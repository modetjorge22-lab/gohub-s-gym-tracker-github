import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        const clientId = Deno.env.get("STRAVA_CLIENT_ID");

        return Response.json({ clientId });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});