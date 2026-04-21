export default function CategoryBar({ categories, activeCategory, onSelectCategory }) {
  if (!categories?.length) return null;

  return (
    <div className="sticky top-[64px] z-30 -mx-4 mb-5 overflow-x-auto border-y border-white/10 bg-slate-950/72 px-4 py-3 backdrop-blur-xl no-scrollbar sm:top-[72px] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex snap-x gap-2 pb-1">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={`snap-start whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
              activeCategory === category
                ? 'bg-[#ffcc33] text-slate-950'
                : 'bg-white/10 text-white'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
