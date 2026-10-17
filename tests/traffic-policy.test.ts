import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { isAutomatedAgent, shouldStopCatalogueCrawl } from "../lib/traffic-policy";
const state = vi.hoisted(() => ({ rate: vi.fn(), admin: vi.fn(), insert: vi.fn(), session: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ isRateLimited: state.rate }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: state.admin }));
vi.mock("../lib/supabase/middleware", () => ({ updateSession: state.session }));
vi.mock("next-intl/middleware", () => ({ default: () => () => NextResponse.next() }));
import { POST } from "../app/api/views/route";
import proxy from "../proxy";
beforeEach(() => {
  vi.clearAllMocks(); state.rate.mockResolvedValue(false);
  state.insert.mockResolvedValue({ error: null });
  state.admin.mockReturnValue({ from: () => ({ insert: state.insert }) });
  state.session.mockImplementation(async (_req, response) => response);
});
describe("crawl cost boundary", () => {
  it.each(["Lightpanda/1.0", "Mozilla/5.0 (compatible; meta-externalagent/1.1)", "Googlebot/2.1"])("drops bot analytics before any DB call: %s", async (ua) => {
    const res = await POST(new NextRequest("https://example.test/api/views", { method: "POST", headers: { "user-agent": ua }, body: "{}" }));
    expect(res.status).toBe(204); expect(state.rate).not.toHaveBeenCalled(); expect(state.admin).not.toHaveBeenCalled();
  });
  it.each(["Mozilla/5.0 (iPad) AppleWebKit/605.1.15 Safari/604.1", "Mozilla/5.0 Firefox/146.0", "Mozilla/5.0 Chrome/155.0.0.0", "Mozilla/5.0 Ddg/26.6"])("keeps human filtering and counting: %s", async (ua) => {
    expect(isAutomatedAgent(ua)).toBe(false);
    const page = await proxy(new NextRequest("https://example.test/de/experiences?du=2026-10-17&vue=carte", { headers: { "user-agent": ua } }));
    expect(page.status).toBe(200); expect(state.session).toHaveBeenCalledOnce();
    const res = await POST(new NextRequest("https://example.test/api/views", { method: "POST", headers: { "user-agent": ua }, body: JSON.stringify({ path: "/de/experiences", locale: "de" }) }));
    expect(res.status).toBe(200); expect(state.insert).toHaveBeenCalledWith({ path: "/de/experiences", locale: "de" });
  });
  it.each(["", "/fr", "/de", "/en"])("blocks crawl combinations before session/render for %s", async (prefix) => {
    const response = await proxy(new NextRequest(`https://example.test${prefix}/experiences?calendrier=2099-12`, { headers: { "user-agent": "Lightpanda/1.0" } }));
    expect(response.status).toBe(403); expect(response.headers.get("cache-control")).toContain("no-store"); expect(state.session).not.toHaveBeenCalled();
  });
  it.each(["/experiences", "/de/experiences/offer", "/admin?du=x", "/auth/callback?du=x"])("does not block canonical/detail/auth paths %s", (path) => {
    expect(shouldStopCatalogueCrawl(new URL(`https://example.test${path}`), "Googlebot/2.1")).toBe(false);
  });
  it("retains the existing human rate limit", async () => {
    state.rate.mockResolvedValue(true);
    const response = await POST(new NextRequest("https://example.test/api/views", { method: "POST", body: "{}" }));
    expect(response.status).toBe(429); expect(state.admin).not.toHaveBeenCalled();
  });
  it("does not intercept server action POSTs", async () => {
    const response = await proxy(new NextRequest("https://example.test/experiences?du=x", { method: "POST", headers: { "user-agent": "Lightpanda/1.0" } }));
    expect(response.status).toBe(200); expect(state.session).toHaveBeenCalledOnce();
  });
  it("ignores prefetch without touching the database", async () => {
    const response = await POST(new NextRequest("https://example.test/api/views", { method: "POST", headers: { "sec-purpose": "prefetch;prerender" } }));
    expect(response.status).toBe(204); expect(state.rate).not.toHaveBeenCalled();
  });
  it("keeps a database failure visible and recovers on next human request", async () => {
    const request = () => new NextRequest("https://example.test/api/views", { method: "POST", body: JSON.stringify({ path: "/experiences", locale: "fr" }) });
    state.insert.mockResolvedValueOnce({ error: { message: "offline" } });
    expect((await POST(request())).status).toBe(503);
    expect((await POST(request())).status).toBe(200);
  });
});
