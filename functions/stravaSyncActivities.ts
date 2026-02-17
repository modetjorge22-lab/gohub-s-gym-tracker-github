import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { format } from 'npm:date-fns@3.6.0';
import { ensureValidStravaAccessToken, isStrengthTrainingActivity } from './stravaClient.ts';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        if (!user.strava_access_token) {
            return Response.json({ error: 'No estás conectado a Strava' }, { status: 400 });
        }

        const accessToken = await ensureValidStravaAccessToken({
            user,
            updateUserTokens: (payload) => base44.auth.updateMe(payload),
        });

        // Get activities from last 30 days
        const after = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
        
        const response = await fetch(
            `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const errorPayload = await response.text();
            return Response.json(
                {
                    error: 'Error obteniendo actividades de Strava',
                    strava_status: response.status,
                    strava_body: errorPayload,
                },
                { status: 400 }
            );
        }

        const activities = await response.json();
        
        // Filter only strength training
        const workouts = activities.filter((a) => isStrengthTrainingActivity(a));

        // Get existing activities for this user
        const existingActivities = await base44.entities.Activity.filter(
            { user_email: user.email },
            '-created_date',
            1000
        );

        let imported = 0;
        let updated = 0;

        for (const activity of activities) {
            const appActivityType = stravaTypeMap[activity.type] || 'other';
            const date = format(new Date(activity.start_date), 'yyyy-MM-dd');
            const durationMinutes = Math.round(activity.elapsed_time / 60);

            // Check if there's already an activity of this type on this day
            const existingOnDay = existingActivities.find(a => 
                a.date === date && 
                a.activity_type === appActivityType
            );

            if (existingOnDay) {
                // Update duration if different
                if (existingOnDay.duration_minutes !== durationMinutes) {
                    await base44.entities.Activity.update(existingOnDay.id, {
                        duration_minutes: durationMinutes,
                        notes: existingOnDay.notes 
                            ? `${existingOnDay.notes} (Actualizado desde Strava)`
                            : 'Sincronizado desde Strava'
                    });
                    updated++;
                }
            } else {
                // Create new activity
                await base44.entities.Activity.create({
                    user_email: user.email,
                    user_name: user.full_name,
                    activity_type: appActivityType,
                    duration_minutes: durationMinutes,
                    points: durationMinutes,
                    date: date,
                    status: 'completed',
                    notes: `Importado desde Strava (${activity.name})`
                });
                imported++;
            }
        }

        return Response.json({ 
            total: activities.length,
            imported,
            updated,
            message: `${imported} nuevos, ${updated} actualizados`
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
