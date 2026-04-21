import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Mic, Navigation, Sparkles, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import FilterPanel from '../components/FilterPanel';
import RestaurantCard from '../components/RestaurantCard';
import { MOCK_RESTAURANTS } from '../data/mockData';
import { getCategoryTheme, normalizeRestaurantCategories } from '../utils/categoryUtils';
import L from 'leaflet';

const API_URL = import.meta.env.VITE_API_URL || '';
const ALL_CATEGORY = 'All';

const userPinIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/14090/14090151.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -32],
});

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

function MapResizer({ watchKey }) {
  const map = useMap();

  useEffect(() => {
    const firstPass = window.setTimeout(() => {
      map.invalidateSize();
    }, 180);
    const secondPass = window.setTimeout(() => {
      map.invalidateSize();
    }, 450);

    return () => {
      window.clearTimeout(firstPass);
      window.clearTimeout(secondPass);
    };
  }, [watchKey, map]);

  return null;
}

function RoutingMachine({ start, end, onRouteFound }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !start || !end) return;

    let routingControl;
    let isMounted = true;

    const loadRouting = async () => {
      await import('leaflet-routing-machine');

      if (!isMounted) return;

      map.eachLayer((layer) => {
        if (layer instanceof L.Routing.Control) {
          map.removeLayer(layer);
        }
      });

      routingControl = L.Routing.control({
        waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
        routeWhileDragging: false,
        addWaypoints: false,
        fitSelectedRoutes: true,
        show: false,
        createMarker: () => null,
        lineOptions: {
          styles: [{ color: '#ffcc33', weight: 5, opacity: 0.9 }],
        },
      })
        .on('routesfound', (e) => {
          const route = e.routes?.[0];
          if (!route || !onRouteFound) return;

          const distance = (route.summary.totalDistance / 1000).toFixed(2);
          const time = Math.round(route.summary.totalTime / 60);

          onRouteFound({ distance, time });
        })
        .addTo(map);
    };

    loadRouting();

    return () => {
      isMounted = false;
      try {
        if (routingControl) map.removeControl(routingControl);
      } catch {
        return undefined;
      }
    };
  }, [map, start, end, onRouteFound]);

  return null;
}

const normalizeMockRestaurant = (restaurant) => ({
  ...normalizeRestaurantCategories(restaurant),
  _id: restaurant.id,
  image: restaurant.coverImage,
  workingHours: restaurant.hours,
  location: {
    type: 'Point',
    coordinates: [restaurant.coordinates[1], restaurant.coordinates[0]],
  },
});

const calculateDistanceKm = (restaurant, userLocation) => {
  if (!restaurant?.location?.coordinates || !userLocation) {
    return null;
  }

  const restaurantLat = restaurant.location.coordinates[1];
  const restaurantLng = restaurant.location.coordinates[0];
  const [userLat, userLng] = userLocation;
  const distanceKm = Math.hypot(restaurantLat - userLat, restaurantLng - userLng) * 111;

  return Number(distanceKm.toFixed(1));
};

const getRestaurantMapUrl = (restaurant) => {
  const coordinates = restaurant?.location?.coordinates;
  if (!coordinates || coordinates.length < 2) {
    return '';
  }

  return `https://www.google.com/maps?q=${coordinates[1]},${coordinates[0]}`;
};

const createRestaurantMarkerIcon = (restaurant, isActive = false) =>
  L.divIcon({
    className: 'restaurant-marker-wrapper',
    html: `<div class="restaurant-marker ${getCategoryTheme(restaurant.category?.[0] || restaurant.type).markerTone} ${isActive ? 'marker-active' : ''}"><span></span></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });

export default function Home() {
  const [mapCenter, setMapCenter] = useState([38.8615, 65.7854]);
  const [activeRestaurantId, setActiveRestaurantId] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([ALL_CATEGORY]);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [sortBy, setSortBy] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [usingFallbackData, setUsingFallbackData] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState(null);
  const { user, token } = useAuth();

  const activeRestaurant = restaurants.find(
    (restaurant) => (restaurant._id || restaurant.id) === activeRestaurantId
  );
  const activeRestaurantCoords = activeRestaurant?.location?.coordinates
    ? [activeRestaurant.location.coordinates[1], activeRestaurant.location.coordinates[0]]
    : null;
  const displayedRestaurants = restaurants;
  const displayedPagination = pagination;
  const showFallbackNotice = usingFallbackData;
  const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 768 : false;
  const mobileSheetHeight = sheetExpanded ? '76vh' : '34vh';
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== ALL_CATEGORY) count += 1;
    if (sortBy) count += 1;
    if (searchQuery.trim()) count += 1;
    return count;
  }, [searchQuery, selectedCategory, sortBy]);

  const handleSelectCategory = (category) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedCategory(category);
  };

  const handleGPSLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
          setMapCenter([lat, lng]);
          setPagination((prev) => ({ ...prev, page: 1 }));
          if (sortBy !== 'nearest') setSortBy('nearest');
        },
        (error) => {
          toast.error(`Joylashuvni aniqlashda xatolik: ${error.message}`);
        }
      );
    } else {
      toast.error("Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi.");
    }
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return toast.error("Kechirasiz, brauzeringizda ovozli qidiruv ishlamaydi.");
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'uz-UZ';
    recognition.interimResults = false;

    recognition.onstart = () => {
      toast('Gapiring, eshitaman...', { icon: '🎙️', duration: 3000 });
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      toast.success(`Qidirilmoqda: "${transcript}"`);
    };

    recognition.onerror = () => {
      toast.error("Ovoz tanib olinmadi, qayta urinib ko'ring.");
    };

    recognition.start();
  };

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/categories`);
        const data = await res.json();
        if (!isMounted) return;

        if (res.ok && data.success && Array.isArray(data.data)) {
          const normalizedCategories = data.data.filter(Boolean);
          setCategoryOptions([ALL_CATEGORY, ...normalizedCategories]);
        } else {
          setCategoryOptions([ALL_CATEGORY]);
        }
      } catch (error) {
        console.error('Category API error:', error);
        if (isMounted) {
          setCategoryOptions([ALL_CATEGORY]);
        }
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 6000);

    const getFallbackRestaurants = () => {
      let fallback = MOCK_RESTAURANTS.map(normalizeMockRestaurant);

      if (selectedCategory !== ALL_CATEGORY) {
        fallback = fallback.filter((restaurant) =>
          restaurant.category?.includes(selectedCategory)
        );
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        fallback = fallback.filter((restaurant) =>
          [restaurant.name, restaurant.address, ...(restaurant.category || [])]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(query))
        );
      }

      if (sortBy === 'popular') {
        fallback = [...fallback].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }

      if (sortBy === 'nearest' && userLocation) {
        fallback = [...fallback]
          .map((restaurant) => ({
            ...restaurant,
            distance: calculateDistanceKm(restaurant, userLocation),
          }))
          .sort((a, b) => (a.distance || Number.MAX_SAFE_INTEGER) - (b.distance || Number.MAX_SAFE_INTEGER));
      }

      setRestaurants(fallback);
      setPagination({ page: 1, pages: 1 });
      setUsingFallbackData(true);
    };

    let url = `${API_URL}/api/restaurants`;
    const params = new URLSearchParams();

    params.append('page', pagination.page);
    params.append('limit', 10);
    if (selectedCategory !== ALL_CATEGORY) params.append('category', selectedCategory);
    if (searchQuery) params.append('search', searchQuery);
    if (sortBy === 'popular') params.append('sort', 'popular');

    if (userLocation || sortBy === 'nearest') {
      if (userLocation) {
        url = `${API_URL}/api/restaurants/near`;
        params.append('lat', userLocation[0]);
        params.append('lng', userLocation[1]);
        params.append('radius', 50);
      }
    }

    const queryString = params.toString();
    setRestaurantsLoading(true);
    fetch(`${url}${queryString ? `?${queryString}` : ''}`, {
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'API error');
        }
        return data;
      })
      .then((data) => {
        window.clearTimeout(timeoutId);
        const normalizedRestaurants = Array.isArray(data.data)
          ? data.data.map(normalizeRestaurantCategories)
          : [];

        setRestaurants(normalizedRestaurants);
        setUsingFallbackData(false);
        setPagination(
          data.pagination
            ? { page: data.pagination.page, pages: data.pagination.pages }
            : { page: 1, pages: 1 }
        );
      })
      .catch((err) => {
        console.error('API Xatolik:', err);
        getFallbackRestaurants();
      })
      .finally(() => {
        setRestaurantsLoading(false);
      });

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [selectedCategory, searchQuery, userLocation, sortBy, pagination.page, token]);

  return (
    <div className="relative flex-1 overflow-hidden bg-[#0b1220]">
      <div className="absolute inset-0">
        <MapContainer center={mapCenter} zoom={13} className="h-full w-full" zoomControl={false}>
          <ChangeView center={mapCenter} zoom={14} />
          <MapResizer watchKey={`${sheetExpanded}-${displayedRestaurants.length}-${activeRestaurantId || ''}`} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {userLocation ? (
            <Marker position={userLocation} icon={userPinIcon}>
              <Popup className="custom-popup font-bold">Men shu yerdaman!</Popup>
            </Marker>
          ) : null}

          {userLocation && activeRestaurantCoords ? (
            <RoutingMachine start={userLocation} end={activeRestaurantCoords} onRouteFound={setRouteInfo} />
          ) : null}

          {displayedRestaurants.map((restaurant) => {
            const restaurantId = restaurant._id || restaurant.id;
            const isActive = activeRestaurantId === restaurantId;
            const restaurantMapUrl = getRestaurantMapUrl(restaurant);

            return (
              <Marker
                key={restaurantId}
                position={[restaurant.location.coordinates[1], restaurant.location.coordinates[0]]}
                icon={createRestaurantMarkerIcon(restaurant, isActive)}
                eventHandlers={{
                  click: () => {
                    setActiveRestaurantId(restaurantId);
                  },
                }}
              >
                <Popup className="custom-popup">
                  <div className="map-popup-card min-w-[240px] max-w-[260px] rounded-[22px] border border-white/10 bg-[#1e293b]/95 p-3 text-white shadow-[0_22px_60px_rgba(2,6,23,0.45)] backdrop-blur-xl">
                    <img
                      src={restaurant.image || restaurant.coverImage}
                      alt={restaurant.name}
                      className="mb-3 h-32 w-full rounded-2xl object-cover"
                    />
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4 className="line-clamp-1 flex-1 text-base font-semibold text-white">
                        {restaurant.name}
                      </h4>
                      <span className="shrink-0 rounded-full bg-[#ffcc33] px-2.5 py-1 text-[11px] font-semibold text-slate-950">
                        {restaurant.category?.[0] || restaurant.type || 'Restoran'}
                      </span>
                    </div>
                    <div className="mb-4 space-y-2">
                      {restaurant.distance !== null && restaurant.distance !== undefined ? (
                        <p className="flex items-center gap-1.5 text-sm text-slate-300">
                          <MapPin size={14} className="text-[#ffcc33]" /> {restaurant.distance} km uzoqlikda
                        </p>
                      ) : null}
                      <p className="line-clamp-2 text-sm text-slate-300">
                        {restaurant.address}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to={`/restaurant/${restaurantId}`}
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-orange-500 px-3 py-2.5 text-center text-xs font-semibold text-white transition-all duration-300 active:scale-[0.98]"
                      >
                        Ko'rish
                      </Link>
                      {restaurantMapUrl ? (
                        <a
                          href={restaurantMapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-full items-center justify-center rounded-2xl bg-white/10 px-3 py-2.5 text-center text-xs font-semibold text-white transition-all duration-300 active:scale-[0.98]"
                        >
                          Xaritada ochish
                        </a>
                      ) : null}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[410] h-44 bg-gradient-to-b from-slate-950/88 via-slate-950/28 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[410] h-52 bg-gradient-to-t from-slate-950 via-slate-950/28 to-transparent" />

        <div className="absolute inset-x-0 top-0 z-[420] px-4 pb-3 pt-4 sm:px-6 lg:px-8 ios-safe-top">
          <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-3 hidden items-center gap-2 sm:flex">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60 backdrop-blur-md">
                  FoodMap Go
                </span>
              </div>
              <div className="rounded-[30px] border border-white/10 bg-slate-950/66 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.35)] backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/38" size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Taom, restoran yoki manzil qidiring"
                      className="h-12 w-full rounded-[24px] border border-white/8 bg-white/[0.05] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#ffcc33]/50 focus:bg-white/[0.08] focus:shadow-[0_0_0_4px_rgba(255,204,51,0.12)]"
                    />
                  </div>
                  <button
                    onClick={startVoiceSearch}
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[22px] bg-white/[0.08] text-white/72 transition hover:bg-white/[0.12] active:scale-[0.98]"
                    title="Ovoz orqali qidirish"
                  >
                    <Mic size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={handleGPSLocation}
                    className="hidden h-12 items-center gap-2 rounded-[22px] bg-[#ffcc33] px-4 text-sm font-semibold text-slate-950 transition hover:brightness-105 md:inline-flex"
                  >
                    <MapPin size={16} />
                    Mening joylashuvim
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={handleGPSLocation}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[22px] border border-white/10 bg-slate-950/66 text-[#ffcc33] shadow-lg backdrop-blur-xl transition hover:bg-slate-900/80 md:hidden"
              title="Mening joylashuvim"
            >
              <MapPin size={18} />
            </button>
          </div>
        </div>

        {userLocation && activeRestaurant && routeInfo ? (
          <div className="absolute right-4 top-28 z-[420] rounded-[24px] border border-white/10 bg-slate-950/72 px-4 py-3 text-white shadow-2xl backdrop-blur-xl sm:right-6 sm:top-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Navigation size={16} className="text-[#ffcc33]" />
              {activeRestaurant.name}
            </div>
            <div className="mt-1 text-xs text-white/64">
              {`${routeInfo.distance} km - ${routeInfo.time} daqiqa`}
            </div>
          </div>
        ) : null}
      </div>

      <motion.section
        drag={isDesktop ? false : 'y'}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.08}
        onDragEnd={(_, info) => {
          if (info.offset.y < -40) setSheetExpanded(true);
          if (info.offset.y > 40) setSheetExpanded(false);
        }}
        animate={{
          height: isDesktop ? 'calc(100dvh - 6rem)' : mobileSheetHeight,
        }}
        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        className="absolute inset-x-0 bottom-0 z-[430] mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-t-[34px] border border-white/10 bg-slate-950/78 shadow-[0_-20px_60px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:max-w-xl md:left-6 md:top-24 md:mx-0 md:w-[430px] md:max-w-none md:rounded-[34px] lg:w-[460px]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 pb-3 pt-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <span className="mx-auto mb-2 block h-1.5 w-14 rounded-full bg-white/18 md:hidden" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/38">Yaqin joylar</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Restoranlar paneli</h2>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-medium text-white/70">
              {displayedRestaurants.length} ta
            </span>
            {activeFiltersCount ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ffcc33] px-3 py-1 text-xs font-semibold text-slate-950">
                <SlidersHorizontal size={12} />
                {activeFiltersCount} filter
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setSheetExpanded((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-white/76 transition hover:bg-white/[0.12]"
          >
            <ChevronUp size={18} className={`transition-transform duration-300 ${sheetExpanded ? 'rotate-0' : 'rotate-180'}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-5 pt-4 sm:px-5 ios-safe-bottom">
          <FilterPanel
            categoryOptions={categoryOptions}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            sortBy={sortBy}
            setSortBy={setSortBy}
            triggerGPS={handleGPSLocation}
          />

          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-white/74">
                {restaurantsLoading ? 'Joylar yuklanmoqda...' : `${displayedRestaurants.length} ta joy topildi`}
              </span>
              {categoriesLoading ? (
                <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white/60">
                  Kategoriyalar yuklanmoqda...
                </span>
              ) : null}
              {sortBy === 'nearest' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#ffcc33] px-3 py-1 text-xs font-semibold text-slate-950">
                  <MapPin size={12} />
                  Sizga eng yaqinlar
                </span>
              ) : null}
            </div>

            {!showFallbackNotice && displayedRestaurants.length > 0 ? (
              <div className="flex items-center gap-2 rounded-[22px] border border-white/8 bg-white/[0.05] px-3 py-2 text-xs font-medium text-white/64">
                <Sparkles size={14} className="text-[#ffcc33]" />
                Tanlangan filterlarga mos joylar ko'rsatilmoqda
              </div>
            ) : null}

            {showFallbackNotice ? (
              <div className="rounded-[22px] border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                Backend vaqtincha ulanmagan, demo restoranlar ko'rsatilmoqda.
              </div>
            ) : null}

            {restaurantsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-32 animate-pulse rounded-[28px] border border-white/8 bg-white/[0.05]"
                  />
                ))}
              </div>
            ) : displayedRestaurants.length ? (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
                }}
                className="space-y-3"
              >
                {displayedRestaurants.map((restaurant) => (
                  <motion.div
                    key={restaurant._id || restaurant.id}
                    variants={{
                      hidden: { opacity: 0, y: 14 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    onClick={() => {
                      setMapCenter([restaurant.location.coordinates[1], restaurant.location.coordinates[0]]);
                      setActiveRestaurantId(restaurant._id || restaurant.id);
                    }}
                    className="cursor-pointer"
                  >
                    <RestaurantCard restaurant={restaurant} compact />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="rounded-[28px] border border-white/10 bg-white/[0.05] px-4 py-5 text-sm text-white/68">
                Hozircha tanlangan filterlarga mos restoran topilmadi.
              </div>
            )}

            {displayedPagination.pages > 1 ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <button
                  disabled={displayedPagination.page === 1}
                  onClick={() => setPagination({ ...displayedPagination, page: displayedPagination.page - 1 })}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.12] disabled:opacity-40"
                >
                  Oldingi
                </button>
                <span className="text-sm font-semibold text-white/68">
                  {displayedPagination.page} / {displayedPagination.pages}
                </span>
                <button
                  disabled={displayedPagination.page === displayedPagination.pages}
                  onClick={() => setPagination({ ...displayedPagination, page: displayedPagination.page + 1 })}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.12] disabled:opacity-40"
                >
                  Keyingi
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
