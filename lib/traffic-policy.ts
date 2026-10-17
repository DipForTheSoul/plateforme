/** Cost control only, never an authentication or authorization boundary. */
export function isAutomatedAgent(userAgent: string | null): boolean {
  return /Lightpanda|meta-externalagent|Googlebot|bingbot|DuckDuckBot|Applebot|Amazonbot|PetalBot|QlyzeBot|Reflectionbot|GPTBot|ClaudeBot|Bytespider|CCBot|HeadlessChrome|crawler|spider/i.test(userAgent ?? "");
}

export function shouldStopCatalogueCrawl(url: URL, userAgent: string | null): boolean {
  if (!/^\/(?:fr\/|de\/|en\/)?experiences\/?$/.test(url.pathname)) return false;
  if (!isAutomatedAgent(userAgent)) return false;
  // Keep the canonical catalogue and individual offers discoverable.
  return ["du", "au", "calendrier", "vue"].some((key) => url.searchParams.has(key));
}
