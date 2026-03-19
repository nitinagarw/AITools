import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { Tabs } from "../Tabs";

const mockTabs = [
  { id: "overview", label: "Overview" },
  { id: "news", label: "News" },
  { id: "analysis", label: "Analysis" },
];

describe("Tabs", () => {
  it("FT-CC-20: renders all tab labels", () => {
    render(<Tabs tabs={mockTabs} activeTab="overview" onTabChange={() => {}} />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("News")).toBeInTheDocument();
    expect(screen.getByText("Analysis")).toBeInTheDocument();
  });

  it("FT-CC-22: clicking tab calls onTabChange", () => {
    const onChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTab="overview" onTabChange={onChange} />);
    fireEvent.click(screen.getByText("News"));
    expect(onChange).toHaveBeenCalledWith("news");
  });
});
