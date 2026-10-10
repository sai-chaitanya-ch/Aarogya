/**
 * Aarogya — Date & Age Calculation Utilities
 */

/**
 * Calculates a person's age in completed years from their date of birth (YYYY-MM-DD).
 * Accurately accounts for leap years, month boundaries, and day-of-month boundaries.
 * 
 * Returns null if dob is absent, invalid, or in the future.
 */
export function calculateAgeFromDob(
  dobString: string | null | undefined,
  referenceDate: Date = new Date()
): number | null {
  if (!dobString || typeof dobString !== 'string') return null;
  const trimmed = dobString.trim();
  if (!trimmed) return null;

  // Expected format: YYYY-MM-DD
  const parts = trimmed.split('-');
  let birthDate: Date;
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed month
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    birthDate = new Date(year, month, day);
    // Verify that date did not overflow (e.g. Feb 31)
    if (
      birthDate.getFullYear() !== year ||
      birthDate.getMonth() !== month ||
      birthDate.getDate() !== day
    ) {
      return null;
    }
  } else {
    birthDate = new Date(trimmed);
    if (isNaN(birthDate.getTime())) return null;
  }

  // Reject future dates (comparing calendar year, month, date)
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const refDay = referenceDate.getDate();

  const birthYear = birthDate.getFullYear();
  const birthMonth = birthDate.getMonth();
  const birthDay = birthDate.getDate();

  if (
    birthYear > refYear ||
    (birthYear === refYear && birthMonth > refMonth) ||
    (birthYear === refYear && birthMonth === refMonth && birthDay > refDay)
  ) {
    return null;
  }

  let age = refYear - birthYear;
  const monthDiff = refMonth - birthMonth;
  if (monthDiff < 0 || (monthDiff === 0 && refDay < birthDay)) {
    age--;
  }

  return age >= 0 ? age : null;
}

/**
 * Returns today's date formatted as YYYY-MM-DD for native HTML date input max attribute.
 */
export function getTodayDateString(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
