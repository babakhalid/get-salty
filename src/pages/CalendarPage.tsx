import { useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { addDays, format, isToday, parseISO, startOfWeek } from "date-fns";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button, cx } from "../components/ui";
import NewBookingDrawer from "../components/calendar/NewBookingDrawer";
import BookingDetailDrawer from "../components/calendar/BookingDetailDrawer";
import DayPanel from "../components/calendar/DayPanel";
import {
  SummaryCellDrawer,
  SummarySection,
  type OpenSummaryCell,
} from "../components/calendar/SummaryRows";

const DAYS_SHOWN = 28;
const COL_W = 46; // px per day column
const LABEL_W = 190;

const STATUS_BAR: Record<string, string> = {
  inquiry: "bg-dune/85 text-ink",
  confirmed: "bg-ocean-600 text-sand-50",
  checked_in: "bg-kelp text-sand-50",
  checked_out: "bg-sand-400 text-white",
  no_show: "bg-coral/70 text-white",
};

type Selection = {
  rowKey: string;
  roomId: Id<"rooms">;
  bedId?: Id<"beds">;
  startIdx: number;
  endIdx: number;
};

export default function CalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [drag, setDrag] = useState<Selection | null>(null);
  const [pendingBooking, setPendingBooking] = useState<{
    roomId: Id<"rooms">;
    bedId?: Id<"beds">;
    checkIn: string;
    checkOut: string;
  } | null>(null);
  const [openBookingId, setOpenBookingId] = useState<Id<"bookings"> | null>(null);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [openSummaryCell, setOpenSummaryCell] = useState<OpenSummaryCell | null>(null);
  const dragging = useRef(false);
  const scope = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    const anchor = startOfWeek(addDays(new Date(), weekOffset * 7), {
      weekStartsOn: 1,
    });
    return Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(anchor, i));
  }, [weekOffset]);

  const rangeStart = format(days[0], "yyyy-MM-dd");
  const rangeEnd = format(addDays(days[DAYS_SHOWN - 1], 1), "yyyy-MM-dd");

  const grid = useQuery(api.calendar.grid, { start: rangeStart, end: rangeEnd });

  useGSAP(
    () => {
      gsap.fromTo(
        ".booking-bar",
        { opacity: 0, scaleX: 0.9 },
        {
          opacity: 1,
          scaleX: 1,
          duration: 0.4,
          ease: "expo.out",
          stagger: 0.015,
          transformOrigin: "left center",
        },
      );
    },
    { scope, dependencies: [weekOffset, grid === undefined] },
  );

  const idxOf = (iso: string) => {
    const t = parseISO(iso).getTime();
    return Math.round((t - days[0].getTime()) / 86400000);
  };

  function startDrag(row: NonNullable<typeof grid>["rows"][number], idx: number) {
    if (row.maintenance) return;
    dragging.current = true;
    setDrag({
      rowKey: row.key,
      roomId: row.roomId,
      bedId: row.bedId,
      startIdx: idx,
      endIdx: idx,
    });
  }

  function moveDrag(rowKey: string, idx: number) {
    if (!dragging.current) return;
    setDrag((d) => (d && d.rowKey === rowKey ? { ...d, endIdx: idx } : d));
  }

  function endDrag() {
    if (!dragging.current || !drag) return;
    dragging.current = false;
    const from = Math.min(drag.startIdx, drag.endIdx);
    const to = Math.max(drag.startIdx, drag.endIdx);
    setPendingBooking({
      roomId: drag.roomId,
      bedId: drag.bedId,
      checkIn: format(days[from], "yyyy-MM-dd"),
      // dragging N cells = N nights; checkout is the morning after the last night
      checkOut: format(addDays(days[to], 1), "yyyy-MM-dd"),
    });
    setDrag(null);
  }

  // Group rows by room for section headers in the label rail
  const rows = grid?.rows ?? [];
  const bookings = grid?.bookings ?? [];

  return (
    <div ref={scope} onMouseUp={endDrag} onMouseLeave={() => { dragging.current = false; setDrag(null); }}>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Calendar</h1>
          <p className="mt-1 text-sm text-ink-faint">
            Drag across empty nights to book. Click a date for the day briefing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week">
            <CaretLeft size={15} weight="bold" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>
            Today
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week">
            <CaretRight size={15} weight="bold" />
          </Button>
          <span className="num ml-2 text-sm font-semibold text-ink-soft">
            {format(days[0], "d MMM")} – {format(days[DAYS_SHOWN - 1], "d MMM yyyy")}
          </span>
        </div>
      </header>

      <div
        className="overflow-x-auto rounded-xl2 border border-sand-200 bg-white select-none"
        style={{ boxShadow: "var(--shadow-diffuse)" }}
      >
        <div style={{ minWidth: LABEL_W + DAYS_SHOWN * COL_W }}>
          {/* Date header */}
          <div
            className="grid border-b border-sand-200 bg-sand-100/60"
            style={{ gridTemplateColumns: `${LABEL_W}px repeat(${DAYS_SHOWN}, ${COL_W}px)` }}
          >
            <div className="sticky left-0 z-20 border-r border-sand-200 bg-sand-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-ink-faint">
              Rooms & beds
            </div>
            {days.map((day, i) => {
              const iso = format(day, "yyyy-MM-dd");
              const weekend = [0, 6].includes(day.getDay());
              return (
                <button
                  key={i}
                  onClick={() => setOpenDay(iso)}
                  className={cx(
                    "flex flex-col items-center gap-0.5 border-r border-sand-100 py-2 transition-colors hover:bg-ocean-50 cursor-pointer",
                    weekend && "bg-sand-100/80",
                    isToday(day) && "bg-ocean-100/70",
                  )}
                  title={`Day briefing — ${iso}`}
                >
                  <span className="text-[10px] font-semibold uppercase text-ink-faint">
                    {format(day, "EEE")}
                  </span>
                  <span
                    className={cx(
                      "num flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-bold",
                      isToday(day) ? "bg-ocean-700 text-sand-50" : "text-ink",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Rows */}
          {grid === undefined ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="skeleton h-10 w-full" />
              ))}
            </div>
          ) : (
            rows.map((row, rowIdx) => {
              const prev = rows[rowIdx - 1];
              const newRoomGroup = !prev || prev.roomId !== row.roomId;
              const rowBookings = bookings.filter((b) =>
                row.bedId ? b.bedId === row.bedId : b.roomId === row.roomId && !b.bedId,
              );
              const isDragRow = drag?.rowKey === row.key;
              const dragFrom = isDragRow ? Math.min(drag.startIdx, drag.endIdx) : -1;
              const dragTo = isDragRow ? Math.max(drag.startIdx, drag.endIdx) : -1;

              return (
                <div
                  key={row.key}
                  className={cx(
                    "relative grid",
                    newRoomGroup ? "border-t border-sand-200" : "border-t border-sand-100",
                  )}
                  style={{ gridTemplateColumns: `${LABEL_W}px repeat(${DAYS_SHOWN}, ${COL_W}px)` }}
                >
                  {/* Label rail */}
                  <div className="sticky left-0 z-10 flex items-center gap-2 border-r border-sand-200 bg-white px-4 py-2">
                    {row.mode === "dorm" ? (
                      <>
                        <span className="w-1 self-stretch rounded-full bg-sand-200" />
                        <div className="min-w-0 leading-tight">
                          <p className="truncate text-[13px] font-semibold">{row.label}</p>
                          <p className="truncate text-[11px] text-ink-faint">{row.roomName}</p>
                        </div>
                      </>
                    ) : (
                      <div className="min-w-0 leading-tight">
                        <p className="truncate text-[13px] font-semibold">{row.roomName}</p>
                        <p className="truncate text-[11px] text-ink-faint">{row.typeName}</p>
                      </div>
                    )}
                    {row.maintenance && (
                      <span className="ml-auto rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-bold text-coral">
                        Maint.
                      </span>
                    )}
                  </div>

                  {/* Day cells */}
                  {days.map((day, i) => {
                    const weekend = [0, 6].includes(day.getDay());
                    const inDrag = isDragRow && i >= dragFrom && i <= dragTo;
                    return (
                      <div
                        key={i}
                        onMouseDown={() => startDrag(row, i)}
                        onMouseEnter={() => moveDrag(row.key, i)}
                        className={cx(
                          "h-11 border-r border-sand-100 transition-colors",
                          weekend && "bg-sand-50",
                          isToday(day) && "bg-ocean-50/60",
                          row.maintenance
                            ? "bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(192,91,77,0.08)_5px,rgba(192,91,77,0.08)_10px)]"
                            : "cursor-crosshair hover:bg-ocean-50",
                          inDrag && "bg-ocean-200/50",
                        )}
                      />
                    );
                  })}

                  {/* Booking bars — half-day offset like classic PMS charts */}
                  {rowBookings.map((booking) => {
                    const from = Math.max(idxOf(booking.checkIn), -0.5);
                    const to = Math.min(idxOf(booking.checkOut), DAYS_SHOWN + 0.5);
                    const left = LABEL_W + (from + 0.5) * COL_W;
                    const width = (to - from) * COL_W - 6;
                    if (width <= 0) return null;
                    return (
                      <button
                        key={booking._id}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => setOpenBookingId(booking._id)}
                        className={cx(
                          "booking-bar absolute top-1.5 z-[5] flex h-8 items-center gap-1.5 overflow-hidden rounded-lg px-2.5 text-left shadow-sm transition-transform hover:-translate-y-[1px] cursor-pointer",
                          STATUS_BAR[booking.status] ?? "bg-ocean-600 text-sand-50",
                        )}
                        style={{ left, width }}
                        title={`${booking.guestName} · ${booking.checkIn} → ${booking.checkOut}`}
                      >
                        <span className="truncate text-xs font-bold">
                          {booking.guestName}
                        </span>
                        {booking.source !== "direct" && booking.source !== "walk_in" && (
                          <span className="ml-auto shrink-0 rounded bg-black/15 px-1 text-[9px] font-black uppercase">
                            {booking.source === "booking_com"
                              ? "B"
                              : booking.source === "airbnb"
                                ? "A"
                                : booking.source === "hostelworld"
                                  ? "H"
                                  : "E"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}

          {/* Per-day totals for packages, activities & services (from Settings) */}
          {grid !== undefined && (
            <>
              <SummarySection
                section="packages"
                rows={grid.summary.packages}
                days={days}
                labelWidth={LABEL_W}
                colWidth={COL_W}
                onOpenCell={setOpenSummaryCell}
              />
              <SummarySection
                section="activities"
                rows={grid.summary.activities}
                days={days}
                labelWidth={LABEL_W}
                colWidth={COL_W}
                onOpenCell={setOpenSummaryCell}
              />
              <SummarySection
                section="services"
                rows={grid.summary.services}
                days={days}
                labelWidth={LABEL_W}
                colWidth={COL_W}
                onOpenCell={setOpenSummaryCell}
              />
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-ink-faint">
        {Object.entries({ inquiry: "Inquiry", confirmed: "Confirmed", checked_in: "Checked in", checked_out: "Checked out" }).map(
          ([status, label]) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className={cx("h-2.5 w-4 rounded", STATUS_BAR[status].split(" ")[0])} />
              {label}
            </span>
          ),
        )}
        <span className="flex items-center gap-1.5 border-l border-sand-200 pl-4">
          <span className="num font-semibold text-[#8a6420]">+N</span>
          portal request awaiting approval
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-dune" />
          guest left a note — click the cell
        </span>
      </div>

      <NewBookingDrawer
        pending={pendingBooking}
        onClose={() => setPendingBooking(null)}
      />
      <BookingDetailDrawer
        bookingId={openBookingId}
        onClose={() => setOpenBookingId(null)}
      />
      <DayPanel date={openDay} onClose={() => setOpenDay(null)} />
      <SummaryCellDrawer
        cell={openSummaryCell}
        onClose={() => setOpenSummaryCell(null)}
      />
    </div>
  );
}
