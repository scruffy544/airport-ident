export async function POST(request) {
  try {
    const body = await request.json();
    const { endpoint, method, token, data } = body;

    const response = await fetch(`https://api.printify.com${endpoint}`, {
      method: method || 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });

    const result = await response.json();
    return Response.json(result, { status: response.status });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
