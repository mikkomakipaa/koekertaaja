'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { WarningCircle, ChartBar, Lightbulb, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import type { MaterialCapacity, QuestionCountValidation } from '@/lib/utils/materialAnalysis';

interface CapacityWarningDialogProps {
  capacity: MaterialCapacity;
  validation: QuestionCountValidation;
  requestedCount: number;
  minimumCount: number;
  onProceed: () => void;
  onAdjust: (count: number) => void;
  onAddMaterial: () => void;
  onCancel: () => void;
}

export function CapacityWarningDialog({
  capacity,
  validation,
  requestedCount,
  minimumCount,
  onProceed,
  onAdjust,
  onAddMaterial,
  onCancel,
}: CapacityWarningDialogProps) {
  const recommendedCount = Math.max(minimumCount, capacity.optimalQuestionCount);
  const acceptableCount = Math.max(minimumCount, capacity.acceptableQuestionCount);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[94vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-amber-200 bg-white p-6 shadow-xl dark:border-amber-800/50 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              <WarningCircle className="h-5 w-5 text-amber-600" weight="duotone" />
              Materiaalianalyysi
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Sulje"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{validation.message}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-4 text-sm dark:border-gray-700 sm:grid-cols-2">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Sanamäärä:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{capacity.wordCount}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Lauseita:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{capacity.sentenceCount}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Arvioidut käsitteet:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{capacity.estimatedConcepts}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Rikkaus:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                  {capacity.richness.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Pyydetty:</span>
                <span className="ml-2 font-semibold text-amber-700 dark:text-amber-300">{requestedCount}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Suositeltu:</span>
                <span className="ml-2 font-semibold text-green-700 dark:text-green-300">
                  {capacity.optimalQuestionCount}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-800 dark:bg-blue-900/20">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                <ChartBar className="mr-1 inline h-4 w-4" weight="duotone" />
                Kapasiteetti: optimaalinen {capacity.optimalQuestionCount}, hyväksyttävä {capacity.acceptableQuestionCount}, maksimi {capacity.maxQuestionCount}
              </p>
              {minimumCount > capacity.optimalQuestionCount && (
                <p className="mt-1 text-xs text-blue-800 dark:text-blue-200">
                  Järjestelmän minimi on {minimumCount} kysymystä per sarja.
                </p>
              )}
            </div>

            {capacity.recommendations.length > 0 && (
              <div className="space-y-2 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <Lightbulb className="mr-1 inline h-4 w-4 text-indigo-500" weight="duotone" />
                  Suositukset
                </p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
                  {capacity.recommendations.map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button variant="secondary" onClick={onCancel}>
              Peruuta
            </Button>
            <Button variant="outline" onClick={onAddMaterial}>
              Lisää materiaalia
            </Button>
            <Button variant="outline" onClick={() => onAdjust(recommendedCount)}>
              Luo {recommendedCount} (suositus)
            </Button>
            {acceptableCount > recommendedCount && (
              <Button variant="outline" onClick={() => onAdjust(acceptableCount)}>
                Luo {acceptableCount} (hyväksyttävä)
              </Button>
            )}
            <Button variant="destructive" onClick={onProceed}>
              Jatka {requestedCount} kysymyksellä
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
