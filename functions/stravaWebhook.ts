import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { format } from 'npm:date-fns@3.6.0';
import { ensureValidStravaAccessToken, isStrengthTrainingActivity } from './stravaClient.ts';

Deno.serve(async (req) => {
    const url = new URL(req.url);
    const verifyToken = Deno.env.get('STRAVA_WEBHOOK_VERIFY_TOKEN');

    if (req.method === 'GET') {
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');

        if (mode === 'subscribe' && token === verifyToken) {
            return Response.json({ 'hub.challenge': challenge });
        }

        return Response.json({ error: 'Verification failed' }, { status: 403 });
    }

    try {
        const event = await req.json();

        if (event.object_type !== 'activity') {
            return Response.json({ success: true });
        }

        if (event.aspect_type !== 'create' && event.aspect_type !== 'update') {
            return Response.json({ success: true });
        }

        const athleteId = event.owner_id;
        const base44 = createClientFromRequest(req);
        const users = await base44.asServiceRole.entities.User.filter({
            strava_athlete_id: athleteId.toString(),
        });

        if (!users || users.length === 0) {
            return Response.json({ success: true, message: 'User not found' });
        }

        const user = users[0];

        if (!user.strava_access_token) {
            return Response.json({ success: true, message: 'No access token' });
        }

        const accessToken = await ensureValidStravaAccessToken({
            user,
            updateUserTokens: (payload) => base44.asServiceRole.entities.User.update(user.id, payload),
        });

        const activityResponse = await fetch(`https://www.strava.com/api/v3/activities/${event.object_id}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!activityResponse.ok) {
            return Response.json({ error: 'Error fetching activity' }, { status: 400 });
        }

        const activity = await activityResponse.json();

        if (!isStrengthTrainingActivity(activity)) {
            return Response.json({ success: true, message: 'Not a strength training' });
        }

        const date = format(new Date(activity.start_date), 'yyyy-MM-dd');
        const durationMinutes = Math.round(activity.elapsed_time / 60);

        const existingActivities = await base44.asServiceRole.entities.Activity.filter({
            user_email: user.email,
            date,
            activity_type: 'strength_training',
        });

        if (existingActivities && existingActivities.length > 0) {
            const existing = existingActivities[0];
            await base44.asServiceRole.entities.Activity.update(existing.id, {
                duration_minutes: durationMinutes,
                notes: existing.notes
                    ? `${existing.notes} (Actualizado desde Strava)`
                    : 'Sincronizado desde Strava',
            });
        } else {
            await base44.asServiceRole.entities.Activity.create({
                user_email: user.email,
                user_name: user.full_name,
                activity_type: 'strength_training',
                duration_minutes: durationMinutes,
                points: durationMinutes,
                date,
                status: 'completed',
                notes: 'Importado desde Strava',
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
