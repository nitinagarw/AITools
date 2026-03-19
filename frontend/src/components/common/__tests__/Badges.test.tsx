import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { SentimentBadge } from "../SentimentBadge";
import { StatusBadge } from "../StatusBadge";
import { RoleBadge } from "../RoleBadge";

describe("SentimentBadge", () => {
  it("FT-CC-09: renders correct text for each sentiment", () => {
    const { rerender } = render(<SentimentBadge sentiment="positive" />);
    expect(screen.getByText(/positive/i)).toBeInTheDocument();

    rerender(<SentimentBadge sentiment="negative" />);
    expect(screen.getByText(/negative/i)).toBeInTheDocument();

    rerender(<SentimentBadge sentiment="neutral" />);
    expect(screen.getByText(/neutral/i)).toBeInTheDocument();
  });
});

describe("StatusBadge", () => {
  it("FT-CC-10: renders correct text for each status", () => {
    const { rerender } = render(<StatusBadge status="ready" />);
    expect(screen.getByText(/ready/i)).toBeInTheDocument();

    rerender(<StatusBadge status="building" />);
    expect(screen.getByText(/building/i)).toBeInTheDocument();

    rerender(<StatusBadge status="failed" />);
    expect(screen.getByText(/failed/i)).toBeInTheDocument();
  });
});

describe("RoleBadge", () => {
  it("FT-CC-11: renders correct text for each role", () => {
    const { rerender } = render(<RoleBadge role="admin" />);
    expect(screen.getByText(/admin/i)).toBeInTheDocument();

    rerender(<RoleBadge role="analyst" />);
    expect(screen.getByText(/analyst/i)).toBeInTheDocument();

    rerender(<RoleBadge role="viewer" />);
    expect(screen.getByText(/viewer/i)).toBeInTheDocument();
  });
});
