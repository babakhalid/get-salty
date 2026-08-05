import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { CONTACT, LANDING, type Locale, type PriceItem } from "../lib/landingContent";
import { cx } from "../components/ui";

gsap.registerPlugin(ScrollTrigger);

const LOCALES: Locale[] = ["en", "fr", "de", "ru"];

/* Placeholder gallery art — swap for real photos in public/gallery/ */
const GALLERY_GRADIENTS = [
  "linear-gradient(140deg, #7dc0c2 0%, #0f5c63 100%)",
  "linear-gradient(140deg, #e8b04b 0%, #a3906f 100%)",
  "linear-gradient(140deg, #4a9fa4 0%, #113b40 100%)",
  "linear-gradient(140deg, #d9ccb6 0%, #87755a 100%)",
  "linear-gradient(140deg, #2b8188 0%, #114a50 100%)",
];

function Kicker({ children }: { children: string }) {
  return (
    <p className="reveal text-xs font-black uppercase tracking-[0.2em] text-ocean-500">
      {children}
    </p>
  );
}

export default function LandingPage() {
  const [locale, setLocale] = useState<Locale>(
    () => (localStorage.getItem("gs-locale") as Locale) ?? "en",
  );
  const t = LANDING[locale];
  const scope = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<keyof typeof t.priceLists>("activities");

  useEffect(() => {
    localStorage.setItem("gs-locale", locale);
  }, [locale]);

  useGSAP(
    () => {
      gsap.fromTo(
        ".hero-in",
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.09 },
      );
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          },
        );
      });
      // slow gallery drift
      gsap.to(".gallery-track", {
        x: -320,
        duration: 26,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope, dependencies: [locale] },
  );

  return (
    <div ref={scope} className="bg-sand-50 text-ink">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ocean-900/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Get Salty Morocco" className="h-9 w-auto" />
            <span className="hidden text-xs font-medium text-ocean-200 sm:block">
              {t.topLocation}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-white/15 bg-white/5 p-0.5">
              {LOCALES.map((code) => (
                <button
                  key={code}
                  onClick={() => setLocale(code)}
                  className={cx(
                    "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase transition-colors cursor-pointer",
                    locale === code
                      ? "bg-sand-50 text-ocean-900"
                      : "text-ocean-200 hover:text-sand-50",
                  )}
                >
                  {code}
                </button>
              ))}
            </div>
            <Link
              to="/book"
              className="rounded-full bg-dune px-4 py-1.5 text-sm font-bold text-ink transition-transform active:scale-[0.97]"
            >
              {t.bookNow}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-ocean-900 text-sand-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-16 lg:grid-cols-[3fr_2fr] lg:pt-24">
          <div>
            <p className="hero-in inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-ocean-200">
              🌊 {t.chip}
            </p>
            <h1 className="hero-in mt-6 text-5xl font-black leading-[0.95] tracking-tighter sm:text-7xl">
              Get Salty
              <span className="block text-ocean-300">Morocco</span>
            </h1>
            <p className="hero-in mt-5 max-w-md text-lg font-semibold text-sand-100">
              {t.tagline}
            </p>
            <p className="hero-in mt-3 max-w-lg leading-relaxed text-ocean-200">
              {t.heroText}
            </p>
            <div className="hero-in mt-8 flex flex-wrap gap-3">
              <a
                href="#prices"
                className="rounded-xl bg-sand-50 px-5 py-2.5 font-bold text-ocean-900 transition-transform active:scale-[0.97]"
              >
                {t.viewPrices}
              </a>
              <a
                href="#package"
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 font-bold text-sand-50 transition-colors hover:bg-white/10"
              >
                {t.surfPackage}
              </a>
            </div>
          </div>
          <div className="hero-in hidden items-center justify-center lg:flex">
            <img src="/logo.png" alt="" className="w-64 opacity-90" />
          </div>
        </div>
        <svg
          className="pointer-events-none absolute -bottom-1 left-0 w-full text-sand-50"
          viewBox="0 0 1440 70"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0 70V35c120-30 240-30 360 0s240 30 360 0 240-30 360 0 240 30 360 0v35z" />
        </svg>
      </section>

      {/* ── Gallery strip ── */}
      <section className="overflow-hidden py-10">
        <div className="gallery-track flex w-max gap-4 px-5">
          {[...t.galleryLabels, ...t.galleryLabels].map((label, i) => (
            <div
              key={i}
              className="flex h-48 w-72 shrink-0 items-end rounded-xl2 p-4 text-sm font-bold text-sand-50 shadow-lg"
              style={{ background: GALLERY_GRADIENTS[i % GALLERY_GRADIENTS.length] }}
            >
              {label}
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-ink-faint">{t.galleryLocation}</p>
      </section>

      {/* ── The House ── */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1fr_1fr] lg:py-24">
        <div>
          <Kicker>{t.houseKicker}</Kicker>
          <h2 className="reveal mt-3 max-w-md text-4xl font-black leading-tight tracking-tighter">
            {t.houseTitle}
          </h2>
          <p className="reveal mt-6 leading-relaxed text-ink-soft">{t.houseP1}</p>
          <p className="reveal mt-4 leading-relaxed text-ink-soft">{t.houseP2}</p>
        </div>
        <div className="flex flex-col justify-center gap-6">
          <div className="reveal flex flex-wrap gap-2">
            {t.houseChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-sand-200 bg-white px-4 py-2 text-sm font-semibold"
              >
                {chip}
              </span>
            ))}
          </div>
          <p className="reveal rounded-xl2 border-l-4 border-ocean-500 bg-ocean-50 p-5 font-semibold text-ocean-900">
            {t.houseNote}
          </p>
        </div>
      </section>

      {/* ── Price list ── */}
      <section id="prices" className="bg-sand-100/70 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Kicker>{t.pricesKicker}</Kicker>
          <h2 className="reveal mt-3 text-4xl font-black tracking-tighter">{t.pricesTitle}</h2>

          <div className="reveal mt-8 flex flex-wrap gap-2">
            {(Object.keys(t.tabs) as (keyof typeof t.tabs)[]).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cx(
                  "rounded-full px-4 py-2 text-sm font-bold transition-colors cursor-pointer",
                  tab === key
                    ? "bg-ocean-800 text-sand-50"
                    : "border border-sand-300 bg-white text-ink-soft hover:border-sand-400",
                )}
              >
                {t.tabs[key]}
              </button>
            ))}
          </div>

          <div className="reveal mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {t.priceLists[tab].map((item: PriceItem, i: number) => (
              <div
                key={`${tab}-${i}`}
                className="flex items-center gap-4 rounded-xl2 border border-sand-200 bg-white p-4"
                style={{ boxShadow: "var(--shadow-diffuse)" }}
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{item.name}</p>
                  {item.note && <p className="text-xs text-ink-faint">{item.note}</p>}
                </div>
                <p className="num shrink-0 text-right text-sm font-black text-ocean-700">
                  {item.price.split("·").map((part, j) => (
                    <span key={j} className="block">
                      {part.trim()}
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured package ── */}
      <section id="package" className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
        <Kicker>{t.packageKicker}</Kicker>
        <h2 className="reveal mt-3 text-4xl font-black tracking-tighter">{t.packageTitle}</h2>
        <p className="reveal mt-2 max-w-md text-ink-soft">{t.packageSub}</p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
          {/* Private */}
          <div className="reveal flex flex-col rounded-xl2 border border-sand-200 bg-white p-6" style={{ boxShadow: "var(--shadow-diffuse)" }}>
            <span className="self-start rounded-full bg-sand-100 px-3 py-1 text-[10px] font-black tracking-widest text-ink-soft">
              {t.privateTag}
            </span>
            <p className="mt-4 text-3xl">🏄</p>
            <h3 className="mt-2 text-lg font-black tracking-tight">{t.pkgPrivateName}</h3>
            <p className="mt-1 text-sm text-ink-faint">{t.pkgPrivateDesc}</p>
            <p className="num mt-5 text-3xl font-black text-ocean-800">{t.pkgPrivatePrice}</p>
            <p className="text-xs text-ink-faint">{t.pkgSuffix}</p>
            <Link
              to="/book"
              className="mt-6 rounded-xl bg-ocean-800 px-4 py-2.5 text-center text-sm font-bold text-sand-50 transition-transform active:scale-[0.98]"
            >
              {t.bookPackage}
            </Link>
          </div>

          {/* Shared — highlighted */}
          <div className="reveal flex flex-col rounded-xl2 border-2 border-ocean-600 bg-ocean-900 p-6 text-sand-50" style={{ boxShadow: "var(--shadow-lift)" }}>
            <span className="self-start rounded-full bg-dune px-3 py-1 text-[10px] font-black tracking-widest text-ink">
              {t.sharedTag}
            </span>
            <p className="mt-4 text-3xl">🏄</p>
            <h3 className="mt-2 text-lg font-black tracking-tight">{t.pkgSharedName}</h3>
            <p className="mt-1 text-sm text-ocean-200">{t.pkgSharedDesc}</p>
            <p className="num mt-5 text-3xl font-black">{t.pkgSharedPrice}</p>
            <p className="text-xs text-ocean-300">{t.pkgSuffix}</p>
            <ul className="mt-5 flex flex-col gap-1.5 border-t border-white/10 pt-4 text-[13px] text-sand-100">
              {t.includes.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <Link
              to="/book"
              className="mt-6 rounded-xl bg-sand-50 px-4 py-2.5 text-center text-sm font-bold text-ocean-900 transition-transform active:scale-[0.98]"
            >
              {t.bookPackage}
            </Link>
          </div>

          {/* B&B + offer */}
          <div className="flex flex-col gap-6">
            <div className="reveal flex flex-col rounded-xl2 border border-sand-200 bg-white p-6" style={{ boxShadow: "var(--shadow-diffuse)" }}>
              <span className="self-start rounded-full bg-sand-100 px-3 py-1 text-[10px] font-black tracking-widest text-ink-soft">
                {t.flexTag}
              </span>
              <p className="mt-4 text-3xl">☀️</p>
              <h3 className="mt-2 text-lg font-black tracking-tight">{t.bnbName}</h3>
              <p className="mt-1 text-sm text-ink-faint">{t.bnbDesc}</p>
              <p className="num mt-5 text-3xl font-black text-ocean-800">{t.bnbPrice}</p>
              <p className="text-xs text-ink-faint">{t.bnbSuffix}</p>
            </div>
            <div className="reveal rounded-xl2 border border-dune/40 bg-dune/10 p-6">
              <p className="text-xs font-black uppercase tracking-widest text-[#8a6420]">
                {t.offerKicker}
              </p>
              <h3 className="mt-2 text-lg font-black tracking-tight">{t.offerTitle}</h3>
              <p className="mt-1 text-sm text-ink-soft">{t.offerText}</p>
              <a
                href={CONTACT.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block rounded-xl bg-kelp px-4 py-2 text-sm font-bold text-sand-50 transition-transform active:scale-[0.98]"
              >
                💬 {t.whatsapp}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Group rates ── */}
      <section className="bg-sand-100/70 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Kicker>{t.groupsKicker}</Kicker>
          <h2 className="reveal mt-3 text-4xl font-black tracking-tighter">{t.groupsTitle}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {t.groupTiers.map((tier) => (
              <div
                key={tier.pax}
                className="reveal rounded-xl2 border border-sand-200 bg-white p-6 text-center"
                style={{ boxShadow: "var(--shadow-diffuse)" }}
              >
                <p className="num text-lg font-bold text-ink-soft">{tier.pax}</p>
                <p className="num mt-1 text-4xl font-black text-ocean-700">
                  {tier.off}
                  <span className="ml-1 text-base font-bold text-ink-faint">off</span>
                </p>
                <p className="mt-3 text-xs leading-relaxed text-ink-faint">{tier.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <Kicker>{t.contactKicker}</Kicker>
            <h2 className="reveal mt-3 text-4xl font-black tracking-tighter">{t.contactTitle}</h2>
            <p className="reveal mt-3 max-w-md leading-relaxed text-ink-soft">{t.contactText}</p>
            <Link
              to="/book"
              className="reveal mt-7 inline-block rounded-xl bg-ocean-800 px-6 py-3 font-bold text-sand-50 transition-transform active:scale-[0.98]"
            >
              ✓ {t.bookYourStay}
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: "💬", label: t.labels.whatsapp, value: CONTACT.whatsapp, href: CONTACT.whatsappLink },
              { icon: "✉️", label: t.labels.email, value: CONTACT.email, href: `mailto:${CONTACT.email}` },
              { icon: "📸", label: t.labels.instagram, value: CONTACT.instagram, href: CONTACT.instagramLink },
              { icon: "📍", label: t.labels.location, value: CONTACT.location },
            ].map((card) => {
              const inner = (
                <>
                  <span className="text-2xl">{card.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink-faint">{card.label}</p>
                    <p className="truncate text-sm font-bold">{card.value}</p>
                  </div>
                </>
              );
              return card.href ? (
                <a
                  key={card.label}
                  href={card.href}
                  target={card.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="reveal flex items-center gap-3 rounded-xl2 border border-sand-200 bg-white p-4 transition-colors hover:border-ocean-300"
                  style={{ boxShadow: "var(--shadow-diffuse)" }}
                >
                  {inner}
                </a>
              ) : (
                <div
                  key={card.label}
                  className="reveal flex items-center gap-3 rounded-xl2 border border-sand-200 bg-white p-4"
                  style={{ boxShadow: "var(--shadow-diffuse)" }}
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-ocean-900 py-12 text-sand-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-center">
          <img src="/logo.png" alt="Get Salty Morocco" className="h-14 w-auto" />
          <p className="text-sm text-ocean-200">{t.footerAddress}</p>
          <p className="text-xs text-ocean-300">{t.rights}</p>
          <Link
            to="/dashboard"
            className="mt-2 text-[11px] font-semibold text-ocean-400 hover:text-ocean-200"
          >
            {t.staffLogin}
          </Link>
        </div>
      </footer>
    </div>
  );
}
