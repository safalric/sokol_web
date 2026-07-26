export const REGISTRATION_CONSENT_VERSION = "2026-07-26" as const;

export const REGISTRATION_LIMITS = {
  participantName: 120,
  guardianName: 120,
  email: 160,
  phone: 30,
  healthNote: 500,
  additionalNote: 600,
} as const;

export function parseIsoBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) || !date.toISOString().startsWith(value) ? null : date;
}

export function isParticipantMinor(value: string, today = new Date()) {
  const birthDate = parseIsoBirthDate(value);
  if (!birthDate) return false;

  const eighteenthBirthday = new Date(birthDate);
  eighteenthBirthday.setUTCFullYear(eighteenthBirthday.getUTCFullYear() + 18);
  return eighteenthBirthday > today;
}
