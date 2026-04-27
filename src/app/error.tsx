"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/error/error-fallback";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error capturado:", error);
  }, [error]);

  return <ErrorFallback error={error} reset={reset} />;
}
