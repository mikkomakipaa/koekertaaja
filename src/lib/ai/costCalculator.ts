import { getModelPricing, type AIModel } from './modelSelector';

export function calculateCost(
  usage: { input_tokens?: number; output_tokens?: number } | undefined,
  model: string
): number {
  if (!usage?.input_tokens || !usage?.output_tokens) {
    return 0;
  }

  const pricing = getModelPricing(model as AIModel);
  const inputCost = (usage.input_tokens / 1_000_000) * pricing.input;
  const outputCost = (usage.output_tokens / 1_000_000) * pricing.output;

  return Number((inputCost + outputCost).toFixed(4));
}
