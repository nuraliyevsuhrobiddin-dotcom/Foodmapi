import { Star, MapPin, ChevronRight, Clock, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RestaurantCard({ restaurant }) {
  const { user, toggleFavorite, setIsAuthModalOpen } = useAuth();
  const restaurantId = restaurant._id || restaurant.id;
  const isFavorited = user?.favorites?.some(f => f._id === restaurantId || f === restaurantId) || false;

  const handleFavoriteClick = async (e) => {
    e.preventDefault(); // Prevent Navigation Link
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    await toggleFavorite(restaurantId);
  };

  return (
    <Link to={`/restaurant/${restaurantId}`} className="block">
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:shadow-none dark:border border-slate-200 dark:border-slate-800 transition-all duration-300 group">
        <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img 
            src={restaurant.image || restaurant.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop'} 
            alt={restaurant.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <button 
            onClick={handleFavoriteClick}
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm z-10"
          >
            <Heart size={16} className={isFavorited ? 'fill-red-500 text-red-500' : ''} />
          </button>
          <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-sm font-semibold flex items-center gap-1 shadow-sm">
            <Star size={14} className="text-yellow-500 fill-yellow-500" />
            <span className="text-slate-800 dark:text-slate-100">{restaurant.rating || 0}</span>
            <span className="text-slate-400 text-xs ml-1 font-normal">({restaurant.reviews || 0})</span>
          </div>
          <div className="absolute bottom-3 left-3 bg-primary/95 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg">
            {restaurant.category?.[0] || restaurant.type || 'Restoran'}
          </div>
        </div>
        
        <div className="p-5">
          <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors text-slate-800 dark:text-slate-100 line-clamp-1">
            {restaurant.name}
          </h3>
          
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-3 gap-4">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              {restaurant.distance || 0} km
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              {restaurant.hours || 'Har kuni 08:00 - 23:00'}
            </div>
          </div>
          
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">
            {restaurant.description || restaurant.address}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Batafsil ma'lumot</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
