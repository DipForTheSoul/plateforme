import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  exchangeError: null as null | Error,
  verifyError: null as null | Error,
  exchangedCode: "",
  verifiedToken: "",
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      exchangeCodeForSession: async (code: string) => {
        state.exchangedCode = code;
        return { error: state.exchangeError };
      },
      verifyOtp: async ({ token_hash }: { token_hash: string }) => {
        state.verifiedToken = token_hash;
        return { error: state.verifyError };
      },
    },
  }),
}));

import { GET } from "@/app/api/auth/callback/route";

beforeEach(() => {
  state.exchangeError = null;
  state.verifyError = null;
  state.exchangedCode = "";
  state.verifiedToken = "";
});

it("accepte un lien de récupération autonome ouvert dans un autre navigateur", async () => {
  const request = new Request(
    "https://www.forthesoul.ch/api/auth/callback?token_hash=recovery-token&type=recovery&next=%2Freinitialiser-mot-de-passe",
  );
  const response = await GET(request as never);

  expect(state.verifiedToken).toBe("recovery-token");
  expect(response.headers.get("location")).toBe(
    "https://www.forthesoul.ch/reinitialiser-mot-de-passe",
  );
});

it("conserve la compatibilité avec les liens PKCE existants", async () => {
  const request = new Request(
    "https://www.forthesoul.ch/api/auth/callback?code=pkce-code&next=%2Freinitialiser-mot-de-passe",
  );
  const response = await GET(request as never);

  expect(state.exchangedCode).toBe("pkce-code");
  expect(response.headers.get("location")).toBe(
    "https://www.forthesoul.ch/reinitialiser-mot-de-passe",
  );
});

it("refuse un type de jeton non prévu", async () => {
  const request = new Request(
    "https://www.forthesoul.ch/api/auth/callback?token_hash=token&type=signup&next=%2Freinitialiser-mot-de-passe",
  );
  const response = await GET(request as never);

  expect(state.verifiedToken).toBe("");
  expect(response.headers.get("location")).toBe(
    "https://www.forthesoul.ch/connexion",
  );
});
