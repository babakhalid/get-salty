import {
  forwardRef,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { X } from "@phosphor-icons/react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

// ── Buttons ────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-ocean-700 text-sand-50 hover:bg-ocean-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
  secondary:
    "bg-white text-ink border border-sand-200 hover:border-sand-300 hover:bg-sand-100",
  ghost: "text-ink-soft hover:bg-sand-100 hover:text-ink",
  danger: "bg-coral/10 text-coral border border-coral/25 hover:bg-coral/15",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: "sm" | "md";
  }
>(function Button({ variant = "primary", size = "md", className, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none cursor-pointer",
        size === "sm" ? "px-3 py-1.5 text-[13px]" : "px-4 py-2 text-sm",
        buttonStyles[variant],
        className,
      )}
      {...props}
    />
  );
});

// ── Form fields ────────────────────────────────────────────────────────

export function Field({
  label,
  children,
  error,
  hint,
  className,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={cx("flex flex-col gap-2", className)}>
      <span className="text-[13px] font-medium text-ink-soft">{label}</span>
      {children}
      {hint && !error && (
        <span className="text-xs text-ink-faint">{hint}</span>
      )}
      {error && <span className="text-xs text-coral">{error}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-sand-200 bg-white px-3.5 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-ocean-400 focus:outline-none disabled:bg-sand-100";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cx(inputBase, className)} {...props} />;
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cx(inputBase, "min-h-20 resize-y", className)}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cx(inputBase, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
});

// ── Badges & status ────────────────────────────────────────────────────

const badgeTones: Record<string, string> = {
  neutral: "bg-sand-100 text-ink-soft border-sand-200",
  ocean: "bg-ocean-50 text-ocean-700 border-ocean-200",
  amber: "bg-dune/10 text-[#8a6420] border-dune/30",
  green: "bg-kelp/10 text-kelp border-kelp/25",
  red: "bg-coral/10 text-coral border-coral/25",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}

export const STATUS_TONE: Record<string, keyof typeof badgeTones> = {
  inquiry: "amber",
  confirmed: "ocean",
  checked_in: "green",
  checked_out: "neutral",
  cancelled: "red",
  no_show: "red",
  pending: "amber",
  accepted: "green",
  approved: "green",
  rejected: "red",
  declined: "red",
  mock: "amber",
  connected: "green",
  error: "red",
  disabled: "neutral",
};

// ── Drawer (right side panel) ──────────────────────────────────────────

export function Drawer({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!open) return;
      gsap.fromTo(
        ".drawer-backdrop",
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: "power2.out" },
      );
      gsap.fromTo(
        ".drawer-panel",
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: "expo.out" },
      );
    },
    { scope, dependencies: [open] },
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div ref={scope} className="fixed inset-0 z-50">
      <div
        className="drawer-backdrop absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={cx(
          "drawer-panel absolute inset-y-0 right-0 flex w-full flex-col bg-sand-50 shadow-2xl",
          wide ? "max-w-2xl" : "max-w-lg",
        )}
      >
        <div className="flex items-center justify-between border-b border-sand-200 px-6 py-4">
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-sand-100 hover:text-ink cursor-pointer"
            aria-label="Close"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

// ── Empty / loading states ─────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sand-100 text-ink-faint">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        {hint && <p className="mt-1 text-sm text-ink-faint">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton h-12 w-full" />
      ))}
    </div>
  );
}

// ── Section heading (labels live outside containers) ──────────────────

export function SectionTitle({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h2 className="text-[15px] font-bold tracking-tight text-ink">
        {children}
      </h2>
      {right}
    </div>
  );
}
