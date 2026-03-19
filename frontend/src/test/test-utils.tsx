import { render, type RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { type ReactElement, type ReactNode } from "react";

function AllProviders({ children }: { children: ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react";
export { renderWithProviders as render };
