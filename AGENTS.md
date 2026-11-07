# Repository guidance

## Tooling and verification
- Use pnpm: `pnpm install`, then `pnpm run build`. Build tooling requires Node.js ^22.18.0, ^24.11.0 or >=26; the published middleware supports Node.js >=22.
- Use `pnpm-lock.yaml`; `package-lock.json` is stale (old package name, TypeScript 4.9 and `form-data`). Do not use npm to synchronize dependencies.
- `pnpm run build` runs `pnpm run typecheck` (TypeScript 7's native `tsc --noEmit`), then tsdown. `prepack` runs this build automatically; type checking alone does not emit files.
- No test, lint or formatter scripts are configured. The user explicitly requested no tests; do not add tests or a test runner unless asked.
- Edit `src/`, not ignored/generated `lib/`. `tsdown.config.mts` bundles `src/index.ts` into exactly `lib/index.js` and `lib/index.d.ts`, with built-in cleanup. Keep the config extension `.mts` (ESM config in a CommonJS package), CJS output and `fixedExtension: false`; do not add a custom cleanup script.
- Keep `isolatedDeclarations` enabled: tsdown uses native Oxc declaration generation, avoiding the legacy TypeScript compiler API.

## Public API and structure
- `src/index.ts` is the public export surface: `configureTurnstile`, `validateTurnstile`, `verifyTurnstile`, and the `VerificationOptions` type. Keep implementation modules separate.
- `config/` owns global state and option resolution; `middleware/` separates middleware creation from request handling; `verification/client.ts` handles a single Cloudflare request; `verification/verifyToken.ts` owns retries, idempotency and the total timeout. Reuse `utils/isRecord.ts` for unknown-object checks.
- Keep repository-defined interfaces and type aliases in `src/types.ts`, separate from runtime implementation; consume them with `import type`.
- Preserve all factory forms: `validateTurnstile()`, `validateTurnstile(options)`, `validateTurnstile(secret)`, and `validateTurnstile(secret, options)`. Do not require an `undefined` placeholder for options-only calls.
- Middleware instances capture their secret and merged options when created. Route overrides must not mutate globals; failed configuration must leave globals unchanged. `configureTurnstile(secret)` resets options to defaults.
- Prefer exported function declarations, not a `turnstile` wrapper object. Async verification uses `export async function`; error responses use `return res.status(...).json(...)` with `Promise<Response | void>`.
- README examples use ECMAScript `import` syntax and pnpm, even though published JavaScript is CommonJS. Do not change package module format merely to match the examples.

## Verification invariants
- Consumers register Express body parsing before the middleware. Accept `body.token`, falling back to `body["cf-turnstile-response"]`; reject non-string, blank or >2048-character tokens before contacting Cloudflare.
- Invalid/missing tokens return 400; unavailable or malformed upstream responses return 503 without exposing internal errors. Call `next()` only after successful verification, outside the upstream-error catch.
- Resolve client IP through `req.ip`/the socket, not directly from untrusted IP headers; proxy trust belongs to the consuming Express app.
- Use native Node APIs, not `form-data` or a fetch polyfill. Retries share one `idempotency_key` and one total timeout signal, including backoff waits.
- Retry only network request failures, HTTP 429/5xx and Cloudflare `internal-error`; do not retry rejected tokens, other HTTP errors or malformed JSON/results. `maxRetries` counts retries after the initial attempt, not total attempts.
