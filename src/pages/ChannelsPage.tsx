import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import {
  ArrowsClockwise,
  Check,
  Plugs,
  Tray,
  X,
} from "@phosphor-icons/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Badge,
  Button,
  Drawer,
  EmptyState,
  Field,
  Select,
  SectionTitle,
  SkeletonRows,
  STATUS_TONE,
  cx,
} from "../components/ui";
import { eur } from "../lib/format";

const CHANNEL_GLYPH: Record<string, string> = {
  booking_com: "B.",
  airbnb: "Ab",
  expedia: "Ex",
  hostelworld: "Hw",
};

const DEMO_GUESTS = [
  { name: "Sander Kruithof", email: "s.kruithof@ziggo.nl", country: "Netherlands" },
  { name: "Emilia Fjeldstad", email: "emilia.fjeldstad@gmail.com", country: "Norway" },
  { name: "Bruno Cavalcanti", email: "brunocav@uol.com.br", country: "Brazil" },
  { name: "Ciara Whelan", email: "ciara.whelan@gmail.com", country: "Ireland" },
];

function ChannexCard() {
  const status = useQuery(api.channex.status);
  const me = useQuery(api.users.me);
  const connect = useMutation(api.channex.connect);
  const syncNow = useMutation(api.channex.syncNow);
  const [busy, setBusy] = useState(false);

  if (status === undefined) return null;
  return (
    <div
      className="mb-8 flex flex-wrap items-center gap-4 rounded-xl2 border border-sand-200 bg-white p-5"
      style={{ boxShadow: "var(--shadow-diffuse)" }}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ocean-900 text-sm font-black text-sand-50">
        CX
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-bold">
          Channex live sync
          <Badge tone={status.connected ? (status.lastError ? "red" : "green") : "neutral"}>
            {status.connected ? (status.lastError ? "sync error" : "connected") : "not connected"}
          </Badge>
        </p>
        {status.connected ? (
          <p className="mt-0.5 text-xs text-ink-faint">
            Property <span className="num">{status.propertyId.slice(0, 8)}…</span> ·{" "}
            {status.mappedRoomTypes} room types mapped
            {status.lastSyncAt && ` · synced ${format(new Date(status.lastSyncAt), "d MMM HH:mm")}`}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-ink-faint">
            Creates the property, rooms and rates on Channex (staging) and starts
            two-way sync: bookings in, availability out.
          </p>
        )}
        {status.connected && status.lastError && (
          <p className="mt-1 truncate text-xs text-coral">{status.lastError}</p>
        )}
      </div>
      {status.connected ? (
        <Button
          variant="secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try { await syncNow({}); } finally { setBusy(false); }
          }}
        >
          <ArrowsClockwise size={16} weight="bold" className={busy ? "animate-spin" : ""} />
          Push availability & rates
        </Button>
      ) : me?.role === "admin" ? (
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try { await connect({}); } finally { setBusy(false); }
          }}
        >
          <Plugs size={16} weight="bold" /> Connect to Channex
        </Button>
      ) : (
        <span className="text-xs text-ink-faint">Ask an admin to connect</span>
      )}
    </div>
  );
}

export default function ChannelsPage() {
  const channels = useQuery(api.channels.list);
  const requests = useQuery(api.channels.requests, {});
  const rooms = useQuery(api.inventory.listRooms);
  const roomTypes = useQuery(api.inventory.listRoomTypes);
  const beds = useQuery(api.inventory.listBeds);
  const simulate = useMutation(api.channels.simulateIncoming);
  const accept = useMutation(api.channels.accept);
  const reject = useMutation(api.channels.reject);

  const [acceptingId, setAcceptingId] = useState<Id<"channelRequests"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const acceptingRequest = requests?.find((r) => r._id === acceptingId);

  async function handleSimulate() {
    if (!channels || channels.length === 0) return;
    setSimulating(true);
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const guest = DEMO_GUESTS[Math.floor(Math.random() * DEMO_GUESTS.length)];
    const inDays = 3 + Math.floor(Math.random() * 14);
    const nights = 3 + Math.floor(Math.random() * 7);
    const arrival = new Date();
    arrival.setDate(arrival.getDate() + inDays);
    const departure = new Date(arrival);
    departure.setDate(departure.getDate() + nights);
    const dorm = Math.random() < 0.5;
    try {
      await simulate({
        channelId: channel._id,
        payload: {
          ota_reservation_code: `${CHANNEL_GLYPH[channel.type].toUpperCase().replace(".", "")}-${Math.floor(Math.random() * 9e9 + 1e9)}`,
          guest_name: guest.name,
          guest_email: guest.email,
          guest_country: guest.country,
          arrival_date: format(arrival, "yyyy-MM-dd"),
          departure_date: format(departure, "yyyy-MM-dd"),
          room_type: dorm ? "Surf Dorm" : "Ocean Double",
          occupancy: dorm ? 1 : 2,
          total_price: dorm ? nights * 18 : nights * 55,
          currency: "EUR",
        },
      });
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Channel manager</h1>
          <p className="mt-1 text-sm text-ink-faint">
            One inbox for every platform. Accept a request to drop it straight onto the calendar.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void handleSimulate()} disabled={simulating}>
          <ArrowsClockwise size={16} weight="bold" className={simulating ? "animate-spin" : ""} />
          Simulate incoming booking
        </Button>
      </header>

      <ChannexCard />

      {/* Channel cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {channels === undefined ? (
          <SkeletonRows count={1} />
        ) : (
          channels.map((channel) => (
            <div
              key={channel._id}
              className="flex items-center gap-4 rounded-xl2 border border-sand-200 bg-white p-5"
              style={{ boxShadow: "var(--shadow-diffuse)" }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ocean-900 text-sm font-black text-sand-50">
                {CHANNEL_GLYPH[channel.type]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{channel.name}</p>
                <p className="text-xs text-ink-faint">
                  {channel.lastSyncAt
                    ? `Synced ${format(new Date(channel.lastSyncAt), "d MMM HH:mm")}`
                    : "Never synced"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge tone={STATUS_TONE[channel.status]}>
                  {channel.status === "mock" ? "Sandbox" : channel.status}
                </Badge>
                {channel.pendingCount > 0 && (
                  <span className="num rounded-full bg-dune/15 px-2 py-0.5 text-[11px] font-bold text-[#8a6420]">
                    {channel.pendingCount} pending
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-faint">
        <Plugs size={13} />
        Running on the sandbox adapter — payloads follow the Channex.io webhook shape, so the live
        integration swaps in without touching this screen.
      </p>

      {/* Request inbox */}
      <div className="mt-10">
        <SectionTitle>Request inbox</SectionTitle>
        <div className="overflow-hidden rounded-xl2 border border-sand-200 bg-white" style={{ boxShadow: "var(--shadow-diffuse)" }}>
          {requests === undefined ? (
            <div className="p-4">
              <SkeletonRows count={3} />
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<Tray size={22} weight="duotone" />}
              title="Inbox zero"
              hint="Incoming OTA bookings, changes and cancellations will land here."
            />
          ) : (
            <ul className="divide-y divide-sand-100">
              {requests.map((request) => (
                <li
                  key={request._id}
                  className={cx(
                    "flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4",
                    request.status !== "pending" && "opacity-60",
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sand-100 text-xs font-black text-ink-soft">
                    {CHANNEL_GLYPH[request.channelType ?? ""] ?? "?"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">
                      {request.payload.guest_name}
                      <span className="ml-2 font-normal text-ink-faint">
                        {request.payload.guest_country}
                      </span>
                    </p>
                    <p className="num mt-0.5 text-xs text-ink-faint">
                      {request.payload.arrival_date} → {request.payload.departure_date} ·{" "}
                      {request.payload.room_type} · {request.payload.occupancy} pax ·{" "}
                      {eur(request.payload.total_price)}
                    </p>
                    <p className="num text-[11px] text-sand-500">{request.payload.ota_reservation_code}</p>
                  </div>
                  <Badge
                    tone={
                      request.type === "cancellation"
                        ? "red"
                        : request.type === "modification"
                          ? "amber"
                          : "ocean"
                    }
                  >
                    {request.type.replace("_", " ")}
                  </Badge>
                  {request.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => { setError(null); setAcceptingId(request._id); }}>
                        <Check size={14} weight="bold" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void reject({ requestId: request._id })}
                      >
                        <X size={14} weight="bold" /> Reject
                      </Button>
                    </div>
                  ) : (
                    <Badge tone={STATUS_TONE[request.status]}>{request.status}</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Accept → choose room */}
      <Drawer
        open={acceptingId !== null}
        onClose={() => setAcceptingId(null)}
        title="Assign a room"
      >
        {acceptingRequest && (
          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const value = String(form.get("slot"));
              const [roomId, bedId] = value.split("|");
              setError(null);
              try {
                await accept({
                  requestId: acceptingRequest._id,
                  roomId: roomId as Id<"rooms">,
                  bedId: bedId ? (bedId as Id<"beds">) : undefined,
                });
                setAcceptingId(null);
              } catch (err) {
                setError(err instanceof Error ? err.message.replace(/^.*Uncaught Error:\s*/, "") : "Failed");
              }
            }}
          >
            <div className="rounded-xl border border-ocean-200 bg-ocean-50 px-4 py-3 text-sm">
              <p className="font-semibold text-ocean-800">{acceptingRequest.payload.guest_name}</p>
              <p className="num mt-0.5 text-ocean-700">
                {acceptingRequest.payload.arrival_date} → {acceptingRequest.payload.departure_date} ·
                requested "{acceptingRequest.payload.room_type}"
              </p>
            </div>
            <Field label="Room / bed">
              <Select name="slot" required>
                {rooms?.map((room) => {
                  const type = roomTypes?.find((t) => t._id === room.roomTypeId);
                  if (type?.mode === "dorm") {
                    return beds
                      ?.filter((b) => b.roomId === room._id)
                      .map((bed) => (
                        <option key={bed._id} value={`${room._id}|${bed._id}`}>
                          {room.name} — {bed.label}
                        </option>
                      ));
                  }
                  return (
                    <option key={room._id} value={room._id}>
                      {room.name} ({type?.name})
                    </option>
                  );
                })}
              </Select>
            </Field>
            {error && (
              <p className="rounded-xl border border-coral/25 bg-coral/10 px-3.5 py-2.5 text-sm text-coral">
                {error}
              </p>
            )}
            <Button type="submit">Confirm & create booking</Button>
          </form>
        )}
      </Drawer>
    </div>
  );
}
