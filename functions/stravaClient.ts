const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

type UserWithStrava = {
  id?: string;
  email?: string;
  strava_access_token?: string;
  strava_refresh_token?: string;
  strava_expires_at?: number;
};

export async function refreshStravaToken(refreshToken: string) {
  const clientId = Deno.env.get('STRAVA_CLIENT_ID');
  const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Faltan variables STRAVA_CLIENT_ID o STRAVA_CLIENT_SECRET');
  }

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

  if (!response.ok) {
    throw new Error(data?.message || 'Error refrescando token de Strava');
  }

  return data;
}

export async function ensureValidStravaAccessToken({
  user,
  updateUserTokens,
}: {
  user: UserWithStrava;
  updateUserTokens: (payload: {
    strava_access_token: string;
    strava_refresh_token: string;
    strava_expires_at: number;
  }) => Promise<void>;
}) {
  if (!user?.strava_access_token) {
    throw new Error('Usuario sin token de Strava');
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = Number(user.strava_expires_at || 0);

  if (expiresAt > now + 120) {
    return user.strava_access_token;
  }

  if (!user?.strava_refresh_token) {
    throw new Error('Token expirado y sin refresh token de Strava');
  }

  const refreshed = await refreshStravaToken(user.strava_refresh_token);

  await updateUserTokens({
    strava_access_token: refreshed.access_token,
    strava_refresh_token: refreshed.refresh_token,
    strava_expires_at: refreshed.expires_at,
  });

  return refreshed.access_token as string;
}

export async function ensureStravaWebhookSubscription(callbackUrl: string) {
  const clientId = Deno.env.get('STRAVA_CLIENT_ID');
  const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');
  const verifyToken = Deno.env.get('STRAVA_WEBHOOK_VERIFY_TOKEN');

  if (!clientId || !clientSecret || !verifyToken) {
    throw new Error('Faltan variables de entorno para webhook de Strava');
  }

  const existingResponse = await fetch(
    `https://www.strava.com/api/v3/push_subscriptions?client_id=${clientId}&client_secret=${clientSecret}`
  );

  if (!existingResponse.ok) {
    const errorData = await existingResponse.json().catch(() => ({}));
    throw new Error(errorData?.message || 'Error consultando webhooks de Strava');
  }

  const subscriptions = await existingResponse.json();
  const alreadyExists = Array.isArray(subscriptions)
    ? subscriptions.some((subscription) => subscription.callback_url === callbackUrl)
    : false;

  if (alreadyExists) {
    return { created: false, message: 'Webhook ya existente' };
  }

  const createResponse = await fetch('https://www.strava.com/api/v3/push_subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      callback_url: callbackUrl,
      verify_token: verifyToken,
    }),
  });

  const createData = await createResponse.json();

  if (!createResponse.ok) {
    throw new Error(createData?.message || 'Error creando webhook en Strava');
  }

  return { created: true, subscription: createData, message: 'Webhook creado' };
}
