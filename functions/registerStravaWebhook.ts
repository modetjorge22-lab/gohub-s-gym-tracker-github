import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { ensureStravaWebhookSubscription } from './stravaClient.ts';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        const callbackUrl = `${new URL(req.url).origin}/functions/stravaWebhook`;
        const webhook = await ensureStravaWebhookSubscription(callbackUrl);

        return Response.json({
            success: true,
            webhook_url: callbackUrl,
            ...webhook,
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
