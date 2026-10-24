import { parseDecimal, validateModule, validateSession, type ModuleFormValues, type SessionFormValues } from './validation';

const moduleValues = (o: Partial<ModuleFormValues> = {}): ModuleFormValues => ({
  code: ' dlbcsemse02 ', name: ' Mobile Software Engineering II ', ects: '5',
  examDate: '2027-02-12', weeklyTargetHours: '2,5', color: 'teal', ...o,
});

describe('parseDecimal', () => {
  it('accepts dot and comma decimals', () => {
    expect(parseDecimal('2.5')).toBe(2.5);
    expect(parseDecimal(' 2,5 ')).toBe(2.5);
    expect(parseDecimal('10')).toBe(10);
  });
  it('rejects anything else', () => {
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('2.5h')).toBeNull();
    expect(parseDecimal('-1')).toBeNull();
  });
});

describe('validateModule', () => {
  it('normalizes valid input into a NewModule', () => {
    expect(validateModule(moduleValues())).toEqual({
      ok: true,
      value: {
        code: 'DLBCSEMSE02', name: 'Mobile Software Engineering II', ects: 5,
        examDate: '2027-02-12', weeklyTargetMin: 150, color: 'teal',
      },
    });
  });
  it('reports every invalid field', () => {
    const result = validateModule(moduleValues({ code: 'x', name: '  ', ects: '31', examDate: '2027-02-30', weeklyTargetHours: '0.1' }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['code', 'ects', 'examDate', 'name', 'weeklyTargetHours']);
    }
  });
  it('allows a missing exam date', () => {
    expect(validateModule(moduleValues({ examDate: null })).ok).toBe(true);
  });
});

const NOW = new Date(2026, 9, 23, 18, 0);
const sessionValues = (o: Partial<SessionFormValues> = {}): SessionFormValues => ({
  moduleId: 1, date: '2026-10-23', time: '09:05', durationMin: '45', focusRating: 4, note: '  Read unit 3 ', ...o,
});

describe('validateSession', () => {
  it('builds a manual NewSession with a UTC start time', () => {
    expect(validateSession(sessionValues(), NOW)).toEqual({
      ok: true,
      value: {
        moduleId: 1, startedAt: new Date(2026, 9, 23, 9, 5).toISOString(), durationMin: 45,
        focusRating: 4, note: 'Read unit 3', source: 'manual',
      },
    });
  });
  it('stores an empty note as null', () => {
    const result = validateSession(sessionValues({ note: '   ' }), NOW);
    expect(result.ok && result.value.note).toBeNull();
  });
  it('rejects missing module, bad time, bad duration and future starts', () => {
    const r1 = validateSession(sessionValues({ moduleId: null, time: '25:00', durationMin: '0' }), NOW);
    expect(r1.ok).toBe(false);
    if (!r1.ok) expect(Object.keys(r1.errors).sort()).toEqual(['durationMin', 'moduleId', 'time']);
    const r2 = validateSession(sessionValues({ time: '18:30' }), NOW);
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.errors.time).toMatch(/future/);
  });
  it('limits note length and duration', () => {
    const r = validateSession(sessionValues({ note: 'a'.repeat(501), durationMin: '721' }), NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['durationMin', 'note']);
  });
});
