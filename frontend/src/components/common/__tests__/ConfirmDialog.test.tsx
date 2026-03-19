import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { ConfirmDialog } from "../ConfirmDialog";

describe("ConfirmDialog", () => {
  it("FT-CC-23: renders title and message", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Organization"
        message="Are you sure you want to delete this organization?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText("Delete Organization")).toBeInTheDocument();
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  it("FT-CC-24: confirm button calls onConfirm", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm"
        message="Proceed?"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );
    const confirmBtn = screen.getByRole("button", { name: /confirm|delete|yes|proceed/i });
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalled();
  });

  it("FT-CC-25: cancel button calls onCancel", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm"
        message="Proceed?"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );
    const cancelBtn = screen.getByRole("button", { name: /cancel|no|close/i });
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalled();
  });
});
