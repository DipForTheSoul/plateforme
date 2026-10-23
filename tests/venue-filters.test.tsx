import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { VenueFilters } from "@/components/VenueFilters";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function setup(countries = ["CH"], country = "", canton = "") {
  const result = render(<VenueFilters country={country} canton={canton} countries={countries} cantons={["BE", "VD"]} countryNames={{CH:"Suisse",FR:"France"}}
    search={{initialValue:"Bern",suggestions:[],labels:{placeholder:"Nom ou ville",suggestions:"Suggestions",city:"Ville",venue:"Lieu"}}}
    labels={{filters:"Filtres",search:"Rechercher",country:"Pays",canton:"Canton",allCountries:"Tous les pays",allCantons:"Tous les cantons",reset:"Réinitialiser",apply:"Appliquer",close:"Fermer",empty:"Aucun filtre"}} />);
  const form = result.container.querySelector("form")!;
  const submit = vi.fn();
  form.addEventListener("submit", event => { event.preventDefault(); submit(Object.fromEntries(new FormData(form))); });
  fireEvent.click(screen.getByRole("button", {name:/^Filtres/}));
  return {submit,form};
}
it("cache le pays unique et applique un canton avec le texte saisi", () => {
  const {submit}=setup();
  expect(screen.queryByLabelText("Pays")).toBeNull();
  fireEvent.change(screen.getByLabelText("Canton"),{target:{value:"BE"}});
  fireEvent.click(screen.getByRole("button",{name:"Appliquer"}));
  expect(submit).toHaveBeenCalledWith({q:"Bern",pays:"CH",canton:"BE"});
  expect(screen.getByRole("button",{name:"Filtres · 1"})).toBeTruthy();
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("annule les changements non appliqués à la fermeture", () => {
  const {submit}=setup();
  fireEvent.change(screen.getByLabelText("Canton"),{target:{value:"VD"}});
  fireEvent.click(screen.getByRole("button",{name:"Fermer"}));
  fireEvent.click(screen.getByRole("button",{name:"Filtres"}));
  expect((screen.getByLabelText("Canton") as HTMLSelectElement).value).toBe("");
  expect(submit).not.toHaveBeenCalled();
});
it("réinitialise les filtres sans effacer le texte recherché", () => {
  const {submit}=setup(["CH"],"CH","BE");
  fireEvent.click(screen.getByRole("button",{name:"Réinitialiser"}));
  fireEvent.click(screen.getByRole("button",{name:"Appliquer"}));
  expect(submit).toHaveBeenCalledWith({q:"Bern",pays:"",canton:""});
});
it("affiche les noms des pays et retire le canton lors du changement de pays", () => {
  const {submit}=setup(["CH","FR"],"CH","BE");
  expect(screen.getByRole("option",{name:"Suisse"})).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Pays"),{target:{value:"FR"}});
  expect(screen.queryByLabelText("Canton")).toBeNull();
  fireEvent.click(screen.getByRole("button",{name:"Appliquer"}));
  expect(submit).toHaveBeenCalledWith({q:"Bern",pays:"FR",canton:""});
});
