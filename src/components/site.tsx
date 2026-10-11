import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Phone, Mail, MessageCircle, Facebook, Instagram } from "lucide-react";
import { SLOGAN, useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import logoSrc from "@/assets/mmhome-logo.png";

/** Official MM Home emblem (exact uploaded file, downscaled only). */
export function Logo({ size = 44 }: { size?: number }) {
  return <img src={logoSrc} alt="MM Home" width={size} height={size} className="shrink-0 object-contain" style={{ width: size, height: size }} />;
}

export function LangSwitch() {
  const { lang, setLang } = useT();
  return (
    <div className="flex items-center gap-1 text-xs tracking-widest">
      {(["el", "en"] as const).map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-muted-foreground">|</span>}
          <button onClick={() => setLang(l)} className={lang === l ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}>{l.toUpperCase()}</button>
        </span>
      ))}
    </div>
  );
}

const links = [["/", "home"], ["/stay", "stay"], ["/amenities", "amenities"], ["/location", "location"], ["/reviews", "reviews"], ["/my-booking", "my"]] as const;

export function SiteHeader() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-5 h-18 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <Logo size={40} />
          <span className="font-serif text-2xl">MM Home</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-7 text-sm">
          {links.map(([to, k]) => (
            <Link key={to} to={to} className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }} activeOptions={{ exact: true }}>{t.nav[k]}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <LangSwitch />
          <Link to="/book" className="btn-gold hidden sm:inline-flex !py-2.5">{t.nav.book}</Link>
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {open && (
        <nav className="lg:hidden border-t px-5 py-4 flex flex-col gap-3 bg-background">
          {[...links, ["/book", "book"] as const].map(([to, k]) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} className="font-serif text-2xl">{t.nav[k]}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  const { t, lang } = useT();
  const { settings } = useStore();
  return (
    <footer className="mt-24 border-t bg-secondary/50">
      <div className="mx-auto max-w-7xl px-5 py-14 grid gap-10 md:grid-cols-3">
        <div className="space-y-3">
          <div className="flex items-center gap-3"><Logo /><span className="font-serif text-2xl">MM Home</span></div>
          <p className="font-serif italic text-lg text-muted-foreground">{SLOGAN}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="eyebrow mb-3">{t.footer.contact}</p>
          <p className="flex items-center gap-2"><Phone size={15} /> <a href={`tel:${settings.phone.replace(/[^+0-9]/g, "")}`}>{settings.phone}</a></p>
          <a href="mailto:info@mmhome.gr" className="flex items-center gap-2"><Mail size={15} /> info@mmhome.gr</a>
          <p>www.mmhome.gr</p>
          <p className="flex items-center gap-2"><MessageCircle size={15} /> {settings.viberUrl ? <a href={settings.viberUrl}>Viber</a> : <span>Viber · {lang === "el" ? "σύντομα" : "coming soon"}</span>}</p>
          <div className="flex gap-4 pt-2 text-muted-foreground">
            {settings.facebookUrl ? <a href={settings.facebookUrl} aria-label="Facebook"><Facebook size={18} /></a> : <span title="Facebook"><Facebook size={18} /></span>}
            {settings.instagramUrl ? <a href={settings.instagramUrl} aria-label="Instagram"><Instagram size={18} /></a> : <span title="Instagram"><Instagram size={18} /></span>}
          </div>
        </div>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>{settings.address || t.common.addressPending}</p>
          <p>{lang === "el" ? "Τρίκαλα, Ελλάδα" : "Trikala, Greece"}</p>
          <div className="flex flex-col gap-2 pt-3"><Link to="/privacy">{lang === "el" ? "Πολιτική Απορρήτου" : "Privacy Policy"}</Link><Link to="/cookies">Cookies</Link><Link to="/terms">{lang === "el" ? "Όροι Κράτησης" : "Booking Terms"}</Link></div>
          <p className="pt-4">© 2026 MM Home. {t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-7xl px-5 pt-16 pb-10 fade-up">
      <h1 className="text-5xl md:text-6xl">{title}</h1>
      {sub && <p className="mt-4 text-lg text-muted-foreground max-w-xl">{sub}</p>}
    </div>
  );
}
