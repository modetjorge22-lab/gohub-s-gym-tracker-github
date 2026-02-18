import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = Deno.env.get("WHOOP_CLIENT_ID");
    const redirectUri = "https://go-hubs-gym-tracker-github.base44.app/api/functions/whoopCallback";

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "read:sleep",
      state: user.email,
    });

    const authUrl = `https://api.prod.whoop.com/oauth/oauth2/auth?${params.toString()}`;
    return Response.json({ url: authUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});