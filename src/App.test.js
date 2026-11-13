import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App scaffold smoke test", () => {
  it("renders the layout shell on the home route without the home-hero section", () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByTestId("site-header")).toBeInTheDocument();
    expect(screen.getByTestId("layout-main")).toBeInTheDocument();
    expect(screen.queryByTestId("home-hero")).not.toBeInTheDocument();
    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
  });
});
