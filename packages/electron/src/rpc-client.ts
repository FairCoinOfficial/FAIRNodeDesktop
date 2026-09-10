import { request as httpRequest } from "node:http";

export type RpcCredentials = {
  host: string;
  port: number;
  user: string;
  password: string;
};

export class RpcError extends Error {
  constructor(
    message: string,
    readonly code?: number,
  ) {
    super(message);
    this.name = "RpcError";
  }
}

type RpcResponse<T> = {
  result: T | null;
  error: { code: number; message: string } | null;
  id: string | number;
};

/**
 * Minimal Bitcoin/PIVX-style JSON-RPC client over HTTP basic auth. faircoind
 * exposes the same RPC surface on 127.0.0.1; we only ever talk to localhost.
 */
export class FaircoindRpcClient {
  constructor(private readonly credentials: RpcCredentials) {}

  call<T>(method: string, params: ReadonlyArray<string | number | boolean> = []): Promise<T> {
    const body = JSON.stringify({ jsonrpc: "1.0", id: "fairnode", method, params });

    return new Promise<T>((resolve, reject) => {
      const auth = Buffer.from(`${this.credentials.user}:${this.credentials.password}`).toString(
        "base64",
      );
      const req = httpRequest(
        {
          host: this.credentials.host,
          port: this.credentials.port,
          method: "POST",
          path: "/",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
            Authorization: `Basic ${auth}`,
          },
          timeout: 15000,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => {
            const text = Buffer.concat(chunks).toString("utf8");
            // faircoind returns 401/403/500 with bodies that may not be JSON.
            try {
              const parsed = JSON.parse(text) as RpcResponse<T>;
              if (parsed.error) {
                reject(new RpcError(parsed.error.message, parsed.error.code));
                return;
              }
              resolve(parsed.result as T);
            } catch {
              reject(
                new RpcError(
                  `RPC ${method} failed: HTTP ${res.statusCode ?? "?"} ${text.slice(0, 200)}`.trim(),
                ),
              );
            }
          });
        },
      );

      req.on("error", (error) => {
        reject(new RpcError(`RPC ${method} unreachable: ${error.message}`));
      });
      req.on("timeout", () => {
        req.destroy();
        reject(new RpcError(`RPC ${method} timed out`));
      });

      req.write(body);
      req.end();
    });
  }
}
