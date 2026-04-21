import { Edit2, MapPin, Star, Trash2 } from 'lucide-react';

export default function RestaurantCard({ restaurant, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 shadow-[0_14px_34px_rgba(15,23,42,0.18)] backdrop-blur-xl">
      <div className="flex gap-3">
        <img
          src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}
          alt={restaurant.name}
          className="h-20 w-20 shrink-0 rounded-2xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-white">{restaurant.name}</h3>
              <p className="mt-1 text-xs text-slate-400">{restaurant.category?.join(', ') || restaurant.type}</p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-[#ffcc33]/15 px-2 py-1 text-xs font-semibold text-[#ffcc33]">
              <Star size={12} className="fill-current" />
              {restaurant.rating}
            </div>
          </div>
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
            <MapPin size={12} />
            {restaurant.location?.coordinates?.[1]}, {restaurant.location?.coordinates?.[0]}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onEdit(restaurant)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm font-medium text-white"
        >
          <Edit2 size={16} />
          Tahrirlash
        </button>
        <button
          type="button"
          onClick={() => onDelete(restaurant._id)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm font-medium text-red-400"
        >
          <Trash2 size={16} />
          O&apos;chirish
        </button>
      </div>
    </div>
  );
}
