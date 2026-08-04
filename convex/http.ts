import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

/**
 * Hermes agent endpoint — verify a guest by phone + reservation code.
 *
 *   POST https://<deployment>.convex.site/hermes/verify
 *   Headers: x-api-key: <HERMES_API_KEY>
 *   Body: { "phone": "+212665001638", "reservationCode": "TSH-4F7K2" }
 *
 * Returns { verified: false } or { verified: true, guest, booking }.
 */
http.route({
  path: "/hermes/verify",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const expected = process.env.HERMES_API_KEY;
    if (!expected || request.headers.get("x-api-key") !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    let body: { phone?: string; reservationCode?: string };
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!body.phone || !body.reservationCode) {
      return new Response(
        JSON.stringify({ error: "phone and reservationCode are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const result = await ctx.runMutation(internal.hermes.verify, {
      phone: body.phone,
      reservationCode: body.reservationCode,
    });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
