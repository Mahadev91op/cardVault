/**
 * NPCI & RBI Standard UPI Ref / UTR Validation Engine
 * 
 * Standard UPI UTR Format:
 * - Exactly 12 numeric digits
 * - Digit 1: Year (e.g. 6 for 2026, 5 for 2025, 4 for 2024)
 * - Digits 2-4: Julian Day of the year (001 to 366). Cannot be 000, > 366, or in future date.
 * - Digits 5-12: Bank transaction sequence / timestamp identifier
 * - Anti-Fraud: Must not be repetitive digits (e.g. 666666666666, 600000000000)
 * - Anti-Fraud: Must not be simple sequential runs (e.g. 612345678901, 698765432101)
 */

export function validateUtrNumber(utr) {
  if (!utr || typeof utr !== 'string') {
    return { isValid: false, error: 'UTR / Ref number is required.' };
  }

  const clean = utr.replace(/[\s-_]/g, '');

  // 1. Length & numeric check
  if (!/^\d{12}$/.test(clean)) {
    return { isValid: false, error: 'UTR must contain exactly 12 numeric digits.' };
  }

  // 2. Repetitive digits check (e.g. 600000000000, 699999999999, 111111111111)
  const uniqueDigits = new Set(clean.split(''));
  if (uniqueDigits.size <= 3) {
    return { isValid: false, error: 'Suspicious / Dummy UTR detected. Please enter a valid bank transaction reference.' };
  }

  // 3. Reject any continuous run of 5 or more identical digits (e.g. 600000123456)
  if (/(\d)\1{4,}/.test(clean)) {
    return { isValid: false, error: 'Invalid UTR: contains suspicious repeating sequence.' };
  }

  // 4. Sequential runs check (e.g. 123456789012, 012345678901, 987654321098)
  const sequentialAscending = '0123456789012345';
  const sequentialDescending = '9876543210987654';
  if (sequentialAscending.includes(clean.slice(1, 8)) || sequentialDescending.includes(clean.slice(1, 8))) {
    return { isValid: false, error: 'Invalid UTR: sequential dummy numbers are not permitted.' };
  }

  // 5. Year digit check
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentYearDigit = currentYear.toString().slice(-1);
  const prevYearDigit = (currentYear - 1).toString().slice(-1);
  
  const utrYearDigit = clean[0];
  if (utrYearDigit !== currentYearDigit && utrYearDigit !== prevYearDigit) {
    return { 
      isValid: false, 
      error: `Invalid UTR year code. For ${currentYear} payments, the reference must start with '${currentYearDigit}'.` 
    };
  }

  // 6. Julian Day check (digits 2 to 4)
  const julianDay = parseInt(clean.slice(1, 4), 10);
  if (isNaN(julianDay) || julianDay < 1 || julianDay > 366) {
    return { 
      isValid: false, 
      error: 'Invalid UTR: Julian date segment is invalid for Indian banking standards.' 
    };
  }

  // If transaction is from the current year, Julian day cannot exceed current day of year (+ 1 day buffer for timezones)
  if (utrYearDigit === currentYearDigit) {
    const startOfYear = new Date(currentYear, 0, 1);
    const dayOfYear = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
    if (julianDay > dayOfYear + 1) {
      return { 
        isValid: false, 
        error: 'Invalid UTR: Transaction date cannot be in the future.' 
      };
    }
  }

  return { isValid: true, cleanUtr: clean };
}
