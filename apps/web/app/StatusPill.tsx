import { statusLabel, statusTone, type StatusTone } from "@/lib/domain/shipment-labels";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "border-slate-300 bg-slate-100 text-slate-700",
  active: "border-teal-300 bg-teal-50 text-teal-800",
  moving: "border-amber-300 bg-amber-50 text-amber-800",
  done: "border-emerald-300 bg-emerald-50 text-emerald-800",
  alert: "border-red-300 bg-red-50 text-red-700",
  closed: "border-slate-300 bg-slate-50 text-slate-500",
};

const DOT_CLASS: Record<StatusTone, string> = {
  neutral: "bg-slate-400",
  active: "bg-teal-600",
  moving: "bg-amber-500 animate-pulse",
  done: "bg-emerald-600",
  alert: "bg-red-600",
  closed: "bg-slate-400",
};

/** Colour-coded shipment status badge, the same on account, booking, and Admin pages. */
export function StatusPill({ status, className = "" }: { status: string; className?: string }) {
  const tone = statusTone(status);
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASS[tone]} ${className}`}>
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[tone]}`} />
      {statusLabel(status)}
    </span>
  );
}
