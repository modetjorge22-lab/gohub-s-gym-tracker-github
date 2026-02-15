import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        const clientId = Deno.env.get("STRAVA_CLIENT_ID");
        const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET");
        const verifyToken = Deno.env.get("STRAVA_WEBHOOK_VERIFY_TOKEN");

        const callbackUrl = `${new URL(req.url).origin}/functions/stravaWebhook`;

        // Register webhook with Strava
        const response = await fetch('https://www.strava.com/api/v3/push_subscriptions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                callback_url: callbackUrl,
                verify_token: verifyToken
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Return detailed error from Strava
            return Response.json({ 
                error: 'Error registrando webhook con Strava',
                strava_error: data,
                attempted_url: callbackUrl,
                status: response.status
            }, { status: 400 });
        }

        return Response.json({ 
            success: true,
            subscription: data,
            webhook_url: callbackUrl,
            message: 'Webhook configurado correctamente'
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});