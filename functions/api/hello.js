export default async function onRequest(context) {
  return new Response(JSON.stringify({ ok: true, route: 'api/test' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
