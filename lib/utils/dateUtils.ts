/**
 * Date utility functions for consistent formatting across the app
 */

/**
 * Formats a date to DD/MM/YY format
 * @param date - Date object, ISO string, or timestamp
 * @returns Formatted date string in DD/MM/YY format
 */
export function formatDate(date: Date | string | number): string {
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  const day = dateObj.getDate().toString().padStart(2, "0");
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const year = dateObj.getFullYear().toString().slice(-2);

  return `${day}/${month}/${year}`;
}

/**
 * Formats a date to DD/MM/YY HH:MM format
 * @param date - Date object, ISO string, or timestamp
 * @returns Formatted date string in DD/MM/YY HH:MM format
 */
export function formatDateTime(date: Date | string | number): string {
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  const day = dateObj.getDate().toString().padStart(2, "0");
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const year = dateObj.getFullYear().toString().slice(-2);
  const hours = dateObj.getHours().toString().padStart(2, "0");
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formats a date for display in a relative format (e.g., "Added 12/03/24")
 * @param date - Date object, ISO string, or timestamp
 * @param prefix - Optional prefix text (e.g., "Added", "Created", "Updated")
 * @returns Formatted string with prefix and DD/MM/YY date
 */
export function formatDateWithPrefix(
  date: Date | string | number,
  prefix: string = "",
): string {
  const formattedDate = formatDate(date);
  return prefix ? `${prefix} ${formattedDate}` : formattedDate;
}

/**
 * Converts DD/MM/YY or DD/MM/YYYY string to ISO date string for database storage
 * @param dateString - Date string in DD/MM/YY or DD/MM/YYYY format
 * @returns ISO date string (YYYY-MM-DD)
 */
export function parseDate(dateString: string): string {
  const [day, month, year] = dateString.split("/");
  if (!day || !month || !year) {
    throw new Error("Invalid date format. Expected DD/MM/YY or DD/MM/YYYY");
  }

  // Handle 2-digit years (assume 21st century for YY format)
  let fullYear = parseInt(year);
  if (year.length === 2) {
    fullYear = 2000 + parseInt(year);
  }

  const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date values");
  }

  return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
}

/**
 * Gets today's date in DD/MM/YY format
 * @returns Today's date formatted as DD/MM/YY
 */
export function getTodayFormatted(): string {
  return formatDate(new Date());
}

/**
 * Formats the distance between a date and now in a human readable format
 * @param date - Date object, ISO string, or timestamp
 * @returns Human readable time distance (e.g., "2 minutes", "1 hour", "3 days")
 */
export function formatDistanceToNow(date: Date | string | number): string {
  const dateObj = new Date(date);
  const now = new Date();

  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""}`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""}`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""}`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks !== 1 ? "s" : ""}`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""}`;
  } else {
    return `${diffInYears} year${diffInYears !== 1 ? "s" : ""}`;
  }
}
