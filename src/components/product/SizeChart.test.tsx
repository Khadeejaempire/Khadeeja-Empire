import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SizeChart } from "./SizeChart";

const measurements = {
  enabled: true,
  unit: "inches" as const,
  sizes: [
    { size: "XS", chest: "30-32", waist: "26-28", hip: "32-34" },
    { size: "M", chest: "34-36", waist: "30-32", hip: "36-38" },
  ],
};

describe("SizeChart", () => {
  it("updates the compact summary without hiding the full reference", () => {
    const { getByRole, getByText } = render(<SizeChart measurements={measurements} />);

    expect(getByText("30-32 Inch")).toBeTruthy();
    fireEvent.click(getByRole("button", { name: "M" }));
    expect(getByText("34-36 Inch")).toBeTruthy();

    fireEvent.click(getByRole("button", { name: "CM" }));
    expect(getByText("86.4-91.4 CM")).toBeTruthy();
  });

  it("opens and closes the measuring guide", () => {
    const { getByRole, queryByRole } = render(<SizeChart measurements={measurements} />);

    fireEvent.click(getByRole("button", { name: "What is my size?" }));
    expect(getByRole("dialog", { name: "How to measure" })).toBeTruthy();

    fireEvent.click(getByRole("button", { name: "Close size guide" }));
    expect(queryByRole("dialog")).toBeNull();
  });

  it("renders null when a product has no saved measurements or size chart is disabled", () => {
    const { container } = render(<SizeChart measurements={undefined} />);
    expect(container.firstChild).toBeNull();
  });
});
