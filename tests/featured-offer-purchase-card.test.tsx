import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeaturedOfferPurchaseCard } from "@/components/forms/FeaturedOfferPurchaseCard";

describe("FeaturedOfferPurchaseCard", () => {
  it("affiche le paiement seulement après le choix de l'offre", () => {
    render(<FeaturedOfferPurchaseCard />);
    expect(screen.queryByRole("button", { name: "Payer avec Stripe" })).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Mettre en avant" })[0]);

  expect(screen.getByText("CHF 20.–")).toHaveClass("font-serif", "text-2xl");
  expect(screen.getByText(/Mettre cette offre en avant pendant/)).toHaveClass("whitespace-nowrap", "text-[13px]", "sm:text-base");
    expect(screen.getByText("30 jours")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Payer avec Stripe" })).toBeInTheDocument();
  });
});
