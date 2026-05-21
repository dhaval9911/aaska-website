import { NextResponse } from 'next/server';

const apiUrl = process.env.API_BASE_URL ?? 'http://localhost:4000/api';

export async function POST(request: Request) {
  const body = await request.json();

  const response = await fetch(`${apiUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();

  return NextResponse.json(payload, {
    status: response.status,
  });
}
