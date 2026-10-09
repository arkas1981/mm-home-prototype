import { createFileRoute } from '@tanstack/react-router';
import { PageTitle } from '@/components/site';
import { useT } from '@/lib/i18n';
import { meta } from '@/lib/meta';
import { termsSections } from '@/lib/policies';
export const Route = createFileRoute('/terms')({ head:()=>meta('Όροι Κράτησης & Διαμονής — MM Home','Όροι διαμονής, εγγύηση €500 και πολιτική ακύρωσης του MM Home.'), component:Terms });
function Terms(){const {lang}=useT(); return <><PageTitle title={lang==='el'?'Όροι Κράτησης & Διαμονής':'Booking & Stay Terms'} sub={lang==='el'?'MM Home · Πολιτική Ακύρωσης':'MM Home · Cancellation Policy'}/><div className="max-w-3xl mx-auto px-5 space-y-9">{termsSections[lang].map(s=><section key={s.title} className="border-t pt-6"><h2 className="text-3xl mb-3">{s.title}</h2><p className="text-muted-foreground leading-relaxed">{s.body}</p></section>)}<a className="text-primary" href="mailto:info@mmhome.gr">info@mmhome.gr</a></div></>}
