import { ShieldCheck } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { depositCopy } from '@/lib/policies';
export function DepositNotice() {
 const {lang}=useT();
 return <aside className="border-t border-b py-5 text-sm leading-relaxed"><p className="flex items-center gap-2 font-medium text-olive mb-2"><ShieldCheck size={18}/>{lang==='el'?'Εγγύηση ζημιών · €500':'Damage security deposit · €500'}</p><p className="text-muted-foreground">{depositCopy[lang]}</p></aside>;
}
