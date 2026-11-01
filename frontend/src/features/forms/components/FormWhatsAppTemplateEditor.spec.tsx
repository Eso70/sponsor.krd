import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { FormWhatsAppTemplateEditor } from "./FormWhatsAppTemplateEditor";
import {
  defaultFormWhatsAppDetails,
  defaultFormWhatsAppTemplate,
} from "../form-submission-whatsapp";
import { formsCopy } from "../forms-copy";
import { formWhatsAppSettingsCopy } from "../form-whatsapp-settings-copy";

it("inserts variables at the cursor and preserves separate language drafts", async () => {
  const save = vi.fn(async () => true);
  render(
    <FormWhatsAppTemplateEditor
      templates={{ en: "Hello !", ar: "مرحبا {{name}}" }}
      locale="en"
      saving={false}
      saveFailed={false}
      onSave={save}
    />,
  );
  const field = screen.getByRole("textbox", {
    name: "Message",
  }) as HTMLTextAreaElement;
  field.setSelectionRange(6, 6);
  fireEvent.click(screen.getByRole("button", { name: "Customer name" }));
  expect(field).toHaveValue("Hello {{name}}!");
  await waitFor(() => expect(field.selectionStart).toBe(14));
  fireEvent.change(screen.getByRole("textbox", { name: "Details heading" }), {
    target: { value: "Order summary" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Products first" }));
  fireEvent.click(screen.getByRole("option", { name: "Original form order" }));
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  fireEvent.click(screen.getByRole("option", { name: "العربية" }));
  expect(field).toHaveValue("مرحبا {{name}}");
  expect(screen.getByRole("textbox", { name: "Details heading" })).toHaveValue(
    defaultFormWhatsAppDetails("ar").heading,
  );
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith(
      "ar",
      "مرحبا {{name}}",
      defaultFormWhatsAppDetails("ar"),
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "العربية" }));
  fireEvent.click(screen.getByRole("option", { name: "English" }));
  expect(field).toHaveValue("Hello {{name}}!");
  expect(screen.getByRole("textbox", { name: "Details heading" })).toHaveValue(
    "Order summary",
  );
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(save).toHaveBeenLastCalledWith("en", "Hello {{name}}!", {
      ...defaultFormWhatsAppDetails("en"),
      heading: "Order summary",
      order: "form",
    }),
  );
});
it("retains edited text and shows the error when saving fails", async () => {
  const props = {
    templates: {},
    locale: "en" as const,
    saving: false,
    saveFailed: false,
    onSave: vi.fn(async () => false),
  };
  const view = render(<FormWhatsAppTemplateEditor {...props} />);
  const field = screen.getByRole("textbox", { name: "Message" });
  fireEvent.change(field, { target: { value: "Please wait, {{name}}" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(props.onSave).toHaveBeenCalledOnce());
  view.rerender(<FormWhatsAppTemplateEditor {...props} saveFailed />);
  expect(field).toHaveValue("Please wait, {{name}}");
  expect(screen.getByRole("alert")).toHaveTextContent("Could not save");
});
it("updates the full mock message with wording, captions, order and message language", () => {
  render(
    <FormWhatsAppTemplateEditor
      templates={{}}
      locale="en"
      saving={false}
      saveFailed={false}
      onSave={vi.fn(async () => true)}
    />,
  );
  const example = screen.getByRole("region", {
    name: formWhatsAppSettingsCopy("en").example,
  });
  expect(example).toHaveTextContent("Ismail Dilshad");
  expect(example).toHaveTextContent("Natural flowers");
  fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
    target: { value: "Thanks {{name}}\n{{details}}" },
  });
  fireEvent.change(
    screen.getByRole("textbox", { name: "Text before the name" }),
    { target: { value: "Customer:" } },
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Details heading" }), {
    target: { value: "Order summary" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Products first" }));
  fireEvent.click(screen.getByRole("option", { name: "Original form order" }));
  expect(example).toHaveTextContent("Thanks Customer: Ismail Dilshad");
  expect(example).toHaveTextContent("Order summary");
  expect(example.textContent!.indexOf("Erbil")).toBeLessThan(
    example.textContent!.indexOf("Natural"),
  );
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  fireEvent.click(screen.getByRole("option", { name: "العربية" }));
  expect(example).toHaveTextContent("إسماعيل دلشاد");
  expect(example).toHaveTextContent("زهور طبيعية");
  expect(example).not.toHaveTextContent("Ismail Dilshad");
});
it.each(["en", "ckb", "ar"] as const)(
  "places Restore defaults before Save at the top and removes Cancel in %s",
  async (locale) => {
    const save = vi.fn(async () => true),
      reset = vi.fn();
    const copy = formWhatsAppSettingsCopy(locale),
      common = formsCopy(locale);
    const config = {
      ...defaultFormWhatsAppDetails(locale),
      heading: "Custom heading",
      order: "products_first" as const,
    };
    render(
      <FormWhatsAppTemplateEditor
        templates={{ [locale]: "Custom {{name}}" }}
        detailsSettings={{ [locale]: config }}
        locale={locale}
        saving={false}
        saveFailed={false}
        onSave={save}
        onReset={reset}
      />,
    );
    const actions = screen.getByRole("group", { name: copy.actions });
    const buttons = within(actions).getAllByRole("button");
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
      copy.restoreDefaults,
      common.save,
    ]);
    expect(screen.getAllByRole("button").slice(0, 2)).toEqual(buttons);
    expect(
      screen.queryByRole("button", { name: common.cancel }),
    ).not.toBeInTheDocument();
    fireEvent.click(buttons[0]);
    expect(
      screen.getByRole("textbox", {
        name:
          locale === "en" ? "Message" : locale === "ar" ? "الرسالة" : "نامە",
      }),
    ).toHaveValue(defaultFormWhatsAppTemplate(locale));
    expect(screen.getByRole("textbox", { name: copy.heading })).toHaveValue(
      defaultFormWhatsAppDetails(locale).heading,
    );
    expect(save).not.toHaveBeenCalled();
    expect(reset).toHaveBeenCalledOnce();
    fireEvent.click(buttons[1]);
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        locale,
        null,
        defaultFormWhatsAppDetails(locale),
      ),
    );
  },
);
