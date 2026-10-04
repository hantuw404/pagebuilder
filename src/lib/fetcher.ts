export interface FetchResult {
  success: boolean;
  html: string;
  modeUsed: 'raw' | 'manual';
  error?: string;
  warning?: string;
}

export async function fetchReferenceHtml(
  urlOrHtml: string,
  mode: 'raw' | 'manual' = 'raw'
): Promise<FetchResult> {
  if (mode === 'manual' || urlOrHtml.trim().startsWith('<') || !urlOrHtml.trim().startsWith('http')) {
    const trimmed = urlOrHtml.trim();
    if (!trimmed || trimmed.length < 50) {
      return {
        success: false,
        html: '',
        modeUsed: 'manual',
        error: 'REFERENCE ACCESS FAILED: HTML source is too short or invalid.',
      };
    }
    return {
      success: true,
      html: trimmed,
      modeUsed: 'manual',
    };
  }

  let targetUrl = urlOrHtml.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        success: false,
        html: '',
        modeUsed: 'raw',
        error: `REFERENCE ACCESS FAILED: HTTP Status ${res.status} (${res.statusText})`,
      };
    }

    const html = await res.text();

    if (!html || html.length < 100) {
      return {
        success: false,
        html: '',
        modeUsed: 'raw',
        error: 'RAW SOURCE INCOMPLETE: Body HTML empty or insufficient access.',
      };
    }

    return {
      success: true,
      html,
      modeUsed: 'raw',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      html: '',
      modeUsed: 'raw',
      error: `REFERENCE ACCESS FAILED: ${message}`,
    };
  }
}
