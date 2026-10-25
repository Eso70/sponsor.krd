import { describe, expect, it } from "vitest";
import { formBlockSummary, formSectionCopy } from "./form-section-copy";
import { formsCopy } from "./forms-copy";

describe("editor section summaries", () => {
  it("counts authored image entries without counting empty editor slots", () => {
    expect(
      formBlockSummary(
        { id: "products", type: "products", title: "", text: "" },
        formsCopy("en"),
      ),
    ).toBe("0 items");
    expect(
      formBlockSummary(
        {
          id: "products",
          type: "products",
          title: "",
          text: "",
          images: ["/images/upload/product.png"],
        },
        formsCopy("en"),
      ),
    ).toBe("1 item");
  });
  it.each(["en", "ar", "ckb"] as const)(
    "uses the editor language for live summaries (%s)",
    (locale) => {
      const details = formSectionCopy(formsCopy(locale));
      expect(
        formBlockSummary(
          {
            id: "banner",
            type: "carousel",
            title: "",
            text: "",
            images: ["one", "two"],
          },
          formsCopy(locale),
        ),
      ).toBe(details.count("images", 2));
      expect(
        formBlockSummary(
          { id: "intro", type: "text", title: "", text: "" },
          formsCopy(locale),
        ),
      ).toBe(details.empty);
    },
  );
});
