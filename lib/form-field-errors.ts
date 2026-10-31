import type {ZodIssue} from 'zod';

const copy = {
  fr: {invalid:'Vérifiez ce champ.',url:'Saisissez une adresse web valide, par exemple monsite.ch.',email:'Saisissez une adresse e-mail valide.',signupBio:'La biographie ne doit pas dépasser 4 000 caractères.',profileBio:'La biographie ne doit pas dépasser 4 000 caractères.',name:'Vérifiez le nom : il est trop court ou trop long.',activities:'Choisissez entre 1 et 10 activités.',password:'Le mot de passe doit contenir au moins 8 caractères.',summary:'Veuillez corriger les champs indiqués. Votre saisie est conservée.',characters:'caractères',maximum:'Maximum'},
  de: {invalid:'Bitte prüfen Sie dieses Feld.',url:'Geben Sie eine gültige Webadresse ein, zum Beispiel meine-seite.ch.',email:'Geben Sie eine gültige E-Mail-Adresse ein.',signupBio:'Die Biografie darf höchstens 4.000 Zeichen enthalten.',profileBio:'Die Biografie darf höchstens 4.000 Zeichen enthalten.',name:'Bitte prüfen Sie den Namen: Er ist zu kurz oder zu lang.',activities:'Wählen Sie zwischen 1 und 10 Aktivitäten.',password:'Das Passwort muss mindestens 8 Zeichen enthalten.',summary:'Bitte korrigieren Sie die angegebenen Felder. Ihre Eingaben bleiben erhalten.',characters:'Zeichen',maximum:'Höchstens'},
  en: {invalid:'Please check this field.',url:'Enter a valid web address, for example mysite.ch.',email:'Enter a valid email address.',signupBio:'The biography must not exceed 4,000 characters.',profileBio:'The biography must not exceed 4,000 characters.',name:'Please check the name: it is too short or too long.',activities:'Choose between 1 and 10 activities.',password:'The password must contain at least 8 characters.',summary:'Please correct the indicated fields. Your entries have been preserved.',characters:'characters',maximum:'Maximum'},
};

export function formValidationCopy(locale:string) { return copy[locale as keyof typeof copy] ?? copy.fr; }

/** Public, actionable feedback only; never echo input values or provider errors. */
export function formFieldErrors(issues:ZodIssue[],locale:string,kind:'signup'|'profile') {
  const t=formValidationCopy(locale);
  const errors:Record<string,string>={};
  for(const issue of issues) {
    const field=String(issue.path[0]??'');
    if(!field||field==='fax'||errors[field]) continue;
    errors[field]=['website','instagram','facebook','googleUrl','review_url'].includes(field)?t.url:
      field==='bio'?(kind==='signup'?t.signupBio:t.profileBio):field==='email'?t.email:
      ['name','firstName','lastName','artistName'].includes(field)?t.name:
      field==='specialties'?t.activities:field==='password'?t.password:t.invalid;
  }
  return errors;
}
