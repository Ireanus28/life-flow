/** Reads a `text/event-stream` body and invokes `onEvent` for each parsed JSON payload. */
export async function readSSE(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: Record<string, unknown>) => void
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const dataLine = frame.split("\n").find((line) => line.startsWith("data:"));
      if (!dataLine) continue;
      const payload = dataLine.slice("data:".length).trim();
      try {
        onEvent(JSON.parse(payload));
      } catch {
        // Malformed frame — skip rather than aborting the whole stream.
      }
    }
  }
}
