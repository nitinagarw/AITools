import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import { DataTable } from "../DataTable";

const mockColumns = [
  { key: "name", label: "Name" },
  { key: "sector", label: "Sector" },
  { key: "status", label: "Status" },
];

const mockRows = [
  { name: "Reliance Industries", sector: "Conglomerate", status: "Active" },
  { name: "TCS", sector: "IT Services", status: "Active" },
  { name: "Infosys", sector: "IT Services", status: "Active" },
];

describe("DataTable", () => {
  it("FT-CC-12: renders rows from provided data", () => {
    render(<DataTable columns={mockColumns} rows={mockRows} />);
    expect(screen.getByText("Reliance Industries")).toBeInTheDocument();
    expect(screen.getByText("TCS")).toBeInTheDocument();
    expect(screen.getByText("Infosys")).toBeInTheDocument();
  });

  it("FT-CC-16: shows empty state when no data", () => {
    render(<DataTable columns={mockColumns} rows={[]} />);
    expect(screen.getByText(/no (data|results)/i)).toBeInTheDocument();
  });

  it("FT-CC-15: shows loading state", () => {
    const { container } = render(<DataTable columns={mockColumns} rows={[]} loading={true} />);
    // Should show skeleton or loading indicator
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });
});
