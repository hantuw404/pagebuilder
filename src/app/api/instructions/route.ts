import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getMasterInstructions } from '@/lib/content-engine';

export async function GET() {
  try {
    const content = getMasterInstructions();
    return NextResponse.json({
      success: true,
      exists: Boolean(content),
      content,
      lineCount: content ? content.split('\n').length : 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Content must be string' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'INSTRUCTION.md');
    fs.writeFileSync(filePath, content, 'utf-8');

    return NextResponse.json({
      success: true,
      lineCount: content.split('\n').length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
