import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CurrencyProvider, useCurrency } from "@/components/CurrencyProvider";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

function CurrencyFixture() {
  const { currency, setCurrency } = useCurrency();
  return <button onClick={() => setCurrency("EUR")}>{currency}</button>;
}

describe("résilience lorsque Safari bloque localStorage", () => {
  it("conserve la devise interactive malgré SecurityError", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage disabled", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage disabled", "SecurityError");
    });

    render(
      <CurrencyProvider rateEur={1.05}>
        <CurrencyFixture />
      </CurrencyProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "CHF" }));
    expect(screen.getByRole("button", { name: "EUR" })).toBeInTheDocument();
  });

  it("permet de refuser Analytics même si le choix ne peut pas être stocké", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage disabled", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage disabled", "SecurityError");
    });

    render(<GoogleAnalytics locale="fr" />);
    const refuse = await screen.findByRole("button", { name: "Refuser" });
    fireEvent.click(refuse);
    await waitFor(() => expect(refuse).not.toBeInTheDocument());
  });
});
