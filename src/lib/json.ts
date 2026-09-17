/**
 * `NextResponse.json` usa `JSON.stringify` internamente, que lança erro ao
 * encontrar um `BigInt` (usado no schema para `fileSizeBytes`, já que vídeos
 * longos podem ultrapassar o range de um Int32). Use este helper em qualquer
 * resposta que possa incluir esses campos.
 */
export function jsonSafe(data: unknown, init?: ResponseInit) {
  const body = JSON.stringify(data, (_key, value) => (typeof value === "bigint" ? Number(value) : value));
  return new Response(body, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
}
