import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button, Drawer, Field, Input, Select, Textarea } from "../ui";
import { eur, prettyDate } from "../../lib/format";

export default function NewBookingDrawer({
  pending,
  onClose,
}: {
  pending: {
    roomId: Id<"rooms">;
    bedId?: Id<"beds">;
    checkIn: string;
    checkOut: string;
  } | null;
  onClose: () => void;
}) {
  const rooms = useQuery(api.inventory.listRooms);
  const roomTypes = useQuery(api.inventory.listRoomTypes);
  const beds = useQuery(api.inventory.listBeds);
  const packages = useQuery(api.catalog.listPackages);
  const createBooking = useMutation(api.bookings.create);

  const [guestMode, setGuestMode] = useState<"new" | "existing">("new");
  const [guestSearch, setGuestSearch] = useState("");
  const [guestId, setGuestId] = useState<Id<"guests"> | null>(null);
  const matches = useQuery(
    api.bookings.listGuests,
    guestMode === "existing" ? { search: guestSearch } : "skip",
  );

  const [packageId, setPackageId] = useState<string>("");
  const [total, setTotal] = useState<string>("");
  const [status, setStatus] = useState<"inquiry" | "confirmed">("confirmed");
  const [source, setSource] = useState<
    "direct" | "walk_in" | "booking_com" | "airbnb" | "expedia" | "hostelworld"
  >("direct");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pending) {
      setError(null);
      setPackageId("");
      setTotal("");
      setGuestMode("new");
      setGuestId(null);
      setGuestSearch("");
      setStatus("confirmed");
      setSource("direct");
    }
  }, [pending]);

  if (!pending) return null;

  const room = rooms?.find((r) => r._id === pending.roomId);
  const roomType = roomTypes?.find((t) => t._id === room?.roomTypeId);
  const bed = beds?.find((b) => b._id === pending.bedId);
  const nights = differenceInCalendarDays(
    parseISO(pending.checkOut),
    parseISO(pending.checkIn),
  );
  const selectedPackage = packages?.find((p) => p._id === packageId);
  const suggested =
    selectedPackage?.price ?? (roomType ? roomType.basePrice * nights : 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pending) return;
    setError(null);
    setSaving(true);
    const form = new FormData(e.currentTarget);
    try {
      await createBooking({
        guestId: guestMode === "existing" && guestId ? guestId : undefined,
        guest:
          guestMode === "new"
            ? {
                fullName: String(form.get("fullName") ?? ""),
                email: String(form.get("email") ?? "") || undefined,
                phone: String(form.get("phone") ?? "") || undefined,
                country: String(form.get("country") ?? "") || undefined,
                surfLevel:
                  (String(form.get("surfLevel")) as
                    | "beginner"
                    | "intermediate"
                    | "advanced") || undefined,
              }
            : undefined,
        roomId: pending.roomId,
        bedId: pending.bedId,
        packageId: packageId ? (packageId as Id<"packages">) : undefined,
        checkIn: pending.checkIn,
        checkOut: pending.checkOut,
        status,
        source,
        adults: Number(form.get("adults") ?? 1),
        children: Number(form.get("children") ?? 0),
        totalAmount: total === "" ? suggested : Number(total),
        notes: String(form.get("notes") ?? "") || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message.replace(/^.*Uncaught Error:\s*/, "") : "Could not create booking");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer open onClose={onClose} title="New booking">
      <div className="mb-5 rounded-xl border border-ocean-200 bg-ocean-50 px-4 py-3 text-sm">
        <p className="font-semibold text-ocean-800">
          {room?.name}
          {bed ? ` · ${bed.label}` : ""}
        </p>
        <p className="num mt-0.5 text-ocean-700">
          {prettyDate(pending.checkIn)} → {prettyDate(pending.checkOut)} ·{" "}
          {nights} night{nights === 1 ? "" : "s"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Guest */}
        <div className="flex gap-2">
          {(["new", "existing"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setGuestMode(mode)}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                guestMode === mode
                  ? "border-ocean-400 bg-ocean-50 text-ocean-800"
                  : "border-sand-200 bg-white text-ink-faint hover:border-sand-300"
              }`}
            >
              {mode === "new" ? "New guest" : "Returning guest"}
            </button>
          ))}
        </div>

        {guestMode === "new" ? (
          <>
            <Field label="Full name">
              <Input name="fullName" required placeholder="Guest name" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email">
                <Input name="email" type="email" placeholder="Optional" />
              </Field>
              <Field label="Phone">
                <Input name="phone" placeholder="Optional" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Country">
                <Input name="country" placeholder="e.g. France" />
              </Field>
              <Field label="Surf level">
                <Select name="surfLevel" defaultValue="">
                  <option value="">Unknown</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              </Field>
            </div>
          </>
        ) : (
          <Field label="Find guest">
            <Input
              value={guestSearch}
              onChange={(e) => setGuestSearch(e.target.value)}
              placeholder="Search by name or email…"
            />
            <div className="mt-1 max-h-40 overflow-y-auto rounded-xl border border-sand-200 bg-white">
              {matches?.length === 0 && (
                <p className="px-3 py-2.5 text-sm text-ink-faint">No matches.</p>
              )}
              {matches?.map((guest) => (
                <button
                  key={guest._id}
                  type="button"
                  onClick={() => setGuestId(guest._id)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                    guestId === guest._id ? "bg-ocean-50 font-semibold text-ocean-800" : "hover:bg-sand-100"
                  }`}
                >
                  <span>{guest.fullName}</span>
                  <span className="text-xs text-ink-faint">{guest.country}</span>
                </button>
              ))}
            </div>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Adults">
            <Input name="adults" type="number" min={1} defaultValue={1} />
          </Field>
          <Field label="Children">
            <Input name="children" type="number" min={0} defaultValue={0} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="confirmed">Confirmed</option>
              <option value="inquiry">Inquiry</option>
            </Select>
          </Field>
          <Field label="Source">
            <Select value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
              <option value="direct">Direct</option>
              <option value="walk_in">Walk-in</option>
              <option value="booking_com">Booking.com</option>
              <option value="airbnb">Airbnb</option>
              <option value="expedia">Expedia</option>
              <option value="hostelworld">Hostelworld</option>
            </Select>
          </Field>
        </div>

        <Field label="Package" hint="Pre-fills included lessons and services">
          <Select value={packageId} onChange={(e) => setPackageId(e.target.value)}>
            <option value="">À la carte (no package)</option>
            {packages
              ?.filter((p) => p.active)
              .map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — {eur(p.price)}
                </option>
              ))}
          </Select>
        </Field>

        <Field label={`Total (suggested ${eur(suggested)})`}>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder={String(suggested)}
          />
        </Field>

        <Field label="Notes">
          <Textarea name="notes" placeholder="Arrival time, requests…" />
        </Field>

        {error && (
          <p className="rounded-xl border border-coral/25 bg-coral/10 px-3.5 py-2.5 text-sm text-coral">
            {error}
          </p>
        )}

        <div className="mt-2 flex gap-3">
          <Button type="submit" disabled={saving || (guestMode === "existing" && !guestId)} className="flex-1">
            {saving ? "Booking…" : "Create booking"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
