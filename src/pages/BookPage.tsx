import { useRef, useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { addDays, format } from "date-fns";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowLeft,
  ArrowRight,
  Bank,
  Check,
  CheckCircle,
  CreditCard,
  LockSimple,
  Users,
} from "@phosphor-icons/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button, Field, Input, Select, SkeletonRows, Textarea, cx } from "../components/ui";
import { formatCardNumber, formatExpiry } from "../components/portal/PaymentSection";
import { eur, prettyDate } from "../lib/format";

const STEPS = ["Dates", "Room", "Extras", "Details", "Payment"] as const;

type Confirmation = {
  portalToken: string;
  reservationCode: string;
  totalAmount: number;
  nights: number;
  roomTypeName: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BookPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [step, setStep] = useState(0);
  const [checkIn, setCheckIn] = useState(format(addDays(new Date(), 7), "yyyy-MM-dd"));
  const [checkOut, setCheckOut] = useState(format(addDays(new Date(), 14), "yyyy-MM-dd"));
  const [roomId, setRoomId] = useState<Id<"rooms"> | null>(null);
  const [packageId, setPackageId] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [details, setDetails] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    adults: 1,
    children: 0,
    surfLevel: "",
    allergies: "",
    notes: "",
  });
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [paidNow, setPaidNow] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const scope = useRef<HTMLDivElement>(null);

  const datesValid = checkIn >= today && checkOut > checkIn;
  const availability = useQuery(
    api.publicBooking.availability,
    datesValid && !finished ? { checkIn, checkOut } : "skip",
  );
  const createRequest = useMutation(api.publicBooking.createRequest);

  useGSAP(
    () => {
      gsap.fromTo(
        ".step-in",
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.45, ease: "expo.out", stagger: 0.05 },
      );
    },
    { scope, dependencies: [step, finished] },
  );

  const selectedRoom = availability?.rooms.find((r) => r.roomId === roomId);
  const selectedPackage = availability?.packages.find((p) => p.packageId === packageId);
  const servicesTotal = Object.entries(selectedServices).reduce((sum, [id, qty]) => {
    const service = availability?.services.find((s) => s.serviceId === id);
    return sum + (service ? service.price * qty : 0);
  }, 0);
  const stayTotal = selectedPackage?.price ?? selectedRoom?.totalForStay ?? 0;
  const total = stayTotal + servicesTotal;

  const detailsValid =
    details.fullName.trim().length >= 2 &&
    EMAIL_RE.test(details.email) &&
    details.adults >= 1 &&
    (selectedRoom
      ? selectedRoom.mode === "dorm"
        ? details.adults + details.children <= 1
        : details.adults + details.children <= selectedRoom.capacity
      : false);

  const canContinue = [
    datesValid && availability !== undefined,
    !!selectedRoom?.available,
    true, // extras are optional
    detailsValid && !submitting,
  ][step];

  function toggleService(serviceId: string) {
    setSelectedServices((prev) => {
      const next = { ...prev };
      if (next[serviceId]) delete next[serviceId];
      else next[serviceId] = 1;
      return next;
    });
  }
  function setServiceQty(serviceId: string, qty: number) {
    setSelectedServices((prev) => ({ ...prev, [serviceId]: Math.max(1, Math.min(30, qty)) }));
  }

  async function handleContinue() {
    setError(null);
    if (step < 3) {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    // step 3 → create the booking, then move to payment
    if (!roomId) return;
    setSubmitting(true);
    try {
      const result = await createRequest({
        checkIn,
        checkOut,
        roomId,
        packageId: packageId ? (packageId as Id<"packages">) : undefined,
        services: Object.entries(selectedServices).map(([serviceId, qty]) => ({
          serviceId: serviceId as Id<"services">,
          qty,
        })),
        adults: details.adults,
        children: details.children,
        fullName: details.fullName,
        email: details.email,
        phone: details.phone || undefined,
        country: details.country || undefined,
        surfLevel:
          (details.surfLevel as "beginner" | "intermediate" | "advanced") || undefined,
        allergies: details.allergies || undefined,
        notes: details.notes || undefined,
      });
      setConfirmation(result);
      setStep(4);
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

  // ── Final confirmation screen ────────────────────────────────────────
  if (finished && confirmation) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-ocean-900 px-6">
        <div className="w-full max-w-md text-center text-sand-50">
          <CheckCircle size={52} weight="duotone" className="mx-auto text-ocean-300" />
          <h1 className="mt-5 text-3xl font-black tracking-tighter">
            {paidNow ? "Booked & paid." : "Request received."}
          </h1>
          <p className="mt-3 text-ocean-200">
            {confirmation.roomTypeName} · {confirmation.nights} night
            {confirmation.nights === 1 ? "" : "s"} ·{" "}
            <span className="num font-bold text-sand-50">{eur(confirmation.totalAmount)}</span>
          </p>
          {paidNow !== null && paidNow > 0 && (
            <p className="mt-2 text-sm text-ocean-200">
              Paid now (simulation):{" "}
              <span className="num font-bold text-sand-50">{eur(paidNow)}</span>
              {paidNow < confirmation.totalAmount && (
                <> · balance {eur(confirmation.totalAmount - paidNow)}</>
              )}
            </p>
          )}
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
          <Link
            to={`/guest/${confirmation.portalToken}`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sand-50 px-5 py-2.5 font-semibold text-ocean-900 transition-transform active:scale-[0.98]"
          >
            Open my guest page <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div ref={scope} className="min-h-[100dvh] bg-sand-50 pb-28 lg:pb-16">
      {/* Hero */}
      <div className="bg-ocean-900 px-6 pb-10 pt-8 text-sand-50">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-sand-50/90"
          >
            <img src="/mascot.png" alt="" className="h-8 w-8 object-contain" />
          </Link>
          <div>
            <p className="font-black tracking-tight">Get Salty Morocco</p>
            <p className="text-xs text-ocean-200">
              Book your stay · no charge until confirmed
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="mx-auto mt-6 flex max-w-5xl items-center gap-1 overflow-x-auto">
          {STEPS.map((label, i) => (
            <button
              key={label}
              disabled={i >= step || step === 4}
              onClick={() => setStep(i)}
              className={cx(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                i === step
                  ? "bg-sand-50 text-ocean-900"
                  : i < step && step < 4
                    ? "bg-white/10 text-sand-50 cursor-pointer hover:bg-white/20"
                    : "text-ocean-300",
              )}
            >
              <span
                className={cx(
                  "num flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                  i < step
                    ? "bg-kelp text-sand-50"
                    : i === step
                      ? "bg-ocean-700 text-sand-50"
                      : "bg-white/10",
                )}
              >
                {i < step ? <Check size={10} weight="bold" /> : i + 1}
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 pt-8 sm:px-6 lg:grid-cols-[1fr_320px]">
        {/* ── Step content ── */}
        <div className="min-w-0">
          {step === 0 && (
            <section
              className="step-in rounded-xl2 border border-sand-200 bg-white p-6"
              style={{ boxShadow: "var(--shadow-diffuse)" }}
            >
              <h2 className="font-bold tracking-tight">When are you coming?</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Field label="Check-in">
                  <Input
                    type="date"
                    min={today}
                    value={checkIn}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      setRoomId(null);
                      setPackageId("");
                    }}
                  />
                </Field>
                <Field label="Check-out">
                  <Input
                    type="date"
                    min={checkIn}
                    value={checkOut}
                    onChange={(e) => {
                      setCheckOut(e.target.value);
                      setRoomId(null);
                      setPackageId("");
                    }}
                  />
                </Field>
              </div>
              {!datesValid && (
                <p className="mt-3 text-sm text-coral">
                  Pick a future check-in and a later check-out.
                </p>
              )}
            </section>
          )}

          {step === 1 && (
            <section className="step-in">
              <h2 className="mb-3 font-bold tracking-tight">Where do you want to sleep?</h2>
              {availability === undefined ? (
                <SkeletonRows count={3} />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {availability.rooms.map((room) => {
                    const soldOut = !room.available;
                    const selected = roomId === room.roomId;
                    return (
                      <button
                        key={room.roomId}
                        type="button"
                        disabled={soldOut}
                        onClick={() => {
                          setRoomId(room.roomId);
                          setPackageId("");
                        }}
                        className={cx(
                          "overflow-hidden rounded-xl2 border bg-white text-left transition-all",
                          soldOut && "opacity-50",
                          selected
                            ? "border-ocean-500 shadow-[0_0_0_2px_var(--color-ocean-500)]"
                            : "border-sand-200 hover:border-sand-300 cursor-pointer",
                        )}
                        style={{ boxShadow: selected ? undefined : "var(--shadow-diffuse)" }}
                      >
                        {room.imageUrl && (
                          <div className="relative">
                            <img
                              src={room.imageUrl}
                              alt={room.name}
                              loading="lazy"
                              className="h-40 w-full object-cover"
                            />
                            {soldOut && (
                              <span className="absolute inset-0 flex items-center justify-center bg-ink/45 text-sm font-bold text-sand-50">
                                Booked for these dates
                              </span>
                            )}
                            {selected && (
                              <span className="absolute right-2 top-2 rounded-full bg-ocean-600 px-2.5 py-1 text-[11px] font-black text-sand-50">
                                Selected
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-3 p-4">
                          <div className="min-w-0">
                            <p className="font-bold">{room.name}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-ink-faint">
                              {room.description}
                            </p>
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
                              <Users size={13} />
                              {room.mode === "dorm" ? "per bed · shared" : `sleeps ${room.capacity}`}
                              <span className="text-ink-faint">· {room.typeName}</span>
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="num text-lg font-bold text-ocean-700">
                              {eur(room.pricePerNight)}
                            </p>
                            <p className="text-[11px] text-ink-faint">/night</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {step === 2 && availability && (
            <section className="step-in flex flex-col gap-8">
              {availability.packages.length > 0 && (
                <div>
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
                </div>
              )}

              {availability.services.length > 0 && (
                <div>
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
                            {active && <Check size={13} weight="bold" />}
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
                </div>
              )}
            </section>
          )}

          {step === 3 && selectedRoom && (
            <section
              className="step-in rounded-xl2 border border-sand-200 bg-white p-6"
              style={{ boxShadow: "var(--shadow-diffuse)" }}
            >
              <h2 className="font-bold tracking-tight">Who's coming?</h2>
              <p className="mt-1 text-xs text-ink-faint">Fields marked * are required.</p>
              <div className="mt-5 flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Full name *"
                    error={
                      details.fullName && details.fullName.trim().length < 2
                        ? "Too short"
                        : undefined
                    }
                  >
                    <Input
                      value={details.fullName}
                      onChange={(e) => setDetails({ ...details, fullName: e.target.value })}
                      placeholder="Your name"
                    />
                  </Field>
                  <Field
                    label="Email *"
                    error={
                      details.email && !EMAIL_RE.test(details.email)
                        ? "Doesn't look like an email"
                        : undefined
                    }
                  >
                    <Input
                      type="email"
                      value={details.email}
                      onChange={(e) => setDetails({ ...details, email: e.target.value })}
                      placeholder="you@example.com"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Phone / WhatsApp">
                    <Input
                      value={details.phone}
                      onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                      placeholder="Optional"
                    />
                  </Field>
                  <Field label="Country">
                    <Input
                      value={details.country}
                      onChange={(e) => setDetails({ ...details, country: e.target.value })}
                      placeholder="Optional"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Adults *">
                    <Input
                      type="number"
                      min={1}
                      max={selectedRoom.mode === "dorm" ? 1 : selectedRoom.capacity}
                      value={details.adults}
                      onChange={(e) => setDetails({ ...details, adults: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Children">
                    <Input
                      type="number"
                      min={0}
                      max={
                        selectedRoom.mode === "dorm"
                          ? 0
                          : Math.max(0, selectedRoom.capacity - details.adults)
                      }
                      value={details.children}
                      onChange={(e) =>
                        setDetails({ ...details, children: Number(e.target.value) })
                      }
                    />
                  </Field>
                </div>
                {details.adults + details.children >
                  (selectedRoom.mode === "dorm" ? 1 : selectedRoom.capacity) && (
                  <p className="rounded-xl border border-coral/25 bg-coral/10 px-3.5 py-2.5 text-sm text-coral">
                    {selectedRoom.mode === "dorm"
                      ? "Dorm beds are booked per person — one request per bed."
                      : `${selectedRoom.name} sleeps up to ${selectedRoom.capacity}.`}
                  </p>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Surf level">
                    <Select
                      value={details.surfLevel}
                      onChange={(e) => setDetails({ ...details, surfLevel: e.target.value })}
                    >
                      <option value="">Not sure yet</option>
                      <option value="beginner">Beginner — first waves</option>
                      <option value="intermediate">Intermediate — green waves</option>
                      <option value="advanced">Advanced — I charge</option>
                    </Select>
                  </Field>
                  <Field label="Allergies / diet">
                    <Input
                      value={details.allergies}
                      onChange={(e) => setDetails({ ...details, allergies: e.target.value })}
                      placeholder="e.g. vegetarian, nut allergy"
                    />
                  </Field>
                </div>
                <Field label="Anything else?">
                  <Textarea
                    value={details.notes}
                    onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                    placeholder="Arrival time, travelling with friends, requests…"
                  />
                </Field>
              </div>
            </section>
          )}

          {step === 4 && confirmation && (
            <PaymentStep
              confirmation={confirmation}
              onPaid={(amount) => {
                setPaidNow(amount);
                setFinished(true);
              }}
              onSkip={() => setFinished(true)}
            />
          )}

          {error && (
            <p className="mt-4 rounded-xl border border-coral/25 bg-coral/10 px-3.5 py-2.5 text-sm text-coral">
              {error}
            </p>
          )}

          {/* Desktop nav buttons */}
          {step < 4 && (
            <div className="mt-6 hidden items-center gap-3 lg:flex">
              {step > 0 && (
                <Button variant="secondary" onClick={() => setStep(step - 1)}>
                  <ArrowLeft size={15} weight="bold" /> Back
                </Button>
              )}
              <Button onClick={() => void handleContinue()} disabled={!canContinue}>
                {step === 3
                  ? submitting
                    ? "Creating booking…"
                    : "Continue to payment"
                  : "Continue"}
                {step < 3 && <ArrowRight size={15} weight="bold" />}
              </Button>
              {!canContinue && step === 1 && (
                <span className="text-xs text-ink-faint">
                  Select an available room to continue
                </span>
              )}
              {!canContinue && step === 3 && !submitting && (
                <span className="text-xs text-ink-faint">
                  Name and a valid email are required
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Sticky order summary (desktop) ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <OrderSummary
              checkIn={checkIn}
              checkOut={checkOut}
              nights={availability?.nights}
              room={selectedRoom}
              pkg={selectedPackage}
              services={availability?.services ?? []}
              selectedServices={selectedServices}
              servicesTotal={servicesTotal}
              total={total}
            />
          </div>
        </aside>
      </div>

      {/* Mobile bottom bar: total + continue */}
      {step < 4 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="rounded-xl border border-sand-200 p-2.5 text-ink-soft cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft size={16} weight="bold" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-ink-faint">Total</p>
              <p className="num text-lg font-black leading-tight">{eur(total)}</p>
            </div>
            <Button onClick={() => void handleContinue()} disabled={!canContinue}>
              {step === 3 ? (submitting ? "Creating…" : "To payment") : "Continue"}
              <ArrowRight size={15} weight="bold" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Order summary card ───────────────────────────────────────────────────

function OrderSummary({
  checkIn,
  checkOut,
  nights,
  room,
  pkg,
  services,
  selectedServices,
  servicesTotal,
  total,
}: {
  checkIn: string;
  checkOut: string;
  nights?: number;
  room?: { name: string; pricePerNight: number; totalForStay: number };
  pkg?: { name: string; price: number };
  services: { serviceId: string; name: string; price: number }[];
  selectedServices: Record<string, number>;
  servicesTotal: number;
  total: number;
}) {
  const serviceLines = Object.entries(selectedServices)
    .map(([id, qty]) => {
      const service = services.find((s) => s.serviceId === id);
      return service ? { name: service.name, qty, amount: service.price * qty } : null;
    })
    .filter(Boolean) as { name: string; qty: number; amount: number }[];

  return (
    <div
      className="rounded-xl2 border border-sand-200 bg-white p-5"
      style={{ boxShadow: "var(--shadow-diffuse)" }}
    >
      <h3 className="text-xs font-black uppercase tracking-wide text-ink-faint">Your stay</h3>
      <p className="num mt-2 text-sm font-semibold">
        {prettyDate(checkIn)} → {prettyDate(checkOut)}
        {nights ? <span className="text-ink-faint"> · {nights}n</span> : null}
      </p>

      <div className="mt-4 flex flex-col gap-2 border-t border-sand-100 pt-4 text-sm">
        {!room && <p className="text-ink-faint">No room selected yet.</p>}
        {room && pkg ? (
          <>
            <div className="flex justify-between gap-3">
              <span className="font-semibold">{pkg.name}</span>
              <span className="num font-semibold">{eur(pkg.price)}</span>
            </div>
            <p className="text-xs text-ink-faint">All-inclusive · staying in {room.name}</p>
          </>
        ) : room ? (
          <div className="flex justify-between gap-3">
            <span className="font-semibold">
              {room.name}
              <span className="block text-xs font-normal text-ink-faint">
                {eur(room.pricePerNight)} × {nights ?? "…"} nights
              </span>
            </span>
            <span className="num font-semibold">{eur(room.totalForStay)}</span>
          </div>
        ) : null}

        {serviceLines.map((line) => (
          <div key={line.name} className="flex justify-between gap-3 text-ink-soft">
            <span>
              {line.name} <span className="num text-xs text-ink-faint">×{line.qty}</span>
            </span>
            <span className="num">{eur(line.amount)}</span>
          </div>
        ))}
        {serviceLines.length > 0 && (
          <div className="flex justify-between gap-3 text-xs text-ink-faint">
            <span>Extras subtotal</span>
            <span className="num">{eur(servicesTotal)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-sand-200 pt-3">
        <span className="font-black">Total</span>
        <span className="num text-xl font-black text-ocean-800">{eur(total)}</span>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
        Nothing is charged until the crew confirms your request. Payment on the
        next step is a simulation.
      </p>
    </div>
  );
}

// ── Payment step (simulation, same rules as the guest portal) ────────────

function PaymentStep({
  confirmation,
  onPaid,
  onSkip,
}: {
  confirmation: Confirmation;
  onPaid: (amount: number) => void;
  onSkip: () => void;
}) {
  const payCard = useMutation(api.portal.simulateCardPayment);
  const declareTransfer = useMutation(api.portal.declareBankTransfer);
  const [method, setMethod] = useState<"card" | "transfer">("card");
  const [amount, setAmount] = useState(String(confirmation.totalAmount));
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountValid = Number(amount) >= 1 && Number(amount) <= confirmation.totalAmount;
  const digits = cardNumber.replace(/\D/g, "");
  const expiryValid = (() => {
    const m = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!m) return false;
    const month = Number(m[1]);
    if (month < 1 || month > 12) return false;
    return new Date(2000 + Number(m[2]), month, 0) >= new Date();
  })();
  const cardValid =
    digits.length === 16 &&
    cardName.trim().length >= 3 &&
    expiryValid &&
    /^\d{3,4}$/.test(cvc);

  async function handlePay() {
    setError(null);
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1800)); // fake gateway latency
    try {
      const result = await payCard({
        token: confirmation.portalToken,
        amount: Number(amount),
        cardLast4: digits.slice(-4),
      });
      onPaid(result.paid);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace(/^.*Uncaught Error:\s*/, "").replace(/ at .*$/s, "")
          : "Payment failed",
      );
      setProcessing(false);
    }
  }

  async function handleTransfer() {
    setError(null);
    try {
      await declareTransfer({ token: confirmation.portalToken, amount: Number(amount) });
      onPaid(0); // declared — the crew confirms receipt before it counts
    } catch {
      setError("Could not send — try again.");
    }
  }

  return (
    <section
      className="step-in rounded-xl2 border border-sand-200 bg-white p-6"
      style={{ boxShadow: "var(--shadow-diffuse)" }}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-bold tracking-tight">Payment</h2>
        <span className="rounded-full border border-dune/40 bg-dune/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#8a6420]">
          Simulation
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-faint">
        Your booking is registered — reservation{" "}
        <span className="num font-bold text-ocean-800">{confirmation.reservationCode}</span>.
        Secure your spot now or pay at the house.
      </p>

      <div className="mt-5 flex gap-2">
        {(
          [
            { key: "card", label: "Pay by card", icon: CreditCard },
            { key: "transfer", label: "Bank transfer", icon: Bank },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setMethod(key);
              setError(null);
            }}
            className={cx(
              "flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors cursor-pointer",
              method === key
                ? "border-ocean-500 bg-ocean-50 text-ocean-800"
                : "border-sand-200 bg-white text-ink-faint hover:border-sand-300",
            )}
          >
            <Icon size={16} weight="duotone" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <Field
          label={`Amount (EUR) — total ${eur(confirmation.totalAmount)}`}
          hint="Pay it all or just a deposit"
        >
          <Input
            type="number"
            min={1}
            max={confirmation.totalAmount}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>

        {method === "card" ? (
          <>
            <Field label="Card number" hint="Simulation — try 4242 4242 4242 4242">
              <Input
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                className="num"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              />
            </Field>
            <Field label="Name on card">
              <Input
                placeholder="As printed on the card"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Expiry">
                <Input
                  inputMode="numeric"
                  placeholder="MM/YY"
                  className="num"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                />
              </Field>
              <Field label="CVC">
                <Input
                  inputMode="numeric"
                  placeholder="123"
                  className="num"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </Field>
            </div>
            {error && (
              <p className="rounded-xl border border-coral/25 bg-coral/10 px-3.5 py-2.5 text-sm text-coral">
                {error}
              </p>
            )}
            <Button
              onClick={() => void handlePay()}
              disabled={!cardValid || !amountValid || processing}
              className="w-full"
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sand-50/40 border-t-sand-50" />
                  Processing…
                </span>
              ) : (
                <>
                  <LockSimple size={14} weight="bold" /> Pay{" "}
                  {amountValid ? eur(Number(amount)) : ""}
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-sand-200 bg-sand-50 p-4 text-sm">
              <p>
                <span className="text-xs text-ink-faint">Beneficiary </span>
                <span className="font-semibold">Get Salty Surf Camp SARL</span>
              </p>
              <p className="num mt-1">
                <span className="font-sans text-xs text-ink-faint">IBAN </span>
                <span className="font-semibold">MA64 0117 6400 0221 0000 5312 84</span>
              </p>
              <p className="mt-1">
                <span className="text-xs text-ink-faint">Reference </span>
                <span className="num font-bold text-ocean-700">
                  {confirmation.reservationCode}
                </span>
              </p>
            </div>
            {error && (
              <p className="rounded-xl border border-coral/25 bg-coral/10 px-3.5 py-2.5 text-sm text-coral">
                {error}
              </p>
            )}
            <Button
              variant="secondary"
              onClick={() => void handleTransfer()}
              disabled={!amountValid}
              className="w-full"
            >
              <Bank size={15} weight="duotone" /> I've made the transfer
            </Button>
          </>
        )}

        <button
          onClick={onSkip}
          className="text-center text-sm font-semibold text-ink-faint hover:text-ink cursor-pointer"
        >
          Skip — I'll pay at the house
        </button>
      </div>
    </section>
  );
}
