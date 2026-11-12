import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App scaffold smoke test", () => {
  it("renders the Turkish catalogue heading and the SCSS-styled preview box", () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Lavabo Aydınlatma Katalog/i,
      })
    ).toBeInTheDocument();

    const scssBox = screen.getByTestId("scss-demo-box");
    expect(scssBox).toHaveClass("scss-demo-box");
    expect(scssBox).toHaveTextContent(/Yerli Üretim LED Aydınlatma Kataloğu/i);
  });
});
