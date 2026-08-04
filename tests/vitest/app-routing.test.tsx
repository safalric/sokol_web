import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { App } from "../../src/App";

describe("application routing", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  test("renders a dedicated 404 page for an unknown URL", () => {
    window.history.replaceState({}, "", "/chybejici-stranka");
    render(<App />);

    expect(screen.getByRole("heading", { level: 1, name: "Stránka nenalezena" })).toBeInTheDocument();
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  });

  test("404 return action navigates to the homepage without reloading", () => {
    window.history.replaceState({}, "", "/chybejici-stranka");
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Zpět na úvod" }));

    expect(window.location.pathname).toBe("/");
    expect(screen.getByRole("heading", { level: 1, name: "TJ Sokol Doudleby nad Orlicí" })).toBeInTheDocument();
  });

  test("renders the grants route instead of normalizing it to the homepage", () => {
    window.history.replaceState({}, "", "/dotace");
    render(<App />);

    expect(screen.getByRole("heading", { level: 1, name: "Dotace a podpora" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/dotace");
  });
});
