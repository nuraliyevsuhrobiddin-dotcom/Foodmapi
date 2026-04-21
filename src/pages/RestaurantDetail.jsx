import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Info, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { MOCK_RESTAURANTS } from '../data/mockData';
import useOverlay from '../hooks/useOverlay';
import { OVERLAYS } from '../constants/overlay';
import HeroSection from '../components/HeroSection';
import InfoCard from '../components/restaurant-detail/InfoCard';
import NavigationSteps from '../components/restaurant-detail/NavigationSteps';
import MenuList from '../components/restaurant-detail/MenuList';
import ReviewList from '../components/restaurant-detail/ReviewList';
import DetailSkeleton from '../components/restaurant-detail/DetailSkeleton';

const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

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
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'driving',
        }),
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
          const steps = Array.isArray(route.instructions)
            ? route.instructions.map((instruction) => ({
                text: instruction.text,
                distance: instruction.distance,
                time: instruction.time,
                distanceText: `${Math.max((instruction.distance || 0) / 1000, 0.1).toFixed(1)} km`,
                timeText: `${Math.max(Math.round((instruction.time || 0) / 60), 1)} min`,
                type: instruction.type,
              }))
            : [];

          onRouteFound({ distance, time, steps });
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

function DetailMapResizer({ showMap }) {
  const map = useMap();

  useEffect(() => {
    if (!showMap) return;

    const timeoutId = window.setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [showMap, map]);

  return null;
}

const API_URL = import.meta.env.VITE_API_URL || '';

const normalizeMockRestaurant = (restaurant) => ({
  ...restaurant,
  _id: restaurant.id,
  image: restaurant.coverImage,
  category: restaurant.type ? [restaurant.type] : [],
  workingHours: restaurant.hours,
  location: {
    type: 'Point',
    coordinates: [restaurant.coordinates[1], restaurant.coordinates[0]],
  },
});

const getMediaTypeFromUrl = (url = '') => {
  const normalizedUrl = url.split('?')[0].toLowerCase();
  if (/\.(mp4|mov|webm|m4v)$/i.test(normalizedUrl) || normalizedUrl.includes('/video/upload/')) {
    return 'video';
  }
  return 'image';
};

export default function RestaurantDetail() {
  const { id } = useParams();
  const { user, token, toggleFavorite } = useAuth();
  const { addToCart, cartItems } = useCart();
  const authOverlay = useOverlay(OVERLAYS.AUTH);
  const cartOverlay = useOverlay(OVERLAYS.CART);

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [galleryPausedUntil, setGalleryPausedUntil] = useState(0);
  const [routeInfo, setRouteInfo] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeMenuCategory, setActiveMenuCategory] = useState('Barchasi');
  const [activeSection, setActiveSection] = useState('overview');

  const overviewRef = useRef(null);
  const menuRef = useRef(null);
  const reviewsRef = useRef(null);

  const isFavorited = user?.favorites?.some((favorite) => favorite._id === id || favorite === id) || false;

  const gallery = useMemo(() => {
    if (restaurant?.gallery?.length > 0) {
      return restaurant.gallery.includes(restaurant.image)
        ? restaurant.gallery
        : [restaurant.image, ...restaurant.gallery];
    }

    return [restaurant?.image];
  }, [restaurant]);

  const mediaGallery = useMemo(
    () =>
      gallery
        .filter(Boolean)
        .map((url) => ({
          url,
          type: getMediaTypeFromUrl(url),
        })),
    [gallery]
  );

  const restaurantCartSummary = useMemo(() => {
    const relatedItems = cartItems.filter((item) => item.restaurantId === restaurant?._id);

    return {
      itemGroups: relatedItems.length,
      itemCount: relatedItems.reduce((sum, item) => sum + item.quantity, 0),
      total: relatedItems.reduce((sum, item) => sum + (Number(item.price || 0) * item.quantity), 0),
    };
  }, [cartItems, restaurant?._id]);

  const menuItemsWithCategory = useMemo(
    () =>
      (restaurant?.menu || []).map((item) => ({
        ...item,
        restaurantCategory: restaurant?.category?.[0] || '',
      })),
    [restaurant]
  );

  const fetchRestaurant = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4500);

    try {
      const res = await fetch(`${API_URL}/api/restaurants/${id}`, { signal: controller.signal });
      const data = await res.json();
      window.clearTimeout(timeoutId);
      if (data.success) {
        setRestaurant(data.data);
      } else {
        const fallbackRestaurant = MOCK_RESTAURANTS
          .map(normalizeMockRestaurant)
          .find((item) => item._id === id || item.id === id);
        setRestaurant(fallbackRestaurant || null);
      }
    } catch (err) {
      console.error(err);
      const fallbackRestaurant = MOCK_RESTAURANTS
        .map(normalizeMockRestaurant)
        .find((item) => item._id === id || item.id === id);
      setRestaurant(fallbackRestaurant || null);
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4500);

    try {
      const res = await fetch(`${API_URL}/api/restaurants/${id}/reviews`, { signal: controller.signal });
      const data = await res.json();
      window.clearTimeout(timeoutId);
      if (data.success) {
        setReviews(data.data);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error(err);
      setReviews([]);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, [id]);

  useEffect(() => {
    fetchRestaurant();
    fetchReviews();
  }, [fetchRestaurant, fetchReviews]);

  useEffect(() => {
    if (showMap || mediaGallery.length <= 1) return undefined;
    if (galleryPausedUntil > Date.now()) return undefined;

    const interval = window.setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % mediaGallery.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, [showMap, mediaGallery.length, galleryPausedUntil]);

  const handleGalleryInteraction = useCallback(() => {
    setGalleryPausedUntil(Date.now() + 7000);
  }, []);

  const sectionLinks = useMemo(
    () => [
      { id: 'overview', label: 'Umumiy', ref: overviewRef },
      { id: 'menu', label: 'Menyu', ref: menuRef },
      { id: 'reviews', label: 'Sharhlar', ref: reviewsRef },
    ],
    []
  );

  useEffect(() => {
    const sections = sectionLinks
      .map((section) => ({ id: section.id, element: section.ref.current }))
      .filter((section) => section.element);

    if (sections.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

        if (visibleEntry?.target?.id) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      {
        rootMargin: '-25% 0px -55% 0px',
        threshold: [0.2, 0.35, 0.5],
      }
    );

    sections.forEach((section) => observer.observe(section.element));

    return () => observer.disconnect();
  }, [sectionLinks]);

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!token) return authOverlay.open();
    setSubmittingReview(true);

    try {
      const res = await fetch(`${API_URL}/api/restaurants/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newReview),
      });
      const data = await res.json();
      if (res.ok) {
        setNewReview({ rating: 5, comment: '' });
        fetchReviews();
        fetchRestaurant();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleFavoriteClick = async () => {
    if (!user) return authOverlay.open();
    await toggleFavorite(id);
  };

  const handleShowRoute = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setShowMap(true);
        },
        (error) => alert(`GPS ga ruxsat bering: ${error.message}`)
      );
    } else {
      alert("Geolokatsiya qo'llab-quvvatlanmaydi");
    }
  };

  const handleAddMenuItem = (item) => {
    addToCart({ ...item, restaurantId: restaurant._id, restaurantName: restaurant.name });
  };

  const scrollToSection = (sectionRef, sectionId) => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(sectionId);
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!restaurant) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <Info size={40} className="text-slate-400" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-slate-800 dark:text-slate-100">Restoran topilmadi</h2>
        <Link to="/" className="rounded-xl bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-orange-600">
          Asosiy sahifaga qaytish
        </Link>
      </div>
    );
  }

  const resCoords = restaurant.location?.coordinates
    ? [restaurant.location.coordinates[1], restaurant.location.coordinates[0]]
    : null;
  const googleMapsDirectionsUrl =
    userLocation && resCoords
      ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${resCoords[0]},${resCoords[1]}`
      : '';

  return (
    <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(255,204,51,0.1),_transparent_18%),linear-gradient(180deg,#020617_0%,#0f172a_24%,#0f172a_100%)] pb-12">
      <HeroSection
        image={mediaGallery[activeImageIndex]?.url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000'}
        mediaType={mediaGallery[activeImageIndex]?.type || 'image'}
        title={restaurant.name}
        rating={restaurant.rating || 0}
        address={restaurant.address}
        badge={restaurant.category?.[0] || 'Restoran'}
        backTo="/"
        isFavorited={isFavorited}
        onFavorite={handleFavoriteClick}
        showMap={showMap}
        onToggleMedia={() => setShowMap((prev) => !prev)}
        galleryCount={mediaGallery.length}
        activeIndex={activeImageIndex}
        onSelectGalleryIndex={setActiveImageIndex}
        onGalleryInteraction={handleGalleryInteraction}
        onVideoEnded={() => setActiveImageIndex((prev) => (prev + 1) % Math.max(mediaGallery.length, 1))}
        galleryMeta={mediaGallery.length > 1 && !showMap ? `${activeImageIndex + 1} / ${mediaGallery.length} media` : ''}
        mediaContent={
          <AnimatePresence mode="wait">
            {showMap ? (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 h-full w-full"
              >
                {resCoords ? (
                  <MapContainer center={resCoords} zoom={13} className="h-full w-full">
                    <DetailMapResizer showMap={showMap} />
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <Marker position={resCoords} icon={customMarkerIcon} />
                    {userLocation ? <Marker position={userLocation} icon={customMarkerIcon} /> : null}
                    {userLocation ? <RoutingMachine start={userLocation} end={resCoords} onRouteFound={setRouteInfo} /> : null}
                  </MapContainer>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        }
      />

      {routeInfo && showMap ? (
        <div className="pointer-events-none sticky top-20 z-30 mx-auto -mb-4 flex max-w-7xl justify-end px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-full bg-[#ffcc33] px-4 py-2 text-sm font-medium text-slate-950 shadow-lg"
          >
            <span className="flex items-center gap-2">
              <Navigation size={16} />
              {routeInfo.distance} km - {routeInfo.time} daqiqa
            </span>
          </motion.div>
        </div>
      ) : null}

      <div className="mx-auto max-w-md px-4 pb-28 pt-6 sm:max-w-3xl sm:px-6 sm:pb-32 sm:pt-8 lg:max-w-7xl lg:px-8">
        <div ref={overviewRef} id="overview">
          <InfoCard
            address={restaurant.address}
            workingHours={restaurant.workingHours}
            routeInfo={routeInfo}
            showMap={showMap}
            onShowRoute={handleShowRoute}
            googleMapsUrl={googleMapsDirectionsUrl}
          />
        </div>

        {showMap && routeInfo ? (
          <NavigationSteps routeInfo={routeInfo} googleMapsUrl={googleMapsDirectionsUrl} />
        ) : null}

        <div className="sticky top-[64px] z-30 -mx-4 mb-5 overflow-x-auto border-y border-white/10 bg-slate-950/72 px-4 py-3 backdrop-blur-xl no-scrollbar sm:top-[72px] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex snap-x gap-2 pb-1">
            {sectionLinks.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.ref, section.id)}
                className={`snap-start whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  activeSection === section.id
                    ? 'bg-[#ffcc33] text-slate-950'
                    : 'bg-white/10 text-white'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={menuRef} id="menu" className="scroll-mt-28">
          <MenuList
            items={menuItemsWithCategory}
            onAddToCart={handleAddMenuItem}
            activeCategory={activeMenuCategory}
            onActiveCategoryChange={setActiveMenuCategory}
          />
        </div>

        <div ref={reviewsRef} id="reviews" className="scroll-mt-28">
          <ReviewList
            reviews={reviews}
            newReview={newReview}
            setNewReview={setNewReview}
            submittingReview={submittingReview}
            onSubmit={handleReviewSubmit}
          />
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 ios-safe-bottom">
        <div className="pointer-events-auto w-full max-w-md rounded-[28px] border border-white/10 bg-slate-950/88 p-3 shadow-[0_-24px_60px_rgba(15,23,42,0.52)] backdrop-blur-xl">
          <button
            type="button"
            onClick={cartOverlay.open}
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-[#ffcc33] px-4 py-3.5 text-left text-sm font-semibold text-slate-950 transition-all duration-300 hover:brightness-105 active:scale-[0.99] sm:text-base"
          >
            <span className="min-w-0">
              <span className="block">Buyurtma berish</span>
              <span className="mt-0.5 block text-xs font-medium text-slate-900/70 sm:text-sm">
                {restaurantCartSummary.itemCount > 0
                  ? `Shu restoran: ${restaurantCartSummary.itemCount} dona, ${restaurantCartSummary.total.toLocaleString()} so'm`
                  : "Taom qo'shsangiz shu yerda mini xulosa ko'rinadi"}
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-slate-950/12 px-3 py-1 text-xs font-bold sm:text-sm">
              {restaurantCartSummary.itemGroups} ta
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
