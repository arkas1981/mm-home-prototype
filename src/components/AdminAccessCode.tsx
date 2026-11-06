import {
  useEffect,
  useState,
} from "react";

import {
  useServerFn,
} from "@tanstack/react-start";

import {
  adminSetAccessCodeD1,
} from "@/lib/d1-admin.functions";

import type {
  Booking,
} from "@/lib/booking";

type Props = {
  booking: Booking;
  reload: () => Promise<void>;
};

export function AdminAccessCode({
  booking,
  reload,
}: Props) {
  const saveAccessCodeFn =
    useServerFn(
      adminSetAccessCodeD1
    );

  const [
    accessCode,
    setAccessCode,
  ] =
    useState(
      booking.accessCode ??
        ""
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  useEffect(() => {
    setAccessCode(
      booking.accessCode ??
        ""
    );
  }, [
    booking.accessCode,
    booking.id,
  ]);

  const save =
    async () => {
      if (saving) {
        return;
      }

      const clean =
        accessCode.replace(
          /\D/g,
          ""
        );

      if (
        clean &&
        (
          clean.length < 4 ||
          clean.length > 10
        )
      ) {
        alert(
          "Ο κωδικός εισόδου πρέπει να αποτελείται από 4 έως 10 ψηφία."
        );

        return;
      }

      setSaving(true);

      try {
        const result =
          await saveAccessCodeFn({
            data: {
              id:
                booking.id,

              accessCode:
                clean,
            },
          });

        if (
          "error" in
            result &&
          result.error
        ) {
          alert(
            "Δεν ήταν δυνατή η αποθήκευση του κωδικού εισόδου."
          );

          return;
        }

        await reload();

        alert(
          clean
            ? "Ο κωδικός εισόδου αποθηκεύτηκε."
            : "Ο κωδικός εισόδου αφαιρέθηκε."
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <div className="panel p-5">
      <p className="font-medium">
        Κωδικός εισόδου
      </p>

      <p className="text-xs text-muted-foreground mt-1">
        Ο επισκέπτης θα τον δει μόνο αφού αποδεχτεί τους όρους στο ψηφιακό check-in.
      </p>

      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <input
          className="field"
          inputMode="numeric"
          autoComplete="off"
          value={
            accessCode
          }
          onChange={(e) =>
            setAccessCode(
              e.target.value.replace(
                /\D/g,
                ""
              )
            )
          }
          placeholder="π.χ. 482615"
          maxLength={
            10
          }
        />

        <button
          type="button"
          className="btn-gold whitespace-nowrap"
          disabled={
            saving
          }
          onClick={
            save
          }
        >
          {saving
            ? "Αποθήκευση..."
            : "Αποθήκευση"}
        </button>
      </div>

      <div className="mt-4 text-xs space-y-2">
        <p>
          <span className="text-muted-foreground">
            Κωδικός:
          </span>{" "}
          {booking.accessCode
            ? "Καταχωρημένος"
            : "Δεν έχει καταχωρηθεί"}
        </p>

        <p>
          <span className="text-muted-foreground">
            Όροι:
          </span>{" "}
          {booking.termsAcceptedAt
            ? "Έχουν γίνει αποδεκτοί"
            : "Δεν έχουν γίνει ακόμη αποδεκτοί"}
        </p>

        {booking.termsAcceptedAt && (
          <p>
            <span className="text-muted-foreground">
              Αποδοχή:
            </span>{" "}
            {new Date(
              booking.termsAcceptedAt
            ).toLocaleString(
              "el-GR"
            )}
          </p>
        )}

        {booking.termsVersion && (
          <p>
            <span className="text-muted-foreground">
              Έκδοση όρων:
            </span>{" "}
            {
              booking.termsVersion
            }
          </p>
        )}

        {booking.checkinToken ? (
          <p className="break-all">
            <span className="text-muted-foreground">
              Digital check-in:
            </span>{" "}
            https://mmhome.gr/checkin/{booking.checkinToken}
          </p>
        ) : (
          <p className="text-muted-foreground">
            Το μοναδικό link θα δημιουργηθεί μόλις αποθηκεύσεις κωδικό εισόδου.
          </p>
        )}
      </div>
    </div>
  );
}
