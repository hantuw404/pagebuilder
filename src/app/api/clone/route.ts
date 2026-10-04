import { NextRequest, NextResponse } from 'next/server';
import { executeReplacement } from '@/lib/slot-replacer';
import { validateClonedHtml, formatStructureDiffOutput } from '@/lib/validator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawHtml, replacementMap, generatedContent, contentSlots } = body;

    if (!rawHtml || !replacementMap || !generatedContent) {
      return NextResponse.json(
        { error: 'Missing rawHtml, replacementMap, or generatedContent.' },
        { status: 400 }
      );
    }

    const clonedHtml = executeReplacement({
      originalHtml: rawHtml,
      replacementMap,
      generatedContent,
      contentSlots: contentSlots || [],
    });

    const validation = validateClonedHtml(rawHtml, clonedHtml);
    const formattedDiff = formatStructureDiffOutput(validation);

    return NextResponse.json({
      success: true,
      clonedHtml,
      validation,
      formattedDiff,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Cloning execution error: ${message}` },
      { status: 500 }
    );
  }
}
