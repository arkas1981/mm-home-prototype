export type FunnelEvent = 'site_visit'|'availability_opened'|'booking_started'|'booking_completed';
export const CONSENT_KEY='mmhome-cookie-consent-v1';
export function analyticsAllowed(enabled:boolean,id:string,consent:boolean){return enabled && /^G-[A-Z0-9]+$/.test(id) && consent;}
export function trackFunnel(event:FunnelEvent){
 if(typeof window==='undefined') return;
 try {const key='mmhome-demo-funnel';const counts=JSON.parse(sessionStorage.getItem(key)||'{}'); counts[event]=(counts[event]||0)+1;sessionStorage.setItem(key,JSON.stringify(counts));window.dispatchEvent(new Event('mm-funnel'));}catch{/* optional demo statistics */}
 const w=window as Window & {gtag?:(...args:unknown[])=>void};
 if(localStorage.getItem(CONSENT_KEY)==='analytics') w.gtag?.('event',event);
}
