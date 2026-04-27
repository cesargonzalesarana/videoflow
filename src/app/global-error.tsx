"use client";

import { ErrorFallback } from "@/components/error/error-fallback";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <ErrorFallback
          error={error}
          reset={reset}
          title="Error cr\u00edtico"
          message="La aplicaci\u00f3n encontr\u00f3 un error grave. Intenta recargar la p\u00e1gina."
        />
      </body>
    </html>
  );
}
