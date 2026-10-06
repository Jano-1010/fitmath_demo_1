export interface PinRecord {
  salt: string;
  hash: string;
}

export interface Profile {
  name: string;
  pin?: PinRecord;
}

export const PIN_PATTERN = /^\d{4,8}$/;
export const validPin = (pin: string): boolean => PIN_PATTERN.test(pin);

const toHex = (buf: ArrayBuffer): string =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export function newSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

/** Salted SHA-256 of the PIN. Needs a secure context (HTTPS or localhost). */
export async function hashPin(pin: string, salt: string): Promise<string> {
  if (!crypto.subtle) throw new Error("PIN-Sperre braucht eine sichere Verbindung (HTTPS).");
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${pin}`)));
}

export async function makePinRecord(pin: string): Promise<PinRecord> {
  const salt = newSalt();
  return { salt, hash: await hashPin(pin, salt) };
}

export async function checkPin(pin: string, record: PinRecord): Promise<boolean> {
  return (await hashPin(pin, record.salt)) === record.hash;
}
