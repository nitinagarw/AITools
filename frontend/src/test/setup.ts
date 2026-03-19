import "@testing-library/jest-dom/vitest";

globalThis.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});
