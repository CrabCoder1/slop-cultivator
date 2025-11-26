/**
 * Formats numbers with adaptive decimal places based on magnitude:
 * - Less than 10: 2 decimal places
 * - 10 to 99: 1 decimal place
 * - 100 or greater: No decimal places
 */
export function formatNumber(value: number): string {
  if (value < 10) {
    return value.toFixed(2);
  } else if (value < 100) {
    return value.toFixed(1);
  } else {
    return Math.round(value).toString();
  }
}
