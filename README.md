# express-turnstile-revived

Validate your CloudFlare Turnstile token using a revived Express middleware.

## Usage

```
pnpm add express-turnstile-revived
```

```js
import express from "express";
import { configureTurnstile, validateTurnstile } from "express-turnstile-revived";

configureTurnstile(process.env.TURNSTILE_SECRET);

const app = express();
app.use(express.json());

app.post(
  "/verify",
  validateTurnstile(),
  (req, res) => {
    res.json({ message: "verified!" });
  }
);

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
```

Override the global secret for a specific route:

```js
app.post("/contact", validateTurnstile("another-secret-key"), contactController);
```

## Request body and errors

Register `express.json()` or `express.urlencoded()` before the middleware. Send
the captcha in `token` or `cf-turnstile-response`; `token` takes precedence when
both are provided. Tokens must be non-blank strings of at most 2,048 characters.

After successful verification, the middleware removes **both** captcha fields
from `req.body` before calling `next()`. Other fields remain unchanged, so strict
request validators can validate just the application payload. Failed verification
leaves the body unchanged and does not call the route controller.

By default, errors use the HTTP status and this JSON format:

```json
{ "status": 400, "message": "Invalid token" }
```

| HTTP status | Message |
| --- | --- |
| 400 | `No token provided` |
| 400 | `Invalid token` |
| 503 | `Turnstile verification unavailable` |

To use your application's Express error handler instead of sending a response,
set `errorMode: "next"` globally or for a route:

```js
configureTurnstile(process.env.TURNSTILE_SECRET, { errorMode: "next" });

app.post("/contact", validateTurnstile(), contactController);

// Or configure just this route:
app.post("/feedback", validateTurnstile({ errorMode: "next" }), feedbackController);

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status ?? 500;
  res.status(status).json({
    status,
    message: status >= 500 ? "Internal Server Error" : error.message,
  });
});
```

In this mode the middleware calls `next(error)` with an `Error` containing
`status` and `message`, without writing a response. No application-specific
wrapper or error class is required.

**Compatibility:** errors previously used `{ success: false, data: { message } }`.
Update clients that read that envelope. Controllers that need the captcha after
verification must now capture it before this middleware.

## Verification retries

By default, verification makes up to three attempts for network failures, HTTP 429/5xx, or
Cloudflare's `internal-error`, waiting 250 ms and then 500 ms between attempts.
Each verification uses the same `idempotency_key` across its attempts. The total
timeout is 10 seconds, including retries and waiting periods.

Rejected tokens, other HTTP errors and malformed responses are not retried.
If verification remains unavailable, the middleware returns HTTP 503.

Configure retry options globally:

```js
configureTurnstile(process.env.TURNSTILE_SECRET, {
  maxRetries: 2,
  retryDelayMs: 250,
  timeoutMs: 10_000,
});
```

Override options for a route, keeping the global secret:

```js
app.post("/contact", validateTurnstile({ maxRetries: 0 }), contactController);
```

Or override both the secret and options:

```js
app.post(
  "/contact",
  validateTurnstile("another-secret-key", { maxRetries: 1, timeoutMs: 5_000 }),
  contactController,
);
```

- `maxRetries`: how many times to retry after the first attempt. For example, `2`
  allows up to 3 attempts. Use `0` for no retries.
- `retryDelayMs`: how long to wait before the first retry, in milliseconds. The
  wait doubles for each retry. Use `0` for no added wait.
- `timeoutMs`: the maximum time for the whole verification, including retries
  and waits. Must be at least `1` millisecond.
- `errorMode`: `"response"` (default) sends `{ status, message }` as JSON;
  `"next"` passes an error to Express. Other values are rejected.

Route options override global options. Any options you leave out use the global
values. Changing the global settings only affects middleware created afterward.

Use whole numbers for retry and timeout values. Time values cannot exceed
2,147,483,647 milliseconds. Invalid options throw a `TypeError` and leave the
global settings unchanged.

Calling `configureTurnstile(secret)` without options restores the defaults:
2 retries, a 250 ms initial wait, a 10-second total timeout, and
`errorMode: "response"`.

## Development

The build tools require Node.js 22.18+, 24.11+, or 26+ and pnpm. The published
middleware supports Node.js 22 or newer.

```sh
pnpm install
pnpm run build
```

Source code is grouped by responsibility:

- `src/index.ts`: public exports.
- `src/config/`: global configuration and option validation.
- `src/middleware/`: middleware creation and Express request handling.
- `src/verification/`: Cloudflare requests, retries and the total timeout.
- `src/types.ts`: shared interfaces and types.
- `src/utils/`: shared helpers.

The build checks types with native TypeScript, then uses tsdown to bundle the
library into just `lib/index.js` and `lib/index.d.ts`. Its built-in cleanup removes
old output files. Use `pnpm run typecheck` to check types without creating files.
Consumers import from `express-turnstile-revived`, not from internal modules.
