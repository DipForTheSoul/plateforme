import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeaturedRequestCard, type FeaturedRequestCopy } from "@/components/forms/FeaturedRequestCard";

const copy: FeaturedRequestCopy = {
  badge: "Option visibilité",
  title: "Mettre cette offre en avant",
  description: "Description",
  duration: "Pendant {days} jours",
  priceLabel: "Supplément",
  choice: "Je souhaite la mise en avant",
  paymentHint: "Paiement après envoi",
  selected: "Option sélectionnée",
};

describe("demande de mise en avant", () => {
  it("affiche clairement le prix, la durée et l'état sélectionné", () => {
    render(<FeaturedRequestCard copy={copy} priceChf={20} durationDays={30} />);
    expect(screen.getByText("CHF 20.–")).toBeInTheDocument();
    expect(screen.getByText("Pendant 30 jours")).toBeInTheDocument();
    const choice = screen.getByRole("checkbox", { name: copy.choice });
    expect(choice).not.toBeChecked();
    fireEvent.click(choice);
    expect(choice).toBeChecked();
    expect(screen.getByText(copy.selected)).toBeInTheDocument();
  });
});
