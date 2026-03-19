import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { Modal } from "../Modal";

describe("Modal", () => {
  it("FT-CC-17: opens when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("FT-CC-17: hidden when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Hidden Modal">
        <p>Hidden content</p>
      </Modal>
    );
    expect(screen.queryByText("Hidden Modal")).not.toBeInTheDocument();
  });

  it("FT-CC-19: closes on Escape key", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Escape Test">
        <p>Content</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
