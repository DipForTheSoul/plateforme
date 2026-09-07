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

export function csvCell(value: string | null | undefined): string {
  let text=value??'';
  // Quoting alone does not prevent spreadsheet formula execution.
  if(/^[\s]*[=+@-]/.test(text))text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
}
