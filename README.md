# MM Home Prototype

Build a polished working prototype of “MM Home”, a premium direct-booking vacation rental website in central Trikala, Greece. Frontend + demo booking/admin flows with mock/local data only. Do NOT enable live Stripe charges, outbound email, production publishing, or require secrets yet. Final property photos will be supplied later; use tasteful luxury placeholders that are easy to replace.

BRAND & DESIGN
Bilingual Greek/English with EL|EN switch; never mix languages on one page; default Greek. Brand MM Home; slogan always exactly “Your Home Away From Home”. Approved visual direction: bright warm luxury—cream/beige/ivory, warm gold/brown accents, only subtle olive, lots of whitespace, large photography, elegant serif headings + clean sans UI. Avoid dark olive-heavy design and information overload. Responsive/mobile-first. Use an easily replaceable placeholder for the circular M&M logo.

PUBLIC SITE
Nav/pages: Αρχική, Διαμονή, Παροχές, Τοποθεσία, Αξιολογήσεις, Κράτηση, Η κράτησή μου; English equivalents.
Home concise/photo-led. Facts: 94 m², 3 bedrooms, max 6 guests, 1 full bathroom + 1 WC, first floor with elevator, fully renovated 2026, central Trikala, approx. 5 min walk to central square, train station, Matsopoulos Mill/Mill of Elves; restaurants/cafes/supermarket/shops nearby. Public address supported but use editable placeholder, never invent an address.
Accommodation: large images/short sections, no floor plan, no dense alternating text. Living room: atmospheric water-vapor fireplace, 65” Smart TV + Netflix, wooden floor. Bedrooms: two 160cm doubles, one 140cm double; 32” TV each; desk/workspace each; flower-like designer ceiling fan/light each; smart bedside tables with speakers, lighting, wireless charging and USB; wardrobes with full-length mirrors; master has 3-door wardrobe + illuminated vanity.
Amenities organized by category, not icon overload: whole-home underfloor heating; Smart Inventor Black AC ONLY in living room; Fiber Wi-Fi 300 Mbps; fully equipped kitchen with Nespresso + complimentary coffee, tea, sugar, water, kettle, toaster, sandwich/toast maker, built-in oven, microwave, fridge/freezer, built-in dishwasher, extractor, cookware/tableware for 6; dining table for 6; washer-dryer 2-in-1, iron/board, drying rack, vacuum; hair dryer, towels, shampoo, shower gel, hand soap; continuous hot water; electric shutters, insect screens, energy-efficient double glazing with laminated/triplex glass, external thermal insulation; security door, intercom, extinguisher, first aid kit, smoke detector. No pets, no smoking indoors, no parties/events. Street parking only, generally easy; never claim private parking.
Outdoor: front balcony table+4 chairs, bar table+2 stools, electric awning; rear lounge balcony sofa, low table, plants/bamboo, warm lighting. Do not claim a view.
Location: simple, walkability-led, interactive-map placeholder.
Reviews: separate page; approved verified-stay reviews only; any seeded examples clearly labeled demo/sample.
Contact: brand MM Home only; placeholder phone, info@mmhome.gr, Viber, Facebook, Instagram; no contact form.

BOOKING DEMO
Flat price for 1–6 guests. Flexible base €200/night. Non-refundable automatically 10% lower (€180 base). Min 2 nights; admin can override price/min nights by date/range. Booking at least 2 calendar days before check-in. Same-day turnover allowed: checkout 11:00, next check-in 15:00. Cleaning included, no cleaning fee/hidden fees; final total shown.
Flexible cancellation: >=21 days before check-in => 100% refund; <21 days => 50% refund. Non-refundable => 0%. Full payment eventually, but prototype must use DEMO payment only and NEVER collect real card data.
Guest fields only: full name, email, mobile, guest count. Main guest 18+. Mention ID/passport at personal check-in. Mandatory terms/cancellation checkbox; non-refundable explicit no-refund acknowledgement.
Flow: availability -> dates/guests -> Flexible vs Non-refundable -> guest details -> demo payment -> confirmation. Confirmation says PERSONAL check-in from 15:00, never self check-in.
“My booking”: email + unique booking code, no account/password. Show stay/payment/rate/policy. Date changes are request/contact only, never automatic. Self-service cancellation calculates exact refund before second confirmation; demo cancellation/reopen dates.
Manual/admin blocked dates unavailable.

ADMIN — ONE ADMIN, MOBILE-FIRST
Demo login/protected-looking admin, no real credentials/auth yet. Dashboard: gross revenue, payment fees placeholder, net revenue, bookings, nights, occupancy monthly/yearly, restrained charts. Booking calendar states Available/Booked/Blocked + check-in/out. Booking detail.
Actions: block/unblock ranges with internal reason; create manual customer booking; edit price/min nights for date/range; non-refundable always 10% below current flexible rate.
Reviews moderation: pending -> approve/reject; only approved public.
Notification settings UI: email + push for new paid booking (demo).
Email automation previews: booking confirmation guest+owner; pre-arrival email 2 days before with warm safe-travels/contact-us placeholder; post-checkout thank-you + unique verified review link. No actual sending yet.
No promo codes. No multi-admin.
Use standard Lovable full-stack TypeScript/Tailwind/shadcn. Local/browser persistence is fine for v1; architect cleanly for later database + Stripe. Seed sample bookings/blocked dates. Make core buttons and demo flows functional. Do not publish production or connect mmhome.gr yet.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/03be2a65-662b-4004-b2ad-677a0908946a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
