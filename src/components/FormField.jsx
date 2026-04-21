export default function FormField({ label, hint, className = '', children }) {
  return (
    <label className={`block space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </span>
        {hint ? (
          <span className="text-xs text-slate-400 dark:text-slate-500">{hint}</span>
        ) : null}
      </div>
      {children}
    </label>
  );
}
