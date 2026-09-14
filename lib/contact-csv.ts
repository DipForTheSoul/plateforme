/** Small RFC-4180-style reader for the comma/semicolon imports offered in admin. */
export function parseContactCsv(text: string): string[][] {
  const input=text.replace(/^\uFEFF/,'');
  const header=input.split(/\r?\n/,1)[0].replace(/"(?:[^"]|"")*"/g,'');
  const delimiter=(header.match(/;/g)?.length??0)>(header.match(/,/g)?.length??0)?';':',';
  const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
  for(let i=0;i<input.length;i++) {
    const char=input[i];
    if(char==='"') {
      if(quoted && input[i+1]==='"'){cell+='"';i++;}
      else quoted=!quoted;
    } else if(char===delimiter && !quoted){row.push(cell.trim());cell='';}
    else if((char==='\n'||char==='\r')&&!quoted){row.push(cell.trim());rows.push(row);row=[];cell='';if(char==='\r'&&input[i+1]==='\n')i++;}
    else cell+=char;
  }
  if(quoted)throw new Error('Guillemets non fermés dans le CSV.');
  if(cell||row.length){row.push(cell.trim());rows.push(row);}
  return rows.filter(row=>row.some(Boolean));
}

export interface ImportedContact {
  email: string;
  firstName: string | null;
  lastName: string | null;
  interests: string[];
}

const headerAliases = {
  email: ['email', 'e-mail', 'email address', 'e-mail address', 'adresse email', 'adresse e-mail'],
  firstName: ['first name', 'firstname', 'prenom', 'prénom'],
  lastName: ['last name', 'lastname', 'surname', 'nom'],
  interests: ['labels', 'label', 'tags', 'tag', 'interests', 'interets', 'intérêts', 'etiquettes', 'étiquettes'],
} as const;

function normalizedHeader(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function findHeader(headers: string[], aliases: readonly string[]): number {
  const normalizedAliases = aliases.map(normalizedHeader);
  return headers.findIndex(value => normalizedAliases.includes(normalizedHeader(value)));
}

/**
 * Converts either the simple documented format or a Wix CSV export into the
 * four fields stored by ForTheSoul. A recognised header may be in any column.
 */
export function normalizeContactRows(rows: string[][]): ImportedContact[] {
  if (!rows.length) return [];

  const emailHeader = findHeader(rows[0], headerAliases.email);
  const hasHeader = emailHeader >= 0;
  const indexes = hasHeader ? {
    email: emailHeader,
    firstName: findHeader(rows[0], headerAliases.firstName),
    lastName: findHeader(rows[0], headerAliases.lastName),
    interests: findHeader(rows[0], headerAliases.interests),
  } : { email: 0, firstName: 1, lastName: 2, interests: 3 };

  return rows.slice(hasHeader ? 1 : 0).flatMap(cells => {
    const email = (cells[indexes.email] ?? '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return [];
    const valueAt = (index: number) => index >= 0 ? (cells[index] ?? '').trim() : '';
    return [{
      email,
      firstName: valueAt(indexes.firstName) || null,
      lastName: valueAt(indexes.lastName) || null,
      interests: valueAt(indexes.interests).split(/[|;,]/).map(value => value.trim()).filter(Boolean),
    }];
  });
}

export function csvCell(value: string | null | undefined): string {
  let text=value??'';
  // Quoting alone does not prevent spreadsheet formula execution.
  if(/^[\s]*[=+@-]/.test(text))text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
}
