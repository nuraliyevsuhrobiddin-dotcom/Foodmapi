import { ArrowLeft, ArrowRight, Flag, Navigation, Route } from 'lucide-react';
import { formatDistance, formatDuration } from '../../utils/navigationFormat';

const translateInstruction = (text = '') => {
  const original = String(text || '').trim();
  if (!original) return "To'g'ri davom eting";

  let translated = original;

  const replacements = [
    [/\bTurn left\b/gi, 'Chapga buriling'],
    [/\bTurn right\b/gi, "O'ngga buriling"],
    [/\bContinue straight\b/gi, "To'g'ri davom eting"],
    [/\bContinue\b/gi, 'Davom eting'],
    [/\bKeep left\b/gi, 'Chap tomonda davom eting'],
    [/\bKeep right\b/gi, "O'ng tomonda davom eting"],
    [/\bSlight left\b/gi, 'Biroz chapga buriling'],
    [/\bSlight right\b/gi, "Biroz o'ngga buriling"],
    [/\bSharp left\b/gi, 'Keskin chapga buriling'],
    [/\bSharp right\b/gi, "Keskin o'ngga buriling"],
    [/\bMake a U-turn\b/gi, 'Ortga qayrilib buriling'],
    [/\bHead north\b/gi, 'Shimol tomonga harakatlaning'],
    [/\bHead south\b/gi, 'Janub tomonga harakatlaning'],
    [/\bHead east\b/gi, 'Sharq tomonga harakatlaning'],
    [/\bHead west\b/gi, "G'arb tomonga harakatlaning"],
    [/\bArrive at your destination\b/gi, 'Manzilga yetib keldingiz'],
    [/\bYou have arrived at your destination\b/gi, 'Manzilga yetib keldingiz'],
    [/\bDestination will be on the left\b/gi, "Manzil chap tomonda bo'ladi"],
    [/\bDestination will be on the right\b/gi, "Manzil o'ng tomonda bo'ladi"],
    [/\bAt the roundabout\b/gi, "Aylanma yo'lda"],
    [/\broundabout\b/gi, "aylanma yo'l"],
    [/\btake the ([0-9]+)(st|nd|rd|th) exit\b/gi, '$1-chi chiqishdan chiqing'],
    [/\bTake the ramp\b/gi, "Yo'l o'tkazgichiga chiqing"],
    [/\bMerge\b/gi, "Yo'lga qo'shiling"],
    [/\bonto\b/gi, 'ga'],
  ];

  replacements.forEach(([pattern, value]) => {
    translated = translated.replace(pattern, value);
  });

  return translated;
};

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
            {formatDistance(routeInfo.totalDistance)} • {formatDuration(routeInfo.totalTime)}
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
                  {translateInstruction(step.text)}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {step.distanceText || formatDistance(step.distance)} • {step.timeText || formatDuration(step.time)}
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
