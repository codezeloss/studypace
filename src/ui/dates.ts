/**
 * Shared settings for the date and time pickers (react-native-paper-dates).
 * British English gives the DD/MM/YYYY input format that students in Germany
 * and most of Europe expect; weeks start on Monday to match the ISO weeks used
 * for all weekly goals.
 */
import { enGB, registerTranslation } from 'react-native-paper-dates';

/** Locale passed to every picker. */
export const DATE_LOCALE = 'en-GB';

/** Props shared by every calendar picker in the app. */
export const calendarProps = { locale: DATE_LOCALE, startWeekOnMonday: true } as const;

/** Registers the picker translation once at app start. */
export function registerDateLocale() {
  registerTranslation(DATE_LOCALE, enGB);
}
