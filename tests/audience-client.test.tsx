import {act,render,waitFor,fireEvent,screen} from '@testing-library/react';
import {beforeEach,it,expect,vi} from 'vitest';
import {PageViewTracker} from '@/components/PageViewTracker';
import {GoogleAnalytics} from '@/components/GoogleAnalytics';
import {AudiencePreferences} from '@/components/AudiencePreferences';
import {AUDIENCE_CONSENT,AUDIENCE_EVENT,AUDIENCE_ID,INTERNAL_AUDIENCE} from '@/lib/audience';
const state=vi.hoisted(()=>({path:'/experiences'}));
vi.mock('next/navigation',()=>({usePathname:()=>state.path}));
vi.mock('next-intl',()=>({useLocale:()=> 'fr'}));
vi.mock('next/script',()=>({default:({src}:{src?:string})=>src?<span data-testid="google-script">{src}</span>:null}));
beforeEach(()=>{
 Object.defineProperty(navigator,'webdriver',{configurable:true,get:()=>false});
 state.path='/experiences';vi.spyOn(document,'visibilityState','get').mockReturnValue('visible');
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200}));
 vi.stubEnv('NEXT_PUBLIC_GA_ID','G-TEST1234');
 for(const key of [AUDIENCE_CONSENT,INTERNAL_AUDIENCE])document.cookie=`${key}=; Max-Age=0; Path=/`;
});
it('informe puis compte sans accord Google et conserve l’identité lors du refus Google',async()=>{
 render(<><GoogleAnalytics locale="fr"/><PageViewTracker/></>);
 expect(screen.getByText(/Le compteur interne estime/)).toBeVisible();
 await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1));
 const identity=JSON.parse(localStorage.getItem(AUDIENCE_ID)!);
 expect(screen.queryByTestId('google-script')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Refuser Google Analytics'}));
 expect(JSON.parse(localStorage.getItem(AUDIENCE_ID)!).id).toBe(identity.id);
 expect(localStorage.getItem(INTERNAL_AUDIENCE)).toBe('enabled');
 expect(screen.queryByTestId('google-script')).toBeNull();
});
it('conserve un ancien refus et permet un choix interne indépendant',async()=>{
 localStorage.setItem(AUDIENCE_CONSENT,'refused');
 render(<><GoogleAnalytics locale="fr" initialConsent="refused"/><PageViewTracker/></>);
 await waitFor(()=>expect(localStorage.getItem(INTERNAL_AUDIENCE)).toBe('disabled'));
 expect(fetch).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Activer le compteur interne'}));
 await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1));
 expect(localStorage.getItem(AUDIENCE_CONSENT)).toBe('refused');
 expect(screen.queryByTestId('google-script')).toBeNull();
});
it('permet Google accepté avec compteur interne désactivé, puis conserve le refus après réouverture',async()=>{
 render(<><GoogleAnalytics locale="fr"/><AudiencePreferences/><PageViewTracker/></>);
 fireEvent.click(screen.getByRole('button',{name:'Désactiver le compteur interne'}));
 fireEvent.click(screen.getByRole('button',{name:'Accepter Google Analytics'}));
 expect(screen.getByTestId('google-script')).toBeVisible();
 expect(localStorage.getItem(INTERNAL_AUDIENCE)).toBe('disabled');
 fireEvent.click(screen.getByRole('button',{name:'Préférences de confidentialité'}));
 expect(screen.getByRole('button',{name:'Activer le compteur interne'})).toBeVisible();
});
it('conserve le même navigateur et compte chaque consultation, y compris les retours',async()=>{
 localStorage.setItem(INTERNAL_AUDIENCE,'enabled');
 const id='11111111-1111-4111-8111-111111111111';
 localStorage.setItem(AUDIENCE_ID,JSON.stringify({id,expires:Date.now()+86400000}));
 const view=render(<PageViewTracker/>);
 await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1));
 state.path='/lieux';view.rerender(<PageViewTracker/>);
 await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(2));
 state.path='/experiences';view.rerender(<PageViewTracker/>);
 await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(3));expect(JSON.parse(localStorage.getItem(AUDIENCE_ID)!).id).toBe(id);
 view.unmount();render(<PageViewTracker/>);await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(4));
 const visits=vi.mocked(fetch).mock.calls.map(call=>JSON.parse(String(call[1]?.body)));
 expect(new Set(visits.map(v=>v.browserId)).size).toBe(1);
 expect(new Set(visits.map(v=>v.eventId)).size).toBe(4);
});
it('une réponse tardive ne recrée pas l’identifiant après opposition',async()=>{
 let resolve!:(value:Response)=>void;
 vi.mocked(fetch).mockReturnValue(new Promise(r=>{resolve=r;}));
 localStorage.setItem(INTERNAL_AUDIENCE,'enabled');render(<PageViewTracker/>);
 localStorage.setItem(INTERNAL_AUDIENCE,'disabled');localStorage.removeItem(AUDIENCE_ID);
 await act(async()=>resolve({ok:true,status:200} as Response));expect(localStorage.getItem(AUDIENCE_ID)).toBeNull();
});
it('reprend après panne lors du retour sur l’onglet',async()=>{
 vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));
 localStorage.setItem(INTERNAL_AUDIENCE,'enabled');render(<PageViewTracker/>);
 await act(async()=>{});
 act(()=>document.dispatchEvent(new Event('visibilitychange')));
 await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(2));
 const calls=vi.mocked(fetch).mock.calls;
 expect(JSON.parse(String(calls[0][1]?.body)).eventId).toBe(JSON.parse(String(calls[1][1]?.body)).eventId);
});
it('n’invente pas un navigateur lorsque le stockage est bloqué',()=>{
 vi.spyOn(localStorage,'getItem').mockImplementation(()=>{throw new Error('blocked');});
 render(<PageViewTracker/>);expect(fetch).not.toHaveBeenCalled();
});
it('ne compte pas les zones privées ni un navigateur automatisé',()=>{
 localStorage.setItem(INTERNAL_AUDIENCE,'enabled');state.path='/admin';
 const view=render(<PageViewTracker/>);expect(fetch).not.toHaveBeenCalled();view.unmount();
 state.path='/experiences';vi.spyOn(navigator,'webdriver','get').mockReturnValue(true);
 render(<PageViewTracker/>);expect(fetch).not.toHaveBeenCalled();
});
it('une notification Google ne déclenche pas un relevé supplémentaire',async()=>{
 localStorage.setItem(INTERNAL_AUDIENCE,'enabled');render(<PageViewTracker/>);
 await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1));
 act(()=>window.dispatchEvent(new Event(AUDIENCE_EVENT)));expect(fetch).toHaveBeenCalledTimes(1);
});
