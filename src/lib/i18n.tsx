import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "el" | "en";
export const SLOGAN = "Your Home Away From Home";

const el = {
  nav: { home: "Αρχική", stay: "Διαμονή", amenities: "Παροχές", location: "Τοποθεσία", reviews: "Αξιολογήσεις", book: "Κράτηση", my: "Η κράτησή μου" },
  common: { bookNow: "Κράτηση", night: "νύχτα", nights: "νύχτες", guests: "επισκέπτες", from: "από", perNight: "/ νύχτα", total: "Σύνολο", back: "Πίσω", next: "Συνέχεια", checkIn: "Άφιξη", checkOut: "Αναχώρηση", demo: "Δείγμα", contact: "Επικοινωνία", addressPending: "Ασκληπιού 44, Τρίκαλα" },
  home: {
    headline: "Σύγχρονη άνεση και πολυτέλεια στην καρδιά των Τρικάλων",
    supporting: "Ένας προσεγμένος χώρος, σχεδιασμένος για να νιώσετε από την πρώτη στιγμή σαν στο σπίτι σας.",
    heroFacts: "94 m² · 3 υπνοδωμάτια · έως 6 επισκέπτες · κέντρο Τρικάλων",
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
    livingT: "Σαλόνι", living: "Ένα σαλόνι σχεδιασμένο για πραγματικές στιγμές χαλάρωσης. Άνετο καθιστικό, ξύλινο δάπεδο και ατμοσφαιρικοί κρυφοί φωτισμοί δημιουργούν ένα ζεστό, σύγχρονο περιβάλλον, ενώ απέναντι το ατμοσφαιρικό τζάκι υδρατμών και η Smart TV 65″ με Netflix ολοκληρώνουν την εμπειρία.",
    bedsT: "Τρία υπνοδωμάτια", beds: "Τρία ξεχωριστά υπνοδωμάτια με διπλό κρεβάτι, Smart TV 32″, προσωπικό γραφείο εργασίας και ιδιαίτερους designer ανεμιστήρες οροφής με ενσωματωμένο φωτισμό.",
    smartT: "Σύγχρονες λεπτομέρειες", smart: "Smart κομοδίνα με ασύρματη φόρτιση, φωτισμό και ενσωματωμένα ηχεία προσθέτουν σύγχρονες πινελιές άνεσης, ενώ δύο από τα υπνοδωμάτια διαθέτουν κομψά μπουντουάρ περιποίησης με καθρέφτη.",
    master: "Κύριο υπνοδωμάτιο", bedroom2: "Δεύτερο υπνοδωμάτιο", bedroom3: "Τρίτο υπνοδωμάτιο",
    kitchenT: "Κουζίνα", kitchen: "Πλήρως εξοπλισμένη για πραγματική καθημερινή χρήση. Nespresso, εντοιχισμένος φούρνος, φούρνος μικροκυμάτων, ψυγείο-καταψύκτης, εντοιχισμένο πλυντήριο πιάτων, βραστήρας, τοστιέρα, πλήρη μαγειρικά σκεύη, σερβίτσιο και πολλές ακόμη παροχές σάς δίνουν όλα όσα χρειάζεστε για μια άνετη διαμονή.",
    welcome: "Καφές Nespresso, τσάι, ζάχαρη και νερό σάς περιμένουν κατά την άφιξή σας.",
    diningT: "Τραπεζαρία", dining: "Ένας φιλόξενος χώρος για να βρεθείτε όλοι μαζί. Η τραπεζαρία έξι ατόμων συνδέεται αρμονικά με την κουζίνα και προσφέρεται από το πρωινό και τον καφέ μέχρι ένα κανονικό οικογενειακό γεύμα ή ένα χαλαρό δείπνο στο σπίτι.",
    bathroomsT: "Μπάνια", bathroomT: "Κύριο μπάνιο", bathroom: "Ένας χώρος με ιδιαίτερη αισθητική και αίσθηση πολυτέλειας, με δύο επιτραπέζιους νιπτήρες, δύο φωτιζόμενους καθρέφτες, εντοιχισμένες μαύρες μπαταρίες και ζεστές ξύλινες λεπτομέρειες. Η μαύρη καμπίνα ντους με υδρομασάζ πλάτης και η κρεμαστή λεκάνη ολοκληρώνουν έναν χώρο σχεδιασμένο για άνεση και χαλάρωση.",
    wcT: "Ανεξάρτητο WC & πλύσιμο", wc: "Δεύτερο ανεξάρτητο WC με νιπτήρα, πλυντήριο ρούχων και αποθηκευτικό χώρο, για επιπλέον πρακτική άνεση σε οικογένειες και παρέες.",
    outT: "Δύο μπαλκόνια, δύο διαφορετικοί χώροι χαλάρωσης.", frontT: "Μπροστινό μπαλκόνι", rearT: "Πίσω lounge μπαλκόνι",
    outFront: "Το μπροστινό μπαλκόνι προσφέρει έναν άνετο χώρο για καφέ, πρωινό ή ποτό, με τραπέζι και τέσσερις καρέκλες, ψηλό bar με δύο σκαμπό και ηλεκτρική τέντα για περισσότερη άνεση.",
    outRear: "Στο πίσω μέρος, ένα πιο ήσυχο lounge μπαλκόνι με καναπέ, χαμηλό τραπέζι, πράσινο και bamboo στοιχεία και ζεστό ατμοσφαιρικό φωτισμό δημιουργεί την ιδανική γωνιά για χαλάρωση στο τέλος της ημέρας.",
  },
  amen: {
    title: "Παροχές", sub: "Όλα όσα χρειάζεστε, οργανωμένα με απλότητα.",
    cats: [
      { t: "Άνεση & κλίμα", i: ["Ενδοδαπέδια θέρμανση σε όλο το σπίτι", "Smart κλιματιστικό Inventor Black στο σαλόνι", "Συνεχές ζεστό νερό", "Ηλεκτρικά ρολά και σίτες", "Ενεργειακά διπλά τζάμια triplex", "Εξωτερική θερμομόνωση"] },
      { t: "Σύνδεση & ψυχαγωγία", i: ["Fiber Wi‑Fi 300 Mbps", "Smart TV 65\" με Netflix", "TV 32\" σε κάθε υπνοδωμάτιο", "Χώρος εργασίας σε κάθε υπνοδωμάτιο"] },
      { t: "Κουζίνα", i: ["Nespresso με δωρεάν καφέ, τσάι, ζάχαρη και νερό", "Βραστήρας, φρυγανιέρα, τοστιέρα", "Εντοιχισμένος φούρνος, μικροκύματα", "Ψυγειοκαταψύκτης, εντοιχισμένο πλυντήριο πιάτων, απορροφητήρας", "Σκεύη και σερβίτσια για 6", "Τραπεζαρία για 6"] },
      { t: "Φροντίδα & πλύσιμο", i: ["Πλυντήριο-στεγνωτήριο 2 σε 1", "Σίδερο και σιδερώστρα, απλώστρα", "Ηλεκτρική σκούπα", "Πιστολάκι μαλλιών, πετσέτες", "Σαμπουάν, αφρόλουτρο, κρεμοσάπουνο"] },
      { t: "Ασφάλεια", i: ["Πόρτα ασφαλείας", "Θυροτηλέφωνο", "Πυροσβεστήρας", "Φαρμακείο πρώτων βοηθειών", "Ανιχνευτής καπνού"] },
      { t: "Κανόνες & στάθμευση", i: ["Δεν επιτρέπονται κατοικίδια", "Απαγορεύεται το κάπνισμα εντός", "Όχι πάρτι ή εκδηλώσεις", "Στάθμευση στον δρόμο — συνήθως εύκολη."] },
    ],
  },
  loc: { title: "Τοποθεσία", sub: "Στο κέντρο των Τρικάλων — όλα με τα πόδια.", map: "ΟΔΗΓΙΕΣ ΠΡΟΣ ΤΟ MM HOME", items: [["Κεντρική πλατεία", "~5 λεπτά"], ["Σιδηροδρομικός σταθμός", "~5 λεπτά"], ["Μύλος Ματσόπουλου / Μύλος των Ξωτικών", "~5 λεπτά"], ["Εστιατόρια, καφέ, σούπερ μάρκετ", "Δίπλα σας"]] as [string, string][] },
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
  common: { bookNow: "Book now", night: "night", nights: "nights", guests: "guests", from: "from", perNight: "/ night", total: "Total", back: "Back", next: "Continue", checkIn: "Check-in", checkOut: "Check-out", demo: "Sample", contact: "Contact", addressPending: "44 Asklipiou Street, Trikala" },
  home: {
    headline: "Modern comfort and luxury in the heart of Trikala",
    supporting: "A thoughtfully designed space that makes you feel at home from the very first moment.",
    heroFacts: "94 m² · 3 bedrooms · up to 6 guests · central Trikala",
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
    livingT: "Living room", living: "A living room made for genuine moments of relaxation. Comfortable seating, wooden flooring and subtle concealed lighting create a warm, contemporary setting, while the atmospheric water-vapour fireplace and 65″ Smart TV with Netflix complete the experience.",
    bedsT: "Three bedrooms", beds: "Three individual bedrooms, each with a double bed, a 32″ Smart TV, a personal workspace and distinctive designer ceiling fans with integrated lighting.",
    smartT: "Thoughtful modern details", smart: "Smart bedside tables with wireless charging, lighting and built-in speakers bring contemporary comfort, while two of the bedrooms feature elegant dressing tables with mirrors.",
    master: "Master bedroom", bedroom2: "Second bedroom", bedroom3: "Third bedroom",
    kitchenT: "Kitchen", kitchen: "Fully equipped for everyday living. A Nespresso machine, built-in oven, microwave, fridge-freezer, built-in dishwasher, kettle, sandwich toaster, a full range of cookware and tableware, and many more amenities provide everything you need for a comfortable stay.",
    welcome: "Nespresso coffee, tea, sugar and water await you on arrival.",
    diningT: "Dining room", dining: "A welcoming space to come together. The six-person dining area flows naturally into the kitchen, equally suited to breakfast and coffee, a family meal or a relaxed dinner at home.",
    bathroomsT: "Bathrooms", bathroomT: "Main bathroom", bathroom: "A beautifully considered space with a sense of luxury: two countertop basins, two illuminated mirrors, concealed black taps and warm wooden details. A black shower enclosure with back hydromassage and a wall-hung toilet complete a bathroom designed for comfort and relaxation.",
    wcT: "Separate WC & laundry", wc: "A second, independent WC with a washbasin, washing machine and storage adds practical comfort for families and groups.",
    outT: "Two balconies, two different spaces to unwind.", frontT: "Front balcony", rearT: "Rear lounge balcony",
    outFront: "The front balcony offers a comfortable spot for coffee, breakfast or a drink, with a table and four chairs, a high bar with two stools and an electric awning for added comfort.",
    outRear: "At the back, a quieter lounge balcony with a sofa, low table, greenery and bamboo details, and warm atmospheric lighting creates the perfect corner to unwind at the end of the day.",
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
  loc: { title: "Location", sub: "In central Trikala — everything on foot.", map: "DIRECTIONS TO MM HOME", items: [["Central square", "~5 min walk"], ["Train station", "~5 min walk"], ["Matsopoulos Mill / Mill of Elves", "~5 min walk"], ["Restaurants, cafés, supermarket", "Nearby"]] },
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
