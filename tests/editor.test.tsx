import {it, expect} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {DescriptionEditor} from '@/components/forms/DescriptionEditor';
import fr from '@/messages/fr.json';
it('ajoute l’italique au gras sans retirer le gras',()=>{
  render(<NextIntlClientProvider locale="fr" messages={fr}><DescriptionEditor defaultValue="Important"/></NextIntlClientProvider>);
  const field=screen.getByRole('textbox') as HTMLTextAreaElement;
  field.setSelectionRange(0,9);
  fireEvent.click(screen.getByRole('button',{name:'Gras'}));
  fireEvent.click(screen.getByRole('button',{name:'Italique'}));
  expect(field.value).toBe('***Important***');
});

it('formate une sélection en italique, souligné et emoji sans soumettre le formulaire',()=>{
  render(<NextIntlClientProvider locale="fr" messages={fr}><DescriptionEditor defaultValue="Texte important"/></NextIntlClientProvider>);
  const field=screen.getByRole('textbox') as HTMLTextAreaElement;
  field.setSelectionRange(0,5);
  fireEvent.click(screen.getByRole('button',{name:'Italique'}));
  expect(field.value).toBe('*Texte* important');
  field.setSelectionRange(8,17);
  fireEvent.click(screen.getByRole('button',{name:'Souligné'}));
  expect(field.value).toBe('*Texte* __important__');
  field.setSelectionRange(field.value.length,field.value.length);
  fireEvent.click(screen.getByRole('button',{name:'Emoji'}));
  fireEvent.click(screen.getByRole('button',{name:'😊'}));
  expect(field.value).toBe('*Texte* __important__😊');
});

it('valide le lien et préserve la sélection lorsque le panneau est utilisé',()=>{
  render(<NextIntlClientProvider locale="fr" messages={fr}><DescriptionEditor defaultValue="Inscription au cours"/></NextIntlClientProvider>);
  const field=screen.getByRole('textbox') as HTMLTextAreaElement;
  field.setSelectionRange(0,11);
  fireEvent.click(screen.getByRole('button',{name:'Lien externe'}));
  fireEvent.change(screen.getByLabelText('Adresse du lien'),{target:{value:'javascript:alert(1)'}});
  fireEvent.click(screen.getByRole('button',{name:'Insérer le lien'}));
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(field.value).toBe('Inscription au cours');
  fireEvent.change(screen.getByLabelText('Adresse du lien'),{target:{value:'example.ch/form(a)'}});
  fireEvent.click(screen.getByRole('button',{name:'Insérer le lien'}));
  expect(field.value).toBe('[Inscription](https://example.ch/form%28a%29) au cours');
});
