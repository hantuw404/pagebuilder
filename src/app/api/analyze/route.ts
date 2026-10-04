import { NextRequest, NextResponse } from 'next/server';
import { fetchReferenceHtml } from '@/lib/fetcher';
import { parseReferenceHtml } from '@/lib/parser';
import { analyzeReference, formatReferenceAnalysisOutput } from '@/lib/analyzer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { referenceUrl, newBrand, newTitle, mode, rawHtml } = body;

    if (!referenceUrl && !rawHtml) {
      return NextResponse.json(
        { error: 'REFERENCE ACCESS FAILED: Reference URL or HTML required.' },
        { status: 400 }
      );
    }

    const fetchRes = await fetchReferenceHtml(rawHtml || referenceUrl, mode || 'raw');
    if (!fetchRes.success) {
      return NextResponse.json({ error: fetchRes.error }, { status: 422 });
    }

    const parsed = parseReferenceHtml(fetchRes.html, referenceUrl || '');
    const report = analyzeReference(
      parsed,
      referenceUrl || 'Manual Input Source',
      newTitle || '',
      newBrand || ''
    );
    const formattedAnalysis = formatReferenceAnalysisOutput(report);

    return NextResponse.json({
      success: true,
      report,
      assets: parsed.assets,
      links: parsed.links,
      contentSlots: parsed.contentSlots,
      colors: parsed.colors,
      detectedOldBrand: parsed.detectedOldBrand,
      formattedAnalysis,
      rawHtml: parsed.rawHtml,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Internal Server Error: ${message}` },
      { status: 500 }
    );
  }
}
