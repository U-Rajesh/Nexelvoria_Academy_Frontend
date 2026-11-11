/**
 * Formats a number to Indian Rupee currency standard: e.g. ₹ 45,000
 */
export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹ 0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats an ISO date string to Indian standard date format: DD MMM YYYY
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return dateString;
  }
}

/**
 * Formats an ISO date string to full date and time: DD MMM YYYY, hh:mm A
 */
export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return dateString;
  }
}

/**
 * Formats duration in minutes to readable hours and minutes
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hours === 0) return `${remainingMins}m`;
  if (remainingMins === 0) return `${hours}h`;
  return `${hours}h ${remainingMins}m`;
}

/**
 * Formats decimal to percentage
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

