import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeaturedOfferPurchaseCard } from "@/components/forms/FeaturedOfferPurchaseCard";

describe("FeaturedOfferPurchaseCard", () => {
  it("affiche le paiement seulement après le choix de l'offre", () => {
    render(<FeaturedOfferPurchaseCard />);
    expect(screen.queryByRole("button", { name: "Payer avec Stripe" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mettre en avant" }));

    expect(screen.getByText("CHF 20.–")).toBeInTheDocument();
    expect(screen.getByText("30 jours")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Payer avec Stripe" })).toBeInTheDocument();
  });
});
