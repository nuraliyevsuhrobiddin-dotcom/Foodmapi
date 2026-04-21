import { ArrowLeft, ArrowRight, Flag, Navigation, Route } from 'lucide-react';

const getStepIcon = (instruction = {}) => {
  const text = `${instruction.text || ''}`.toLowerCase();
  const type = `${instruction.type || ''}`.toLowerCase();

  if (text.includes('left') || text.includes('chap') || type.includes('left')) {
    return ArrowLeft;
  }

  if (text.includes('right') || text.includes("o'ng") || type.includes('right')) {
    return ArrowRight;
  }

  if (text.includes('arrive') || text.includes('yetib') || type.includes('destination')) {
    return Flag;
  }

  return ArrowRight;
};

export default function NavigationSteps({ routeInfo, googleMapsUrl }) {
  if (!routeInfo?.steps?.length) return null;

  return (
    <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.05] p-4 shadow-lg backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Yo&apos;l tafsiloti</p>
          <h3 className="mt-1 text-base font-semibold text-white">
            {routeInfo.distance} km • {routeInfo.time} min
          </h3>
        </div>
        {googleMapsUrl ? (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-white/15 active:scale-[0.99]"
          >
            <Route size={14} />
            Google Maps
          </a>
        ) : null}
      </div>

      <div className="space-y-2">
        {routeInfo.steps.map((step, index) => {
          const StepIcon = getStepIcon(step);

          return (
            <div
              key={`${step.text}-${index}`}
              className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/10 px-3 py-3"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ffcc33]/12 text-[#ffcc33] ring-1 ring-[#ffcc33]/20">
                <StepIcon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-6 text-white">
                  {step.text || "To'g'ri davom eting"}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {step.distanceText} • {step.timeText}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/[0.04] px-3 py-2 text-xs text-white/55">
        <Navigation size={14} className="text-[#ffcc33]" />
        Burilishlar avtomatik route hisobidan olingan
      </div>
    </div>
  );
}
