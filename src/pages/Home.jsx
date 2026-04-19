import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
// Mock data if needed
// import { MOCK_RESTAURANTS } from '../data/mockData';
import { Search, MapPin, List, Map as MapIcon, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import FilterPanel from '../components/FilterPanel';
import RestaurantCard from '../components/RestaurantCard';
import L from 'leaflet';

const API_URL = import.meta.env.VITE_API_URL || '';

// Create a custom icon for the markers
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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

export default function Home() {
  const [mapCenter, setMapCenter] = useState([38.8615, 65.7854]); // Default to Qarshi
  const [activeRestaurantId, setActiveRestaurantId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [sortBy, setSortBy] = useState(''); // 'popular' yoki 'nearest'
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [mobileView, setMobileView] = useState('list'); // 'list' yoki 'map'
  const { user } = useAuth();

  // Category toggle handler
  const toggleCategory = (category) => {
    setPagination(prev => ({ ...prev, page: 1 }));
    if (category === 'Hammasi') {
      setCategories([]);
    } else {
      setCategories((prev) => 
        prev.includes(category) 
          ? prev.filter((c) => c !== category)
          : [...prev, category]
      );
    }
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

    recognition.onerror = (event) => {
      toast.error("Ovoz tanib olinmadi, qayta urinib ko'ring.");
    };

    recognition.start();
  };

  // Fetch restaurants from backend
  useEffect(() => {
    if (categories.includes('Saqlanganlar')) {
      if (user) {
        setRestaurants(user.favorites || []);
        setPagination({ page: 1, pages: 1 });
      } else {
        setRestaurants([]);
      }
      return;
    }
  
    let url = `${API_URL}/api/restaurants`;
    let params = new URLSearchParams();
    
    params.append('page', pagination.page);
    params.append('limit', 10);
    if (categories.length > 0) params.append('category', categories.join(','));
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
    fetch(`${url}${queryString ? `?${queryString}` : ''}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRestaurants(data.data);
          setPagination(
            data.pagination
              ? { page: data.pagination.page, pages: data.pagination.pages }
              : { page: 1, pages: 1 }
          );
        }
      })
      .catch(err => console.error("API Xatolik:", err));
  }, [categories, searchQuery, userLocation, user, sortBy, pagination.page]);
  
  return (
    <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
      
      {/* List Panel (Sidebar on desktop, Bottom/Scroll on mobile) */}
      <div className={`w-full md:w-[420px] lg:w-[480px] bg-background flex flex-col z-20 h-[calc(100vh-72px)] shrink-0 border-r border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}`}>
        
        {/* Search Bar */}
        <div className="p-4 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Qayerda ovqatlanamiz? (Qashqadaryo)" 
              className="w-full pl-10 pr-12 py-3 bg-slate-100 dark:bg-slate-800 border-transparent focus:border-primary focus:bg-white dark:focus:bg-slate-900 rounded-xl outline-none transition-all duration-300 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-sm"
            />
            <button 
              onClick={startVoiceSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors hover:scale-110"
              title="Ovoz orqali qidirish"
            >
              <Mic size={20} />
            </button>
          </div>
        </div>

        <FilterPanel categories={categories} toggleCategory={toggleCategory} sortBy={sortBy} setSortBy={setSortBy} triggerGPS={handleGPSLocation} />

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
            Topilgan joylar: {restaurants.length}
          </p>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
            }}
            className="space-y-4"
          >
            {restaurants.map(restaurant => (
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
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 pb-8">
              <button 
                disabled={pagination.page === 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Oldingi
              </button>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                {pagination.page} / {pagination.pages}
              </span>
              <button 
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Keyingi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className={`flex-1 h-[calc(100vh-72px)] relative z-10 w-full shrink-0 ${mobileView === 'map' ? 'block' : 'hidden md:block'}`}>
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

          {restaurants.map((restaurant) => (
            <Marker 
              key={restaurant._id || restaurant.id} 
              position={[restaurant.location.coordinates[1], restaurant.location.coordinates[0]]}
              icon={customMarkerIcon}
              eventHandlers={{
                click: () => {
                  setActiveRestaurantId(restaurant._id || restaurant.id);
                },
              }}
            >
              <Popup className="custom-popup">
                <div className="p-1 min-w-[200px]">
                  <img 
                    src={restaurant.image || restaurant.coverImage} 
                    alt={restaurant.name} 
                    className="w-full h-24 object-cover rounded-lg mb-2" 
                  />
                  <h4 className="font-bold text-sm mb-1">{restaurant.name}</h4>
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <MapPin size={12} /> {restaurant.distance || 0} km
                  </p>
                  <a href={`/restaurant/${restaurant._id || restaurant.id}`} className="block w-full text-center bg-primary text-white text-xs py-1.5 rounded-md font-medium hover:bg-orange-600 transition-colors">
                    Ko'rish
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* GPS Button */}
        <button 
          onClick={handleGPSLocation}
          className="absolute bottom-6 right-6 z-[400] w-14 h-14 bg-white dark:bg-slate-800 text-primary rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border border-slate-100 dark:border-slate-700 hover:bg-primary hover:text-white"
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
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] px-6 py-3.5 bg-primary text-white rounded-full font-bold shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
      >
        {mobileView === 'list' ? <><MapIcon size={18}/> Xarita</> : <><List size={18}/> Ro'yxat</>}
      </button>
      
    </div>
  );
}
