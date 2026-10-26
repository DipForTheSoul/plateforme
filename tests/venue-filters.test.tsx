import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { VenueFilters } from "@/components/VenueFilters";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function setup(countries = ["CH"], country = "", canton = "") {
  const result = render(<VenueFilters country={country} canton={canton} countries={countries} cantons={["BE", "VD"]} countryNames={{CH:"Suisse",FR:"France"}}
    search={{initialValue:"Bern",suggestions:[],labels:{placeholder:"Nom ou ville",suggestions:"Suggestions",city:"Ville",venue:"Lieu"}}}
    labels={{search:"Rechercher",country:"Pays",canton:"Canton",allCountries:"Tous les pays",allCantons:"Tous les cantons"}} />);
  const form = result.container.querySelector("form")!;
  const submit = vi.fn();
  form.addEventListener("submit", event => { event.preventDefault(); submit(Object.fromEntries(new FormData(form))); });
  return {submit};
}
it("soumet directement le canton et le texte avec le pays unique implicite", () => {
  const {submit}=setup();
  expect(screen.queryByLabelText("Pays")).toBeNull();
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.change(screen.getByLabelText("Canton"),{target:{value:"BE"}});
  fireEvent.click(screen.getByRole("button",{name:"Rechercher"}));
  expect(submit).toHaveBeenCalledWith({q:"Bern",pays:"CH",canton:"BE"});
});
it("revient à tous les cantons sans effacer le texte", () => {
  const {submit}=setup(["CH"],"CH","BE");
  fireEvent.change(screen.getByLabelText("Canton"),{target:{value:""}});
  fireEvent.click(screen.getByRole("button",{name:"Rechercher"}));
  expect(submit).toHaveBeenCalledWith({q:"Bern",pays:"",canton:""});
});
it("retire le canton lors du changement de pays", () => {
  const {submit}=setup(["CH","FR"],"CH","BE");
  fireEvent.change(screen.getByLabelText("Pays"),{target:{value:"FR"}});
  expect(screen.queryByLabelText("Canton")).toBeNull();
  fireEvent.click(screen.getByRole("button",{name:"Rechercher"}));
  expect(submit).toHaveBeenCalledWith({q:"Bern",pays:"FR",canton:""});
});
