import { describe, expect, it } from "vitest";
import { businessMessages } from "./messages";

describe("business message catalogue", () => {
  it("translates every Kurdish dashboard namespace and key", () => {
    // Arabic-only copy adapters supply shared components whose existing
    // Kurdish defaults live beside those components, not in this catalogue.
    expect(Object.keys(businessMessages.ar)).toEqual(
      expect.arrayContaining(Object.keys(businessMessages.ckb)),
    );
    for (const namespace of Object.keys(businessMessages.ckb) as Array<
      keyof typeof businessMessages.ckb
    >) {
      expect(Object.keys(businessMessages.ar[namespace]).sort()).toEqual(
        Object.keys(businessMessages.ckb[namespace]).sort(),
      );
    }
  });

  it("provides English copy for every dashboard and Arabic adapter key", () => {
    for (const namespace of Object.keys(businessMessages.ar) as Array<keyof typeof businessMessages.ar>) {
      expect(Object.keys(businessMessages.en[namespace]).sort()).toEqual(
        Object.keys(businessMessages.ar[namespace]).sort(),
      );
    }
  });
});
