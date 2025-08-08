/**
 * Convert HH:mm format to minutes since midnight
 * @param timeStr Time in HH:mm format (e.g., "09:30")
 * @returns Minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to HH:mm format
 * @param minutes Minutes since midnight
 * @returns Time in HH:mm format
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Validate time format (HH:mm)
 * @param timeStr Time string to validate
 * @returns True if valid format
 */
export function isValidTimeFormat(timeStr: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param dateStr Date string to validate
 * @returns True if valid format
 */
export function isValidDateFormat(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0] === dateStr;
}

/**
 * Check if start time is before end time
 * @param startTime Start time in HH:mm format
 * @param endTime End time in HH:mm format
 * @returns True if start is before end
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  return timeToMinutes(startTime) < timeToMinutes(endTime);
}

/**
 * Get current date in YYYY-MM-DD format
 * @returns Current date string
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if a date is in the future (not today or past)
 * @param dateStr Date in YYYY-MM-DD format
 * @returns True if date is in the future
 */
export function isFutureDate(dateStr: string): boolean {
  const inputDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate > today;
}

/**
 * Check if a date is today or in the future
 * @param dateStr Date in YYYY-MM-DD format
 * @returns True if date is today or in the future
 */
export function isTodayOrFuture(dateStr: string): boolean {
  const inputDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
}

