import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, Image as ImageIcon, Map as MapIcon, Pause, Play, Star, Video } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function HeroSection({
  image,
  mediaType = 'image',
  title,
  rating,
  address,
  badge,
  backTo = '/',
  isFavorited = false,
  onFavorite,
  showMap = false,
  onToggleMedia,
  mediaContent,
  galleryMeta,
  galleryCount = 0,
  activeIndex = 0,
  onSelectGalleryIndex,
  onGalleryInteraction,
  onVideoEnded,
}) {
  const [loadedMediaKey, setLoadedMediaKey] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const [videoPlaybackState, setVideoPlaybackState] = useState({ key: '', playing: true });
  const videoRef = useRef(null);
  const shouldShowImage = !showMap;
  const currentMediaKey = `${mediaType}:${image}`;
  const isVisualReady = showMap || loadedMediaKey === currentMediaKey;
  const isVideoPlaying =
    videoPlaybackState.key === currentMediaKey ? videoPlaybackState.playing : true;

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const parallaxOffset = useMemo(() => Math.min(scrollY * 0.18, 36), [scrollY]);
  const stickyVisible = scrollY > 180;

  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      void videoRef.current.play();
      setVideoPlaybackState({ key: currentMediaKey, playing: true });
    } else {
      videoRef.current.pause();
      setVideoPlaybackState({ key: currentMediaKey, playing: false });
    }
  };

  return (
    <>
      <AnimatePresence>
        {stickyVisible ? (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="fixed inset-x-0 top-0 z-[60] border-b border-white/10 bg-slate-950/88 backdrop-blur-xl"
          >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{title}</p>
                <p className="truncate text-xs text-white/45">{address}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                {rating || 0}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="relative h-[45vh] w-full overflow-hidden rounded-b-2xl bg-slate-900 sm:h-[50vh] lg:h-[60vh]">
        {showMap ? (
          <motion.div
            key="hero-map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {mediaContent}
          </motion.div>
        ) : (
          <div className="absolute inset-0">
            {!isVisualReady ? (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900" />
            ) : null}
            {mediaType === 'video' ? (
              <motion.video
                ref={videoRef}
                key={image}
                src={image}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: isVisualReady ? 1 : 0, scale: isVisualReady ? 1 : 1.04, y: -parallaxOffset }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                onLoadedData={() => setLoadedMediaKey(currentMediaKey)}
                autoPlay
                muted
                playsInline
                onPlay={() => setVideoPlaybackState({ key: currentMediaKey, playing: true })}
                onPause={() => setVideoPlaybackState({ key: currentMediaKey, playing: false })}
                onEnded={() => {
                  onGalleryInteraction?.();
                  onVideoEnded?.();
                }}
                drag={shouldShowImage && galleryCount > 1 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.08}
                onDragEnd={(_, info) => {
                  if (!onSelectGalleryIndex || galleryCount <= 1) return;
                  onGalleryInteraction?.();
                  if (info.offset.x <= -40) {
                    onSelectGalleryIndex((activeIndex + 1) % galleryCount);
                  } else if (info.offset.x >= 40) {
                    onSelectGalleryIndex((activeIndex - 1 + galleryCount) % galleryCount);
                  }
                }}
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            ) : (
              <motion.img
                key={image}
                src={image}
                alt={title}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: isVisualReady ? 1 : 0, scale: isVisualReady ? 1 : 1.04, y: -parallaxOffset }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                onLoad={() => setLoadedMediaKey(currentMediaKey)}
                drag={shouldShowImage && galleryCount > 1 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.08}
                onDragEnd={(_, info) => {
                  if (!onSelectGalleryIndex || galleryCount <= 1) return;
                  onGalleryInteraction?.();
                  if (info.offset.x <= -40) {
                    onSelectGalleryIndex((activeIndex + 1) % galleryCount);
                  } else if (info.offset.x >= 40) {
                    onSelectGalleryIndex((activeIndex - 1 + galleryCount) % galleryCount);
                  }
                }}
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            )}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/24 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="absolute inset-x-0 top-0 z-10 mx-auto flex max-w-7xl items-start justify-between p-4 sm:p-6 lg:px-8 ios-safe-top">
          <Link
            to={backTo}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/65"
          >
            <ArrowLeft size={20} />
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMedia}
              className="flex h-12 items-center gap-2 rounded-full bg-black/50 px-4 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/65"
            >
              {showMap ? (
                <>
                  <ImageIcon size={16} /> Galereya
                </>
              ) : (
                <>
                  <MapIcon size={16} /> Xarita
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onFavorite}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/65"
            >
              <Heart size={18} className={isFavorited ? 'fill-red-500 text-red-500' : ''} />
            </button>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10 sm:bottom-6 sm:left-6 lg:left-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#ffcc33] px-3 py-1 text-xs font-semibold text-slate-950 shadow-sm sm:text-sm">
              {badge}
            </span>
            {mediaType === 'video' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                <Video size={13} />
                Video lavha
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-md sm:text-sm">
              <Star size={13} className="fill-yellow-400 text-yellow-400" />
              {rating || 0}
            </span>
            {galleryMeta ? (
              <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
                {galleryMeta}
              </span>
            ) : null}
          </div>
          <h1 className="max-w-xl text-2xl font-bold tracking-tight text-white drop-shadow-md sm:max-w-2xl sm:text-3xl lg:max-w-3xl lg:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/84 drop-shadow-md sm:max-w-2xl sm:text-base">
            {address}
          </p>
          {!showMap && galleryCount > 1 ? (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onGalleryInteraction?.();
                    onSelectGalleryIndex?.((activeIndex - 1 + galleryCount) % galleryCount);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/60"
                  aria-label="Oldingi rasm"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onGalleryInteraction?.();
                    onSelectGalleryIndex?.((activeIndex + 1) % galleryCount);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/60"
                  aria-label="Keyingi rasm"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              {mediaType === 'video' ? (
                <button
                  type="button"
                  onClick={toggleVideoPlayback}
                  className="flex h-9 items-center gap-2 rounded-full bg-black/45 px-3 text-white backdrop-blur-md transition hover:bg-black/60"
                  aria-label={isVideoPlaying ? "Videoni to'xtatish" : 'Videoni davom ettirish'}
                >
                  {isVideoPlaying ? <Pause size={15} /> : <Play size={15} />}
                  <span className="text-xs font-medium">{isVideoPlaying ? "To'xtatish" : 'Davom ettirish'}</span>
                </button>
              ) : null}
              {Array.from({ length: galleryCount }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    onGalleryInteraction?.();
                    onSelectGalleryIndex?.(index);
                  }}
                  className={`h-2.5 rounded-full transition-all ${
                    activeIndex === index ? 'w-7 bg-[#ffcc33]' : 'w-2.5 bg-white/42 hover:bg-white/72'
                  }`}
                  aria-label={`${index + 1}-rasmga o'tish`}
                />
              ))}
              <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
                {activeIndex + 1} / {galleryCount}
              </span>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
