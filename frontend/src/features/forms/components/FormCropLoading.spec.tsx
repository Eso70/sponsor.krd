import { Suspense } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormEditorDrawer } from "./FormEditorDrawer";
import { createForm } from "../forms-model";
import { formsCopy } from "../forms-copy";

vi.mock("next/dynamic", () => ({
  default: () =>
    function PendingModule(): never {
      throw new Promise<void>(() => undefined);
    },
}));
vi.mock("../api", () => ({
  formsApi: {
    titleAvailability: vi.fn(async () => ({ available: true, slug: "demo" })),
  },
}));

describe("crop drawer module loading boundary", () => {
  it.each(["business", "platform"] as const)(
    "keeps %s form editing mounted while crop code is pending",
    async (scope) => {
      const copy = formsCopy("en");
      render(
        <Suspense fallback={<p>Homepage skeleton</p>}>
          <FormEditorDrawer
            scope={scope}
            initialForm={{
              ...createForm("en"),
              name: "Demo",
              logoEnabled: true,
              logo: "data:image/png;base64,YQ==",
            }}
            copy={copy}
            onSave={vi.fn()}
            onClose={vi.fn()}
          />
        </Suspense>,
      );
      if (!screen.queryByRole("button", { name: "Crop image: Logo 1" }))
        fireEvent.click(screen.getByRole("button", { name: "Introduction" }));
      fireEvent.click(
        await screen.findByRole("button", { name: "Crop image: Logo 1" }),
      );
      expect(screen.queryByText("Homepage skeleton")).not.toBeInTheDocument();
      expect(
        screen.getByRole("dialog", { name: "Crop image" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: copy.imageCrop.confirm }),
      ).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: copy.cancel }));
      await waitFor(() =>
        expect(
          screen.getByRole("dialog", { name: "Form editor" }),
        ).toBeInTheDocument(),
      );
      expect(screen.queryByText("Homepage skeleton")).not.toBeInTheDocument();
    },
  );
});
