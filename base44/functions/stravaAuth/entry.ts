import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { ensureStravaWebhookSubscription } from './stravaClient.ts';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { code } = await req.json();

        if (!code) {
            return Response.json({ error: 'Código no proporcionado' }, { status: 400 });
        }

        const clientId = Deno.env.get("STRAVA_CLIENT_ID");
        const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET");
        // Exchange code for tokens
        const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            return Response.json({ 
                error: 'Error obteniendo tokens de Strava',
                details: tokenData 
            }, { status: 400 });
        }

        // Save tokens to user
        await base44.auth.updateMe({
            strava_access_token: tokenData.access_token,
            strava_refresh_token: tokenData.refresh_token,
            strava_expires_at: tokenData.expires_at,
            strava_athlete_id: tokenData.athlete.id,
        });

        // Ensure global webhook exists so all connected users get auto-sync events.
        const callbackUrl = `${new URL(req.url).origin}/functions/stravaWebhook`;
        const webhook = await ensureStravaWebhookSubscription(callbackUrl);

        return Response.json({ 
            success: true,
            athlete: tokenData.athlete,
            webhook
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
