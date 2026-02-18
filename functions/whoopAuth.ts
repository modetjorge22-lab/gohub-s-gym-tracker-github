import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const WHOOP_OAUTH_BASE = Deno.env.get('WHOOP_OAUTH_BASE_URL') || 'https://api.prod.whoop.com/oauth/oauth2';
const WHOOP_TOKEN_URL = `${WHOOP_OAUTH_BASE}/token`;
const WHOOP_API_BASE = Deno.env.get('WHOOP_API_BASE_URL') || 'https://api.prod.whoop.com/developer/v1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { code, redirectUri } = await req.json();

    if (!code) {
      return Response.json({ error: 'Código de autorización requerido' }, { status: 400 });
    }

    const clientId = Deno.env.get('WHOOP_CLIENT_ID');
    const clientSecret = Deno.env.get('WHOOP_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return Response.json({ error: 'WHOOP_CLIENT_ID/WHOOP_CLIENT_SECRET no configurados en backend' }, { status: 400 });
    }

    const fallbackRedirect = `${new URL(req.url).origin}/WhoopConnect`;
    const finalRedirectUri = redirectUri || Deno.env.get('WHOOP_REDIRECT_URI') || fallbackRedirect;

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: finalRedirectUri,
    });

    const tokenResponse = await fetch(WHOOP_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body,
    });

    const tokenData = await tokenResponse.json().catch(() => ({}));

    if (!tokenResponse.ok) {
      return Response.json(
        {
          error: tokenData?.error_description || tokenData?.error || 'Error obteniendo tokens de WHOOP',
          whoop_status: tokenResponse.status,
          whoop_body: tokenData,
        },
        { status: 400 }
      );
    }

    const expiresIn = Number(tokenData.expires_in || 3600);
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    let whoopUserId = '';
    let whoopProfile = null;

    try {
      const profileResponse = await fetch(`${WHOOP_API_BASE}/user/profile/basic`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/json',
        },
      });

      if (profileResponse.ok) {
        whoopProfile = await profileResponse.json().catch(() => null);
        whoopUserId = String(whoopProfile?.user_id || whoopProfile?.id || '');
      }
    } catch (_) {
      // perfil opcional
    }

    await base44.auth.updateMe({
      whoop_access_token: tokenData.access_token,
      whoop_refresh_token: tokenData.refresh_token,
      whoop_expires_at: expiresAt,
      whoop_user_id: whoopUserId,
    });

    return Response.json({
      success: true,
      connected: true,
      whoop_user_id: whoopUserId || null,
      profile: whoopProfile,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Error conectando WHOOP' }, { status: 500 });
  }
});
