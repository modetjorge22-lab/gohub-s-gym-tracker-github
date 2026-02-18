import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const userEmail = url.searchParams.get("state");

    if (!code || !userEmail) {
      return new Response("Missing code or state", { status: 400 });
    }

    const clientId = Deno.env.get("WHOOP_CLIENT_ID");
    const clientSecret = Deno.env.get("WHOOP_CLIENT_SECRET");
    const redirectUri = "https://go-hubs-gym-tracker-github.base44.app/api/functions/whoopCallback";

    // Exchange code for tokens
    const tokenRes = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return new Response(`Token exchange failed: ${err}`, { status: 400 });
    }

    const tokenData = await tokenRes.json();

    const base44 = createClientFromRequest(req);

    // Save or update token
    const existing = await base44.asServiceRole.entities.WhoopToken.filter({ user_email: userEmail });
    const tokenPayload = {
      user_email: userEmail,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
    };

    if (existing.length > 0) {
      await base44.asServiceRole.entities.WhoopToken.update(existing[0].id, tokenPayload);
    } else {
      await base44.asServiceRole.entities.WhoopToken.create(tokenPayload);
    }

    // Redirect back to integrations page
    return Response.redirect("https://go-hubs-gym-tracker-github.base44.app/#/IntegrationsSettings?whoop=connected", 302);
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});