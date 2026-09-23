import { describe, expect, it } from "vitest";
import { businessMessages } from "./messages";

describe("business message catalogue", () => {
  it("has the same namespaces and keys in Kurdish and Arabic", () => {
    expect(Object.keys(businessMessages.ar).sort()).toEqual(
      Object.keys(businessMessages.ckb).sort(),
    );
    for (const namespace of Object.keys(businessMessages.ckb) as Array<
      keyof typeof businessMessages.ckb
    >) {
      expect(Object.keys(businessMessages.ar[namespace]).sort()).toEqual(
        Object.keys(businessMessages.ckb[namespace]).sort(),
      );
    }
  });
});
