import { NextRequest, NextResponse } from 'next/server';
import { createCloneZipBuffer } from '@/lib/exporter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { finalHtml, replacementMap, brandName } = body;

    if (!finalHtml) {
      return NextResponse.json({ error: 'Missing finalHtml' }, { status: 400 });
    }

    const safeBrand = (brandName || 'CLONE').replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();
    const zipBuffer = await createCloneZipBuffer(
      finalHtml,
      replacementMap || { brand: { old: '', new: safeBrand }, title: { new: '' }, assets: {}, links: {}, contentSlots: {} }
    );

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeBrand}-CLONE.zip"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Export error: ${message}` }, { status: 500 });
  }
}
