import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { PhoneNumberInput } from "./PhoneNumberInput";
import { NumberInput } from "./NumberInput";

function Phone({ initialCode = "964" }: { initialCode?: string }) {
  const [value, setValue] = useState("");
  const [code, setCode] = useState(initialCode);
  return (
    <>
      <PhoneNumberInput
        label="Phone"
        countryLabel="Country code"
        value={value}
        onChange={setValue}
        countryCode={code}
        onCountryCodeChange={setCode}
      />
      <output aria-label="Selected code">{code}</output>
    </>
  );
}

describe("plain numeric entry", () => {
  it("keeps phone entry digits-only while accepting local digits and formatted international pastes", () => {
    render(<Phone />);
    const input = screen.getByRole("textbox", { name: "Phone" });
    fireEvent.change(input, { target: { value: "٧٥٠abc ١٢٣-٤٥٦٧" } });
    expect(input).toHaveValue("7501234567");
    fireEvent.change(input, { target: { value: "+۹۶۴ (۷۵۰) ۱۲۳ ۴۵۶۷" } });
    expect(input).toHaveValue("7501234567");
    expect(screen.getByLabelText("Selected code")).toHaveTextContent("964");
    fireEvent.change(input, { target: { value: "+44 7700 900123" } });
    expect(input).toHaveValue("7700900123");
    expect(screen.getByLabelText("Selected code")).toHaveTextContent("44");
    expect(input).toHaveAttribute("inputmode", "numeric");
    fireEvent.change(input, { target: { value: "" } });
    expect(input).toHaveValue("");
  });
  it("requires exactly ten Iraqi mobile digits, allowing one domestic zero", () => {
    render(<Phone />);
    const input = screen.getByRole("textbox", { name: "Phone" });
    fireEvent.change(input, { target: { value: "750123456" } });
    fireEvent.blur(input);
    expect(input).toBeInvalid();
    expect(screen.getByText("Phone number is too short.")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "7501234567" } });
    expect(input).toBeValid();
    fireEvent.change(input, { target: { value: "75012345678" } });
    expect(input).toHaveValue("7501234567");
    fireEvent.change(input, { target: { value: "07501234567" } });
    expect(input).toBeValid();
    fireEvent.change(input, { target: { value: "075012345678" } });
    expect(input).toHaveValue("07501234567");
    fireEvent.change(input, { target: { value: "" } });
    for (const value of ["6", "6501234567", "06501234567", "1", "00"]) {
      fireEvent.change(input, { target: { value } });
      expect(input).toHaveValue("");
    }
    fireEvent.change(input, { target: { value: "0" } });
    expect(input).toHaveValue("0");
    fireEvent.change(input, { target: { value: "07" } });
    expect(input).toHaveValue("07");
    expect(
      screen.queryByText(/10 digits starting|١٠ ژمارە|10 أرقام/),
    ).not.toBeInTheDocument();
  });
  it.each([
    ["246", "3", "7"],
    ["244", "9", "7"],
    ["1", "2", "0"],
    ["39", "0", "6"],
  ])(
    "enforces the country start when typing for +%s",
    (code, allowed, rejected) => {
      render(<Phone initialCode={code} />);
      const input = screen.getByRole("textbox", { name: "Phone" });
      fireEvent.change(input, { target: { value: rejected } });
      expect(input).toHaveValue("");
      fireEvent.change(input, { target: { value: allowed } });
      expect(input).toHaveValue(allowed);
      fireEvent.change(input, { target: { value: "" } });
      expect(input).toHaveValue("");
    },
  );
  it("preserves a valid price while rejecting letters, signs and exponent notation", () => {
    function Price() {
      const [value, setValue] = useState<number | null>(null);
      return (
        <NumberInput
          value={value}
          onValueChange={setValue}
          onEmpty={() => setValue(null)}
          decimalOnly
          step={0.01}
          aria-label="Price"
        />
      );
    }
    render(<Price />);
    const input = screen.getByRole("textbox", { name: "Price" });
    fireEvent.change(input, { target: { value: "۷۵۰۰٫۵۰" } });
    expect(input).toHaveValue("7500.50");
    for (const value of ["1e3", "-1", "+2", "letters", "1.2.3"]) {
      fireEvent.change(input, { target: { value } });
      expect(input).toHaveValue("7500.50");
    }
    fireEvent.change(input, { target: { value: "" } });
    expect(input).toHaveValue("");
    fireEvent.change(input, { target: { value: "0" } });
    fireEvent.blur(input);
    expect(input).toHaveValue("0");
  });
});
