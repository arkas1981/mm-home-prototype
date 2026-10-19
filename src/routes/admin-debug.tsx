import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminAuthDiagnostic } from "@/lib/admin-auth.functions";

export const Route = createFileRoute("/admin-debug")({
  component: AdminDebug,
});

type Status = {
  emailLoaded: boolean;
  passwordLoaded: boolean;
  sessionSecretLoaded: boolean;
};

function AdminDebug() {
  const diagnostic = useServerFn(adminAuthDiagnostic);
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    diagnostic()
      .then((result) => setStatus(result))
      .catch(() => setError("Diagnostic failed"));
  }, [diagnostic]);

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="panel p-8 w-full max-w-md space-y-4">
        <h1 className="text-3xl">MM Home Admin Diagnostic</h1>

        {error && (
          <p className="text-destructive">
            {error}
          </p>
        )}

        {!status && !error && (
          <p>Checking...</p>
        )}

        {status && (
          <div className="space-y-3 text-lg">
            <p>
              ADMIN_EMAIL:{" "}
              <strong>
                {status.emailLoaded ? "YES" : "NO"}
              </strong>
            </p>

            <p>
              ADMIN_PASSWORD:{" "}
              <strong>
                {status.passwordLoaded ? "YES" : "NO"}
              </strong>
            </p>

            <p>
              ADMIN_SESSION_SECRET:{" "}
              <strong>
                {status.sessionSecretLoaded ? "YES" : "NO"}
              </strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
