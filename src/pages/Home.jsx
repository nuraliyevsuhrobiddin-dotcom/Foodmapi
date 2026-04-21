import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
// Mock data if needed
// import { MOCK_RESTAURANTS } from '../data/mockData';
import { Search, MapPin, List, Map as MapIcon, Mic, Navigation, Sparkles } from 'lucide-react';
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

// A unique animated marker for the actual user
const userPinIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/14090/14090151.png', // Blue location pin/person icon
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -32],
});

// Component to recenter map when clicking on list item
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

// Component to fix Leaflet map grey tiles when toggling from Hidden to Block on mobile
function MapResizer({ mobileView }) {
  const map = useMap();
  useEffect(() => {
    if (mobileView === 'map') {
      setTimeout(() => {
        map.invalidateSize();
      }, 200); // Allow time for CSS transition
    }
  }, [mobileView, map]);
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
          styles: [{ color: '#ff6b35', weight: 5, opacity: 0.85 }]
        }
      }).on('routesfound', (e) => {
        const route = e.routes?.[0];
        if (!route || !onRouteFound) return;

        const distance = (route.summary.totalDistance / 1000).toFixed(2);
        const time = Math.round(route.summary.totalTime / 60);

        onRouteFound({ distance, time });
      }).addTo(map);
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
  const [mapCenter, setMapCenter] = useState([38.8615, 65.7854]); // Default to Qarshi
  const [activeRestaurantId, setActiveRestaurantId] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([ALL_CATEGORY]);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [sortBy, setSortBy] = useState(''); // 'popular' yoki 'nearest'
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [mobileView, setMobileView] = useState('list'); // 'list' yoki 'map'
  const [usingFallbackData, setUsingFallbackData] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState(null);
  const { user } = useAuth();

  const activeRestaurant = restaurants.find(
    (restaurant) => (restaurant._id || restaurant.id) === activeRestaurantId
  );
  const activeRestaurantCoords = activeRestaurant?.location?.coordinates
    ? [activeRestaurant.location.coordinates[1], activeRestaurant.location.coordinates[0]]
    : null;

  const handleSelectCategory = (category) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedCategory(category);
  };

  // Ask for GPS Location
  const handleGPSLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
          setMapCenter([lat, lng]);
          setPagination(prev => ({ ...prev, page: 1 }));
          if(sortBy !== 'nearest') setSortBy('nearest');
        },
        (error) => {
          alert("Joylashuvni aniqlashda xatolik yuz berdi: " + error.message);
        }
      );
    } else {
      alert("Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi.");
    }
  };

  // Voice search logic
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

  const displayedRestaurants = restaurants;
  const displayedPagination = pagination;
  const showFallbackNotice = usingFallbackData;

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

  // Fetch restaurants from backend
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4500);

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
    let params = new URLSearchParams();
    
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
    fetch(`${url}${queryString ? `?${queryString}` : ''}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        window.clearTimeout(timeoutId);
        if (data.success) {
          if (Array.isArray(data.data) && data.data.length > 0) {
            setRestaurants(data.data.map(normalizeRestaurantCategories));
            setUsingFallbackData(false);
          } else {
            getFallbackRestaurants();
          }
          setPagination(
            data.pagination
              ? { page: data.pagination.page, pages: data.pagination.pages }
              : { page: 1, pages: 1 }
          );
        }
      })
      .catch(err => {
        console.error("API Xatolik:", err);
        getFallbackRestaurants();
      });

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [selectedCategory, searchQuery, userLocation, sortBy, pagination.page]);
  
  return (
    <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
      
      {/* List Panel (Sidebar on desktop, Bottom/Scroll on mobile) */}
      <div className={`w-full md:w-[420px] lg:w-[500px] bg-background flex flex-col z-20 h-[calc(100dvh-76px)] md:h-[calc(100dvh-80px)] shrink-0 border-r border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}`}>
        
        {/* Search Bar */}
        <div className="shrink-0 border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,107,53,0.14),_transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-3 sm:p-4 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(255,107,53,0.18),_transparent_36%),linear-gradient(180deg,rgba(30,41,59,0.98),rgba(15,23,42,0.98))]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">FoodMap</p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[22px]">
                Qayerda ovqatlanamiz?
              </h1>
            </div>
            <div className="hidden rounded-full bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur sm:inline-flex dark:bg-slate-900/60 dark:text-slate-300">
              Qarshi bo'ylab
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Qayerda ovqatlanamiz? (Qashqadaryo)" 
              className="w-full rounded-[22px] border border-white/70 bg-white/90 py-3.5 pl-10 pr-12 text-slate-800 shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-primary focus:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:bg-slate-900"
            />
            <button 
              onClick={startVoiceSearch}
              className="absolute right-1.5 top-1/2 inline-flex touch-target -translate-y-1/2 items-center justify-center rounded-2xl text-slate-400 transition-colors hover:text-primary hover:scale-110"
              title="Ovoz orqali qidirish"
            >
              <Mic size={20} />
            </button>
          </div>
        </div>

        <FilterPanel
          categoryOptions={categoryOptions}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          sortBy={sortBy}
          setSortBy={setSortBy}
          triggerGPS={handleGPSLocation}
        />

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 ios-safe-bottom">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Topilgan joylar: {displayedRestaurants.length}
            </p>
            {categoriesLoading && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                Kategoriyalar yuklanmoqda...
              </span>
            )}
            {sortBy === 'nearest' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <MapPin size={12} />
                Sizga eng yaqinlar
              </span>
            )}
            {selectedCategory !== ALL_CATEGORY && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {selectedCategory}
              </span>
            )}
          </div>
          {!showFallbackNotice && displayedRestaurants.length > 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
              <Sparkles size={14} className="text-primary" />
              Tanlangan kategoriya va lokatsiyaga mos joylar ko'rsatilmoqda
            </div>
          )}
          {showFallbackNotice && (
            <p className="text-xs text-amber-600 dark:text-amber-300 -mt-1 mb-3">
              Backend vaqtincha ulanmagan, demo restoranlar ko'rsatilmoqda.
            </p>
          )}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
            }}
            className="space-y-4"
          >
            {displayedRestaurants.map(restaurant => (
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
                }}
                key={restaurant._id || restaurant.id}
                onClick={() => {
                  setMapCenter([restaurant.location.coordinates[1], restaurant.location.coordinates[0]]);
                  setActiveRestaurantId(restaurant._id || restaurant.id);
                }}
                className="cursor-pointer"
              >
                <RestaurantCard restaurant={restaurant} />
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination Buttons */}
          {displayedPagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 pb-8">
              <button 
                disabled={displayedPagination.page === 1}
                onClick={() => setPagination({ ...displayedPagination, page: displayedPagination.page - 1 })}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Oldingi
              </button>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                {displayedPagination.page} / {displayedPagination.pages}
              </span>
              <button 
                disabled={displayedPagination.page === displayedPagination.pages}
                onClick={() => setPagination({ ...displayedPagination, page: displayedPagination.page + 1 })}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Keyingi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className={`flex-1 h-[calc(100dvh-76px)] md:h-[calc(100dvh-80px)] relative z-10 w-full shrink-0 ${mobileView === 'map' ? 'block' : 'hidden md:block'}`}>
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          className="w-full h-full"
          zoomControl={false}
        >
          {/* Change view when selected from list */}
          <ChangeView center={mapCenter} zoom={14} />
          
          {/* Fix map corruption on mobile toggle */}
          <MapResizer mobileView={mobileView} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Render User Location Marker */}
          {userLocation && (
            <Marker position={userLocation} icon={userPinIcon}>
              <Popup className="custom-popup font-bold">Men shu yerdaman!</Popup>
            </Marker>
          )}

          {userLocation && activeRestaurantCoords && (
            <RoutingMachine start={userLocation} end={activeRestaurantCoords} onRouteFound={setRouteInfo} />
          )}

          {displayedRestaurants.map((restaurant) => (
            (() => {
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
                <div className="min-w-[220px]">
                  <img 
                    src={restaurant.image || restaurant.coverImage} 
                    alt={restaurant.name} 
                    className="w-full h-28 object-cover rounded-xl mb-3" 
                  />
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">{restaurant.name}</h4>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                      {restaurant.category?.[0] || restaurant.type || 'Restoran'}
                    </span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {restaurant.distance !== null && restaurant.distance !== undefined && (
                      <p className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-1">
                        <MapPin size={12} /> {restaurant.distance} km uzoqlikda
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-2">
                      {restaurant.address}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <a href={`/restaurant/${restaurantId}`} className="block w-full text-center bg-primary text-white text-xs py-2 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
                      Ko'rish
                    </a>
                    {restaurantMapUrl && (
                      <a
                        href={restaurantMapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full text-center bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100 text-xs py-2 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Google Maps'da ochish
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
              );
            })()
          ))}
        </MapContainer>

        {userLocation && activeRestaurant && routeInfo && (
          <div className="absolute top-4 right-4 sm:right-6 z-[400] rounded-2xl bg-white/92 px-4 py-3 shadow-xl backdrop-blur-md dark:bg-slate-900/92">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Navigation size={16} className="text-primary" />
              {activeRestaurant.name}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">
              {`${routeInfo.distance} km - ${routeInfo.time} daqiqa`}
            </div>
          </div>
        )}
        
        {/* GPS Button */}
        <button 
          onClick={handleGPSLocation}
          className="absolute bottom-24 md:bottom-6 right-4 sm:right-6 z-[400] w-14 h-14 bg-white dark:bg-slate-800 text-primary rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border border-slate-100 dark:border-slate-700 hover:bg-primary hover:text-white"
          title="Mening joylashuvim"
        >
           <MapPin size={24} />
        </button>

        {/* Shadow overlay gradient on desktop for map depth */}
        <div className="hidden md:block absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-900/10 to-transparent pointer-events-none z-[400]" />
      </div>

      {/* Mobile View Toggle */}
      <button 
        onClick={() => setMobileView(mobileView === 'list' ? 'map' : 'list')}
        className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[500] px-6 py-3.5 bg-primary text-white rounded-full font-bold shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform ios-safe-bottom"
      >
        {mobileView === 'list' ? <><MapIcon size={18}/> Xarita</> : <><List size={18}/> Ro'yxat</>}
      </button>
      
    </div>
  );
}

