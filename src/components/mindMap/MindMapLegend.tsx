const LEGEND_ITEMS = [
  {
    key: 'none',
    symbol: '○',
    label: 'Ei harjoiteltu',
    detail: '0-49 % oikein',
    color: 'bg-slate-300 dark:bg-slate-500',
  },
  {
    key: 'partial',
    symbol: '◑',
    label: 'Osittain hallittu',
    detail: '50-79 % oikein',
    color: 'bg-amber-400 dark:bg-amber-500',
  },
  {
    key: 'mastered',
    symbol: '●',
    label: 'Hallittu',
    detail: '>= 80 % oikein',
    color: 'bg-emerald-500 dark:bg-emerald-400',
  },
] as const;

export function MindMapLegend() {
  return (
    <section
      data-testid="mind-map-legend"
      aria-label="Osaamisen selite"
      className="p-2"
    >
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Osaaminen</h2>
      <ul className="mt-2 flex flex-nowrap items-center gap-3 overflow-x-auto pb-1">
        {LEGEND_ITEMS.map((item) => (
          <li key={item.key} className="flex min-h-12 shrink-0 items-center gap-2 px-0.5 py-1">
            <span
              aria-hidden="true"
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${item.color}`}
            >
              {item.symbol}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-gray-800 dark:text-gray-100">{item.label}</span>
              <span className="block text-xs text-gray-600 dark:text-gray-300">{item.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
