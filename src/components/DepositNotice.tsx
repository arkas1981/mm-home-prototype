import {
  ShieldCheck,
} from "lucide-react";

import {
  useT,
} from "@/lib/i18n";

export function DepositNotice() {
  const {
    lang,
  } =
    useT();

  return (
    <aside className="border-t border-b py-5 text-sm leading-relaxed">
      <p className="flex items-center gap-2 font-medium text-olive mb-2">
        <ShieldCheck
          size={
            18
          }
        />

        {lang ===
        "el"
          ? "Ευθύνη για ζημιές"
          : "Damage responsibility"}
      </p>

      <p className="text-muted-foreground">
        {lang ===
        "el"
          ? "Ο επισκέπτης οφείλει να χρησιμοποιεί το κατάλυμα και τον εξοπλισμό του με τη δέουσα προσοχή. Σε περίπτωση ζημιάς που οφείλεται σε υπαιτιότητα του επισκέπτη ή των ατόμων της κράτησής του, μπορεί να ζητηθεί το τεκμηριωμένο πραγματικό κόστος αποκατάστασης ή αντικατάστασης."
          : "Guests must use the property and its equipment with appropriate care. Where damage is caused by the guest or members of their booking, MM Home may request the documented actual cost of repair or replacement."}
      </p>
    </aside>
  );
}
