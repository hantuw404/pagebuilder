import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { apiKey, apiBaseUrl, model } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const endpoint = (apiBaseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
    const startTime = Date.now();

    const res = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say "pong" and nothing else.' }],
        max_tokens: 10,
      }),
    });

    const latency = Date.now() - startTime;

    if (!res.ok) {
      const errorText = await res.text();
      let msg = `HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(errorText);
        msg = parsed.error?.message || msg;
      } catch (_) {
        msg = errorText.slice(0, 150) || msg;
      }
      return NextResponse.json(
        { success: false, error: `Koneksi gagal: ${msg}` },
        { status: 400 }
      );
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || 'OK';

    return NextResponse.json({
      success: true,
      latencyMs: latency,
      reply,
      modelUsed: data.model || model,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Error jaringan/timeout: ${message}` },
      { status: 500 }
    );
  }
}
