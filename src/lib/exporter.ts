import JSZip from 'jszip';
import { ReplacementMap } from './types';

export async function createCloneZip(
  finalHtml: string,
  replacementMap: ReplacementMap,
  brandName: string = 'CLONE'
): Promise<Blob> {
  const zip = new JSZip();

  // Root files
  zip.file('index.html', finalHtml);
  zip.file('replacement-map.json', JSON.stringify(replacementMap, null, 2));

  // Generate zip blob
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
}

export async function createCloneZipBuffer(
  finalHtml: string,
  replacementMap: ReplacementMap
): Promise<Buffer> {
  const zip = new JSZip();
  zip.file('index.html', finalHtml);
  zip.file('replacement-map.json', JSON.stringify(replacementMap, null, 2));

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  return buffer;
}
