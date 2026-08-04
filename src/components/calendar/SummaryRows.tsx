import { format } from "date-fns";
import { Drawer, cx } from "../ui";
import { prettyDateLong } from "../../lib/format";

export type SummaryEntry = {
  guestName: string;
  count: number;
  note?: string;
  pending?: boolean;
};

export type SummaryDay = {
  total: number;
  pendingTotal: number;
  entries: SummaryEntry[];
};

export type SummaryRow = {
  key: string;
  name: string;
  color?: string;
  perDay: Record<string, SummaryDay>;
};

export type OpenSummaryCell = {
  rowName: string;
  color?: string;
  date: string;
  day: SummaryDay;
};

const SECTION_LABELS: Record<string, string> = {
  packages: "Packages",
  activities: "Activities",
  services: "Services",
};

export function SummarySection({
  section,
  rows,
  days,
  labelWidth,
  colWidth,
  onOpenCell,
}: {
  section: "packages" | "activities" | "services";
  rows: SummaryRow[];
  days: Date[];
  labelWidth: number;
  colWidth: number;
  onOpenCell: (cell: OpenSummaryCell) => void;
}) {
  if (rows.length === 0) return null;
  const template = {
    gridTemplateColumns: `${labelWidth}px repeat(${days.length}, ${colWidth}px)`,
  };
  return (
    <>
      {/* Section divider */}
      <div className="grid border-t-2 border-sand-200 bg-sand-100/80" style={template}>
        <div className="sticky left-0 z-10 bg-sand-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
          {SECTION_LABELS[section]}
        </div>
        <div style={{ gridColumn: `span ${days.length}` }} />
      </div>

      {rows.map((row) => (
        <div key={row.key} className="grid border-t border-sand-100" style={template}>
          <div className="sticky left-0 z-10 flex items-center gap-2 border-r border-sand-200 bg-white px-4 py-1.5">
            {row.color && (
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: row.color }}
              />
            )}
            <p className="truncate text-[12px] font-medium text-ink-soft">{row.name}</p>
          </div>
          {days.map((date, i) => {
            const iso = format(date, "yyyy-MM-dd");
            const day = row.perDay[iso];
            const weekend = [0, 6].includes(date.getDay());
            const hasNotes = day?.entries.some((e) => e.note);
            return (
              <button
                key={i}
                disabled={!day}
                onClick={() =>
                  day &&
                  onOpenCell({ rowName: row.name, color: row.color, date: iso, day })
                }
                className={cx(
                  "relative flex h-7 items-center justify-center border-r border-sand-100 text-[11px]",
                  weekend && "bg-sand-50",
                  day && "cursor-pointer transition-colors hover:bg-ocean-50",
                )}
                title={day ? `${row.name} — click for details` : undefined}
              >
                {day && day.total > 0 && (
                  <span className="num font-bold text-ink">{day.total}</span>
                )}
                {day && day.pendingTotal > 0 && (
                  <span className="num ml-0.5 font-semibold text-[#8a6420]">
                    +{day.pendingTotal}
                  </span>
                )}
                {hasNotes && (
                  <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-dune" />
                )}
              </button>
            );
          })}
        </div>
      ))}
    </>
  );
}

export function SummaryCellDrawer({
  cell,
  onClose,
}: {
  cell: OpenSummaryCell | null;
  onClose: () => void;
}) {
  if (!cell) return null;
  const confirmed = cell.day.entries.filter((e) => !e.pending);
  const pending = cell.day.entries.filter((e) => e.pending);
  return (
    <Drawer
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          {cell.color && (
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: cell.color }} />
          )}
          {cell.rowName}
        </span>
      }
    >
      <p className="mb-5 text-sm text-ink-faint">{prettyDateLong(cell.date)}</p>

      <div className="mb-6 flex items-end gap-6 rounded-xl2 border border-sand-200 bg-white p-5">
        <div>
          <p className="text-xs text-ink-faint">Confirmed</p>
          <p className="num text-2xl font-bold">{cell.day.total}</p>
        </div>
        {cell.day.pendingTotal > 0 && (
          <div>
            <p className="text-xs text-ink-faint">Requested</p>
            <p className="num text-2xl font-bold text-[#8a6420]">
              +{cell.day.pendingTotal}
            </p>
          </div>
        )}
      </div>

      {confirmed.length > 0 && (
        <section className="mb-6">
          <h3 className="mb-2 text-sm font-bold">Guests</h3>
          <ul className="divide-y divide-sand-100 rounded-xl border border-sand-200 bg-white px-4">
            {confirmed.map((entry, i) => (
              <li key={i} className="py-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{entry.guestName}</span>
                  <span className="num text-ink-faint">×{entry.count}</span>
                </div>
                {entry.note && (
                  <p className="mt-1 rounded-lg bg-dune/10 px-2.5 py-1.5 text-xs text-[#6b4f19]">
                    "{entry.note}"
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {pending.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold">Awaiting approval</h3>
          <p className="mb-2 text-xs text-ink-faint">
            Requested from the guest portal — approve from the booking drawer.
          </p>
          <ul className="divide-y divide-dune/20 rounded-xl border border-dune/30 bg-dune/5 px-4">
            {pending.map((entry, i) => (
              <li key={i} className="py-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{entry.guestName}</span>
                  <span className="num text-[#8a6420]">×{entry.count}</span>
                </div>
                {entry.note && (
                  <p className="mt-1 text-xs text-ink-soft">"{entry.note}"</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Drawer>
  );
}
