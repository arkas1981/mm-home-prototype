import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useEffect,
  useState,
} from "react";

import {
  Logo,
} from "@/components/site";

import {
  Lock,
} from "lucide-react";

export const Route =
  createFileRoute(
    "/admin-access"
  )({
    component:
      AdminAccess,
  });

function AdminAccess() {
  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    busy,
    setBusy,
  ] =
    useState(false);

  useEffect(() => {
    const check =
      async () => {
        try {
          const response =
            await fetch(
              "/api/admin-login",
              {
                method:
                  "GET",

                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const data =
            (await response.json()) as {
              authenticated?: boolean;
            };

          if (
            data.authenticated
          ) {
            window.location.href =
              "/admin";
          }
        } catch {
          // Stay on login page.
        }
      };

    check();
  }, []);

  const submit =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      setBusy(true);
      setError("");

      try {
        const response =
          await fetch(
            "/api/admin-login",
            {
              method:
                "POST",

              credentials:
                "include",

              headers: {
                "content-type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  email:
                    email.trim(),

                  password,
                }),
            }
          );

        const result =
          (await response.json()) as {
            ok?: boolean;
            error?: string;
          };

        if (
          response.status ===
            401 ||
          result.error ===
            "credentials"
        ) {
          setError(
            "Λάθος email ή κωδικός."
          );

          setBusy(false);
          return;
        }

        if (
          !response.ok ||
          !result.ok
        ) {
          setError(
            "Δεν ήταν δυνατή η σύνδεση."
          );

          setBusy(false);
          return;
        }

        window.location.href =
          "/admin";
      } catch {
        setError(
          "Δεν ήταν δυνατή η σύνδεση."
        );

        setBusy(false);
      }
    };

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <form
        onSubmit={
          submit
        }
        className="panel p-8 w-full max-w-sm text-center space-y-4"
      >
        <Logo
          size={56}
        />

        <h1 className="text-3xl">
          Διαχείριση MM Home
        </h1>

        <input
          className="field"
          type="email"
          autoComplete="username"
          placeholder="Email"
          value={
            email
          }
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          required
        />

        <input
          className="field"
          type="password"
          autoComplete="current-password"
          placeholder="Κωδικός"
          value={
            password
          }
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          required
        />

        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          className="btn-gold w-full"
          disabled={
            busy
          }
        >
          <Lock
            size={14}
          />

          {busy
            ? "Σύνδεση..."
            : "Σύνδεση"}
        </button>
      </form>
    </div>
  );
}
