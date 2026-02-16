import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { format } from 'npm:date-fns@3.6.0';
import { ensureValidStravaAccessToken } from './stravaClient.ts';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const allUsers = await base44.asServiceRole.entities.User.list();
        const stravaUsers = allUsers.filter((u) => u.strava_access_token);

        if (stravaUsers.length === 0) {
            return Response.json({
                message: 'No hay usuarios con Strava conectado',
                synced: 0,
            });
        }

        let totalImported = 0;
        let totalUpdated = 0;
        const results = [];

        for (const stravaUser of stravaUsers) {
            try {
                const accessToken = await ensureValidStravaAccessToken({
                    user: stravaUser,
                    updateUserTokens: (payload) => base44.asServiceRole.entities.User.update(stravaUser.id, payload),
                });

                const after = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;

                const response = await fetch(
                    `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=50`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                if (!response.ok) {
                    results.push({
                        user: stravaUser.email,
                        status: 'error',
                        error: 'Error obteniendo actividades de Strava',
                    });
                    continue;
                }

                const activities = await response.json();
                
                // Mapeo de tipos de Strava a tipos de la app
                const stravaTypeMap = {
                    'Run': 'running',
                    'Ride': 'cycling',
                    'Swim': 'swimming',
                    'WeightTraining': 'strength_training',
                    'Workout': 'strength_training',
                    'Yoga': 'yoga',
                    'Hike': 'hiking',
                    'Walk': 'hiking',
                    'Soccer': 'football',
                    'Basketball': 'basketball',
                };

                const existingActivities = await base44.asServiceRole.entities.Activity.filter(
                    { user_email: stravaUser.email },
                    '-created_date',
                    1000
                );

                let imported = 0;
                let updated = 0;

                for (const activity of activities) {
                    const appActivityType = stravaTypeMap[activity.type] || 'other';
                    const date = format(new Date(activity.start_date), 'yyyy-MM-dd');
                    const durationMinutes = Math.round(activity.elapsed_time / 60);

                    const existingOnDay = existingActivities.find(
                        (a) => a.date === date && a.activity_type === appActivityType
                    );

                    if (existingOnDay) {
                        if (existingOnDay.duration_minutes !== durationMinutes) {
                            await base44.asServiceRole.entities.Activity.update(existingOnDay.id, {
                                duration_minutes: durationMinutes,
                                notes: existingOnDay.notes
                                    ? `${existingOnDay.notes} (Auto-actualizado)`
                                    : 'Auto-sincronizado desde Strava',
                            });
                            updated++;
                        }
                    } else {
                        await base44.asServiceRole.entities.Activity.create({
                            user_email: stravaUser.email,
                            user_name: stravaUser.full_name,
                            activity_type: appActivityType,
                            duration_minutes: durationMinutes,
                            points: durationMinutes,
                            date,
                            status: 'completed',
                            notes: `Auto-importado desde Strava (${activity.name})`,
                        });
                        imported++;
                    }
                }

                totalImported += imported;
                totalUpdated += updated;

                results.push({
                    user: stravaUser.email,
                    status: 'success',
                    imported,
                    updated,
                });
            } catch (error) {
                results.push({
                    user: stravaUser.email,
                    status: 'error',
                    error: error.message,
                });
            }
        }

        return Response.json({
            message: `Sincronización completada: ${totalImported} nuevos, ${totalUpdated} actualizados`,
            total_users: stravaUsers.length,
            total_imported: totalImported,
            total_updated: totalUpdated,
            details: results,
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});