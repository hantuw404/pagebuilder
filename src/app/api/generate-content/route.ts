import { NextRequest, NextResponse } from 'next/server';
import { generateSeoContent, formatContentOutput } from '@/lib/content-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { report, contentSlots, newBrand, newTitle, options } = body;

    if (!report || !newBrand || !newTitle) {
      return NextResponse.json(
        { error: 'Missing required parameters (report, newBrand, newTitle).' },
        { status: 400 }
      );
    }

    const content = await generateSeoContent(
      report,
      contentSlots || [],
      newBrand,
      newTitle,
      options
    );

    const formattedContent = formatContentOutput(content);

    return NextResponse.json({
      success: true,
      content,
      formattedContent,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Content Generation Error: ${message}` },
      { status: 500 }
    );
  }
}
