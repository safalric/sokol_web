import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { EventRegistrationForm } from "../../src/components/EventRegistrationForm";

describe("Google Forms registration link", () => {
  test("keeps an unconfigured registration safely closed", () => {
    render(<EventRegistrationForm eventName="Sokolský výlet" formUrl={null} open={false} />);

    expect(screen.getByText("Přihláška přes Google Forms")).toBeInTheDocument();
    expect(screen.getByText(/Přihlašování zatím není otevřené/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Otevřít přihlášku/ })).not.toBeInTheDocument();
  });

  test("opens a configured form in a separate tab", () => {
    render(<EventRegistrationForm eventName="Letní tábor" formUrl="https://docs.google.com/forms/d/e/test/viewform" open />);

    const link = screen.getByRole("link", { name: /Otevřít přihlášku/ });
    expect(link).toHaveAttribute("href", "https://docs.google.com/forms/d/e/test/viewform");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });
});
