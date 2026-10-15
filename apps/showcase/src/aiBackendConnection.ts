/** Framework-neutral connection setup; endpoint credentials stay in memory. */
import type { AgentSession, AssistantTransport } from "@adapttable/ai";
import { assistantHttpTransport, connectAgentHttp } from "@adapttable/ai/http";

export const SHOWCASE_AI_ENDPOINT = "http://127.0.0.1:8787";

export interface ShowcaseBackendConnection {
  readonly endpoint: string;
  readonly transport: AssistantTransport;
  readonly key: string;
}

let connectionSequence = 0;

export async function connectShowcaseBackend(
  session: AgentSession,
  endpoint: string,
  token: string,
  signal?: AbortSignal
): Promise<ShowcaseBackendConnection> {
  const address = endpoint.trim();
  const url = new URL(address);
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new Error("Enter an HTTP or HTTPS endpoint.");
  const options = {
    endpoint: address,
    ...(token ? { headers: { authorization: `Bearer ${token}` } } : {}),
  };
  await connectAgentHttp(session, options, signal);
  signal?.throwIfAborted();
  return {
    endpoint: address,
    transport: assistantHttpTransport(options),
    key: `showcase-http-${String(++connectionSequence)}`,
  };
}
