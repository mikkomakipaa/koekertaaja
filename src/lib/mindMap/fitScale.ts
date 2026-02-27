interface MindMapFitScaleInput {
  containerWidth: number;
  containerHeight: number;
  layoutWidth: number;
  layoutHeight: number;
  padding: number;
  minScale: number;
  maxScale: number;
  maxAutoScale?: number;
}

const roundScale = (value: number): number => Math.round(value * 100) / 100;

const clampScale = (value: number, minScale: number, maxScale: number): number => {
  if (value < minScale) return minScale;
  if (value > maxScale) return maxScale;
  return roundScale(value);
};

const isPositiveNumber = (value: number): boolean => Number.isFinite(value) && value > 0;

export const calculateMindMapFitScale = ({
  containerWidth,
  containerHeight,
  layoutWidth,
  layoutHeight,
  padding,
  minScale,
  maxScale,
  maxAutoScale = 1,
}: MindMapFitScaleInput): number => {
  if (
    !isPositiveNumber(containerWidth) ||
    !isPositiveNumber(containerHeight) ||
    !isPositiveNumber(layoutWidth) ||
    !isPositiveNumber(layoutHeight)
  ) {
    return clampScale(1, minScale, maxScale);
  }

  const horizontalSpace = Math.max(containerWidth - padding * 2, 1);
  const verticalSpace = Math.max(containerHeight - padding * 2, 1);

  const widthScale = horizontalSpace / layoutWidth;
  const heightScale = verticalSpace / layoutHeight;
  const fitScale = Math.min(widthScale, heightScale, maxAutoScale);

  return clampScale(fitScale, minScale, maxScale);
};
