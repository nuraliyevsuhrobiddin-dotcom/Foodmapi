import { Compass, MapPinned } from 'lucide-react';

function CategoryChip({ active, children, onClick, tone = '', icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-300 active:scale-[0.98] ${
        active
          ? 'border-white bg-white text-slate-950 shadow-[0_12px_32px_rgba(255,255,255,0.22)]'
          : `border-white/12 bg-white/[0.08] text-white/78 backdrop-blur-md ${tone}`
      }`}
    >
      {Icon ? <Icon size={15} /> : null}
      <span>{children}</span>
    </button>
  );
}

export default function CategoryList({
  sortBy,
  setSortBy,
  triggerGPS,
  className = '',
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
            Saralash
          </p>
          <p className="mt-1 text-sm text-white/72">Restoranlarni tezkor tartiblash</p>
        </div>
        {sortBy && (
          <button
            type="button"
            onClick={() => setSortBy('')}
            className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.12]"
          >
            Tozalash
          </button>
        )}
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <div className="flex min-w-max gap-2.5 pb-1">
          <CategoryChip
            active={sortBy === 'nearest'}
            onClick={() => {
              if (sortBy === 'nearest') {
                setSortBy('');
              } else {
                triggerGPS();
              }
            }}
            icon={Compass}
          >
            Eng yaqin
          </CategoryChip>

          <CategoryChip
            active={sortBy === 'popular'}
            onClick={() => setSortBy(sortBy === 'popular' ? '' : 'popular')}
            icon={MapPinned}
          >
            Eng mashhur
          </CategoryChip>
        </div>
      </div>
    </div>
  );
}
