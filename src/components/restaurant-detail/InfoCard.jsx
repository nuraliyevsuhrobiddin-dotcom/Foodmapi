import { Clock, MapPin, Navigation } from 'lucide-react';

export default function InfoCard({
  address,
  workingHours,
  routeInfo,
  showMap,
  onShowRoute,
  googleMapsUrl,
}) {
  return (
    <div className="relative z-20 -mt-10 mb-8 rounded-[30px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.24)] backdrop-blur-xl sm:-mt-14 sm:p-6">
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:gap-6">
        <div className="flex flex-1 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ffcc33]/12 text-[#ffcc33] ring-1 ring-[#ffcc33]/20">
            <MapPin size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="mb-1 font-semibold text-white">Manzil</h3>
            <p className="text-sm leading-6 text-white/65">{address}</p>
          </div>
        </div>

        <div className="flex flex-1 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white">
            <Clock size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="mb-1 font-semibold text-white">Ish vaqti</h3>
            <p className="text-sm leading-6 text-white/65">{workingHours || '09:00 - 23:00'}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onShowRoute}
          className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#ffcc33] px-4 py-3.5 font-medium text-slate-950 shadow-[0_18px_40px_rgba(255,204,51,0.22)] transition-all duration-300 hover:brightness-105 active:scale-[0.99]"
        >
          <span className="absolute inset-0 h-full w-full bg-white/10 transition-transform duration-300 group-hover:scale-105" />
          {routeInfo && showMap ? (
            <span className="relative z-10 flex items-center gap-2 text-sm sm:text-base">
              <Navigation size={18} />
              {routeInfo.distance} km • {routeInfo.time} min
            </span>
          ) : (
            <span className="relative z-10 flex items-center gap-2 text-sm sm:text-base">
              <Navigation size={18} />
              Yo&apos;lni boshlash
            </span>
          )}
        </button>

        {googleMapsUrl ? (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:bg-white/15 active:scale-[0.99] sm:w-auto"
          >
            <MapPin size={18} />
            Xaritada ochish
          </a>
        ) : null}
      </div>
    </div>
  );
}
