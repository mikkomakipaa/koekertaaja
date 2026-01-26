'use client';

import { useId } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  GameController,
  DeviceMobile,
  Sparkle,
  ShieldCheck,
  BookOpenText,
  Brain,
  ChartLineUp,
} from '@phosphor-icons/react';

type AudienceKey = 'oppilaille' | 'huoltajille';

const pupilItems = [
  {
    title: 'Valmistaudu kokeisiin',
    description: 'Harjoittele omaan tahtiin ennen koetta',
    icon: Target,
  },
  {
    title: 'Opi hauskasti',
    description: 'Kerää pisteitä, rakenna putkia ja avaa saavutuksia',
    icon: GameController,
  },
  {
    title: 'Opettele missä vain',
    description: 'Puhelimella, tabletilla tai tietokoneella',
    icon: DeviceMobile,
  },
  {
    title: 'Saat välitöntä palautetta',
    description: 'Kertaa virheet ja opi niistä',
    icon: Sparkle,
  },
];

const guardianItems = [
  {
    title: 'Turvallinen ympäristö',
    description: 'Ei mainoksia, ei häiriöitä, ei seurantaa.',
    icon: ShieldCheck,
  },
  {
    title: 'Sisällöt koealueittain',
    description: 'Kirjat kotona? Sisältö löytyy muistikorteilta.',
    icon: BookOpenText,
  },
  {
    title: 'Suunniteltu tukemaan oppimista',
    description: 'Selitykset auttavat ymmärtämään asian',
    icon: Brain,
  },
  {
    title: 'Seuranta ja edistyminen',
    description: 'Näe lapsesi harjoittelun tulokset ja edistyminen',
    icon: ChartLineUp,
  },
];

function AudienceGrid({ items }: { items: typeof pupilItems }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="flex gap-3 rounded-2xl border border-emerald-100/70 bg-white/95 p-3 shadow-sm transition-all duration-200 motion-reduce:transition-none dark:border-emerald-400/40 dark:bg-slate-900/70 dark:shadow-[0_0_0_1px_rgba(148,163,184,0.12)]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Icon size={24} weight="duotone" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MobileAccordion({
  activeAudience,
  onAudienceChange,
}: {
  activeAudience: AudienceKey;
  onAudienceChange: (value: AudienceKey) => void;
}) {
  const baseId = useId();

  const sections = [
    {
      id: 'oppilaille' as const,
      label: 'Oppilaille',
      helper: 'Hauska tapa harjoitella ennen koetta',
      items: pupilItems,
    },
    {
      id: 'huoltajille' as const,
      label: 'Huoltajille',
      helper: 'Tuki oppimiselle kotona ja koulussa',
      items: guardianItems,
    },
  ];

  return (
    <div className="flex flex-col gap-3 md:hidden">
      {sections.map((section, index) => {
        const isOpen = activeAudience === section.id;
        const buttonId = `${baseId}-${section.id}-button`;
        const panelId = `${baseId}-${section.id}-panel`;
        const helperId = `${baseId}-${section.id}-helper`;
        return (
          <div
            key={section.id}
            className="rounded-2xl border border-gray-200 bg-white/95 shadow-sm transition-colors duration-200 motion-reduce:transition-none dark:border-slate-700/70 dark:bg-slate-900/70"
          >
            <button
              type="button"
              id={buttonId}
              aria-controls={panelId}
              aria-expanded={isOpen}
              aria-describedby={helperId}
              onClick={() => onAudienceChange(section.id)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  const nextIndex = (index + 1) % sections.length;
                  onAudienceChange(sections[nextIndex].id);
                }
                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  const prevIndex = (index - 1 + sections.length) % sections.length;
                  onAudienceChange(sections[prevIndex].id);
                }
                if (event.key === 'Home') {
                  event.preventDefault();
                  onAudienceChange(sections[0].id);
                }
                if (event.key === 'End') {
                  event.preventDefault();
                  onAudienceChange(sections[sections.length - 1].id);
                }
              }}
              className="flex min-h-[48px] w-full items-center justify-between gap-3 px-4 py-3 text-left text-base font-semibold text-gray-900 transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-gray-100 dark:focus-visible:ring-emerald-300 dark:focus-visible:ring-offset-gray-950"
            >
              <span>{section.label}</span>
              <span
                id={helperId}
                className={`text-sm font-medium transition-colors duration-200 motion-reduce:transition-none ${
                  isOpen ? 'text-emerald-600 dark:text-emerald-300' : 'text-gray-400 dark:text-slate-400'
                }`}
              >
                {section.helper}
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid overflow-hidden transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden px-4 pb-4">
                <AudienceGrid items={section.items} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AudienceTabs({
  activeAudience,
  onAudienceChange,
}: {
  activeAudience: AudienceKey;
  onAudienceChange: (value: AudienceKey) => void;
}) {
  return (
    <section aria-labelledby="audience-heading">
      <span id="oppilaille" className="sr-only" aria-hidden="true" />
      <span id="huoltajille" className="sr-only" aria-hidden="true" />
      <div>
        <h2 id="audience-heading" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Kenelle Koekertaaja on?
        </h2>
      </div>

      <div className="mt-3 hidden md:block">
        <Tabs value={activeAudience} onValueChange={(value) => onAudienceChange(value as AudienceKey)}>
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-gray-100 p-1 transition-colors duration-200 motion-reduce:transition-none dark:bg-gray-800 dark:ring-1 dark:ring-slate-700/60">
            <TabsTrigger
              value="oppilaille"
              className="rounded-xl border-b-2 border-transparent px-4 py-3 text-base font-semibold text-gray-700 transition-colors duration-200 motion-reduce:transition-none data-[state=active]:border-emerald-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 dark:text-gray-200 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-emerald-300"
            >
              Oppilaille
            </TabsTrigger>
            <TabsTrigger
              value="huoltajille"
              className="rounded-xl border-b-2 border-transparent px-4 py-3 text-base font-semibold text-gray-700 transition-colors duration-200 motion-reduce:transition-none data-[state=active]:border-emerald-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 dark:text-gray-200 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-emerald-300"
            >
              Huoltajille
            </TabsTrigger>
          </TabsList>
          <TabsContent value="oppilaille" className="mt-4">
            <AudienceGrid items={pupilItems} />
          </TabsContent>
          <TabsContent value="huoltajille" className="mt-4">
            <AudienceGrid items={guardianItems} />
          </TabsContent>
        </Tabs>
      </div>

      <MobileAccordion activeAudience={activeAudience} onAudienceChange={onAudienceChange} />
    </section>
  );
}
