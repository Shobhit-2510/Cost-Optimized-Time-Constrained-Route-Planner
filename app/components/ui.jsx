"use client";

import { cn } from "@/app/lib/utils";
import { Loader2 } from "lucide-react";

// ─── Button ─────────────────────────────────────────────────────────────────
export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md font-medium text-xs tracking-wide transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed select-none focus:outline-none focus:ring-1 focus:ring-neutral-400";

  const variants = {
    primary:
      "bg-neutral-100 text-neutral-900 hover:bg-white active:bg-neutral-200 border border-neutral-200 shadow-sm font-semibold",
    secondary:
      "bg-neutral-900 text-neutral-200 hover:bg-neutral-800 hover:text-white border border-neutral-800 active:bg-neutral-850",
    accent:
      "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 border border-blue-500 shadow-sm font-semibold",
    danger:
      "bg-red-950/40 text-red-300 hover:bg-red-900/60 border border-red-800/80 active:bg-red-900",
    success:
      "bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800/80 active:bg-emerald-900",
    ghost:
      "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-850 border border-transparent",
    outline:
      "border border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white bg-transparent",
  };

  const sizes = {
    xs: "px-2.5 py-1 text-[11px]",
    sm: "px-3 py-1.5 text-xs",
    md: "px-3.5 py-2 text-xs",
    lg: "px-4 py-2.5 text-sm",
    icon: "p-2",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-current" /> : null}
      {children}
    </button>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-lg bg-[#111114] border border-[#232328] shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn("px-4 py-3 border-b border-[#232328]", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn("text-xs font-semibold uppercase tracking-wider text-neutral-300", className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }) {
  return <div className={cn("p-4", className)}>{children}</div>;
}

// ─── Input ───────────────────────────────────────────────────────────────────
export function Input({ className, label, error, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full rounded-md bg-[#16161a] border border-[#27272a] px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600",
          "focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors duration-150",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────
export function Select({ className, label, children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        className={cn(
          "w-full rounded-md bg-[#16161a] border border-[#27272a] px-3 py-2 text-xs text-neutral-100",
          "focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors duration-150 cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

// ─── Badge ───────────────────────────────────────────────────────────────────
export function Badge({ children, variant = "default", className }) {
  const variants = {
    default: "bg-[#1c1c21] text-neutral-300 border-[#2a2a30]",
    indigo: "bg-blue-950/40 text-blue-300 border-blue-900/60",
    success: "bg-emerald-950/40 text-emerald-300 border-emerald-900/60",
    warning: "bg-amber-950/40 text-amber-300 border-amber-900/60",
    danger: "bg-red-950/40 text-red-300 border-red-900/60",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border font-mono",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({ className, label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full rounded-md bg-[#16161a] border border-[#27272a] px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 resize-none",
          "focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors duration-150",
          className
        )}
        {...props}
      />
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange, className }) {
  return (
    <div className={cn("flex gap-1 p-1 bg-[#141418] border border-[#232328] rounded-md", className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-150 flex-1 justify-center",
              isActive
                ? "bg-[#25252b] text-neutral-100 shadow-sm border border-[#35353d]"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-[#1a1a20]"
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = "md", className }) {
  const sizes = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-6 w-6" };
  return (
    <Loader2 className={cn("animate-spin text-neutral-400", sizes[size], className)} />
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, sub, variant = "default" }) {
  return (
    <div className="flex flex-col gap-1 p-3.5 rounded-lg bg-[#141418] border border-[#232328]">
      <div className="flex items-center justify-between text-neutral-400 mb-0.5">
        <span className="text-[11px] font-medium tracking-wider uppercase text-neutral-400">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-neutral-400" />}
      </div>
      <div className="text-xl font-semibold text-neutral-100 font-mono tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-neutral-400">{sub}</div>}
    </div>
  );
}
