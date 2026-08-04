import { useState } from "react";
import { useQuery } from "convex/react";
import { CaretDown, CaretUp, ClockCounterClockwise } from "@phosphor-icons/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { EmptyState, Select, SkeletonRows, cx } from "../components/ui";
import { prettyDateTime } from "../lib/format";

const ENTITIES = [
  "bookings", "guests", "payments", "expenses", "channelRequests", "channels",
  "guestRequests", "users", "rooms", "roomTypes", "activities", "services", "packages",
];

function DiffBlock({ label, value }: { label: string; value: unknown }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-faint">{label}</p>
      <pre className="overflow-x-auto rounded-lg bg-sand-100 p-3 font-mono text-[11px] leading-relaxed text-ink-soft">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export default function LogsPage() {
  const [entity, setEntity] = useState<string>("");
  const [actorId, setActorId] = useState<string>("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const users = useQuery(api.users.list);
  const logs = useQuery(api.auditLogs.list, {
    entity: entity || undefined,
    actorId: actorId ? (actorId as Id<"users">) : undefined,
    limit: 200,
  });

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Audit log</h1>
          <p className="mt-1 text-sm text-ink-faint">
            Every action by every user, with before/after snapshots.
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={actorId} onChange={(e) => setActorId(e.target.value)} className="w-44">
            <option value="">All users</option>
            {users?.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name ?? user.email}
              </option>
            ))}
          </Select>
          <Select value={entity} onChange={(e) => setEntity(e.target.value)} className="w-44">
            <option value="">All entities</option>
            {ENTITIES.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </Select>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl2 border border-sand-200 bg-white" style={{ boxShadow: "var(--shadow-diffuse)" }}>
        {logs === undefined ? (
          <div className="p-4"><SkeletonRows count={6} /></div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<ClockCounterClockwise size={22} weight="duotone" />}
            title="No log entries"
            hint="Actions matching these filters will appear here."
          />
        ) : (
          <ul className="divide-y divide-sand-100">
            {logs.map((log) => {
              const isOpen = expanded === log._id;
              const hasDiff = log.before !== undefined || log.after !== undefined;
              return (
                <li key={log._id}>
                  <button
                    onClick={() => hasDiff && setExpanded(isOpen ? null : log._id)}
                    className={cx(
                      "flex w-full flex-col gap-1 px-4 py-3 text-left sm:flex-row sm:items-center sm:gap-4 sm:px-5",
                      hasDiff && "cursor-pointer transition-colors hover:bg-sand-50",
                    )}
                  >
                    <span className="flex items-center gap-3 sm:contents">
                      <span className="num shrink-0 text-xs text-ink-faint sm:w-32">
                        {prettyDateTime(log._creationTime)}
                      </span>
                      <span className="truncate text-[13px] font-semibold sm:w-36 sm:shrink-0">
                        {log.actorName}
                      </span>
                      <span className="num hidden w-44 shrink-0 truncate rounded bg-sand-100 px-2 py-0.5 text-[11px] text-ink-soft lg:inline-block">
                        {log.action}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">
                      {log.summary}
                    </span>
                    {hasDiff &&
                      (isOpen ? (
                        <CaretUp size={14} className="hidden shrink-0 text-ink-faint sm:block" />
                      ) : (
                        <CaretDown size={14} className="hidden shrink-0 text-ink-faint sm:block" />
                      ))}
                  </button>
                  {isOpen && (
                    <div className="flex flex-col gap-3 border-t border-sand-100 bg-sand-50/60 px-5 py-4 md:flex-row">
                      <DiffBlock label="Before" value={log.before} />
                      <DiffBlock label="After" value={log.after} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
