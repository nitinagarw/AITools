import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { SearchBar } from "../SearchBar";

describe("SearchBar", () => {
  it("FT-CC-01: renders with placeholder text", () => {
    render(<SearchBar value="" onChange={() => {}} onSearch={() => {}} />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("FT-CC-02: calls onSearch on Enter key", () => {
    const onSearch = vi.fn();
    render(<SearchBar value="reliance" onChange={() => {}} onSearch={onSearch} />);
    const input = screen.getByRole("textbox") || screen.getByPlaceholderText(/search/i);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSearch).toHaveBeenCalled();
  });

  it("FT-CC-03: hero variant renders larger input", () => {
    const { container } = render(
      <SearchBar value="" onChange={() => {}} onSearch={() => {}} variant="hero" />
    );
    const input = container.querySelector("input");
    expect(input).toBeInTheDocument();
  });
});
