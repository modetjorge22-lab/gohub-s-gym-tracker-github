const WHOOP_OAUTH_BASE = Deno.env.get('WHOOP_OAUTH_BASE_URL') || 'https://api.prod.whoop.com/oauth/oauth2';
const WHOOP_TOKEN_URL = `${WHOOP_OAUTH_BASE}/token`;

type UserWithWhoop = {
  id?: string;
  email?: string;
  whoop_access_token?: string;
  whoop_refresh_token?: string;
  whoop_expires_at?: number;
};

export async function refreshWhoopToken(refreshToken: string) {
  const clientId = Deno.env.get('WHOOP_CLIENT_ID');
  const clientSecret = Deno.env.get('WHOOP_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Faltan variables WHOOP_CLIENT_ID o WHOOP_CLIENT_SECRET');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error_description || data?.error || data?.message || 'Error refrescando token de WHOOP');
  }

  return data;
}

export async function ensureValidWhoopAccessToken({
  user,
  updateUserTokens,
}: {
  user: UserWithWhoop;
  updateUserTokens: (payload: {
    whoop_access_token: string;
    whoop_refresh_token: string;
    whoop_expires_at: number;
  }) => Promise<void>;
}) {
  if (!user?.whoop_access_token) {
    throw new Error('Usuario sin token de WHOOP');
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = Number(user.whoop_expires_at || 0);

  if (expiresAt > now + 120) {
    return user.whoop_access_token;
  }

  if (!user?.whoop_refresh_token) {
    throw new Error('Token WHOOP expirado y sin refresh token');
  }

  const refreshed = await refreshWhoopToken(user.whoop_refresh_token);
  const expiresIn = Number(refreshed.expires_in || 3600);
  const refreshedExpiresAt = now + expiresIn;

  await updateUserTokens({
    whoop_access_token: refreshed.access_token,
    whoop_refresh_token: refreshed.refresh_token || user.whoop_refresh_token,
    whoop_expires_at: refreshedExpiresAt,
  });

  return refreshed.access_token as string;
}

export function mapWhoopSportToActivityType(sportName?: string, scoreState?: string) {
  const sport = String(sportName || '').toLowerCase();

  if (sport.includes('run')) return 'running';
  if (sport.includes('cycl')) return 'cycling';
  if (sport.includes('swim')) return 'swimming';
  if (sport.includes('yoga')) return 'yoga';
  if (sport.includes('hik')) return 'hiking';
  if (sport.includes('tennis')) return 'tennis';
  if (sport.includes('padel')) return 'padel';
  if (sport.includes('basket')) return 'basketball';
  if (sport.includes('football') || sport.includes('soccer') || sport.includes('futbol')) return 'football';
  if (sport.includes('martial') || sport.includes('boxing') || sport.includes('mma') || sport.includes('jiu')) return 'martial_arts';
  if (sport.includes('strength') || sport.includes('weight') || sport.includes('gym') || scoreState === 'strength_trainer') {
    return 'strength_training';
  }

  return 'other';
}
