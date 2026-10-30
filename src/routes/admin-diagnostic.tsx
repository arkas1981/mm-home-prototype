import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useEffect,
  useState,
} from "react";

import {
  useServerFn,
} from "@tanstack/react-start";

import {
  adminAuthDiagnostic,
} from "@/lib/admin-auth.functions";

import {
  meta,
} from "@/lib/meta";

export const Route =
  createFileRoute(
    "/admin-diagnostic"
  )({
    head: () => ({
      ...meta(
        "Admin Diagnostic — MM Home",
        "Έλεγχος ρυθμίσεων admin."
      ),
      meta: [
        ...meta(
          "Admin Diagnostic — MM Home",
          "Έλεγχος ρυθμίσεων admin."
        ).meta,
        {
          name: "robots",
          content: "noindex",
        },
      ],
    }),

    component:
      AdminDiagnostic,
  });

type Status = {
  emailLoaded: boolean;
  passwordLoaded: boolean;
  sessionSecretLoaded: boolean;
};

function AdminDiagnostic() {
  const diagnostic =
    useServerFn(
      adminAuthDiagnostic
    );

  const [
    status,
    setStatus,
  ] =
    useState<
      Status | null
    >(null);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    const run =
      async () => {
        try {
          const result =
            await diagnostic();

          setStatus(
            result
          );
        } catch (
          err
        ) {
          console.error(
            err
          );

          setError(
            "Ο διαγνωστικός έλεγχος απέτυχε."
          );
        }
      };

    run();
  }, [diagnostic]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="panel p-6 max-w-lg w-full">
          <h1 className="text-2xl font-serif mb-4">
            Admin Diagnostic
          </h1>

          <p className="text-destructive">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Έλεγχος…
      </div>
    );
  }

  const Row = ({
    label,
    ok,
  }: {
    label: string;
    ok: boolean;
  }) => (
    <div className="flex justify-between items-center py-3 border-b last:border-0">
      <span>
        {label}
      </span>

      <strong
        className={
          ok
            ? "text-green-600"
            : "text-red-600"
        }
      >
        {ok
          ? "OK"
          : "ΠΡΟΒΛΗΜΑ"}
      </strong>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="panel p-6 max-w-lg w-full">
        <h1 className="text-2xl font-serif mb-2">
          MM Home Admin Diagnostic
        </h1>

        <p className="text-sm text-muted-foreground mb-5">
          Δεν εμφανίζονται μυστικές τιμές.
          Ελέγχεται μόνο αν έχουν φορτωθεί.
        </p>

        <Row
          label="ADMIN_EMAIL"
          ok={
            status.emailLoaded
          }
        />

        <Row
          label="ADMIN_PASSWORD"
          ok={
            status.passwordLoaded
          }
        />

        <Row
          label="ADMIN_SESSION_SECRET"
          ok={
            status.sessionSecretLoaded
          }
        />
      </div>
    </div>
  );
}
