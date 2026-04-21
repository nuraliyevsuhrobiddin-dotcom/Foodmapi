import { Star, MapPin, ChevronRight, Clock, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCategoryTheme, normalizeRestaurantCategories } from '../utils/categoryUtils';

export default function RestaurantCard({ restaurant }) {
  const { user, toggleFavorite, setIsAuthModalOpen } = useAuth();
  const navigate = useNavigate();
  const normalizedRestaurant = normalizeRestaurantCategories(restaurant);
  const restaurantData = normalizedRestaurant;
  const restaurantId = restaurantData._id || restaurantData.id;
  const isFavorited = user?.favorites?.some(f => f._id === restaurantId || f === restaurantId) || false;
  const hasDistance = restaurantData.distance !== null && restaurantData.distance !== undefined;
  const distanceLabel = hasDistance ? `${restaurantData.distance} km uzoqlikda` : null;
  const categoryLabel = restaurantData.category?.[0] || restaurantData.type || 'Restoran';
  const categoryTheme = getCategoryTheme(categoryLabel);

  const handleFavoriteClick = async (e) => {
    e.preventDefault(); // Prevent Navigation Link
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const result = await toggleFavorite(restaurantId);
    if (result.success && result.isFavorited) {
      navigate('/profile');
    }
  };

  return (
    <Link to={`/restaurant/${restaurantId}`} className="block">
      <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.14)] dark:border-slate-800 dark:bg-[#1e293b] dark:shadow-none">
        <div className="relative h-44 overflow-hidden bg-slate-100 sm:h-56 dark:bg-slate-800">
          <img 
            src={restaurantData.image || restaurantData.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop'} 
            alt={restaurantData.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${categoryTheme.gradientClass} opacity-75`} />
          <button 
            onClick={handleFavoriteClick}
            className="absolute left-3 top-3 z-10 flex touch-target items-center justify-center rounded-2xl bg-white/90 text-slate-400 shadow-sm backdrop-blur-md transition-colors hover:text-red-500 dark:bg-slate-900/90"
          >
            <Heart size={16} className={isFavorited ? 'fill-red-500 text-red-500' : ''} />
          </button>
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-xl bg-white/90 px-2.5 py-1 text-sm font-semibold shadow-sm backdrop-blur-md dark:bg-slate-900/90">
            <Star size={14} className="text-yellow-500 fill-yellow-500" />
            <span className="text-slate-800 dark:text-slate-100">{restaurantData.rating || 0}</span>
            <span className="text-slate-400 text-xs ml-1 font-normal">({restaurantData.reviews || 0})</span>
          </div>
          <div className={`absolute bottom-3 left-3 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-sm ${categoryTheme.surfaceClass}`}>
            {categoryLabel}
          </div>
          {hasDistance && (
            <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-sm dark:bg-slate-900/90 dark:text-slate-100">
              {distanceLabel}
            </div>
          )}
        </div>
        
        <div className="p-4 sm:p-5">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 text-lg font-bold text-slate-800 transition-colors group-hover:text-primary dark:text-slate-100">
              {restaurantData.name}
            </h3>
          </div>
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {restaurantData.description || restaurantData.address}
          </p>

          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900/70">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Masofa</span>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <MapPin size={14} className="text-primary" />
                {distanceLabel || 'Joylashuv yo‘q'}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900/70">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Ish vaqti</span>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Clock size={14} className="text-primary" />
                {restaurantData.workingHours || restaurantData.hours || 'Har kuni 08:00 - 23:00'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Batafsil ma'lumot</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
