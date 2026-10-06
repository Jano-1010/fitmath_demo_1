import { describe, expect, it } from "vitest";
import { checkPin, hashPin, makePinRecord, validPin } from "./auth";

describe("pin", () => {
  it("accepts 4 to 8 digits only", () => {
    expect(validPin("1234")).toBe(true);
    expect(validPin("12345678")).toBe(true);
    expect(validPin("123")).toBe(false);
    expect(validPin("123456789")).toBe(false);
    expect(validPin("12a4")).toBe(false);
    expect(validPin("")).toBe(false);
  });
  it("verifies the right pin and rejects a wrong one", async () => {
    const rec = await makePinRecord("4711");
    expect(await checkPin("4711", rec)).toBe(true);
    expect(await checkPin("4712", rec)).toBe(false);
  });
  it("never stores the pin itself and salts every record", async () => {
    const a = await makePinRecord("4711");
    const b = await makePinRecord("4711");
    expect(JSON.stringify(a)).not.toContain("4711");
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
    expect(await hashPin("4711", a.salt)).toBe(a.hash);
  });
});
