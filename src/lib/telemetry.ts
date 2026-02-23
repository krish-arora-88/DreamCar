import { randomUUID } from 'node:crypto';

type HandlerFn = (req: Request) => Promise<Response>;

export function withTelemetry(name: string, fn: HandlerFn): HandlerFn {
  return async (req: Request): Promise<Response> => {
    const requestId = randomUUID();
    const start = Date.now();
    console.log(JSON.stringify({ event: 'request_start', requestId, endpoint: name, method: req.method }));

    try {
      const res = await fn(req);
      const duration = Date.now() - start;
      console.log(
        JSON.stringify({ event: 'request_end', requestId, endpoint: name, status: res.status, durationMs: duration }),
      );
      const headers = new Headers(res.headers);
      headers.set('x-request-id', requestId);
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
    } catch (err) {
      const duration = Date.now() - start;
      console.error(
        JSON.stringify({
          event: 'request_error',
          requestId,
          endpoint: name,
          durationMs: duration,
          error: err instanceof Error ? err.message : 'Unknown',
        }),
      );
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'content-type': 'application/json', 'x-request-id': requestId },
      });
    }
  };
}
