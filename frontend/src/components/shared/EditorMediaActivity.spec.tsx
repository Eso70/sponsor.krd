import { act, fireEvent, render, screen } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import {
  EditorMediaActivityContext,
  useEditorMediaBusy,
} from "./EditorMediaActivity";
import { EditorImagePicker } from "./EditorImagePicker";
import { formsCopy } from "@/features/forms/forms-copy";
import { readFormImage } from "@/features/forms/form-media";
vi.mock("@/features/forms/form-media", async (original) => ({
  ...(await original<typeof import("@/features/forms/form-media")>()),
  readFormImage: vi.fn(),
}));
function Editor() {
  const media = useEditorMediaBusy();
  return (
    <EditorMediaActivityContext.Provider value={media.report}>
      {["Logo", "Banner"].map((label) => (
        <EditorImagePicker
          key={label}
          label={label}
          hint=""
          copy={formsCopy("en")}
          images={[]}
          onChange={vi.fn()}
        />
      ))}
      <button disabled={media.busy}>Save</button>
    </EditorMediaActivityContext.Provider>
  );
}
it("keeps the editor locked until all selected image files finish reading", async () => {
  const finish: Array<(image: string) => void> = [];
  vi.mocked(readFormImage).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish.push(resolve);
      }),
  );
  render(<Editor />);
  const file = new File(["image"], "image.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Logo"), {
    target: { files: [file] },
  });
  fireEvent.change(screen.getByLabelText("Banner"), {
    target: { files: [file] },
  });
  expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  await act(async () => finish[0]("data:image/png;base64,YQ=="));
  expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  await act(async () => finish[1]("data:image/png;base64,YQ=="));
  expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
});
