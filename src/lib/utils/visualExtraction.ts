export type VisualType = 'diagram' | 'chart' | 'image' | 'table';

export interface VisualMaterialFile {
  type: string;
  name: string;
  data: string;
}

export interface ExtractedVisual {
  id: string;
  type: VisualType;
  pageNumber: number;
  base64Data: string;
  mediaType: string;
  caption?: string;
  contextText: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ExtractedMaterial {
  text: string;
  visuals: ExtractedVisual[];
  metadata: {
    hasVisuals: boolean;
    visualCount: number;
    imageFileCount: number;
    pdfFileCount: number;
  };
}

export interface VisualAnalysis {
  visualId: string;
  questionPotential: 'high' | 'medium' | 'low';
  suggestedQuestionTypes: string[];
  concepts: string[];
  reasoning: string;
}

interface ExtractMaterialParams {
  materialText?: string;
  materialFiles?: VisualMaterialFile[];
  maxVisuals?: number;
}

const CAPTION_REGEX = /(Kuva|Figure|Taulukko|Table|Kaavio|Chart|Diagram)\s+\d+[:.]\s*([^\n]+)/gi;

const getDataUri = (mediaType: string, data: string): string => {
  return `data:${mediaType};base64,${data}`;
};

const inferCaptionFromFileName = (name: string): string | undefined => {
  const fileNameWithoutExt = name.replace(/\.[^/.]+$/, '').trim();
  if (!fileNameWithoutExt) {
    return undefined;
  }
  const normalized = fileNameWithoutExt.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return normalized.length > 2 ? normalized : undefined;
};

const contextualWindow = (text: string, visualIndex: number, chars: number): string => {
  if (!text.trim()) {
    return '';
  }

  if (text.length <= chars * 2) {
    return text;
  }

  const ratio = (visualIndex + 1) / (Math.max(visualIndex + 1, 1) + 1);
  const center = Math.floor(text.length * ratio);
  return extractContext(text, center, chars);
};

export function classifyVisual(caption?: string, context?: string): VisualType {
  const text = `${caption ?? ''} ${context ?? ''}`.toLowerCase();

  if (text.includes('taulukko') || text.includes('table')) return 'table';
  if (text.includes('kaavio') || text.includes('graph') || text.includes('chart')) return 'chart';
  if (
    text.includes('kuva') &&
    (text.includes('kolmio') || text.includes('ympyr') || text.includes('neli') || text.includes('diagram'))
  ) {
    return 'diagram';
  }

  return 'image';
}

export function extractCaption(pageText: string, position = 0): string | undefined {
  const matches = Array.from(pageText.matchAll(CAPTION_REGEX));
  if (matches.length === 0) {
    return undefined;
  }

  const index = Math.max(0, Math.min(position, matches.length - 1));
  const selected = matches[index];
  return selected[0]?.trim();
}

export function extractContext(pageText: string, position: number, chars = 200): string {
  if (!pageText) {
    return '';
  }

  const safePosition = Math.max(0, Math.min(position, pageText.length));
  const start = Math.max(0, safePosition - chars);
  const end = Math.min(pageText.length, safePosition + chars);
  return pageText.slice(start, end).trim();
}

export async function extractMaterialWithVisuals(
  params: ExtractMaterialParams
): Promise<ExtractedMaterial> {
  const text = params.materialText?.trim() ?? '';
  const files = params.materialFiles ?? [];
  const maxVisuals = Math.max(0, params.maxVisuals ?? 8);

  const imageFiles = files.filter((file) => file.type.startsWith('image/')).slice(0, maxVisuals);
  const pdfFileCount = files.filter((file) => file.type === 'application/pdf').length;

  const visuals: ExtractedVisual[] = imageFiles.map((file, index) => {
    const caption = inferCaptionFromFileName(file.name) ?? extractCaption(text, index);
    const contextText = contextualWindow(text, index, 200);

    return {
      id: `image_${index + 1}`,
      type: classifyVisual(caption, contextText),
      pageNumber: 1,
      base64Data: getDataUri(file.type, file.data),
      mediaType: file.type,
      caption,
      contextText,
      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    };
  });

  return {
    text,
    visuals,
    metadata: {
      hasVisuals: visuals.length > 0,
      visualCount: visuals.length,
      imageFileCount: imageFiles.length,
      pdfFileCount,
    },
  };
}

export function parseImageReference(value?: string): number | null {
  if (!value) {
    return null;
  }

  const match = value.match(/IMAGE_(\d+)/i);
  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[1], 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return parsed - 1;
}

export function analyzeVisualPotential(visual: ExtractedVisual, subject: string): VisualAnalysis {
  const subjectKey = subject.toLowerCase();
  const concepts = [visual.type, ...(visual.caption ? [visual.caption.toLowerCase()] : [])]
    .join(' ')
    .split(/[^a-zA-Z\u00C0-\u024F0-9_]+/)
    .filter(Boolean)
    .slice(0, 5);

  if (visual.type === 'diagram') {
    return {
      visualId: visual.id,
      questionPotential: 'high',
      suggestedQuestionTypes: ['diagram_interpretation', 'measurement', 'comparison'],
      concepts,
      reasoning: `${subjectKey}: diagrammi tukee vaiheittaista tulkintaa ja mittausta.`,
    };
  }

  if (visual.type === 'chart' || visual.type === 'table') {
    return {
      visualId: visual.id,
      questionPotential: 'high',
      suggestedQuestionTypes: ['chart_reading', 'trend_analysis', 'comparison'],
      concepts,
      reasoning: `${subjectKey}: numeerinen/taulukkomuotoinen sisältö tukee suoria tulkintakysymyksiä.`,
    };
  }

  return {
    visualId: visual.id,
    questionPotential: 'medium',
    suggestedQuestionTypes: ['image_analysis', 'labeling'],
    concepts,
    reasoning: `${subjectKey}: kuva tukee tunnistamista ja käsitteiden soveltamista.`,
  };
}
