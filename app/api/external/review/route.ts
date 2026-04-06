import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/encryption'; // The function we built

export async function POST(req: Request) {
  // 1. Get the key from the request headers
  const authHeader = req.headers.get('authorization');
  const providedKey = authHeader?.replace('Bearer ', '');
  const userId = req.headers.get('x-user-id'); // Assuming the extension sends the User ID

  if (!providedKey || !userId) {
    return NextResponse.json({ error: 'Missing Credentials' }, { status: 401 });
  }

  // 2. AUTHENTICATE THE REQUEST
  const isValid = await validateApiKey(providedKey, userId);

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
  }

  // 3. If valid, process the code review...
  return NextResponse.json({ review: "Looks good!" });
}