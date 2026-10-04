export type ExtractionMode = 'raw' | 'rendered' | 'manual';

export interface MetadataStatus {
  found: boolean;
  value: string | null;
  status: 'FOUND' | 'NOT FOUND' | 'UNVERIFIED';
}

export interface PageMetadata {
  title: MetadataStatus;
  description: MetadataStatus;
  keywords: MetadataStatus;
  robots: MetadataStatus;
  canonical: MetadataStatus;
  ogTitle: MetadataStatus;
  ogDescription: MetadataStatus;
  ogImage: MetadataStatus;
  ogUrl: MetadataStatus;
  twitterCard: MetadataStatus;
  twitterTitle: MetadataStatus;
  twitterDescription: MetadataStatus;
  jsonLd: MetadataStatus;
}

export type AssetRole = 'LOGO' | 'HERO' | 'FAVICON' | 'BACKGROUND' | 'ICON' | 'IMAGE' | 'VIDEO_POSTER';

export interface ExtractedAsset {
  originalUrl: string;
  role: AssetRole;
  occurrences: number;
  newUrl?: string;
  keepOriginal?: boolean;
}

export interface ExtractedLink {
  originalUrl: string;
  isRelative: boolean;
  occurrences: number;
  category: 'internal' | 'external' | 'social' | 'cta' | 'navigation' | 'other';
  newUrl?: string;
  keepOriginal?: boolean;
}

export interface ContentSlot {
  id: string; // e.g., CONTENT-001
  type: 'H1' | 'H2' | 'H3' | 'H4' | 'PARAGRAPH' | 'FAQ_QUESTION' | 'FAQ_ANSWER' | 'REVIEW_TEXT' | 'CTA_COPY' | 'OTHER';
  selector: string;
  index: number;
  originalText: string;
  originalWordCount: number;
  newText?: string;
}

export interface StructureCounts {
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  paragraphs: number;
  faqCount: number;
  reviewCount: number;
  totalWords: number;
  writingStyle: string;
}

export interface BlueprintItem {
  order: number;
  section: string;
  elements: string[];
}

export interface AnalysisReport {
  url: string;
  detectedOldBrand: string;
  metadata: PageMetadata;
  structure: StructureCounts;
  faq: {
    hasFaq: boolean;
    count: number;
    pattern: string;
  };
  review: {
    hasReview: boolean;
    count: number;
    pattern: string;
    isPlaceholder: boolean;
  };
  additionalElements: string[];
  keywords: {
    primary: string;
    secondary: string[];
    related: string[];
  };
  blueprint: BlueprintItem[];
  domTreeOutline: string[];
}

export interface GeneratedContent {
  rawMeta: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    robots: string;
    canonical: string;
    ogTitle: string;
    ogDescription: string;
  };
  h1: string[];
  h2: string[];
  h3: string[];
  paragraphs: string[];
  faqs: Array<{ question: string; answer: string }>;
  reviews: Array<{ author?: string; text: string; rating?: number; isPlaceholder?: boolean }>;
  wordCount: number;
  wordCountMatchPercent: number;
  /** Which engine actually produced the content. */
  engine?: 'llm' | 'deterministic';
  /** Human-readable note, e.g. the fallback reason when LLM was requested but failed. */
  engineNote?: string;
}

export interface ReplacementMap {
  brand: {
    old: string;
    new: string;
  };
  title: {
    new: string;
  };
  assets: Record<string, string>;
  links: Record<string, string>;
  contentSlots: Record<string, string>;
}

export interface ValidationCheckItem {
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL' | 'UNCHANGED';
  detail: string;
}

export interface ValidationReport {
  sections: ValidationCheckItem;
  h1: ValidationCheckItem;
  h2: ValidationCheckItem;
  paragraphs: ValidationCheckItem;
  faq: ValidationCheckItem;
  review: ValidationCheckItem;
  css: ValidationCheckItem;
  js: ValidationCheckItem;
  dom: ValidationCheckItem;
  structuralSimilarityPercent: number;
  allPassed: boolean;
}
