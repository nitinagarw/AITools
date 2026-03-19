import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { StatCard } from "../StatCard";

describe("StatCard", () => {
  it("FT-CC-06: renders value and label", () => {
    render(<StatCard label="Revenue" value="₹9.8T" />);
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("₹9.8T")).toBeInTheDocument();
  });

  it("FT-CC-07: positive trend shows green indicator", () => {
    const { container } = render(
      <StatCard label="Price" value="₹2,845" trend={2.3} />
    );
    expect(container.querySelector(".text-emerald-600, .text-green-600")).toBeTruthy();
  });

  it("FT-CC-08: negative trend shows red indicator", () => {
    const { container } = render(
      <StatCard label="Price" value="₹2,845" trend={-1.5} />
    );
    expect(container.querySelector(".text-red-600, .text-red-500")).toBeTruthy();
  });
});
