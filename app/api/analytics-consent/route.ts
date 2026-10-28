import { NextRequest, NextResponse } from "next/server";
import {AUDIENCE_CONSENT,INTERNAL_AUDIENCE,internalAudienceChoice} from '@/lib/audience';

function returnUrl(request: Request) {
  const fallback = new URL("/", request.url);
  const referer = request.headers.get("referer");
  if (!referer) return fallback;
  try {const candidate = new URL(referer);return candidate.origin === fallback.origin ? candidate : fallback;}catch{return fallback;}
}

export async function POST(request: NextRequest) {
  if(request.headers.get('origin')!==new URL(request.url).origin)return new NextResponse(null,{status:403});
  const form = await request.formData();
  const consent = form.get("consent") === "accepted" ? "accepted" : "refused";
  const response = NextResponse.redirect(returnUrl(request), { status: 303 });
  // Before changing Google's legacy choice, preserve any earlier opposition.
  response.cookies.set(INTERNAL_AUDIENCE,internalAudienceChoice(request.cookies.get(INTERNAL_AUDIENCE)?.value,request.cookies.get(AUDIENCE_CONSENT)?.value),{
    path:'/',maxAge:31536000,sameSite:'lax',secure:new URL(request.url).protocol==='https:',
  });
  response.cookies.set("fts-audience-consent-v2", consent, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
