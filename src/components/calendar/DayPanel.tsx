import { useQuery } from "convex/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ForkKnife,
  Moon,
  Van,
  Waves,
} from "@phosphor-icons/react";
import { api } from "../../../convex/_generated/api";
import { Drawer, SkeletonRows } from "../ui";
import { prettyDateLong } from "../../lib/format";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  unknown: "Level unknown",
};

export default function DayPanel({
  date,
  onClose,
}: {
  date: string | null;
  onClose: () => void;
}) {
  const detail = useQuery(api.calendar.dayDetail, date ? { date } : "skip");

  if (!date) return null;

  return (
    <Drawer open onClose={onClose} title={prettyDateLong(date)}>
      {detail === undefined ? (
        <SkeletonRows count={6} />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Headline numbers */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-sand-200 bg-white p-3 text-center">
              <ArrowDownLeft size={16} weight="bold" className="mx-auto text-kelp" />
              <p className="num mt-1 text-xl font-bold">{detail.arrivals.length}</p>
              <p className="text-[11px] text-ink-faint">Arrivals</p>
            </div>
            <div className="rounded-xl border border-sand-200 bg-white p-3 text-center">
              <ArrowUpRight size={16} weight="bold" className="mx-auto text-ink-faint" />
              <p className="num mt-1 text-xl font-bold">{detail.departures.length}</p>
              <p className="text-[11px] text-ink-faint">Departures</p>
            </div>
            <div className="rounded-xl border border-sand-200 bg-white p-3 text-center">
              <Moon size={16} weight="bold" className="mx-auto text-ocean-500" />
              <p className="num mt-1 text-xl font-bold">{detail.guestsSleeping}</p>
              <p className="text-[11px] text-ink-faint">Sleeping</p>
            </div>
          </div>

          {/* Activity prep — the prediction view */}
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold">
              <Waves size={15} weight="duotone" className="text-ocean-600" />
              Sessions to prepare
            </h3>
            {detail.activities.length === 0 ? (
              <p className="rounded-xl border border-sand-200 bg-white px-4 py-4 text-sm text-ink-faint">
                No activities scheduled — free day.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {detail.activities.map((activity) => (
                  <div
                    key={activity.name}
                    className="rounded-xl border border-sand-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-bold">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: activity.color }}
                        />
                        {activity.name}
                        {activity.startTime && (
                          <span className="num rounded-md bg-ocean-50 px-1.5 py-0.5 text-[11px] font-bold text-ocean-800">
                            {activity.startTime}
                          </span>
                        )}
                      </span>
                      <span className="num rounded-full bg-sand-100 px-2.5 py-0.5 text-xs font-bold">
                        {activity.total} pax
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(activity.byLevel).map(([level, count]) => (
                        <span
                          key={level}
                          className="rounded-full border border-sand-200 bg-sand-50 px-2 py-0.5 text-[11px] font-medium text-ink-soft"
                        >
                          {count} × {LEVEL_LABEL[level] ?? level}
                        </span>
                      ))}
                    </div>
                    <ul className="mt-2.5 text-xs text-ink-faint">
                      {activity.participants.map((participant, i) => (
                        <li key={i}>
                          {participant.guestName}
                          {participant.count > 1 && ` (+${participant.count - 1})`}
                          {participant.level && ` · ${participant.level}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Services due */}
          {detail.services.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold">
                <Van size={15} weight="duotone" className="text-ocean-600" />
                Services due
              </h3>
              <ul className="divide-y divide-sand-100 rounded-xl border border-sand-200 bg-white px-4">
                {detail.services.map((service, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium">
                      {service.name}
                      {service.startTime && (
                        <span className="num ml-2 text-xs font-bold text-ocean-700">
                          {service.startTime}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-ink-faint">
                      {service.guestName} · ×{service.qty}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Dietary flags */}
          {detail.dietary.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold">
                <ForkKnife size={15} weight="duotone" className="text-dune" />
                Kitchen notes
              </h3>
              <ul className="divide-y divide-sand-100 rounded-xl border border-dune/30 bg-dune/5 px-4">
                {detail.dietary.map((guest) => (
                  <li key={guest.bookingId} className="py-2.5 text-sm">
                    <span className="font-semibold">{guest.guestName}</span>
                    <span className="text-ink-soft"> — {guest.allergies}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Movements */}
          <section className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="mb-2 text-sm font-bold">Arriving</h3>
              {detail.arrivals.length === 0 ? (
                <p className="text-xs text-ink-faint">Nobody.</p>
              ) : (
                <ul className="flex flex-col gap-1.5 text-sm">
                  {detail.arrivals.map((guest) => (
                    <li key={guest.bookingId} className="rounded-lg bg-kelp/10 px-3 py-1.5">
                      {guest.guestName}
                      <span className="num text-xs text-ink-faint"> · {guest.adults + guest.children} pax</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold">Leaving</h3>
              {detail.departures.length === 0 ? (
                <p className="text-xs text-ink-faint">Nobody.</p>
              ) : (
                <ul className="flex flex-col gap-1.5 text-sm">
                  {detail.departures.map((guest) => (
                    <li key={guest.bookingId} className="rounded-lg bg-sand-100 px-3 py-1.5">
                      {guest.guestName}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </Drawer>
  );
}
