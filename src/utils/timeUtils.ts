import { DateTime } from 'luxon';

/**
 * Convert a time string (e.g., "09:30") to seconds since midnight.
 */
export function timeStringToSeconds(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 3600 + minutes * 60;
}

/**
 * Convert seconds since midnight to a time string (e.g., "09:30").
 */
export function secondsToTimeString(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Format seconds since midnight into a localized time string (e.g., "9:30 AM").
 */
export function formatSecondsToLocalTime(seconds: number, timeZone: string): string {
  const dt = DateTime.fromSeconds(seconds, { zone: timeZone }).startOf('day').plus({ seconds });
  return dt.toFormat('hh:mm a');
}

/**
 * Check if current time in given timezone is within specified start and end time (in seconds).
 */
export function isNowWithinTimeSpan(startTime: number, endTime: number, timeZone: string): boolean {
  const now = DateTime.now().setZone(timeZone);
  const currentSeconds = now.hour * 3600 + now.minute * 60 + now.second;
  return currentSeconds >= startTime && currentSeconds <= endTime;
}


