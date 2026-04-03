Deno.serve(async () => {
  try {
    const clientId = Deno.env.get('WHOOP_CLIENT_ID');

    if (!clientId) {
      return Response.json({ error: 'WHOOP_CLIENT_ID no configurado en el backend' }, { status: 400 });
    }

    return Response.json({ clientId });
  } catch (error) {
    return Response.json({ error: error.message || 'Error obteniendo WHOOP client id' }, { status: 500 });
  }
});
