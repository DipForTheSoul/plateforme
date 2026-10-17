import {act,render,waitFor,fireEvent,screen} from '@testing-library/react';
import {beforeEach,it,expect,vi} from 'vitest';
import {PageViewTracker} from '@/components/PageViewTracker';
import {GoogleAnalytics} from '@/components/GoogleAnalytics';
import {AudiencePreferences} from '@/components/AudiencePreferences';
import {AUDIENCE_CONSENT,AUDIENCE_EVENT,AUDIENCE_ID} from '@/lib/audience';
vi.mock('next/navigation',()=>({usePathname:()=>'/experiences'}));
vi.mock('next-intl',()=>({useLocale:()=> 'fr'}));
vi.mock('next/script',()=>({default:()=>null}));
beforeEach(()=>{
 vi.spyOn(document,'visibilityState','get').mockReturnValue('visible');
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200}));
 document.cookie=`${AUDIENCE_CONSENT}=; Max-Age=0; Path=/`;
});
it('ne compte rien avant accord, puis une seule fois par jour malgré un remontage',async()=>{
 const first=render(<PageViewTracker/>);expect(fetch).not.toHaveBeenCalled();
 localStorage.setItem(AUDIENCE_CONSENT,'accepted');
 act(()=>window.dispatchEvent(new Event(AUDIENCE_EVENT)));
 await waitFor(()=>expect(JSON.parse(localStorage.getItem(AUDIENCE_ID)!).lastSent).toBeTruthy());
 first.unmount();render(<PageViewTracker/>);expect(fetch).toHaveBeenCalledTimes(1);
});
it('une réponse tardive ne restaure pas un identifiant après retrait',async()=>{
 let resolve!:(value:Response)=>void;
 vi.mocked(fetch).mockReturnValue(new Promise(r=>{resolve=r;}) as Promise<Response>);
 localStorage.setItem(AUDIENCE_CONSENT,'accepted');render(<PageViewTracker/>);
 localStorage.setItem(AUDIENCE_CONSENT,'refused');localStorage.removeItem(AUDIENCE_ID);
 await act(async()=>resolve({ok:true,status:200} as Response));
 expect(localStorage.getItem(AUDIENCE_ID)).toBeNull();
});
it('propose le choix sans Google Analytics et permet de rouvrir après refus',()=>{
 vi.stubEnv('NEXT_PUBLIC_GA_ID','');
 render(<><GoogleAnalytics locale="fr"/><AudiencePreferences/></>);
 fireEvent.click(screen.getByRole('button',{name:'Refuser'}));
 expect(localStorage.getItem(AUDIENCE_CONSENT)).toBe('refused');
 expect(screen.queryByRole('button',{name:'Accepter'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Préférences cookies'}));
 expect(screen.getByRole('button',{name:'Accepter'})).toBeVisible();
});
