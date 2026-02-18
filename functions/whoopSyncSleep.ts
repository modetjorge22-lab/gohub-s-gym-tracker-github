import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function refreshWhoopToken(base44, tokenRecord) {
  const clientId = Deno.env.get("WHOOP_CLIENT_ID");
  const clientSecret = Deno.env.get("WHOOP_CLIENT_SECRET");

  const res = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokenRecord.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) throw new Error("Failed to refresh Whoop token");

  const data = await res.json();
  const updated = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || tokenRecord.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000),
  };

  await base44.asServiceRole.entities.WhoopToken.update(tokenRecord.id, updated);
  return updated.access_token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get user's Whoop token
    const tokens = await base44.asServiceRole.entities.WhoopToken.filter({ user_email: user.email });
    if (tokens.length === 0) {
      return Response.json({ error: 'No Whoop account connected' }, { status: 404 });
    }

    let tokenRecord = tokens[0];
    let accessToken = tokenRecord.access_token;

    // Refresh if expired
    if (Date.now() >= tokenRecord.expires_at - 60000) {
      accessToken = await refreshWhoopToken(base44, tokenRecord);
    }

    // Fetch sleep data from Whoop (last 30 days)
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sleepRes = await fetch(
      `https://api.prod.whoop.com/developer/v1/activity/sleep?start=${startDate}&limit=30`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!sleepRes.ok) {
      const err = await sleepRes.text();
      return Response.json({ error: `Whoop API error: ${err}` }, { status: 400 });
    }

    const sleepData = await sleepRes.json();
    const records = sleepData.records || [];

    // Fetch recovery data
    const recoveryRes = await fetch(
      `https://api.prod.whoop.com/developer/v1/recovery?start=${startDate}&limit=30`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const recoveryData = recoveryRes.ok ? await recoveryRes.json() : { records: [] };
    const recoveryMap = {};
    (recoveryData.records || []).forEach(r => {
      if (r.cycle_id) recoveryMap[r.cycle_id] = r;
    });

    // Get existing records to avoid duplicates
    const existing = await base44.asServiceRole.entities.WhoopSleep.filter({ user_email: user.email });
    const existingIds = new Set(existing.map(r => r.whoop_id));

    let created = 0;
    for (const record of records) {
      const whoopId = String(record.id);
      if (existingIds.has(whoopId)) continue;

      const score = record.score || {};
      const stages = score.stage_summary || {};
      const totalMs =
        (stages.total_in_bed_time_milli || 0);
      const totalMinutes = Math.round(totalMs / 60000);

      const sleepDate = record.end ? record.end.split("T")[0] : null;
      if (!sleepDate) continue;

      const recovery = recoveryMap[record.cycle_id] || {};
      const recoveryScore = recovery.score?.recovery_score ?? null;
      const hrv = recovery.score?.hrv_rmssd_milli ? Math.round(recovery.score.hrv_rmssd_milli) : null;
      const rhr = recovery.score?.resting_heart_rate ?? null;

      await base44.asServiceRole.entities.WhoopSleep.create({
        user_email: user.email,
        whoop_id: whoopId,
        date: sleepDate,
        total_duration_minutes: totalMinutes,
        sleep_performance: score.sleep_performance_percentage ?? null,
        recovery_score: recoveryScore,
        hrv_rmssd: hrv,
        resting_heart_rate: rhr,
      });
      created++;
    }

    return Response.json({ success: true, synced: created, total: records.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});