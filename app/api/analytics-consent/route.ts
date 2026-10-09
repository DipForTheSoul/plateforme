import { NextResponse } from "next/server";

function returnUrl(request: Request) {
  const fallback = new URL("/", request.url);
  const referer = request.headers.get("referer");
  if (!referer) return fallback;
  const candidate = new URL(referer);
  return candidate.origin === fallback.origin ? candidate : fallback;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const consent = form.get("consent") === "accepted" ? "accepted" : "refused";
  const response = NextResponse.redirect(returnUrl(request), { status: 303 });
  response.cookies.set("fts-analytics-consent", consent, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
