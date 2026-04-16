import { motion } from 'framer-motion';
import { CATEGORIES } from '../data/mockData';

export default function FilterPanel({ categories, toggleCategory, sortBy, setSortBy, triggerGPS }) {
  // Exclude 'Hammasi' from the actual map array to treat it as a special reset button
  const specificCategories = CATEGORIES.filter(c => c !== 'Hammasi');

  return (
    <div className="w-full bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-800 p-4">
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {/* 'Hammasi' button clears all categories */}
        <button
          onClick={() => { if(categories.length > 0) toggleCategory('Hammasi'); }}
          className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 relative ${
            categories.length === 0 
              ? 'text-white' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {categories.length === 0 && (
            <motion.div
              layoutId="active-filter-hammasi"
              className="absolute inset-0 bg-primary rounded-full -z-10"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          Hammasi
        </button>

        {specificCategories.map((category) => {
          const isActive = categories.includes(category);
          return (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 relative ${
                isActive 
                  ? 'text-white bg-primary shadow-md shadow-primary/20' 
                  : 'text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {category}
            </button>
          )
        })}
        
        {/* Additional sort filters */}
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 my-auto mx-2 shrink-0"></div>
        
        <button 
          onClick={() => {
            if (sortBy === 'nearest') {
               setSortBy('');
            } else {
               triggerGPS();
            }
          }}
          className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium border transition-colors ${
            sortBy === 'nearest'
              ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          Eng yaqin
        </button>

        <button 
          onClick={() => setSortBy(sortBy === 'popular' ? '' : 'popular')}
          className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium border transition-colors ${
            sortBy === 'popular'
              ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          Eng mashhur
        </button>
      </div>
    </div>
  );
}
