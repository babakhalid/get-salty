import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  CaretLeft,
  CaretRight,
  Check,
  Tray,
  X,
} from "@phosphor-icons/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Badge,
  Button,
  EmptyState,
  SkeletonRows,
  STATUS_TONE,
  cx,
} from "../components/ui";
import { eur, prettyDate, prettyDateTime } from "../lib/format";
import BookingDetailDrawer from "../components/calendar/BookingDetailDrawer";

const PAGE_SIZE = 10;
const FILTERS = [
  { key: "pending", label: "Pending" },
  { key: "all", label: "All" },
  { key: "approved", label: "Approved" },
  { key: "declined", label: "Declined" },
] as const;

export default function RequestsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("pending");
  const [page, setPage] = useState(0);
  const [openBookingId, setOpenBookingId] = useState<Id<"bookings"> | null>(null);

  const requests = useQuery(api.requests.list, {
    status: filter === "all" ? undefined : filter,
  });
  const pendingCount = useQuery(api.requests.pendingCount);
  const resolve = useMutation(api.bookings.resolveGuestRequest);

  const pageCount = requests ? Math.max(1, Math.ceil(requests.length / PAGE_SIZE)) : 1;
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = useMemo(
    () => requests?.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [requests, safePage],
  );

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight">
            Guest requests
            {pendingCount !== undefined && pendingCount > 0 && (
              <span className="num rounded-full bg-dune/15 px-2.5 py-0.5 text-sm font-bold text-[#8a6420]">
                {pendingCount} pending
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            Everything guests asked for from their portals — newest first.
            Approving an order adds it to the booking's bill.
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-sand-200 bg-white p-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setFilter(key);
                setPage(0);
              }}
              className={cx(
                "rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors cursor-pointer",
                filter === key
                  ? "bg-ocean-700 text-sand-50"
                  : "text-ink-faint hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div
        className="overflow-hidden rounded-xl2 border border-sand-200 bg-white"
        style={{ boxShadow: "var(--shadow-diffuse)" }}
      >
        {requests === undefined ? (
          <div className="p-4">
            <SkeletonRows count={5} />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<Tray size={22} weight="duotone" />}
            title={filter === "pending" ? "Inbox zero" : "Nothing here"}
            hint={
              filter === "pending"
                ? "New portal orders and requirements will land here."
                : "Requests with this status will show up here."
            }
          />
        ) : (
          <ul className="divide-y divide-sand-100">
            {pageRows?.map((request) => (
              <li
                key={request._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setOpenBookingId(request.bookingId)}
                      className="text-sm font-bold text-ocean-700 hover:underline cursor-pointer"
                    >
                      {request.guestName}
                    </button>
                    <Badge tone={request.type === "order" ? "ocean" : "amber"}>
                      {request.type === "order" ? "Order" : "Requirement"}
                    </Badge>
                    <span className="text-xs text-ink-faint">
                      {request.roomName}
                      {request.reservationCode && (
                        <span className="num"> · {request.reservationCode}</span>
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink">
                    {request.itemName ? (
                      <>
                        <span className="font-semibold">{request.itemName}</span>
                        {request.qty && request.qty > 1 && (
                          <span className="num"> ×{request.qty}</span>
                        )}
                        {request.amount !== undefined && request.amount > 0 && (
                          <span className="num text-ink-soft"> · {eur(request.amount)}</span>
                        )}
                        {request.date && (
                          <span className="num text-ink-faint"> · {prettyDate(request.date)}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-ink-soft">Special request</span>
                    )}
                  </p>
                  {request.note && (
                    <p className="mt-1 rounded-lg bg-sand-100 px-3 py-1.5 text-xs text-ink-soft">
                      "{request.note}"
                    </p>
                  )}
                  <p className="num mt-1.5 text-[11px] text-ink-faint">
                    {prettyDateTime(request.createdAt)}
                    {request.resolvedByName && ` · resolved by ${request.resolvedByName}`}
                  </p>
                </div>

                {request.status === "pending" && request.bookingActive ? (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      onClick={() => void resolve({ requestId: request._id, approve: true })}
                    >
                      <Check size={14} weight="bold" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void resolve({ requestId: request._id, approve: false })}
                    >
                      <X size={14} weight="bold" /> Decline
                    </Button>
                  </div>
                ) : (
                  <Badge tone={STATUS_TONE[request.status]}>{request.status}</Badge>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {requests && requests.length > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sand-200 px-5 py-3">
            <p className="num text-xs text-ink-faint">
              {safePage * PAGE_SIZE + 1}–
              {Math.min((safePage + 1) * PAGE_SIZE, requests.length)} of {requests.length}{" "}
              requests
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(safePage - 1)}
                disabled={safePage === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-sand-200 text-ink-soft transition-colors hover:bg-sand-100 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                aria-label="Previous page"
              >
                <CaretLeft size={13} weight="bold" />
              </button>
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={cx(
                    "num h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition-colors cursor-pointer",
                    i === safePage
                      ? "bg-ocean-700 text-sand-50"
                      : "border border-sand-200 text-ink-soft hover:bg-sand-100",
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(safePage + 1)}
                disabled={safePage >= pageCount - 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-sand-200 text-ink-soft transition-colors hover:bg-sand-100 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                aria-label="Next page"
              >
                <CaretRight size={13} weight="bold" />
              </button>
            </div>
          </div>
        )}
      </div>

      <BookingDetailDrawer
        bookingId={openBookingId}
        onClose={() => setOpenBookingId(null)}
      />
    </div>
  );
}
