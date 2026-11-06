import type {
  Lang,
} from "./i18n";

export const termsSections:
  Record<
    Lang,
    {
      title: string;
      body: string;
    }[]
  > = {
  el: [
    {
      title:
        "Κράτηση και τελική τιμή",

      body:
        "Ολόκληρο διαμέρισμα για 1–6 επισκέπτες με ενιαία τιμή. Βασική Ευέλικτη €200/νύχτα· Μη επιστρέψιμη ακριβώς 10% χαμηλότερη (€180 στη βασική τιμή). Ελάχιστη διαμονή 2 νύχτες, εκτός ειδικών δηλωμένων περιόδων. Κράτηση τουλάχιστον 2 ημερολογιακές ημέρες πριν. Καθαρισμός περιλαμβάνεται, χωρίς τέλος καθαρισμού ή κρυφές χρεώσεις. Η ανάλυση τέλους ανθεκτικότητας περιλαμβάνεται στο ίδιο τελικό σύνολο και παραμένει δοκιμαστική μέχρι επιβεβαίωση από λογιστή.",
    },

    {
      title:
        "Άφιξη και αναχώρηση",

      body:
        "Το check-in είναι διαθέσιμο από τις 15:00 και η αναχώρηση πραγματοποιείται έως τις 11:00, ώστε να είναι δυνατή άφιξη άλλων επισκεπτών την ίδια ημέρα. Ο κύριος επισκέπτης πρέπει να είναι 18+ και να παρουσιάσει έγκυρη ταυτότητα ή διαβατήριο εφόσον ζητηθεί. Ενημερώστε μας για σημαντική καθυστέρηση στην άφιξή σας. Αργότερη αναχώρηση είναι δυνατή μόνο με προηγούμενη συμφωνία και διαθεσιμότητα.",
    },

    {
      title:
        "Ψηφιακό check-in και κωδικός εισόδου",

      body:
        "Πριν από την άφιξη ο κύριος επισκέπτης λαμβάνει μοναδικό σύνδεσμο ψηφιακού check-in. Με την αποδοχή των παρόντων όρων ολοκληρώνεται το ψηφιακό check-in και εμφανίζεται ο προσωπικός κωδικός εισόδου του καταλύματος. Ο κωδικός προορίζεται αποκλειστικά για τους επισκέπτες της συγκεκριμένης κράτησης και δεν πρέπει να κοινοποιείται σε τρίτους.",
    },

    {
      title:
        "Ακύρωση, μη εμφάνιση και πρόωρη αναχώρηση",

      body:
        "Ευέλικτη: ακύρωση τουλάχιστον 21 ημέρες πριν την άφιξη επιστρέφει 100%· λιγότερο από 21 ημέρες επιστρέφει 50%. Μη επιστρέψιμη: έκπτωση 10% με 0% επιστροφή σε ακύρωση. Μη εμφάνιση: καμία επιστροφή ανεξαρτήτως τιμής. Πρόωρη αναχώρηση με επιλογή επισκέπτη: καμία επιστροφή για αχρησιμοποίητες νύχτες.",
    },

    {
      title:
        "Αλλαγές και αριθμός επισκεπτών",

      body:
        "Αλλαγή ημερομηνιών μόνο με επικοινωνία, συμφωνία και διαθεσιμότητα, ποτέ αυτόματα. Αλλαγή αριθμού επισκεπτών δωρεάν έως 6, εφόσον ενημερώσετε πριν το check-in. Πάνω από 6 αποτελεί ουσιώδη παραβίαση. Απαγορεύεται υπεκμίσθωση ή μεταβίβαση κράτησης χωρίς προηγούμενη συμφωνία του MM Home.",
    },

    {
      title:
        "Σεβασμός στο σπίτι και τους γείτονες",

      body:
        "Απαγορεύονται κάπνισμα εντός, κατοικίδια, πάρτι και εκδηλώσεις. Σοβαρή παραβίαση για πάρτι ή εκδήλωση μπορεί να οδηγήσει σε λήξη της διαμονής χωρίς επιστροφή. Για σοβαρή διατάραξη των ωρών κοινής ησυχίας δίνεται πρώτα προειδοποίηση· αν συνεχιστεί, η διαμονή μπορεί να λήξει χωρίς επιστροφή. Χρησιμοποιείτε τον εξοπλισμό για τον προβλεπόμενο σκοπό και σύμφωνα με τις οδηγίες του MM Home. Επαγγελματική ή εμπορική φωτογράφιση και βιντεοσκόπηση επιτρέπεται μόνο με προηγούμενη άδεια.",
    },

    {
      title:
        "Ζημιές και ευθύνη επισκέπτη",

      body:
        "Ο επισκέπτης οφείλει να χρησιμοποιεί το κατάλυμα και τον εξοπλισμό του με τη δέουσα προσοχή. Σε περίπτωση ζημιάς που οφείλεται σε υπαιτιότητα του επισκέπτη ή των ατόμων της κράτησής του, μπορεί να ζητηθεί το τεκμηριωμένο πραγματικό κόστος αποκατάστασης ή αντικατάστασης. Ο επισκέπτης οφείλει να ενημερώσει άμεσα το MM Home για οποιαδήποτε ζημιά ή σοβαρό πρόβλημα προκύψει κατά τη διαμονή.",
    },

    {
      title:
        "Αδυναμία φιλοξενίας και ανωτέρα βία",

      body:
        "Αν το MM Home ακυρώσει επειδή δεν μπορεί να παρέχει το κατάλυμα, επιστρέφεται το 100% του καταβληθέντος ποσού ανεξαρτήτως τιμής. Δεν υποσχόμαστε κάλυψη κόστους εναλλακτικής διαμονής. Η ανωτέρα βία αντιμετωπίζεται σύμφωνα με το εφαρμοστέο δίκαιο.",
    },

    {
      title:
        "Προσωπικά και ξεχασμένα αντικείμενα",

      body:
        "Ξεχασμένα αντικείμενα φυλάσσονται για 30 ημέρες. Αποστολή ή courier γίνεται με έξοδα επισκέπτη. Το MM Home δεν ευθύνεται για απώλεια προσωπικών αντικειμένων, εκτός όπου η ευθύνη δεν μπορεί νόμιμα να αποκλειστεί.",
    },
  ],

  en: [
    {
      title:
        "Booking and final price",

      body:
        "The whole apartment has one flat price for 1–6 guests. Base Flexible €200/night; Non-refundable exactly 10% lower (€180 at base). Minimum 2 nights unless a stated special period applies. Book at least 2 calendar days ahead. Cleaning is included, with no cleaning fee or hidden charges. The climate resilience fee breakdown is included within the same final total and remains provisional pending accountant confirmation.",
    },

    {
      title:
        "Arrival and departure",

      body:
        "Check-in is available from 15:00 and checkout is by 11:00, allowing same-day turnover. The main guest must be 18+ and present a valid ID or passport if requested. Please notify us of any significant delay. Late checkout is available only by prior agreement and subject to availability.",
    },

    {
      title:
        "Digital check-in and access code",

      body:
        "Before arrival, the main guest receives a unique digital check-in link. By accepting these terms, digital check-in is completed and the personal access code for the property is displayed. The code is intended exclusively for the guests included in the relevant booking and must not be shared with third parties.",
    },

    {
      title:
        "Cancellation, no-show and early departure",

      body:
        "Flexible: cancellation at least 21 days before arrival refunds 100%; less than 21 days refunds 50%. Non-refundable: 10% discount with 0% refund on cancellation. No-show: no refund regardless of rate. Early departure by the guest: no refund for unused nights.",
    },

    {
      title:
        "Changes and guest count",

      body:
        "Date changes are available only by request, agreement and availability, never automatically. Guest-count changes are free up to 6 when notified before check-in. More than 6 guests is a material breach. Subletting or transferring a booking without prior MM Home approval is prohibited.",
    },

    {
      title:
        "Respect for the home and neighbours",

      body:
        "Smoking indoors, pets, parties and events are prohibited. Serious party or event violations may result in termination of the stay without refund. Serious disturbance during quiet hours will first result in a warning; if it continues, the stay may be terminated without refund. Equipment must be used only for its intended purpose and according to MM Home instructions. Professional or commercial photography and filming require prior permission.",
    },

    {
      title:
        "Damage and guest responsibility",

      body:
        "Guests must use the property and its equipment with appropriate care. Where damage is caused by the guest or members of their booking, MM Home may request the documented actual cost of repair or replacement. Guests must promptly notify MM Home of any damage or serious issue arising during the stay.",
    },

    {
      title:
        "Unable to accommodate and force majeure",

      body:
        "If MM Home cancels because the accommodation cannot be provided, 100% of the amount paid is refunded regardless of rate. Alternative accommodation costs are not promised. Force majeure is handled under applicable law.",
    },

    {
      title:
        "Personal belongings and forgotten items",

      body:
        "Forgotten items are kept for 30 days. Courier or shipping is at the guest's expense. MM Home is not liable for lost personal belongings except where liability cannot legally be excluded.",
    },
  ],
};

export const acceptanceValid = (
  rate:
    | "flexible"
    | "nonref",

  adult:
    boolean,

  terms:
    boolean,

  nonref:
    boolean
) =>
  adult &&
  terms &&
  (
    rate ===
      "flexible" ||
    nonref
  );

export function feeBreakdown(
  total:
    number,

  nights:
    number,

  perNight:
    number
) {
  const fee =
    Math.min(
      total,

      Math.max(
        0,

        Math.round(
          perNight *
            nights *
            100
        ) /
          100
      )
    );

  return {
    accommodation:
      Math.round(
        (
          total -
          fee
        ) *
          100
      ) /
        100,

    fee,

    total,
  };
}

export function refundForReason(
  total:
    number,

  rate:
    | "flexible"
    | "nonref",

  days:
    number,

  reason:
    | "guest"
    | "host"
    | "no-show"
    | "early-departure"
) {
  return reason ===
    "host"
    ? total
    : reason !==
        "guest" ||
      rate ===
        "nonref"
    ? 0
    : days >=
      21
    ? total
    : total /
      2;
}

export const reviewEligible = (
  b: {
    status:
      string;

    checkOut:
      string;
  },

  today:
    string,

  hour:
    number
) =>
  b.status ===
    "confirmed" &&
  (
    b.checkOut <
      today ||
    (
      b.checkOut ===
        today &&
      hour >=
        11
    )
  );
