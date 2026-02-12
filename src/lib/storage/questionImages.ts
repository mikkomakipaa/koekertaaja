import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import type { ExtractedVisual } from '@/lib/utils/visualExtraction';

const logger = createLogger({ module: 'storage.questionImages' });
const BUCKET_NAME = 'question-assets';

interface StoreQuestionImageParams {
  questionId: string;
  visual: ExtractedVisual;
}

const decodeDataUri = (base64Data: string): { mediaType: string; buffer: Buffer } => {
  const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    throw new Error('Invalid base64 data URI for question image');
  }

  return {
    mediaType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
};

const normalizeExtension = (mediaType: string): string => {
  if (mediaType === 'image/jpeg') return 'jpg';
  if (mediaType === 'image/png') return 'png';
  if (mediaType === 'image/webp') return 'webp';
  if (mediaType === 'image/gif') return 'gif';
  return 'png';
};

export async function storeQuestionImage(params: StoreQuestionImageParams): Promise<string> {
  const { questionId, visual } = params;
  const supabase = getSupabaseAdmin();

  const { mediaType, buffer } = decodeDataUri(visual.base64Data);
  const ext = normalizeExtension(mediaType);
  const fileName = `question_images/${questionId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, buffer, {
      contentType: mediaType,
      upsert: true,
      cacheControl: '31536000',
    });

  if (error) {
    logger.error(
      {
        message: error.message,
        fileName,
      },
      'Failed to upload question image'
    );
    throw error;
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
  return data.publicUrl;
}

export async function storeQuestionImagesBulk(
  items: Array<{ questionId: string; visual: ExtractedVisual }>
): Promise<Map<string, string>> {
  const imageUrlByQuestionId = new Map<string, string>();

  for (const item of items) {
    try {
      const url = await storeQuestionImage(item);
      imageUrlByQuestionId.set(item.questionId, url);
    } catch (error) {
      logger.warn(
        {
          questionId: item.questionId,
          visualId: item.visual.id,
          error: error instanceof Error ? error.message : String(error),
        },
        'Skipping visual upload for question due to upload failure'
      );
    }
  }

  return imageUrlByQuestionId;
}
