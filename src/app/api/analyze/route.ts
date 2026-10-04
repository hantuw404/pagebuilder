import { NextRequest, NextResponse } from 'next/server';
import { fetchReferenceHtml } from '@/lib/fetcher';
import { parseReferenceHtml } from '@/lib/parser';
import { analyzeReference, formatReferenceAnalysisOutput } from '@/lib/analyzer';
import { buildStructureOutline, classifyStructureWithAi } from '@/lib/structure-analyzer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { referenceUrl, newBrand, newTitle, mode, rawHtml, aiOptions } = body;

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

    // ---------------------------------------------------------------------
    // Strict AI Structure Analysis (classification-only, never rewrites HTML)
    // ---------------------------------------------------------------------
    let structureVerdict = {
      source: 'fallback' as 'ai' | 'fallback',
      note: undefined as string | undefined,
      contentCount: 0,
    };
    let contentWhitelist: Set<number> | undefined;

    if (aiOptions?.apiKey) {
      // Build a stamped outline and let the AI classify content vs locked.
      const { outline } = buildStructureOutline(fetchRes.html);
      const verdict = await classifyStructureWithAi(
        outline,
        newBrand || '',
        newTitle || '',
        aiOptions
      );

      structureVerdict = {
        source: verdict.source,
        note: verdict.note,
        contentCount: verdict.contentIdx.length,
      };

      // Only enforce the whitelist when the AI actually produced a usable verdict.
      if (verdict.source === 'ai' && verdict.contentIdx.length > 0) {
        contentWhitelist = new Set(verdict.contentIdx);
      }
    }

    const parsed = parseReferenceHtml(fetchRes.html, referenceUrl || '', { contentWhitelist });
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
      structure: structureVerdict,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Internal Server Error: ${message}` },
      { status: 500 }
    );
  }
}
