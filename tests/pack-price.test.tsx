import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { CurrencyProvider, useCurrency } from "@/components/CurrencyProvider";
import { PackPrice } from "@/components/PackPrice";

function Fixture() {
  const { setCurrency } = useCurrency();
  return <><button onClick={() => setCurrency("EUR")}>EUR</button><PackPrice valueChf={25}/></>;
}

it("convertit les packs lorsque le visiteur sélectionne EUR", () => {
  localStorage.clear();
  render(<CurrencyProvider rateEur={1.05}><Fixture/></CurrencyProvider>);
  expect(screen.getByText("CHF 25.–")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "EUR" }));
  expect(screen.getByText("EUR 26.25")).toBeInTheDocument();
});
