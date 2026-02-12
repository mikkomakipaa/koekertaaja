interface VisualQuestionPreviewProps {
  imageUrl?: string;
  altText?: string;
  className?: string;
}

export function VisualQuestionPreview({
  imageUrl,
  altText = 'Kysymyksen kuva',
  className,
}: VisualQuestionPreviewProps) {
  if (!imageUrl) {
    return null;
  }

  return (
    <div className={className ?? 'mb-5'}>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
        <img
          src={imageUrl}
          alt={altText}
          loading="lazy"
          className="max-h-[380px] w-full object-contain"
        />
      </div>
    </div>
  );
}
