import type {ReactNode} from 'react';
import {webUrlSchema} from '@/lib/web-url';

/** Deliberately small formatting vocabulary; user HTML is always escaped by React. */
function inline(text:string):ReactNode[] {
  return text.split(/(\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^\s)]+\))/g).map((part,index)=>{
    if(part.startsWith('**')&&part.endsWith('**'))return <strong key={index}>{part.slice(2,-2)}</strong>;
    const link=/^\[([^\]\n]+)\]\(([^\s)]+)\)$/.exec(part);
    if(link){const parsed=webUrlSchema.safeParse(link[2]);if(parsed.success&&parsed.data)return <a key={index} href={parsed.data} target="_blank" rel="noopener noreferrer" className="underline">{link[1]}</a>;}
    return part;
  });
}

/** Keep formatted descriptions and long URLs inside a narrow mobile viewport. */
export function EventDescription({text}: {text: string}) {
  const blocks:ReactNode[]=[];const lines=text.split('\n');
  for(let i=0;i<lines.length;i++){
    if(/^[-*] /.test(lines[i])){
      const items=[];
      while(i<lines.length&&/^[-*] /.test(lines[i])){items.push(<li key={i}>{inline(lines[i].slice(2))}</li>);i++;}
      i--;blocks.push(<ul key={`list-${i}`} className="my-3 list-disc pl-6">{items}</ul>);
    }else blocks.push(<div key={i} className="min-h-[1em] whitespace-pre-wrap">{inline(lines[i])}</div>);
  }
  return <div className="prose mt-8 max-w-none [overflow-wrap:anywhere] text-soul-ink/90">{blocks}</div>;
}
