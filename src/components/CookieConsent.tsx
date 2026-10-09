import {useEffect,useState} from 'react';
import {Link} from '@tanstack/react-router';
import {Button} from '@/components/ui/button';
import {useT} from '@/lib/i18n';
import {useStore} from '@/lib/store';
import {analyticsAllowed,CONSENT_KEY,trackFunnel} from '@/lib/analytics';
export function CookieConsent(){
 const {lang}=useT();const {settings}=useStore();const [choice,setChoice]=useState<string|null>(null);const [open,setOpen]=useState(false);const [analytics,setAnalytics]=useState(false);
 useEffect(()=>{const c=localStorage.getItem(CONSENT_KEY);setChoice(c);setAnalytics(c==='analytics');setOpen(!c);const handler=()=>setOpen(true);window.addEventListener('mm-cookie-settings',handler);trackFunnel('site_visit');return()=>window.removeEventListener('mm-cookie-settings',handler)},[]);
 useEffect(()=>{
 const w=window as Window & {dataLayer?:unknown[];gtag?:(...args:unknown[])=>void};
 const enabled=analyticsAllowed(settings.analyticsEnabled,settings.analyticsId,choice==='analytics');
 (w as unknown as Record<string,unknown>)[`ga-disable-${settings.analyticsId}`]=!enabled;
 if(!enabled){w.gtag?.('consent','update',{analytics_storage:'denied'});return;}
 w.dataLayer=w.dataLayer||[];w.gtag=function(...args:unknown[]){w.dataLayer?.push(args)};
 w.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 w.gtag('js',new Date());w.gtag('config',settings.analyticsId,{send_page_view:true});
 const script=document.createElement('script');script.async=true;script.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(settings.analyticsId)}`;document.head.append(script);
 return()=>script.remove();
 },[choice,settings.analyticsEnabled,settings.analyticsId]);
 const save=(yes:boolean)=>{localStorage.setItem(CONSENT_KEY,yes?'analytics':'necessary');setChoice(yes?'analytics':'necessary');setAnalytics(yes);setOpen(false);if(!yes){document.cookie.split(';').map(c=>c.trim().split('=')[0]).filter(n=>n.startsWith('_ga')).forEach(n=>{document.cookie=`${n}=; Max-Age=0; path=/`;});}};
 if(!open)return null;
 return <section aria-label={lang==='el'?'Επιλογές cookies':'Cookie choices'} className="fixed bottom-3 left-3 right-3 z-50 mx-auto max-w-2xl border bg-background p-5 shadow-lg rounded-lg"><h2 className="text-2xl">{lang==='el'?'Η ιδιωτικότητά σας':'Your privacy'}</h2><p className="text-sm text-muted-foreground my-3">{lang==='el'?'Τα απαραίτητα cookies υποστηρίζουν τη διαμονή σας στον ιστότοπο. Τα προαιρετικά στατιστικά ενεργοποιούνται μόνο με τη συγκατάθεσή σας.':'Necessary cookies support your visit. Optional analytics are enabled only with your consent.'}</p><label className="flex items-center gap-3 text-sm mb-4"><input type="checkbox" checked={analytics} onChange={e=>setAnalytics(e.target.checked)}/>{lang==='el'?'Προαιρετικά στατιστικά':'Optional analytics'}</label><div className="flex gap-2 flex-wrap"><Button variant="outline" onClick={()=>save(false)}>{lang==='el'?'Μόνο απαραίτητα':'Necessary only'}</Button><Button onClick={()=>save(analytics)}>{lang==='el'?'Αποθήκευση επιλογής':'Save choice'}</Button><Button variant="link" asChild><Link to="/cookies">{lang==='el'?'Cookies':'Cookies'}</Link></Button></div></section>
}
