import {
  applyCursorColor,
  applyCursorTheme,
  resetCursorColor,
} from "./cursor-theme";

describe("cursor theme", () => {
  afterEach(() => {
    resetCursorColor();
    vi.unstubAllGlobals();
  });

  it("tints both cursor assets with the active accent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        text: async () => '<svg><path fill="#25F4EE" /></svg>',
      }),
    );

    await applyCursorColor("#123456");

    expect(
      document.documentElement.style.getPropertyValue("--custom-cursor-default"),
    ).toContain("%23123456");
    expect(
      document.documentElement.style.getPropertyValue("--custom-cursor-text"),
    ).toContain("%23123456");
  });

  it("paints platform cursors with the complete configured gradient", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        text: async () =>
          '<svg xmlns="http://www.w3.org/2000/svg"><defs></defs><path fill="#25F4EE" /></svg>',
      }),
    );

    await applyCursorTheme("gradient:to-r:#25F4EE:#FE2C55");

    const cursor = document.documentElement.style.getPropertyValue(
      "--custom-cursor-default",
    );
    expect(cursor).toContain("linearGradient");
    expect(cursor).toContain("%2325F4EE");
    expect(cursor).toContain("%23FE2C55");
    expect(cursor).toContain("cursor-theme-gradient");
  });
});
