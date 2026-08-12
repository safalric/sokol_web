import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { EventRegistrationForm } from "../../src/components/EventRegistrationForm";

describe("registration form profiles", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("trip form omits health and allergy fields", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    render(<EventRegistrationForm eventName="Sokolský výlet" registrationType="trip" />);

    expect(screen.getByText("Rychlá přihláška na výlet")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Zdravotní omezení/)).not.toBeInTheDocument();
    expect(screen.getByText(/Zdravotní údaje se v tomto formuláři nezpracovávají/)).toBeInTheDocument();
  });

  test("camp form includes the optional health field", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    render(<EventRegistrationForm eventName="Letní tábor" registrationType="camp" />);

    expect(screen.getByText("Přihláška na tábor")).toBeInTheDocument();
    expect(screen.getByLabelText(/Zdravotní omezení/)).toBeInTheDocument();
  });
});
