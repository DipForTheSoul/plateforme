import { describe, expect, it } from "vitest";
import config from "@/next.config";

describe("en-têtes de sécurité globaux", () => {
  it("protège toutes les routes contre le sniffing, l’encapsulation et les référents excessifs", async () => {
    const entries = await config.headers?.();
    const global = entries?.find((entry) => entry.source === "/(.*)");
    const headers = Object.fromEntries(
      (global?.headers ?? []).map(({ key, value }) => [key, value])
    );

    expect(headers).toMatchObject({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
    expect(headers["Permissions-Policy"]).toContain("camera=()");
    expect(headers["Permissions-Policy"]).toContain("microphone=()");
  });
});
