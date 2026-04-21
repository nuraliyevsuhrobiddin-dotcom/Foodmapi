import { Star, MapPin, ChevronRight, Clock, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCategoryTheme, normalizeRestaurantCategories } from '../utils/categoryUtils';

export default function RestaurantCard({ restaurant, compact = false }) {
  const { user, toggleFavorite, setIsAuthModalOpen } = useAuth();
  const navigate = useNavigate();
  const restaurantData = normalizeRestaurantCategories(restaurant);
  const restaurantId = restaurantData._id || restaurantData.id;
  const isFavorited =
    user?.favorites?.some((favorite) => favorite._id === restaurantId || favorite === restaurantId) ||
    false;
  const hasDistance = restaurantData.distance !== null && restaurantData.distance !== undefined;
  const distanceLabel = hasDistance ? `${restaurantData.distance} km uzoqlikda` : null;
  const categoryLabel = restaurantData.category?.[0] || restaurantData.type || 'Restoran';
  const categoryTheme = getCategoryTheme(categoryLabel);

  const handleFavoriteClick = async (event) => {
    event.preventDefault();
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
      <div
        className={`group overflow-hidden border transition-all duration-300 ${
          compact
            ? 'rounded-[26px] border-white/10 bg-white/[0.06] shadow-[0_12px_28px_rgba(15,23,42,0.18)] backdrop-blur-md hover:bg-white/[0.09]'
            : 'rounded-[28px] border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)] hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.14)] dark:border-slate-800 dark:bg-[#1e293b] dark:shadow-none'
        }`}
      >
        <div
          className={`relative overflow-hidden ${
            compact ? 'h-36 bg-slate-800' : 'h-44 bg-slate-100 sm:h-56 dark:bg-slate-800'
          }`}
        >
          <img
            src={
              restaurantData.image ||
              restaurantData.coverImage ||
              'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop'
            }
            alt={restaurantData.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div
            className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${categoryTheme.gradientClass} opacity-75`}
          />
          <button
            onClick={handleFavoriteClick}
            className={`absolute left-3 top-3 z-10 flex touch-target items-center justify-center rounded-2xl shadow-sm backdrop-blur-md transition-colors hover:text-red-500 ${
              compact ? 'bg-slate-950/70 text-white/70' : 'bg-white/90 text-slate-400 dark:bg-slate-900/90'
            }`}
          >
            <Heart size={16} className={isFavorited ? 'fill-red-500 text-red-500' : ''} />
          </button>
          <div
            className={`absolute right-3 top-3 flex items-center gap-1 rounded-xl px-2.5 py-1 text-sm font-semibold shadow-sm backdrop-blur-md ${
              compact ? 'bg-slate-950/72 text-white' : 'bg-white/90 dark:bg-slate-900/90'
            }`}
          >
            <Star size={14} className="fill-yellow-500 text-yellow-500" />
            <span className={compact ? 'text-white' : 'text-slate-800 dark:text-slate-100'}>
              {restaurantData.rating || 0}
            </span>
            <span className={`${compact ? 'text-white/45' : 'text-slate-400'} ml-1 text-xs font-normal`}>
              ({restaurantData.reviews || 0})
            </span>
          </div>
          <div
            className={`absolute bottom-3 left-3 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-sm ${categoryTheme.surfaceClass}`}
          >
            {categoryLabel}
          </div>
          {hasDistance ? (
            <div
              className={`absolute bottom-3 right-3 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-sm ${
                compact
                  ? 'bg-slate-950/78 text-white'
                  : 'bg-white/90 text-slate-800 dark:bg-slate-900/90 dark:text-slate-100'
              }`}
            >
              {distanceLabel}
            </div>
          ) : null}
        </div>

        <div className={compact ? 'p-4' : 'p-4 sm:p-5'}>
          <div className="mb-2 flex items-start justify-between gap-3">
            <h3
              className={`line-clamp-1 font-bold transition-colors group-hover:text-primary ${
                compact ? 'text-base text-white' : 'text-lg text-slate-800 dark:text-slate-100'
              }`}
            >
              {restaurantData.name}
            </h3>
          </div>
          <p
            className={`mb-3 line-clamp-2 text-sm leading-relaxed ${
              compact ? 'text-white/58' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {restaurantData.description || restaurantData.address}
          </p>

          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className={`rounded-2xl px-3 py-2.5 ${compact ? 'bg-black/24' : 'bg-slate-50 dark:bg-slate-900/70'}`}>
              <span
                className={`mb-1 block text-[11px] font-semibold uppercase tracking-wide ${
                  compact ? 'text-white/38' : 'text-slate-400'
                }`}
              >
                Masofa
              </span>
              <div className={`flex items-center gap-1.5 text-sm font-semibold ${compact ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                <MapPin size={14} className="text-primary" />
                {distanceLabel || "Joylashuv yo'q"}
              </div>
            </div>
            <div className={`rounded-2xl px-3 py-2.5 ${compact ? 'bg-black/24' : 'bg-slate-50 dark:bg-slate-900/70'}`}>
              <span
                className={`mb-1 block text-[11px] font-semibold uppercase tracking-wide ${
                  compact ? 'text-white/38' : 'text-slate-400'
                }`}
              >
                Ish vaqti
              </span>
              <div className={`flex items-center gap-1.5 text-sm font-semibold ${compact ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                <Clock size={14} className="text-primary" />
                {restaurantData.workingHours || restaurantData.hours || 'Har kuni 08:00 - 23:00'}
              </div>
            </div>
          </div>

          <div className={`flex items-center justify-between border-t pt-4 ${compact ? 'border-white/8' : 'border-slate-100 dark:border-slate-800'}`}>
            <span className={`text-sm font-medium ${compact ? 'text-white/62' : 'text-slate-500 dark:text-slate-400'}`}>
              Batafsil ma'lumot
            </span>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 ${
                compact
                  ? 'bg-[#ffcc33] text-slate-950'
                  : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
              }`}
            >
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
