import type {ReactNode} from 'react';
import {webUrlSchema} from '@/lib/web-url';
import {descriptionParts, type DescriptionPart} from '@/lib/description-format';

/** Deliberately small formatting vocabulary; user HTML is always escaped by React. */
function renderParts(parts: DescriptionPart[]):ReactNode[] {
  return parts.map((part,index)=>{
    if(typeof part === 'string') return part;
    const children = renderParts(part.children);
    if(part.kind === 'bold') return <strong key={index}>{children}</strong>;
    if(part.kind === 'italic') return <em key={index}>{children}</em>;
    if(part.kind === 'underline') return <u key={index}>{children}</u>;
    const parsed=webUrlSchema.safeParse(part.url);
    return parsed.success&&parsed.data ? <a key={index} href={parsed.data} target="_blank" rel="noopener noreferrer" className="underline">{children}</a> : <span key={index}>{children}</span>;
  });
}
const inline = (text: string) => renderParts(descriptionParts(text));

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
