import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { format } from 'npm:date-fns@3.6.0';

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

const stravaTypeMap = {
  'Run': 'running',
  'TrailRun': 'running',
  'Walk': 'hiking',
  'Hike': 'hiking',
  'Ride': 'cycling',
  'VirtualRide': 'cycling',
  'EBikeRide': 'cycling',
  'MountainBikeRide': 'cycling',
  'Swim': 'swimming',
  'WeightTraining': 'strength_training',
  'Workout': 'strength_training',
  'CrossFit': 'strength_training',
  'Yoga': 'yoga',
  'Tennis': 'tennis',
  'Padel': 'padel',
  'Soccer': 'football',
  'Football': 'football',
  'Basketball': 'basketball',
  'MartialArts': 'martial_arts',
  'Rowing': 'other',
  'StairStepper': 'other',
  'Elliptical': 'other',
  'RockClimbing': 'other',
  'Golf': 'other',
  'Skiing': 'other',
};

async function refreshStravaToken(refreshToken) {
  const clientId = Deno.env.get('STRAVA_CLIENT_ID');
  const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || 'Error refrescando token de Strava');
  return data;
}

async function ensureValidStravaAccessToken(user, updateUserTokens) {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = Number(user.strava_expires_at || 0);

  if (expiresAt > now + 120) {
    return user.strava_access_token;
  }

  const refreshed = await refreshStravaToken(user.strava_refresh_token);
  await updateUserTokens({
    strava_access_token: refreshed.access_token,
    strava_refresh_token: refreshed.refresh_token,
    strava_expires_at: refreshed.expires_at,
  });

  return refreshed.access_token;
}

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

    const accessToken = await ensureValidStravaAccessToken(user, (payload) =>
      base44.auth.updateMe(payload)
    );

    // Get activities from last 365 days
    const after = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;

    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const errorPayload = await response.text();
      console.error('Strava API error:', response.status, errorPayload);
      return Response.json(
        { error: 'Error obteniendo actividades de Strava', strava_status: response.status, strava_body: errorPayload },
        { status: 400 }
      );
    }

    const stravaActivities = await response.json();
    console.log(`Strava returned ${stravaActivities.length} activities`);
    if (stravaActivities.length > 0) {
      console.log('Sample activity:', JSON.stringify(stravaActivities[0]));
    }

    // Get existing activities for this user
    const existingActivities = await base44.entities.Activity.filter(
      { user_email: user.email },
      '-created_date',
      1000
    );

    let imported = 0;
    let updated = 0;

    for (const activity of stravaActivities) {
      const activityType = activity.sport_type || activity.type || '';
      const appActivityType = stravaTypeMap[activityType] || 'other';
      const date = format(new Date(activity.start_date), 'yyyy-MM-dd');
      const durationMinutes = Math.round(activity.elapsed_time / 60);

      // Check if there's already an activity of this type on this day
      const existingOnDay = existingActivities.find(
        (a) => a.date === date && a.activity_type === appActivityType
      );

      if (existingOnDay) {
        if (existingOnDay.duration_minutes !== durationMinutes) {
          await base44.entities.Activity.update(existingOnDay.id, {
            duration_minutes: durationMinutes,
            notes: existingOnDay.notes
              ? `${existingOnDay.notes} (Actualizado desde Strava)`
              : 'Sincronizado desde Strava',
          });
          updated++;
        }
      } else {
        await base44.entities.Activity.create({
          user_email: user.email,
          user_name: user.full_name,
          activity_type: appActivityType,
          duration_minutes: durationMinutes,
          points: durationMinutes,
          date: date,
          status: 'completed',
          notes: `Importado desde Strava (${activity.name})`,
        });
        imported++;
      }
    }

    return Response.json({
      total: stravaActivities.length,
      imported,
      updated,
      message: `${imported} nuevos, ${updated} actualizados`,
    });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});