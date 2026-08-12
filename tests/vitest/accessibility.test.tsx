import axe from "axe-core";
import { render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { App } from "../../src/App";

const routes = ["/", "/o-nas", "/cviceni", "/akce", "/kalendar", "/prihlaska", "/fotogalerie", "/historie", "/kontakt", "/gdpr", "/dotace"];

describe("automated accessibility audit", () => {
  test.each(routes)("%s has no serious or critical axe violations", async (route) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      period: { year: 2026, month: 8 },
      source: "demo",
      demo: true,
      events: [],
      warning: null,
    }), { headers: { "Content-Type": "application/json" } })));
    window.history.replaceState({}, "", route);
    const { container } = render(<App />);
    const result = await axe.run(container, {
      iframes: false,
      rules: {
        "color-contrast": { enabled: false },
        "color-contrast-enhanced": { enabled: false },
      },
    });
    const violations = result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || ""));
    expect(violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) }))).toEqual([]);
    vi.unstubAllGlobals();
  });
});
