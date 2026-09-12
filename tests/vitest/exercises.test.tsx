import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExercisePage, WeeklySchedule } from "../../src/pages/ExercisePage";
import { currentPosters, archivedPosters } from "../../src/data/posters";

describe("verified exercise content", () => {
  it("filters by day without losing trainer contacts or poster controls", () => {
    render(<ExercisePage />);
    expect(screen.getByRole("status")).toHaveTextContent("15 cvičení");
    fireEvent.change(screen.getByLabelText("Den cvičení"), { target: { value: "1" } });
    expect(screen.getByRole("heading", { name: "Florbal", exact: true })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Volejbal", exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "603 472 150" })).toHaveAttribute("href", "tel:+420603472150");
    expect(screen.getByRole("button", { name: "Zvětšit plakát Florbal", exact: true })).toBeVisible();
  });

  it("renders all 17 weekly sessions and distinguishes unknown venues", () => {
    render(<WeeklySchedule />);
    expect(screen.getAllByRole("listitem")).toHaveLength(17);
    expect(screen.getAllByText("Místo domluvte s trenérkami")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Florbal" })).toHaveAttribute("href", "/cviceni#florbal");
  });

  it("keeps current posters separate from historical material", () => {
    expect(currentPosters).toHaveLength(15);
    expect(archivedPosters).toHaveLength(12);
    expect(currentPosters.filter((poster) => poster.featured)).toHaveLength(3);
    expect(archivedPosters.every((poster) => !poster.featured)).toBe(true);
    expect(currentPosters.every((poster) => poster.registrationUrl === "/prihlaska")).toBe(true);
  });
});
