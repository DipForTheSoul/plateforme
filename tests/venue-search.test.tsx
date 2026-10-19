import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { VenueSearch } from "@/components/VenueSearch";
afterEach(cleanup);
function setup() {
  const submit = vi.fn();
  render(<form onSubmit={event => { event.preventDefault(); submit(new FormData(event.currentTarget).get("q")); }}>
    <VenueSearch initialValue="" suggestions={[{value:"Genève",kind:"city"},{value:"Salle du lac",kind:"venue"}]}
      labels={{placeholder:"Recherche",suggestions:"Suggestions",city:"Ville",venue:"Lieu"}} />
  </form>);
  return { input:screen.getByRole("combobox"), submit };
}
it("propose une ville sans exiger les accents et sélectionne au clavier", () => {
  const {input,submit}=setup();
  fireEvent.change(input,{target:{value:"gene"}});
  expect(screen.getByRole("option").textContent).toContain("Genève");
  fireEvent.keyDown(input,{key:"ArrowDown"});
  fireEvent.keyDown(input,{key:"Enter"});
  expect(submit).toHaveBeenCalledWith("Genève");
  expect(screen.queryByRole("listbox")).toBeNull();
});
it("sélectionne un lieu et ferme les suggestions avec Échap", () => {
  const {input,submit}=setup();
  fireEvent.change(input,{target:{value:"s"}});
  fireEvent.keyDown(input,{key:"Escape"});
  expect(screen.queryByRole("listbox")).toBeNull();
  fireEvent.focus(input);
  fireEvent.click(screen.getByRole("option"));
  expect(submit).toHaveBeenCalledWith("Salle du lac");
});
it("conserve la recherche libre sans fausse proposition", () => {
  const {input}=setup();
  fireEvent.change(input,{target:{value:"inconnu"}});
  expect(screen.queryByRole("listbox")).toBeNull();
  expect((input as HTMLInputElement).value).toBe("inconnu");
});
