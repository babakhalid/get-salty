import { useRef, useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { addDays, format } from "date-fns";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  CheckCircle,
  Users,
  Waves,
} from "@phosphor-icons/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Button,
  Field,
  Input,
  Select,
  SkeletonRows,
  Textarea,
  cx,
} from "../components/ui";
import { eur, prettyDate } from "../lib/format";

type Confirmation = {
  portalToken: string;
  reservationCode: string;
  totalAmount: number;
  nights: number;
  roomTypeName: string;
};

export default function BookPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [checkIn, setCheckIn] = useState(format(addDays(new Date(), 7), "yyyy-MM-dd"));
  const [checkOut, setCheckOut] = useState(format(addDays(new Date(), 14), "yyyy-MM-dd"));
  const [roomTypeId, setRoomTypeId] = useState<Id<"roomTypes"> | null>(null);
  const [packageId, setPackageId] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const scope = useRef<HTMLDivElement>(null);

  const datesValid = checkIn >= today && checkOut > checkIn;
  const availability = useQuery(
    api.publicBooking.availability,
    datesValid && !confirmation ? { checkIn, checkOut } : "skip",
  );
  const createRequest = useMutation(api.publicBooking.createRequest);

  useGSAP(
    () => {
      gsap.fromTo(
        ".book-item",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.55, ease: "expo.out", stagger: 0.07 },
      );
    },
    { scope, dependencies: [confirmation === null] },
  );

  const selectedType = availability?.roomTypes.find((t) => t.roomTypeId === roomTypeId);
  const selectedPackage = availability?.packages.find((p) => p.packageId === packageId);
  const servicesTotal = Object.entries(selectedServices).reduce((sum, [id, qty]) => {
    const service = availability?.services.find((s) => s.serviceId === id);
    return sum + (service ? service.price * qty : 0);
  }, 0);
  const total =
    (selectedPackage?.price ?? selectedType?.totalForStay ?? 0) + servicesTotal;

  function toggleService(serviceId: string) {
    setSelectedServices((prev) => {
      const next = { ...prev };
      if (next[serviceId]) delete next[serviceId];
      else next[serviceId] = 1;
      return next;
    });
  }

  function setServiceQty(serviceId: string, qty: number) {
    setSelectedServices((prev) => ({
      ...prev,
      [serviceId]: Math.max(1, Math.min(30, qty)),
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!roomTypeId) return;
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const result = await createRequest({
        checkIn,
        checkOut,
        roomTypeId,
        packageId: packageId ? (packageId as Id<"packages">) : undefined,
        services: Object.entries(selectedServices).map(([serviceId, qty]) => ({
          serviceId: serviceId as Id<"services">,
          qty,
        })),
        adults: Number(form.get("adults") ?? 1),
        children: Number(form.get("children") ?? 0),
        fullName: String(form.get("fullName") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? "") || undefined,
        country: String(form.get("country") ?? "") || undefined,
        surfLevel:
          (String(form.get("surfLevel")) as "beginner" | "intermediate" | "advanced") ||
          undefined,
        allergies: String(form.get("allergies") ?? "") || undefined,
        notes: String(form.get("notes") ?? "") || undefined,
      });
      setConfirmation(result);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace(/^.*Uncaught Error:\s*/, "").replace(/ at .*$/s, "")
          : "Something went wrong — please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Confirmation screen ──────────────────────────────────────────────
  if (confirmation) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-ocean-900 px-6">
        <div className="w-full max-w-md text-center text-sand-50">
          <CheckCircle size={52} weight="duotone" className="mx-auto text-ocean-300" />
          <h1 className="mt-5 text-3xl font-black tracking-tighter">
            Request received.
          </h1>
          <p className="mt-3 text-ocean-200">
            {confirmation.roomTypeName} · {confirmation.nights} night
            {confirmation.nights === 1 ? "" : "s"} ·{" "}
            <span className="num font-bold text-sand-50">{eur(confirmation.totalAmount)}</span>
          </p>
          <div className="mx-auto mt-5 inline-block rounded-xl border border-white/15 bg-white/10 px-5 py-3">
            <p className="text-[11px] uppercase tracking-wide text-ocean-300">
              Your reservation code
            </p>
            <p className="num mt-0.5 text-2xl font-black tracking-widest">
              {confirmation.reservationCode}
            </p>
          </div>
          <p className="mt-3 text-xs text-ocean-300">
            Quote this code + your phone number when you message or call us.
          </p>
          <p className="mt-4 text-sm text-ocean-200">
            The crew will confirm shortly. Meanwhile, set up your stay — surf
            level, food, extras — on your personal page:
          </p>
          <Link
            to={`/guest/${confirmation.portalToken}`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sand-50 px-5 py-2.5 font-semibold text-ocean-900 transition-transform active:scale-[0.98]"
          >
            Open my guest page <ArrowRight size={16} weight="bold" />
          </Link>
          <p className="mt-8 text-xs text-ocean-300">
            Keep that link — it's your key to your booking.
          </p>
        </div>
      </div>
    );
  }

  // ── Booking flow ─────────────────────────────────────────────────────
  return (
    <div ref={scope} className="min-h-[100dvh] bg-sand-50">
      {/* Hero */}
      <div className="bg-ocean-900 px-6 pb-14 pt-10 text-sand-50">
        <div className="mx-auto max-w-2xl">
          <div className="book-item flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10">
              <Waves size={20} weight="bold" />
            </span>
            <span className="font-black tracking-tight">Tamraght Surf House</span>
          </div>
          <h1 className="book-item mt-8 max-w-lg text-4xl font-black leading-[1.05] tracking-tighter">
            Pick your dates. We'll keep a bed warm.
          </h1>
          <p className="book-item mt-3 max-w-md text-ocean-200">
            Book direct — no middleman, best price, and the crew knows you're
            coming before you land.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 pb-20">
        {/* Step 1 — dates */}
        <section
          className="book-item -mt-7 rounded-xl2 border border-sand-200 bg-white p-6"
          style={{ boxShadow: "var(--shadow-lift)" }}
        >
          <h2 className="font-bold tracking-tight">When are you coming?</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Check-in">
              <Input
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </Field>
            <Field label="Check-out">
              <Input
                type="date"
                min={checkIn}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </Field>
          </div>
          {datesValid && availability && (
            <p className="num mt-3 text-sm text-ink-faint">
              {prettyDate(checkIn)} → {prettyDate(checkOut)} · {availability.nights}{" "}
              night{availability.nights === 1 ? "" : "s"}
            </p>
          )}
          {!datesValid && (
            <p className="mt-3 text-sm text-coral">Pick a future check-in and a later check-out.</p>
          )}
        </section>

        {/* Step 2 — room type */}
        <section className="book-item mt-8">
          <h2 className="mb-3 font-bold tracking-tight">Where do you want to sleep?</h2>
          {availability === undefined && datesValid ? (
            <SkeletonRows count={3} />
          ) : availability ? (
            <div className="flex flex-col gap-3">
              {availability.roomTypes.map((type) => {
                const soldOut = type.unitsLeft === 0;
                const selected = roomTypeId === type.roomTypeId;
                return (
                  <button
                    key={type.roomTypeId}
                    type="button"
                    disabled={soldOut}
                    onClick={() => {
                      setRoomTypeId(type.roomTypeId);
                      setPackageId("");
                    }}
                    className={cx(
                      "rounded-xl2 border bg-white p-5 text-left transition-all",
                      soldOut && "opacity-45",
                      selected
                        ? "border-ocean-500 shadow-[0_0_0_1px_var(--color-ocean-500)]"
                        : "border-sand-200 hover:border-sand-300 cursor-pointer",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold">{type.name}</p>
                        <p className="mt-0.5 text-sm text-ink-faint">{type.description}</p>
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
                          <Users size={13} />
                          {type.mode === "dorm"
                            ? "per bed · shared dorm"
                            : `sleeps up to ${type.capacity}`}
                          {" · "}
                          {soldOut ? (
                            <span className="font-semibold text-coral">full for these dates</span>
                          ) : (
                            <span className="font-semibold text-kelp">
                              {type.unitsLeft} left
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="num text-lg font-bold text-ocean-700">
                          {eur(type.pricePerNight)}
                        </p>
                        <p className="text-xs text-ink-faint">
                          /night{type.mode === "dorm" ? " per bed" : ""}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>

        {/* Step 3 — package */}
        {selectedType && availability && availability.packages.length > 0 && (
          <section className="book-item mt-8">
            <h2 className="mb-1 font-bold tracking-tight">Make it a surf week?</h2>
            <p className="mb-3 text-sm text-ink-faint">
              Packages sized exactly for your {availability.nights}-night stay.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setPackageId("")}
                className={cx(
                  "rounded-xl2 border bg-white p-4 text-left text-sm transition-all cursor-pointer",
                  packageId === ""
                    ? "border-ocean-500 shadow-[0_0_0_1px_var(--color-ocean-500)]"
                    : "border-sand-200 hover:border-sand-300",
                )}
              >
                <span className="font-bold">Room only</span>
                <span className="text-ink-faint"> — add lessons and extras later</span>
              </button>
              {availability.packages.map((pkg) => (
                <button
                  key={pkg.packageId}
                  type="button"
                  onClick={() => setPackageId(pkg.packageId)}
                  className={cx(
                    "rounded-xl2 border bg-white p-4 text-left transition-all cursor-pointer",
                    packageId === pkg.packageId
                      ? "border-ocean-500 shadow-[0_0_0_1px_var(--color-ocean-500)]"
                      : "border-sand-200 hover:border-sand-300",
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold">{pkg.name}</p>
                      <p className="mt-0.5 text-xs text-ink-faint">{pkg.description}</p>
                    </div>
                    <p className="num shrink-0 font-bold text-ocean-700">{eur(pkg.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step 4 — extra services (multiple) */}
        {selectedType && availability && availability.services.length > 0 && (
          <section className="book-item mt-8">
            <h2 className="mb-1 font-bold tracking-tight">Add extras</h2>
            <p className="mb-3 text-sm text-ink-faint">
              Pick as many as you like — transfers, meals, rentals.
            </p>
            <div className="flex flex-col gap-2">
              {availability.services.map((service) => {
                const qty = selectedServices[service.serviceId];
                const active = qty !== undefined;
                return (
                  <div
                    key={service.serviceId}
                    className={cx(
                      "flex items-center gap-3 rounded-xl2 border bg-white px-4 py-3 transition-all",
                      active
                        ? "border-ocean-500 shadow-[0_0_0_1px_var(--color-ocean-500)]"
                        : "border-sand-200 hover:border-sand-300",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleService(service.serviceId)}
                      className={cx(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer",
                        active
                          ? "border-ocean-600 bg-ocean-600 text-white"
                          : "border-sand-300 bg-white",
                      )}
                      aria-label={active ? `Remove ${service.name}` : `Add ${service.name}`}
                    >
                      {active && <CheckCircle size={13} weight="bold" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleService(service.serviceId)}
                      className="min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <p className="text-sm font-semibold">{service.name}</p>
                      <p className="text-xs text-ink-faint">
                        {eur(service.price)} {service.unit.replace("_", " ")}
                      </p>
                    </button>
                    {active && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setServiceQty(service.serviceId, qty - 1)}
                          className="h-7 w-7 rounded-lg border border-sand-200 text-sm font-bold text-ink-soft hover:bg-sand-100 cursor-pointer"
                        >
                          −
                        </button>
                        <span className="num w-7 text-center text-sm font-bold">{qty}</span>
                        <button
                          type="button"
                          onClick={() => setServiceQty(service.serviceId, qty + 1)}
                          className="h-7 w-7 rounded-lg border border-sand-200 text-sm font-bold text-ink-soft hover:bg-sand-100 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    )}
                    {active && (
                      <span className="num w-16 text-right text-sm font-bold text-ocean-700">
                        {eur(service.price * qty)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Step 5 — details */}
        {selectedType && (
          <section className="book-item mt-8">
            <h2 className="mb-3 font-bold tracking-tight">Who's coming?</h2>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 rounded-xl2 border border-sand-200 bg-white p-6"
              style={{ boxShadow: "var(--shadow-diffuse)" }}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full name">
                  <Input name="fullName" required placeholder="Your name" />
                </Field>
                <Field label="Email">
                  <Input name="email" type="email" required placeholder="you@example.com" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone / WhatsApp">
                  <Input name="phone" placeholder="Optional" />
                </Field>
                <Field label="Country">
                  <Input name="country" placeholder="Optional" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Adults">
                  <Input
                    name="adults"
                    type="number"
                    min={1}
                    max={selectedType.mode === "dorm" ? 1 : selectedType.capacity}
                    defaultValue={1}
                  />
                </Field>
                <Field label="Children">
                  <Input
                    name="children"
                    type="number"
                    min={0}
                    max={selectedType.mode === "dorm" ? 0 : selectedType.capacity - 1}
                    defaultValue={0}
                  />
                </Field>
              </div>
              {selectedType.mode === "dorm" && (
                <p className="rounded-xl bg-sand-100 px-3.5 py-2.5 text-xs text-ink-soft">
                  Dorm beds are booked per person — travelling together? Send one
                  request each and mention it in the notes; we'll put you side by side.
                </p>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Surf level">
                  <Select name="surfLevel" defaultValue="">
                    <option value="">Not sure yet</option>
                    <option value="beginner">Beginner — first waves</option>
                    <option value="intermediate">Intermediate — green waves</option>
                    <option value="advanced">Advanced — I charge</option>
                  </Select>
                </Field>
                <Field label="Allergies / diet">
                  <Input name="allergies" placeholder="e.g. vegetarian, nut allergy" />
                </Field>
              </div>
              <Field label="Anything else?">
                <Textarea name="notes" placeholder="Arrival time, travelling with friends, requests…" />
              </Field>

              <div className="mt-2 rounded-xl bg-ocean-50 px-4 py-3">
                <div className="flex items-center justify-between text-sm text-ocean-800">
                  <span className="font-semibold">
                    {selectedPackage ? selectedPackage.name : `${selectedType.name} · room only`}
                  </span>
                  <span className="num">{eur(selectedPackage?.price ?? selectedType.totalForStay)}</span>
                </div>
                {Object.entries(selectedServices).map(([id, qty]) => {
                  const service = availability?.services.find((s) => s.serviceId === id);
                  if (!service) return null;
                  return (
                    <div key={id} className="mt-1 flex items-center justify-between text-xs text-ocean-700">
                      <span>{service.name} ×{qty}</span>
                      <span className="num">{eur(service.price * qty)}</span>
                    </div>
                  );
                })}
                <div className="mt-2 flex items-center justify-between border-t border-ocean-200 pt-2">
                  <span className="text-sm font-bold text-ocean-900">Total</span>
                  <span className="num text-lg font-bold text-ocean-900">{eur(total)}</span>
                </div>
              </div>
              <p className="text-xs text-ink-faint">
                Nothing is charged now — the crew confirms your request and you
                pay at the house (cash, card or transfer).
              </p>

              {error && (
                <p className="rounded-xl border border-coral/25 bg-coral/10 px-3.5 py-2.5 text-sm text-coral">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={submitting} className="mt-1">
                {submitting ? "Sending…" : "Request my stay"}
              </Button>
            </form>
          </section>
        )}

        <p className="book-item mt-10 text-center text-xs text-ink-faint">
          Tamraght Surf House · Tamraght, Morocco · See you in the water.
        </p>
      </div>
    </div>
  );
}
