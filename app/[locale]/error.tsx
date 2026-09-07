"use client";
import {useLocale} from 'next-intl';
import {Link} from '@/i18n/navigation';

export default function ErrorPage({retry}:{error:Error & {digest?:string};retry:()=>void}) {
  const locale=useLocale();
  const text=locale==='de'?{title:'Die Aktion konnte nicht bestätigt werden.',body:'Laden Sie die Seite neu und prüfen Sie den aktuellen Stand, bevor Sie die Aktion wiederholen.',retry:'Erneut laden',home:'Zur Startseite'}:locale==='en'?{title:'The action could not be confirmed.',body:'Reload the page and check its current state before repeating the action.',retry:'Reload',home:'Back to home'}:{title:'L’action n’a pas pu être confirmée.',body:'Rechargez la page et vérifiez son état avant de recommencer l’opération.',retry:'Recharger',home:'Retour à l’accueil'};
  return <section role="alert" className="mx-auto max-w-xl px-4 py-16"><h1 className="text-2xl">{text.title}</h1><p className="my-5">{text.body}</p><div className="flex flex-wrap gap-3"><button className="btn-primary" onClick={()=>retry()}>{text.retry}</button><Link className="btn-secondary" href="/">{text.home}</Link></div></section>;
}
