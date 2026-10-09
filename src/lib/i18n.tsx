import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "el" | "en";
export const SLOGAN = "Your Home Away From Home";

const el = {
  nav: { home: "Αρχική", stay: "Διαμονή", amenities: "Παροχές", location: "Τοποθεσία", reviews: "Αξιολογήσεις", book: "Κράτηση", my: "Η κράτησή μου" },
  common: { bookNow: "Κράτηση", night: "νύχτα", nights: "νύχτες", guests: "επισκέπτες", from: "από", perNight: "/ νύχτα", total: "Σύνολο", back: "Πίσω", next: "Συνέχεια", checkIn: "Άφιξη", checkOut: "Αναχώρηση", demo: "Δείγμα", contact: "Επικοινωνία", addressPending: "Η διεύθυνση θα ανακοινωθεί σύντομα" },
  home: {
    eyebrow: "Κεντρικά Τρίκαλα · Ανακαίνιση 2026",
    intro: "Ένα φωτεινό, πλήρως ανακαινισμένο διαμέρισμα 94 m² στην καρδιά των Τρικάλων, για έως 6 επισκέπτες.",
    facts: ["94 m²", "3 υπνοδωμάτια", "Έως 6 επισκέπτες", "1 μπάνιο + 1 WC", "1ος όροφος με ασανσέρ", "Ανακαίνιση 2026"],
    walkTitle: "Όλα σε απόσταση αναπνοής",
    walk: "Περίπου 5 λεπτά με τα πόδια από την κεντρική πλατεία, τον σιδηροδρομικό σταθμό και τον Μύλο του Ματσόπουλου / Μύλο των Ξωτικών. Εστιατόρια, καφέ, σούπερ μάρκετ και καταστήματα δίπλα σας.",
    priceNote: "Ενιαία τιμή για 1–6 επισκέπτες. Καθαρισμός περιλαμβάνεται, χωρίς κρυφές χρεώσεις.",
    explore: "Δείτε τη διαμονή",
  },
  stay: {
    title: "Η διαμονή",
    sub: "Ζεστασιά, φως και προσεγμένες λεπτομέρειες σε κάθε χώρο.",
    livingT: "Σαλόνι", living: "Ατμοσφαιρικό τζάκι ατμού νερού, Smart TV 65\" με Netflix και ξύλινο δάπεδο.",
    bedsT: "Τρία υπνοδωμάτια", beds: "Δύο διπλά κρεβάτια 160 cm και ένα διπλό 140 cm. Σε κάθε δωμάτιο: TV 32\", γραφείο εργασίας και designer ανεμιστήρας-φωτιστικό σε σχήμα λουλουδιού.",
    smartT: "Έξυπνες λεπτομέρειες", smart: "Έξυπνα κομοδίνα με ηχεία, φωτισμό, ασύρματη φόρτιση και USB. Ντουλάπες με ολόσωμους καθρέφτες· η κύρια κρεβατοκάμαρα διαθέτει τρίφυλλη ντουλάπα και φωτιζόμενο μπουντουάρ.",
    kitchenT: "Κουζίνα & τραπεζαρία", kitchen: "Πλήρως εξοπλισμένη κουζίνα με Nespresso και τραπέζι φαγητού για 6.",
    outT: "Δύο μπαλκόνια", outFront: "Μπροστινό μπαλκόνι με τραπέζι και 4 καρέκλες, μπαρ με 2 σκαμπό και ηλεκτρική τέντα.",
    outRear: "Πίσω μπαλκόνι-lounge με καναπέ, χαμηλό τραπέζι, φυτά και μπαμπού, και ζεστό φωτισμό.",
  },
  amen: {
    title: "Παροχές", sub: "Όλα όσα χρειάζεστε, οργανωμένα με απλότητα.",
    cats: [
      { t: "Άνεση & κλίμα", i: ["Ενδοδαπέδια θέρμανση σε όλο το σπίτι", "Smart κλιματιστικό Inventor Black μόνο στο σαλόνι", "Συνεχές ζεστό νερό", "Ηλεκτρικά ρολά και σίτες", "Ενεργειακά διπλά τζάμια triplex", "Εξωτερική θερμομόνωση"] },
      { t: "Σύνδεση & ψυχαγωγία", i: ["Fiber Wi‑Fi 300 Mbps", "Smart TV 65\" με Netflix", "TV 32\" σε κάθε υπνοδωμάτιο", "Χώρος εργασίας σε κάθε υπνοδωμάτιο"] },
      { t: "Κουζίνα", i: ["Nespresso με δωρεάν καφέ, τσάι, ζάχαρη και νερό", "Βραστήρας, φρυγανιέρα, τοστιέρα", "Εντοιχισμένος φούρνος, μικροκύματα", "Ψυγειοκαταψύκτης, εντοιχισμένο πλυντήριο πιάτων, απορροφητήρας", "Σκεύη και σερβίτσια για 6", "Τραπεζαρία για 6"] },
      { t: "Φροντίδα & πλύσιμο", i: ["Πλυντήριο-στεγνωτήριο 2 σε 1", "Σίδερο και σιδερώστρα, απλώστρα", "Ηλεκτρική σκούπα", "Πιστολάκι μαλλιών, πετσέτες", "Σαμπουάν, αφρόλουτρο, κρεμοσάπουνο"] },
      { t: "Ασφάλεια", i: ["Πόρτα ασφαλείας", "Θυροτηλέφωνο", "Πυροσβεστήρας", "Φαρμακείο πρώτων βοηθειών", "Ανιχνευτής καπνού"] },
      { t: "Κανόνες & στάθμευση", i: ["Δεν επιτρέπονται κατοικίδια", "Απαγορεύεται το κάπνισμα εντός", "Όχι πάρτι ή εκδηλώσεις", "Στάθμευση μόνο στον δρόμο — συνήθως εύκολη"] },
    ],
  },
  loc: { title: "Τοποθεσία", sub: "Στο κέντρο των Τρικάλων — όλα με τα πόδια.", map: "Διαδραστικός χάρτης (σύντομα)", items: [["Κεντρική πλατεία", "~5 λεπτά"], ["Σιδηροδρομικός σταθμός", "~5 λεπτά"], ["Μύλος Ματσόπουλου / Μύλος των Ξωτικών", "~5 λεπτά"], ["Εστιατόρια, καφέ, σούπερ μάρκετ", "Δίπλα σας"]] as [string, string][] },
  rev: { title: "Αξιολογήσεις", sub: "Μόνο από επιβεβαιωμένες διαμονές.", none: "Δεν υπάρχουν ακόμη αξιολογήσεις.", sampleNote: "Οι αξιολογήσεις με την ένδειξη «Δείγμα» είναι ενδεικτικές για το demo.", verified: "Επιβεβαιωμένη διαμονή",
    writeT: "Γράψτε την αξιολόγησή σας", invalid: "Ο σύνδεσμος δεν είναι έγκυρος ή η διαμονή δεν έχει ολοκληρωθεί.", name: "Όνομα (όπως θα εμφανίζεται)", text: "Η εμπειρία σας", submit: "Υποβολή", thanks: "Ευχαριστούμε! Η αξιολόγησή σας θα δημοσιευτεί μετά από έγκριση." },
  book: {
    title: "Κράτηση", steps: ["Ημερομηνίες", "Τιμή", "Στοιχεία", "Πληρωμή", "Επιβεβαίωση"],
    pick: "Επιλέξτε ημερομηνία άφιξης και αναχώρησης.", legendTaken: "Μη διαθέσιμο",
    errors: { order: "Η αναχώρηση πρέπει να είναι μετά την άφιξη.", lead: "Οι κρατήσεις γίνονται τουλάχιστον 2 ημέρες πριν την άφιξη.", min: "Ελάχιστη διαμονή: {n} νύχτες για αυτές τις ημερομηνίες.", taken: "Κάποιες νύχτες δεν είναι διαθέσιμες." },
    times: "Άφιξη από 15:00 · Αναχώρηση έως 11:00",
    flexT: "Ευέλικτη", flex: "100% επιστροφή έως 21 ημέρες πριν την άφιξη· 50% αργότερα.",
    nrT: "Μη επιστρέψιμη", nr: "10% χαμηλότερη τιμή. Καμία επιστροφή σε ακύρωση.",
    included: "Καθαρισμός περιλαμβάνεται. Χωρίς κρυφές χρεώσεις — αυτό είναι το τελικό σύνολο.",
    name: "Ονοματεπώνυμο", email: "Email", phone: "Κινητό", guests: "Αριθμός επισκεπτών",
    adult: "Ο κύριος επισκέπτης είναι 18 ετών και άνω.", id: "Κατά το προσωπικό check-in θα ζητηθεί ταυτότητα ή διαβατήριο.",
    terms: "Έχω διαβάσει και αποδέχομαι τους Όρους Κράτησης & Διαμονής και την Πολιτική Ακύρωσης του MM Home.", nrAck: "Αναγνωρίζω ότι επέλεξα τη μη επιστρέψιμη τιμή με έκπτωση 10% και δεν δικαιούμαι επιστροφή σε ακύρωση.",
    invalid: "Συμπληρώστε σωστά όλα τα πεδία και αποδεχτείτε τους όρους.",
    payT: "Demo πληρωμή", payNote: "Πρωτότυπο: δεν γίνεται πραγματική χρέωση και δεν συλλέγονται στοιχεία κάρτας.", pay: "Ολοκλήρωση demo πληρωμής",
    doneT: "Η κράτησή σας επιβεβαιώθηκε", code: "Κωδικός κράτησης", doneNote: "Προσωπικό check-in από τις 15:00 — θα σας υποδεχτούμε εμείς. Φέρτε ταυτότητα ή διαβατήριο.", manage: "Διαχείριση κράτησης",
  },
  my: {
    title: "Η κράτησή μου", sub: "Εισάγετε το email σας και τον κωδικό κράτησης.", code: "Κωδικός κράτησης", find: "Αναζήτηση", notFound: "Δεν βρέθηκε κράτηση με αυτά τα στοιχεία.",
    status: "Κατάσταση", confirmed: "Επιβεβαιωμένη", cancelled: "Ακυρωμένη", paid: "Πληρώθηκε (demo)", rate: "Τιμολόγιο", policy: "Πολιτική",
    change: "Αλλαγή ημερομηνιών: επικοινωνήστε μαζί μας — οι αλλαγές δεν γίνονται αυτόματα.",
    cancel: "Ακύρωση κράτησης", refundIs: "Επιστροφή χρημάτων: {p}% — €{a}", confirmCancel: "Επιβεβαίωση ακύρωσης", keep: "Διατήρηση κράτησης", refunded: "Επιστράφηκε (demo)",
  },
  footer: { contact: "Επικοινωνία", rights: "Όλα τα δικαιώματα διατηρούνται." },
  months: "el-GR",
};

type Dict = typeof el;

const en: Dict = {
  nav: { home: "Home", stay: "Accommodation", amenities: "Amenities", location: "Location", reviews: "Reviews", book: "Book", my: "My booking" },
  common: { bookNow: "Book now", night: "night", nights: "nights", guests: "guests", from: "from", perNight: "/ night", total: "Total", back: "Back", next: "Continue", checkIn: "Check-in", checkOut: "Check-out", demo: "Sample", contact: "Contact", addressPending: "Address to be announced soon" },
  home: {
    eyebrow: "Central Trikala · Renovated 2026",
    intro: "A bright, fully renovated 94 m² apartment in the heart of Trikala, for up to 6 guests.",
    facts: ["94 m²", "3 bedrooms", "Up to 6 guests", "1 bathroom + 1 WC", "1st floor with elevator", "Renovated 2026"],
    walkTitle: "Everything within a short stroll",
    walk: "Approx. 5 minutes on foot to the central square, the train station and Matsopoulos Mill / Mill of Elves. Restaurants, cafés, a supermarket and shops nearby.",
    priceNote: "One flat price for 1–6 guests. Cleaning included, no hidden fees.",
    explore: "Explore the home",
  },
  stay: {
    title: "Accommodation", sub: "Warmth, light and considered details in every room.",
    livingT: "Living room", living: "An atmospheric water-vapour fireplace, a 65\" Smart TV with Netflix and warm wooden floors.",
    bedsT: "Three bedrooms", beds: "Two 160 cm doubles and one 140 cm double. Each room has a 32\" TV, a desk workspace and a flower-like designer ceiling fan and light.",
    smartT: "Smart details", smart: "Smart bedside tables with speakers, lighting, wireless charging and USB. Wardrobes with full-length mirrors; the master has a 3-door wardrobe and an illuminated vanity.",
    kitchenT: "Kitchen & dining", kitchen: "A fully equipped kitchen with Nespresso and a dining table for 6.",
    outT: "Two balconies", outFront: "Front balcony with a table and 4 chairs, a bar table with 2 stools and an electric awning.",
    outRear: "Rear lounge balcony with a sofa, low table, plants and bamboo, and warm lighting.",
  },
  amen: {
    title: "Amenities", sub: "Everything you need, simply organised.",
    cats: [
      { t: "Comfort & climate", i: ["Whole-home underfloor heating", "Smart Inventor Black air conditioning in the living room only", "Continuous hot water", "Electric shutters and insect screens", "Energy-efficient double glazing, laminated/triplex glass", "External thermal insulation"] },
      { t: "Connectivity & entertainment", i: ["Fiber Wi‑Fi 300 Mbps", "65\" Smart TV with Netflix", "32\" TV in every bedroom", "Workspace in every bedroom"] },
      { t: "Kitchen", i: ["Nespresso with complimentary coffee, tea, sugar and water", "Kettle, toaster, sandwich/toast maker", "Built-in oven, microwave", "Fridge/freezer, built-in dishwasher, extractor", "Cookware and tableware for 6", "Dining table for 6"] },
      { t: "Care & laundry", i: ["Washer-dryer 2-in-1", "Iron and board, drying rack", "Vacuum cleaner", "Hair dryer, towels", "Shampoo, shower gel, hand soap"] },
      { t: "Safety", i: ["Security door", "Intercom", "Fire extinguisher", "First aid kit", "Smoke detector"] },
      { t: "House rules & parking", i: ["No pets", "No smoking indoors", "No parties or events", "Street parking only — generally easy"] },
    ],
  },
  loc: { title: "Location", sub: "In central Trikala — everything on foot.", map: "Interactive map (coming soon)", items: [["Central square", "~5 min walk"], ["Train station", "~5 min walk"], ["Matsopoulos Mill / Mill of Elves", "~5 min walk"], ["Restaurants, cafés, supermarket", "Nearby"]] },
  rev: { title: "Reviews", sub: "From verified stays only.", none: "No reviews yet.", sampleNote: "Reviews marked “Sample” are demo examples.", verified: "Verified stay",
    writeT: "Write your review", invalid: "This link is invalid or the stay has not been completed yet.", name: "Name (as displayed)", text: "Your experience", submit: "Submit", thanks: "Thank you! Your review will be published after approval." },
  book: {
    title: "Book your stay", steps: ["Dates", "Rate", "Details", "Payment", "Confirmation"],
    pick: "Select your check-in and check-out dates.", legendTaken: "Unavailable",
    errors: { order: "Check-out must be after check-in.", lead: "Bookings must be made at least 2 days before check-in.", min: "Minimum stay: {n} nights for these dates.", taken: "Some nights are not available." },
    times: "Check-in from 15:00 · Check-out by 11:00",
    flexT: "Flexible", flex: "100% refund up to 21 days before check-in; 50% after that.",
    nrT: "Non-refundable", nr: "10% lower price. No refund on cancellation.",
    included: "Cleaning included. No hidden fees — this is your final total.",
    name: "Full name", email: "Email", phone: "Mobile", guests: "Number of guests",
    adult: "The main guest is 18 years or older.", id: "An ID card or passport will be requested at personal check-in.",
    terms: "I have read and accept the Booking & Stay Terms and Cancellation Policy of MM Home.", nrAck: "I acknowledge the 10% discounted non-refundable rate and that cancellation receives no refund.",
    invalid: "Please complete all fields correctly and accept the terms.",
    payT: "Demo payment", payNote: "Prototype: no real charge is made and no card details are collected.", pay: "Complete demo payment",
    doneT: "Your booking is confirmed", code: "Booking code", doneNote: "Personal check-in from 15:00 — we will welcome you in person. Please bring an ID card or passport.", manage: "Manage booking",
  },
  my: {
    title: "My booking", sub: "Enter your email and booking code.", code: "Booking code", find: "Find booking", notFound: "No booking found with these details.",
    status: "Status", confirmed: "Confirmed", cancelled: "Cancelled", paid: "Paid (demo)", rate: "Rate", policy: "Policy",
    change: "Date changes: please contact us — changes are never made automatically.",
    cancel: "Cancel booking", refundIs: "Refund: {p}% — €{a}", confirmCancel: "Confirm cancellation", keep: "Keep booking", refunded: "Refunded (demo)",
  },
  footer: { contact: "Contact", rights: "All rights reserved." },
  months: "en-GB",
};

const dicts = { el, en };
const Ctx = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void }>({ lang: "el", t: el, setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangS] = useState<Lang>("el");
  useEffect(() => { const s = new URLSearchParams(window.location.search).get("lang") || localStorage.getItem("mmhome-lang"); if (s === "en" || s === "el") setLangS(s); }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = (l: Lang) => { setLangS(l); localStorage.setItem("mmhome-lang", l); const url = new URL(window.location.href); url.searchParams.set("lang", l); window.history.replaceState(null, "", url); window.dispatchEvent(new Event("mm-language")); };
  return <Ctx.Provider value={{ lang, t: dicts[lang], setLang }}>{children}</Ctx.Provider>;
}
export const useT = () => useContext(Ctx);
export const fmtDate = (iso: string, lang: Lang) =>
  new Date(iso + "T12:00:00").toLocaleDateString(lang === "el" ? "el-GR" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
