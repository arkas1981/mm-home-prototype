import {
  useState,
} from "react";

import {
  useServerFn,
} from "@tanstack/react-start";

import {
  Trash2,
} from "lucide-react";

import {
  adminDeleteBookingD1,
} from "@/lib/admin-delete-booking.functions";

type Props = {
  id: string;
  code: string;
  source: string;

  onDeleted:
    () =>
      Promise<void> |
      void;
};

export function AdminDeleteBooking({
  id,
  code,
  source,
  onDeleted,
}: Props) {
  const deleteBooking =
    useServerFn(
      adminDeleteBookingD1
    );

  const [
    deleting,
    setDeleting,
  ] =
    useState(
      false
    );

  if (
    source !==
    "manual"
  ) {
    return null;
  }

  const remove =
    async () => {
      if (
        deleting
      ) {
        return;
      }

      const first =
        window.confirm(
          `ΟΡΙΣΤΙΚΗ ΔΙΑΓΡΑΦΗ

Η κράτηση ${code} θα διαγραφεί οριστικά.

Η ενέργεια αυτή ΔΕΝ είναι το ίδιο με την «Ακύρωση κράτησης» και δεν μπορεί να αναιρεθεί.

Θέλεις να συνεχίσεις;`
        );

      if (
        !first
      ) {
        return;
      }

      const typed =
        window.prompt(
          `Για τελική επιβεβαίωση γράψε ακριβώς:

${code}`
        );

      if (
        typed
          ?.trim()
          .toUpperCase() !==
        code.toUpperCase()
      ) {
        alert(
          "Η διαγραφή ακυρώθηκε. Ο κωδικός κράτησης δεν γράφτηκε σωστά."
        );

        return;
      }

      setDeleting(
        true
      );

      try {
        const result =
          await deleteBooking({
            data: {
              id,
            },
          });

        if (
          "error" in
            result &&
          result.error
        ) {
          if (
            result.error ===
            "not_manual"
          ) {
            alert(
              "Η οριστική διαγραφή επιτρέπεται μόνο για χειροκίνητες κρατήσεις."
            );

            return;
          }

          alert(
            "Δεν ήταν δυνατή η οριστική διαγραφή της κράτησης."
          );

          return;
        }

        alert(
          `Η κράτηση ${code} διαγράφηκε οριστικά.`
        );

        await onDeleted();
      } catch {
        alert(
          "Παρουσιάστηκε πρόβλημα κατά τη διαγραφή της κράτησης."
        );
      } finally {
        setDeleting(
          false
        );
      }
    };

  return (
    <button
      type="button"
      disabled={
        deleting
      }
      onClick={
        remove
      }
      className="
        btn-line
        !border-destructive
        !text-destructive
        inline-flex
        items-center
        gap-2
      "
    >
      <Trash2
        size={
          16
        }
      />

      {deleting
        ? "Διαγραφή..."
        : "Οριστική διαγραφή κράτησης"}
    </button>
  );
}
