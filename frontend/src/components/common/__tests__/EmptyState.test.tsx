import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("FT-CC-30: renders message", () => {
    render(<EmptyState message="No organizations found" />);
    expect(screen.getByText("No organizations found")).toBeInTheDocument();
  });

  it("FT-CC-30: renders action button when provided", () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        message="No results"
        actionLabel="Request Analysis"
        onAction={onAction}
      />
    );
    const button = screen.getByText("Request Analysis");
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalled();
  });
});
