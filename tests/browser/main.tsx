import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { EventForm } from '@/components/forms/EventForm';
import { EventDescription } from '@/components/EventDescription';
import {FeaturedPurchasePanel} from '@/components/forms/FeaturedPurchasePanel';
import {FeaturedOfferPurchaseCard} from '@/components/forms/FeaturedOfferPurchaseCard';
import {NewsletterForm} from '@/components/NewsletterForm';
import {ImageGallery} from '@/components/ImageGallery';
import { ProfileForm } from '@/app/[locale]/espace-praticien/profil/ProfileForm';
import { setMode } from './actions';
import fr from '@/messages/fr.json';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import type { Category, Practitioner, Event } from '@/types/database';
import '@/app/globals.css';
const dictionaries={fr,de,en};
const categories=[{id:'10000000-0000-4000-8000-000000000001',slug:'meditation',name:'Méditation',position:1}] as Category[];
const practitioner={id:'test-profile',name:'Praticien de test',bio:'Texte initial',languages:['fr'],specialties:[],photos:[],contact:{},links:{}} as unknown as Practitioner;
const event={id:'test-event',title:'Love Lounge test',description:'Description de test suffisamment longue.',start_date:'2026-10-09T09:00:00Z',images:[],languages:['fr'],recurrence:null,updated_at:'2026-09-07T00:00:00Z'} as unknown as Event;
function App(){
  const [locale,setLocale]=useState<'fr'|'de'|'en'>('fr');
  const [page,setPage]=useState('create');
  return <NextIntlClientProvider locale={locale} messages={dictionaries[locale]}>
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl">Laboratoire de tests local</h1>
      <details><summary>Test de description longue sur mobile</summary><EventDescription text={'Texte avec séparateurs très longs\n'+'>'.repeat(160)+'\n'+'https://example.com/'+ 'longurl'.repeat(50)} /></details>
      <p className="my-3">Composants réels · réponses serveur simulées · aucun e-mail ni paiement réel.</p>
      <nav className="mb-8 flex flex-wrap gap-3">
        <label>Langue <select aria-label="Langue de test" value={locale} onChange={e=>setLocale(e.target.value as typeof locale)}><option>fr</option><option>de</option><option>en</option></select></label>
        <label>Parcours <select aria-label="Parcours de test" value={page} onChange={e=>setPage(e.target.value)}><option value="create">Créer une expérience (admin)</option><option value="edit">Modifier une expérience</option><option value="profile">Profil praticien</option><option value="featured">Mise en avant — comparaison</option></select></label>
        <label>Résultat <select aria-label="Résultat serveur" onChange={e=>setMode(e.target.value)}><option value="validation">Erreur de validation</option><option value="network">Panne réseau</option><option value="success">Succès</option></select></label>
      </nav>
      <div key={locale+page}>{page==='featured'?<>
        <h2>Aperçu validé (démonstration)</h2><FeaturedOfferPurchaseCard/>
        <h2 className="mt-8">Composant corrigé (données de test)</h2>
        <div data-testid="featured-corrected" className="card p-5"><p>Offre de test publiée</p><FeaturedPurchasePanel eventId="qa-synthetic" price={20} days={30} pendingLabel="Ouverture…"/></div>
        <h2 className="mt-8">Galerie de test</h2><ImageGallery images={['/logo.png','/logo.png?second']} alt="Image de test"/>
        <div className="mt-40"><NewsletterForm placeholder="Email de test" consentLabel="Consentement de test" buttonLabel="Inscription de test" successMessage="Inscription simulée confirmée" errorMessage="Échec simulé"/></div>
      </>:page==='profile'?<ProfileForm practitioner={practitioner}/>:<EventForm categories={categories} venues={[]} defaultLanguages={['fr']} event={page==='edit'?event:undefined} practitioners={page==='create'?[{id:'20000000-0000-4000-8000-000000000001',name:'Praticien de test'}]:undefined}/>}</div>
    </main>
  </NextIntlClientProvider>;
}
createRoot(document.getElementById('root')!).render(<App/>);
