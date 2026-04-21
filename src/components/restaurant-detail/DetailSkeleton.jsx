export default function DetailSkeleton() {
  return (
    <div className="flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,204,51,0.1),_transparent_18%),linear-gradient(180deg,#020617_0%,#0f172a_24%,#0f172a_100%)]">
      <div className="h-[45vh] w-full animate-pulse bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 lg:h-[60vh]" />
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="-mt-10 mb-8 rounded-[30px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl sm:-mt-14 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="h-4 w-24 rounded-full bg-white/10" />
              <div className="h-4 w-full rounded-full bg-white/10" />
              <div className="h-4 w-3/4 rounded-full bg-white/10" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-24 rounded-full bg-white/10" />
              <div className="h-4 w-2/3 rounded-full bg-white/10" />
            </div>
          </div>
          <div className="mt-6 h-14 rounded-2xl bg-white/10" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="flex gap-4 rounded-[28px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md"
            >
              <div className="h-20 w-20 rounded-2xl bg-white/10" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-2/3 rounded-full bg-white/10" />
                <div className="h-4 w-1/3 rounded-full bg-white/10" />
                <div className="h-9 w-24 rounded-full bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
