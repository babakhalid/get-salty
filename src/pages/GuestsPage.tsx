import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  CaretLeft,
  CaretRight,
  Copy,
  Check,
  FilePdf,
  ForkKnife,
  MagnifyingGlass,
  PencilSimple,
  UsersThree,
} from "@phosphor-icons/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Badge,
  Button,
  Drawer,
  EmptyState,
  Field,
  Input,
  Select,
  SkeletonRows,
  STATUS_TONE,
  Textarea,
  cx,
} from "../components/ui";
import { eur, prettyDate, SOURCE_LABELS, STATUS_LABELS } from "../lib/format";
import BookingDetailDrawer from "../components/calendar/BookingDetailDrawer";
import { downloadBookingConfirmation } from "../lib/bookingConfirmationPdf";

const PAGE_SIZE = 10;

export default function GuestsPage() {
  const [search, setSearchRaw] = useState("");
  const [page, setPage] = useState(0);
  const [openGuestId, setOpenGuestId] = useState<Id<"guests"> | null>(null);
  const guests = useQuery(api.guestDirectory.list, { search: search || undefined });

  const setSearch = (value: string) => {
    setSearchRaw(value);
    setPage(0);
  };

  const pageCount = guests ? Math.max(1, Math.ceil(guests.length / PAGE_SIZE)) : 1;
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = useMemo(
    () => guests?.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [guests, safePage],
  );

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Guest book</h1>
          <p className="mt-1 text-sm text-ink-faint">
            Everyone who ever stayed — click a guest for their full story.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <MagnifyingGlass
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, country…"
            className="pl-9"
          />
        </div>
      </header>

      <div
        className="overflow-hidden rounded-xl2 border border-sand-200 bg-white"
        style={{ boxShadow: "var(--shadow-diffuse)" }}
      >
        {guests === undefined ? (
          <div className="p-4">
            <SkeletonRows count={6} />
          </div>
        ) : guests.length === 0 ? (
          <EmptyState
            icon={<UsersThree size={22} weight="duotone" />}
            title={search ? "No guests match" : "No guests yet"}
            hint={
              search
                ? "Try another name, email or country."
                : "Guests appear here as soon as bookings come in."
            }
          />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3 font-semibold">Guest</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">Country</th>
                <th className="hidden px-5 py-3 font-semibold lg:table-cell">Surf level</th>
                <th className="px-5 py-3 text-right font-semibold">Stays</th>
                <th className="hidden px-5 py-3 text-right font-semibold sm:table-cell">Last stay</th>
                <th className="px-5 py-3 text-right font-semibold">Spent</th>
                <th className="px-5 py-3 text-right font-semibold">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {pageRows?.map((guest) => (
                <tr
                  key={guest.guestId}
                  onClick={() => setOpenGuestId(guest.guestId)}
                  className="cursor-pointer transition-colors hover:bg-sand-50"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ocean-100 text-[11px] font-bold text-ocean-800">
                        {guest.fullName
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-semibold">
                          <span className="truncate">{guest.fullName}</span>
                          {guest.inHouseNow && <Badge tone="green">In house</Badge>}
                          {guest.allergies && (
                            <ForkKnife size={13} className="shrink-0 text-dune" />
                          )}
                        </p>
                        <p className="truncate text-xs text-ink-faint">{guest.email ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-5 py-3 text-ink-soft md:table-cell">
                    {guest.country ?? "—"}
                  </td>
                  <td className="hidden px-5 py-3 capitalize text-ink-soft lg:table-cell">
                    {guest.surfLevel ?? "—"}
                  </td>
                  <td className="num px-5 py-3 text-right font-semibold">{guest.staysCount}</td>
                  <td className="num hidden px-5 py-3 text-right text-ink-soft sm:table-cell">
                    {guest.lastStay ? prettyDate(guest.lastStay) : "—"}
                  </td>
                  <td className="num px-5 py-3 text-right font-semibold">
                    {eur(guest.totalSpent)}
                  </td>
                  <td
                    className={cx(
                      "num px-5 py-3 text-right font-semibold",
                      guest.balance > 0.005 ? "text-coral" : "text-ink-faint",
                    )}
                  >
                    {guest.balance > 0.005 ? eur(guest.balance) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {/* Pagination */}
        {guests && guests.length > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sand-200 px-5 py-3">
            <p className="num text-xs text-ink-faint">
              {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, guests.length)} of{" "}
              {guests.length} guests
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

      <GuestProfileDrawer guestId={openGuestId} onClose={() => setOpenGuestId(null)} />
    </div>
  );
}

function GuestProfileDrawer({
  guestId,
  onClose,
}: {
  guestId: Id<"guests"> | null;
  onClose: () => void;
}) {
  const profile = useQuery(
    api.guestDirectory.profile,
    guestId ? { guestId } : "skip",
  );
  const updateGuest = useMutation(api.bookings.updateGuest);
  const [editing, setEditing] = useState(false);
  const [openBookingId, setOpenBookingId] = useState<Id<"bookings"> | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  if (!guestId) return null;
  const guest = profile?.guest;

  return (
    <>
      <Drawer open onClose={onClose} title={guest?.fullName ?? "Guest"} wide>
        {profile === undefined ? (
          <SkeletonRows count={6} />
        ) : profile === null || !guest ? (
          <p className="text-sm text-ink-faint">Guest not found.</p>
        ) : (
          <div className="flex flex-col gap-7">
            {/* Lifetime stats — dividers, no boxes */}
            <div className="grid grid-cols-4 divide-x divide-sand-200 rounded-xl2 border border-sand-200 bg-white py-4">
              {[
                { label: "Stays", value: String(profile.stats.stays) },
                { label: "Nights", value: String(profile.stats.nights) },
                { label: "Lifetime spend", value: eur(profile.stats.lifetimeSpend) },
                {
                  label: "Open balance",
                  value: profile.stats.balance > 0.005 ? eur(profile.stats.balance) : "—",
                  danger: profile.stats.balance > 0.005,
                },
              ].map((stat) => (
                <div key={stat.label} className="px-4 text-center">
                  <p
                    className={cx(
                      "num text-xl font-bold",
                      stat.danger && "text-coral",
                    )}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-faint">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Profile */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold">Profile</h3>
                <Button size="sm" variant="secondary" onClick={() => setEditing((e) => !e)}>
                  <PencilSimple size={14} /> {editing ? "Close" : "Edit"}
                </Button>
              </div>
              {editing ? (
                <form
                  className="flex flex-col gap-4 rounded-xl2 border border-sand-200 bg-white p-5"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    await updateGuest({
                      guestId,
                      fullName: String(form.get("fullName")),
                      email: String(form.get("email")) || undefined,
                      phone: String(form.get("phone")) || undefined,
                      country: String(form.get("country")) || undefined,
                      surfLevel:
                        (String(form.get("surfLevel")) as
                          | "beginner"
                          | "intermediate"
                          | "advanced") || undefined,
                      allergies: String(form.get("allergies")),
                      notes: String(form.get("notes")),
                    });
                    setEditing(false);
                  }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Full name">
                      <Input name="fullName" defaultValue={guest.fullName} required />
                    </Field>
                    <Field label="Email">
                      <Input name="email" type="email" defaultValue={guest.email} />
                    </Field>
                    <Field label="Phone">
                      <Input name="phone" defaultValue={guest.phone} />
                    </Field>
                    <Field label="Country">
                      <Input name="country" defaultValue={guest.country} />
                    </Field>
                    <Field label="Surf level">
                      <Select name="surfLevel" defaultValue={guest.surfLevel ?? ""}>
                        <option value="">Unknown</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </Select>
                    </Field>
                    <Field label="Allergies / diet">
                      <Input name="allergies" defaultValue={guest.allergies} />
                    </Field>
                  </div>
                  <Field label="Staff notes">
                    <Textarea name="notes" defaultValue={guest.notes} />
                  </Field>
                  <Button type="submit" className="self-start">
                    Save profile
                  </Button>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl2 border border-sand-200 bg-white p-5 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-xs text-ink-faint">Email</p>
                    <p className="mt-0.5 break-all font-semibold">{guest.email ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-faint">Phone</p>
                    <p className="mt-0.5 font-semibold">{guest.phone ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-faint">Country</p>
                    <p className="mt-0.5 font-semibold">{guest.country ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-faint">Surf level</p>
                    <p className="mt-0.5 font-semibold capitalize">{guest.surfLevel ?? "Unknown"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-ink-faint">Allergies / diet</p>
                    <p className="mt-0.5 font-semibold">{guest.allergies || "None"}</p>
                  </div>
                  {guest.notes && (
                    <div className="col-span-2 md:col-span-3">
                      <p className="text-xs text-ink-faint">Staff notes</p>
                      <p className="mt-0.5 text-ink-soft">{guest.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Booking history */}
            <section>
              <h3 className="mb-2 text-sm font-bold">
                Stay history
                <span className="num ml-2 font-normal text-ink-faint">
                  {profile.history.length}
                </span>
              </h3>
              {profile.history.length === 0 ? (
                <p className="rounded-xl2 border border-sand-200 bg-white px-5 py-6 text-sm text-ink-faint">
                  No bookings yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {profile.history.map((stay) => (
                    <li
                      key={stay.bookingId}
                      className="rounded-xl2 border border-sand-200 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <button
                          onClick={() => setOpenBookingId(stay.bookingId)}
                          className="num text-sm font-bold text-ocean-700 hover:underline cursor-pointer"
                        >
                          {prettyDate(stay.checkIn)} → {prettyDate(stay.checkOut)}
                        </button>
                        <span className="text-sm text-ink-soft">
                          {stay.roomName}
                          {stay.bedLabel ? ` · ${stay.bedLabel}` : ""}
                        </span>
                        <Badge tone={STATUS_TONE[stay.status]}>
                          {STATUS_LABELS[stay.status]}
                        </Badge>
                        <Badge>{SOURCE_LABELS[stay.source]}</Badge>
                        <span className="ml-auto flex items-center gap-3 text-sm">
                          {stay.activitiesCount > 0 && (
                            <span className="num text-xs text-ink-faint">
                              {stay.activitiesCount} activities
                            </span>
                          )}
                          <span className="num font-bold">{eur(stay.totalAmount)}</span>
                          {stay.balance > 0.005 && (
                            <span className="num text-xs font-semibold text-coral">
                              {eur(stay.balance)} due
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-4">
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(
                              `${window.location.origin}/guest/${stay.portalToken}`,
                            );
                            setCopiedToken(stay.portalToken);
                            setTimeout(() => setCopiedToken(null), 1500);
                          }}
                          className="flex items-center gap-1 text-xs font-semibold text-ink-faint transition-colors hover:text-ocean-700 cursor-pointer"
                        >
                          {copiedToken === stay.portalToken ? (
                            <>
                              <Check size={12} weight="bold" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={12} /> Portal link
                            </>
                          )}
                        </button>
                        <button
                          onClick={() =>
                            downloadBookingConfirmation({
                              guestName: guest.fullName,
                              guestCountry: guest.country,
                              reservationCode: stay.reservationCode,
                              bookingDate: stay.createdAt,
                              roomName: stay.roomName,
                              roomTypeName: stay.roomTypeName,
                              packageName: stay.packageName,
                              guests: stay.adults + stay.children,
                              checkIn: stay.checkIn,
                              checkOut: stay.checkOut,
                              total: stay.totalAmount,
                              paid: stay.paid,
                            })
                          }
                          className="flex items-center gap-1 text-xs font-semibold text-ink-faint transition-colors hover:text-ocean-700 cursor-pointer"
                        >
                          <FilePdf size={12} weight="duotone" /> Confirmation PDF
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </Drawer>

      <BookingDetailDrawer
        bookingId={openBookingId}
        onClose={() => setOpenBookingId(null)}
      />
    </>
  );
}
