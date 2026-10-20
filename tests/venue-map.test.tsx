import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ map: vi.fn(), setView: vi.fn(), tiles: vi.fn(), marker: vi.fn(), add: vi.fn(), remove: vi.fn(), invalidate: vi.fn(), observe: vi.fn(), disconnect: vi.fn() }));
vi.mock("leaflet", () => ({ default: { map: mocks.map, tileLayer: mocks.tiles, circleMarker: mocks.marker } }));
import { VenueMap } from "@/components/VenueMap";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.setView.mockReturnValue({ remove: mocks.remove, invalidateSize: mocks.invalidate });
  mocks.map.mockReturnValue({ setView: mocks.setView });
  mocks.tiles.mockReturnValue({ addTo: mocks.add });
  mocks.marker.mockReturnValue({ addTo: mocks.add });
  vi.stubGlobal("ResizeObserver", class { observe = mocks.observe; disconnect = mocks.disconnect; });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it("charge des tuiles raster sans iframe et libère la carte au démontage", async () => {
  let result: ReturnType<typeof render>;
  await act(async () => { result = render(<VenueMap lat={46.5} lng={6.6} label="Lieu fictif" />); });
  expect(screen.getByRole("region", { name: "Lieu fictif" })).toBeTruthy();
  expect(mocks.setView).toHaveBeenCalledWith([46.5, 6.6], 15);
  expect(mocks.tiles).toHaveBeenCalledWith("https://tile.openstreetmap.org/{z}/{x}/{y}.png", expect.objectContaining({ maxZoom: 18 }));
  expect(result!.container.querySelector("iframe")).toBeNull();
  result!.unmount();
  expect(mocks.remove).toHaveBeenCalledOnce();
  expect(mocks.disconnect).toHaveBeenCalledOnce();
});
it("ne laisse pas une erreur de chargement casser la fiche", async () => {
  mocks.map.mockImplementationOnce(() => { throw new Error("internal provider detail"); });
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  await act(async () => { render(<VenueMap lat={46.5} lng={6.6} label="Lieu fictif" />); });
  expect(screen.getByRole("region", { name: "Lieu fictif" })).toBeTruthy();
  expect(warn).toHaveBeenCalledWith("Venue map unavailable");
});
