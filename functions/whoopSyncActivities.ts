import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { format } from 'npm:date-fns@3.6.0';
import { ensureValidWhoopAccessToken, mapWhoopSportToActivityType } from './whoopClient.ts';

const WHOOP_API_BASE = Deno.env.get('WHOOP_API_BASE_URL') || 'https://api.prod.whoop.com/developer/v1';

async function fetchWorkoutsPage(accessToken: string, afterIso: string, nextToken?: string) {
  const attempts = [
    `${WHOOP_API_BASE}/activity/workout?limit=25&start=${encodeURIComponent(afterIso)}${nextToken ? `&nextToken=${encodeURIComponent(nextToken)}` : ''}`,
    `${WHOOP_API_BASE}/activity/workout?limit=25&start_date=${encodeURIComponent(afterIso)}${nextToken ? `&next_token=${encodeURIComponent(nextToken)}` : ''}`,
    `${WHOOP_API_BASE}/activity/workout?limit=25${nextToken ? `&next_token=${encodeURIComponent(nextToken)}` : ''}`,
  ];

  let lastError: { status: number; body: string; url: string } | null = null;

  for (const url of attempts) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const payload = await response.json();
      return {
        payload,
        usedUrl: url,
      };
    }

    const body = await response.text().catch(() => '');
    lastError = { status: response.status, body, url };

    if (response.status !== 404) {
      break;
    }
  }

  throw new Error(JSON.stringify(lastError || { status: 500, body: 'Unknown WHOOP API error' }));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!user.whoop_access_token) {
      return Response.json({ error: 'No estás conectado a WHOOP' }, { status: 400 });
    }

    const accessToken = await ensureValidWhoopAccessToken({
      user,
      updateUserTokens: (payload) => base44.auth.updateMe(payload),
    });

    const afterDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const afterIso = afterDate.toISOString();

    let collected: any[] = [];
    let nextToken: string | undefined;
    let page = 0;

    while (page < 10) {
      page += 1;
      const { payload } = await fetchWorkoutsPage(accessToken, afterIso, nextToken);

      const workouts = payload?.records || payload?.workouts || payload?.data || payload?.items || [];
      if (Array.isArray(workouts)) {
        collected = collected.concat(workouts);
      }

      nextToken = payload?.next_token || payload?.nextToken || payload?.pagination_token || undefined;
      if (!nextToken) break;
    }

    const existingActivities = await base44.entities.Activity.filter(
      { user_email: user.email },
      '-created_date',
      1000
    );

    let imported = 0;
    let updated = 0;

    for (const workout of collected) {
      const startTime = workout?.start || workout?.start_time || workout?.start_datetime || workout?.start_date;
      if (!startTime) continue;

      const date = format(new Date(startTime), 'yyyy-MM-dd');

      const durationSeconds = Number(
        workout?.duration_seconds ||
          workout?.duration ||
          workout?.duration_sec ||
          workout?.score?.duration_seconds ||
          0
      );

      const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
      const activityType = mapWhoopSportToActivityType(
        workout?.sport_name || workout?.sport || workout?.name,
        workout?.score_state
      );

      const existingOnDay = existingActivities.find((a) => a.date === date && a.activity_type === activityType);

      const notesSuffix = `Importado desde WHOOP (${workout?.sport_name || workout?.sport || 'workout'})`;

      if (existingOnDay) {
        if (existingOnDay.duration_minutes !== durationMinutes) {
          await base44.entities.Activity.update(existingOnDay.id, {
            duration_minutes: durationMinutes,
            points: durationMinutes,
            notes: existingOnDay.notes ? `${existingOnDay.notes} (Actualizado desde WHOOP)` : notesSuffix,
          });
          updated++;
        }
      } else {
        await base44.entities.Activity.create({
          user_email: user.email,
          user_name: user.full_name,
          activity_type: activityType,
          duration_minutes: durationMinutes,
          points: durationMinutes,
          date,
          status: 'completed',
          notes: notesSuffix,
        });
        imported++;
      }
    }

    return Response.json({
      total: collected.length,
      imported,
      updated,
      message: `${imported} nuevos, ${updated} actualizados desde WHOOP`,
    });
  } catch (error) {
    let parsed = null;
    try {
      parsed = JSON.parse(error.message);
    } catch (_) {
      parsed = null;
    }

    if (parsed?.status) {
      return Response.json(
        {
          error: 'Error obteniendo entrenamientos de WHOOP',
          whoop_status: parsed.status,
          whoop_body: parsed.body,
          whoop_url: parsed.url,
        },
        { status: 400 }
      );
    }

    return Response.json({ error: error.message || 'Error sincronizando WHOOP' }, { status: 500 });
  }
});
