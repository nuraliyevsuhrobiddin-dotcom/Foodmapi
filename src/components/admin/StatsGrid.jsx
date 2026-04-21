export default function StatsGrid({ items, compact = false }) {
  return (
    <div className={`grid grid-cols-2 gap-2 sm:gap-3 ${compact ? 'lg:grid-cols-2' : 'lg:grid-cols-4'}`}>
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-2xl border border-white/10 p-3 text-center shadow-[0_14px_34px_rgba(15,23,42,0.18)] backdrop-blur-xl ${item.className || 'bg-white/[0.06]'}`}
        >
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-white/60">
            {item.icon ? <item.icon className="h-3.5 w-3.5 text-white/50" /> : null}
            <span>{item.label}</span>
          </div>
          <div className="mt-1.5 text-lg font-bold text-white sm:text-xl">{item.value}</div>
          {item.helper ? <div className="mt-1 text-[11px] text-white/45">{item.helper}</div> : null}
        </div>
      ))}
    </div>
  );
}
