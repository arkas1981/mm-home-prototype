import { toISO } from "@/lib/booking";

export interface DayInfo { disabled?: boolean; className?: string; title?: string; mark?: string }

export function MonthCalendar({ year, month, locale, info, onPick }: {
  year: number; month: number; locale: string; info: (iso: string) => DayInfo; onPick?: (iso: string) => void;
}) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const wd = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: "narrow" }));
  return (
    <div>
      <p className="font-serif text-xl mb-3 capitalize">{first.toLocaleDateString(locale, { month: "long", year: "numeric" })}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">{wd.map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, i) => <span key={"e" + i} />)}
        {Array.from({ length: days }, (_, i) => {
          const iso = toISO(new Date(year, month, i + 1));
          const d = info(iso);
          return (
            <button key={iso} type="button" disabled={d.disabled} title={d.title} onClick={() => onPick?.(iso)}
              className={`relative aspect-square rounded-md text-sm transition-colors ${d.className ?? "hover:bg-accent"} ${d.disabled ? "cursor-not-allowed" : ""}`}>
              {i + 1}
              {d.mark && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] leading-none">{d.mark}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
