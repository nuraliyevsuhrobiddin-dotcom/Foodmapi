import { Compass, Flame, Grid2x2, MapPinned, Soup, Store, UtensilsCrossed } from 'lucide-react';
import { getCategoryTheme, normalizeCategoryLabel } from '../utils/categoryUtils';

const ICON_MAP = {
  Grid2x2,
  Soup,
  Flame,
  Store,
  UtensilsCrossed,
};

const ALL_CATEGORY = 'All';

export default function FilterPanel({
  categoryOptions,
  selectedCategory,
  onSelectCategory,
  sortBy,
  setSortBy,
  triggerGPS,
}) {
  const hasActiveFilters = selectedCategory !== ALL_CATEGORY || sortBy;

  return (
    <div className="w-full border-b border-slate-200 dark:border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(255,107,53,0.14),_transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] px-4 py-3 sm:p-4 dark:bg-[radial-gradient(circle_at_top_left,_rgba(255,107,53,0.16),_transparent_38%),linear-gradient(180deg,rgba(30,41,59,0.96),rgba(15,23,42,0.98))]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
            Kashf Qilish
          </p>
          <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200 sm:text-[15px]">
            Backend kategoriyalari bilan tez filtrlash
          </p>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              onSelectCategory(ALL_CATEGORY);
              setSortBy('');
            }}
            className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
          >
            Tozalash
          </button>
        )}
      </div>

      <div className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
        {categoryOptions.map((category) => {
          const isActive = selectedCategory === category;
          const normalizedCategory = normalizeCategoryLabel(category);
          const theme = category === ALL_CATEGORY ? null : getCategoryTheme(normalizedCategory);
          const Icon = category === ALL_CATEGORY ? Grid2x2 : ICON_MAP[theme?.icon] || UtensilsCrossed;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              className={`snap-start whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 relative touch-target border shadow-sm ${
                isActive
                  ? category === ALL_CATEGORY
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
                    : `${theme.activeClass} shadow-lg`
                  : category === ALL_CATEGORY
                    ? 'border-slate-200/80 bg-white/80 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800'
                    : `${theme.idleClass} hover:-translate-y-0.5`
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Icon size={14} />
                {category === ALL_CATEGORY ? 'Hammasi' : normalizedCategory}
              </span>
            </button>
          );
        })}

        <div className="my-auto mx-1 h-10 w-px shrink-0 bg-gradient-to-b from-transparent via-slate-300 to-transparent dark:via-slate-700"></div>

        <button
          type="button"
          onClick={() => {
            if (sortBy === 'nearest') {
              setSortBy('');
            } else {
              triggerGPS();
            }
          }}
          className={`snap-start whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-semibold border transition-all touch-target ${
            sortBy === 'nearest'
              ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-900 dark:border-white'
              : 'border-slate-200/80 bg-white/80 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Compass size={14} />
            Eng yaqin
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSortBy(sortBy === 'popular' ? '' : 'popular')}
          className={`snap-start whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-semibold border transition-all touch-target ${
            sortBy === 'popular'
              ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/25'
              : 'border-slate-200/80 bg-white/80 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <MapPinned size={14} />
            Eng mashhur
          </span>
        </button>
      </div>
    </div>
  );
}
