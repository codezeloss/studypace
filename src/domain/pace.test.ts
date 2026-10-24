import { paceStatus, suggestWeeklyTarget, weeksUntilExam, workloadMinutes } from './pace';

const MONDAY = new Date(2026, 9, 19, 9);
const SUNDAY = new Date(2026, 9, 25, 20);

describe('workloadMinutes', () => {
  it('uses 25 hours per ECTS', () => {
    expect(workloadMinutes(5)).toBe(7500);
  });
});

describe('weeksUntilExam', () => {
  it('rounds up partial weeks and floors at 0', () => {
    expect(weeksUntilExam('2026-12-28', MONDAY)).toBe(10);
    expect(weeksUntilExam('2026-10-22', MONDAY)).toBe(1);
    expect(weeksUntilExam('2026-10-01', MONDAY)).toBe(0);
  });
  it('returns null without a valid date', () => {
    expect(weeksUntilExam(null, MONDAY)).toBeNull();
    expect(weeksUntilExam('nope', MONDAY)).toBeNull();
  });
});

describe('suggestWeeklyTarget', () => {
  it('spreads the remaining workload over the weeks left', () => {
    // 7500 - 1500 = 6000 min over 10 weeks
    expect(suggestWeeklyTarget({ ects: 5, examDate: '2026-12-28', loggedTotalMin: 1500, today: MONDAY })).toBe(600);
  });
  it('rounds up to quarter hours', () => {
    // 1500 min / 7 weeks = 214.3 -> 225
    expect(suggestWeeklyTarget({ ects: 1, examDate: '2026-12-07', loggedTotalMin: 0, today: MONDAY })).toBe(225);
  });
  it('asks for everything remaining when the exam is this week or past', () => {
    expect(suggestWeeklyTarget({ ects: 1, examDate: '2026-10-01', loggedTotalMin: 500, today: MONDAY })).toBe(1005);
  });
  it('never suggests less than 15 minutes', () => {
    expect(suggestWeeklyTarget({ ects: 1, examDate: '2026-12-28', loggedTotalMin: 5000, today: MONDAY })).toBe(15);
  });
  it('returns null without an exam date', () => {
    expect(suggestWeeklyTarget({ ects: 5, examDate: null, loggedTotalMin: 0, today: MONDAY })).toBeNull();
  });
});

describe('paceStatus', () => {
  it('is done once the target is reached', () => {
    expect(paceStatus(700, 700, MONDAY)).toBe('done');
  });
  it('allows 10% tolerance against the expected share of the week', () => {
    // Monday: expected = 700 / 7 = 100, tolerance 90
    expect(paceStatus(90, 700, MONDAY)).toBe('onTrack');
    expect(paceStatus(89, 700, MONDAY)).toBe('behind');
  });
  it('expects the full target on Sunday', () => {
    expect(paceStatus(540, 600, SUNDAY)).toBe('onTrack');
    expect(paceStatus(539, 600, SUNDAY)).toBe('behind');
  });
});
