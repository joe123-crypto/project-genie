import React from "react";

interface StatusBannerProps {
  kind?: "error" | "success" | "info";
  message: string;
  className?: string;
}

const kindClasses = {
  error:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-200",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200",
  info:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/30 dark:text-sky-200",
} as const;

export default function StatusBanner({
  kind = "info",
  message,
  className = "",
}: StatusBannerProps) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`rounded-2xl border px-4 py-3 text-sm ${kindClasses[kind]} ${className}`.trim()}
    >
      {message}
    </div>
  );
}
