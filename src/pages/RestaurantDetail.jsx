import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, Navigation, Info, Heart, Loader2, Map as MapIcon, Image as ImageIcon, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Marker definitions
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Routing Component
function RoutingMachine({ start, end, onRouteFound }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !start || !end) return;

    let routingControl;
    let isMounted = true;

    const loadRouting = async () => {
      await import('leaflet-routing-machine');

      if (!isMounted) return;

      // Remove old routing controls if any
      map.eachLayer((layer) => {
        if (layer instanceof L.Routing.Control) {
          map.removeLayer(layer);
        }
      });

      routingControl = L.Routing.control({
        waypoints: [
          L.latLng(start[0], start[1]),
          L.latLng(end[0], end[1])
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        fitSelectedRoutes: true,
        show: false,
        createMarker: function() { return null; },
        lineOptions: {
          styles: [{ color: '#f97316', weight: 5, opacity: 0.8 }]
        }
      }).on('routesfound', function(e) {
        if (e.routes && e.routes[0] && onRouteFound) {
          const route = e.routes[0];
          const distMap = (route.summary.totalDistance / 1000).toFixed(1);
          const timeMap = Math.round(route.summary.totalTime / 60);
          onRouteFound({ distance: distMap, time: timeMap });
        }
      }).addTo(map);
    };

    loadRouting();

    return () => {
      isMounted = false;
      try {
        if (routingControl) map.removeControl(routingControl);
      } catch (_error) {}
    };
  }, [map, start, end]);

  return null;
}

const API_URL = import.meta.env.VITE_API_URL || '';

export default function RestaurantDetail() {
  const { id } = useParams();
  const { user, token, toggleFavorite, setIsAuthModalOpen } = useAuth();
  const { addToCart } = useCart();
  
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [routeInfo, setRouteInfo] = useState(null);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Computed definitions
  const isFavorited = user?.favorites?.some(f => f._id === id || f === id) || false;
  const gallery = restaurant?.gallery?.length > 0 ? (restaurant.gallery.includes(restaurant.image) ? restaurant.gallery : [restaurant.image, ...restaurant.gallery]) : [restaurant?.image];

  // Fetch restaurant details
  const fetchRestaurant = async () => {
    try {
      const res = await fetch(`${API_URL}/api/restaurants/${id}`);
      const data = await res.json();
      if (data.success) {
        setRestaurant(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/restaurants/${id}/reviews`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRestaurant();
    fetchReviews();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!token) return setIsAuthModalOpen(true);
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_URL}/api/restaurants/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newReview)
      });
      const data = await res.json();
      if (res.ok) {
        setNewReview({ rating: 5, comment: '' });
        fetchReviews();
        fetchRestaurant(); // To update average rating
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    // Auto cycle through gallery images when map is hidden
    if (!showMap && gallery.length > 1) {
      const interval = setInterval(() => {
        setActiveImageIndex((prev) => (prev + 1) % gallery.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [showMap, gallery]);

  const handleFavoriteClick = async () => {
    if (!user) return setIsAuthModalOpen(true);
    await toggleFavorite(id);
  };

  const handleShowRoute = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setShowMap(true);
        },
        (error) => alert("GPS ga ruxsat bering: " + error.message)
      );
    } else {
      alert("Geolokatsiya qo'llab-quvvatlanmaydi");
    }
  };

  if (loading) {
    return <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  }

  if (!restaurant) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <Info size={40} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-slate-100">Restoran topilmadi</h2>
        <Link to="/" className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-orange-600 transition-colors">
          Asosiy sahifaga qaytish
        </Link>
      </div>
    );
  }

  const resCoords = restaurant.location?.coordinates ? [restaurant.location.coordinates[1], restaurant.location.coordinates[0]] : null;
  return (
    <div className="flex-1 overflow-y-auto bg-background pb-12">
      {/* Header Image or Map */}
      <div className="relative h-[40vh] sm:h-[50vh] w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        
        <AnimatePresence mode="wait">
          {!showMap ? (
            <motion.div 
              key="gallery"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full"
            >
              <img 
                src={gallery[activeImageIndex] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000'} 
                alt={restaurant.name} 
                className="w-full h-full object-cover transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-black/30" />
            </motion.div>
          ) : (
            <motion.div 
              key="map"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full z-0"
            >
              {resCoords && (
                <MapContainer center={resCoords} zoom={13} className="w-full h-full">
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <Marker position={resCoords} icon={customMarkerIcon} />
                  {userLocation && <Marker position={userLocation} icon={customMarkerIcon} />}
                  {userLocation && <RoutingMachine start={userLocation} end={resCoords} onRouteFound={setRouteInfo} />}
                </MapContainer>
              )}
              {/* Add shadow overlay for map readability of text */}
              <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none z-[400]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Navigation Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 lg:px-8 max-w-7xl mx-auto flex justify-between items-center z-10">
          <Link 
            to="/" 
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            {routeInfo && showMap && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden sm:flex items-center gap-2 bg-green-500/90 backdrop-blur-md px-4 py-2 rounded-full text-white font-medium shadow-lg"
              >
                <Navigation size={16} />
                <span>{routeInfo.distance} km • {routeInfo.time} daqiqa</span>
              </motion.div>
            )}
            <button 
              onClick={() => setShowMap(!showMap)}
              className="h-10 px-4 rounded-full bg-slate-900/40 backdrop-blur-md flex items-center gap-2 text-white hover:bg-slate-900/60 transition-colors font-medium text-sm"
            >
              {showMap ? <><ImageIcon size={16}/> Galereya</> : <><MapIcon size={16}/> Xarita</>}
            </button>
            <button 
              onClick={handleFavoriteClick}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors shadow-sm"
            >
              <Heart size={20} className={isFavorited ? "fill-red-500 text-red-500" : ""} />
            </button>
          </div>
        </div>

        {/* Info Tags Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto z-10 pointer-events-none">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-primary text-white text-sm font-semibold rounded-lg shadow-sm">
              {restaurant.category?.[0] || 'Restoran'}
            </span>
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-white text-sm font-medium">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              {restaurant.rating || 0}
            </div>
            {gallery.length > 1 && !showMap && (
               <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-white text-xs font-medium">
                 {activeImageIndex + 1} / {gallery.length} rasmlar
               </div>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight drop-shadow-md">
            {restaurant.name}
          </h1>
          <p className="text-slate-200 text-sm sm:text-base max-w-2xl line-clamp-2 drop-shadow-md">
            {restaurant.address}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        {/* Main Content Area */}
        <div className="flex-1">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-8">
            <div className="flex flex-col sm:flex-row gap-6 mb-6">
              <div className="flex-1 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Manzil</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 inline-block">
                    {restaurant.address} 
                  </p>
                </div>
              </div>
              
              <div className="flex-1 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Ish vaqti</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {restaurant.workingHours || "09:00 - 23:00"}
                  </p>
                </div>
              </div>
            </div>
            
            <button onClick={handleShowRoute} className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm relative overflow-hidden group">
              <span className="absolute inset-0 w-full h-full bg-white/10 group-hover:scale-105 transition-transform"></span>
              {routeInfo && showMap && userLocation ? (
                 <span className="flex items-center gap-2"><Navigation size={18} /> {routeInfo.distance} km masofa ({routeInfo.time} min)</span>
              ) : (
                 <span className="flex items-center gap-2"><Navigation size={18} /> Menga yo'lni chizib ko'rsat!</span>
              )}
            </button>
          </div>

          {/* Menu Section */}
          {restaurant.menu?.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="w-8 h-1 bg-primary rounded-full"></span>
                Menyu
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {restaurant.menu.map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={item._id || i} 
                    className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex gap-4 group hover:shadow-md transition-all duration-300"
                  >
                    <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden">
                      <img 
                        src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex flex-col justify-between flex-1 py-1">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{item.name}</h4>
                        <p className="text-primary font-medium text-sm mt-1">{item.price} so'm</p>
                      </div>
                      <button onClick={() => addToCart({ ...item, restaurantId: restaurant._id, restaurantName: restaurant.name })} className="self-start text-xs font-semibold px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                        Qo'shish
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="w-8 h-1 bg-primary rounded-full"></span>
              Sharhlar ({reviews.length})
            </h2>

            {/* Review Form */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-8">
              <h3 className="font-bold mb-4 text-slate-800 dark:text-slate-100">Fikringizni qoldiring</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className="focus:outline-none"
                    >
                      <Star
                        size={24}
                        className={star <= newReview.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300"}
                      />
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <textarea
                    required
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Restoran haqida nima deb o'ylaysiz?"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-primary transition-all resize-none h-24"
                  />
                  <button
                    disabled={submittingReview}
                    className="absolute bottom-3 right-3 p-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {submittingReview ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
                </div>
              </form>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-primary">
                        {review.user?.username?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100">{review.user?.username}</h4>
                        <p className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg text-yellow-600 text-xs font-bold">
                      <Star size={12} className="fill-yellow-600" />
                      {review.rating}
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-center text-slate-400 py-8 italic">Hozircha sharhlar yo'q. Birinchi bo'lib fikr bildiring!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
