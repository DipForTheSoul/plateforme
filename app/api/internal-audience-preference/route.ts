import {NextResponse} from 'next/server';
import {INTERNAL_AUDIENCE} from '@/lib/audience';

export async function POST(request:Request) {
  const origin=new URL(request.url).origin;
  if(request.headers.get('origin')!==origin)return new NextResponse(null,{status:403});
  const form=await request.formData();
  const choice=form.get('choice');
  if(choice!=='enabled'&&choice!=='disabled')return new NextResponse(null,{status:400});
  let target=new URL('/confidentialite',request.url);
  try{const ref=new URL(request.headers.get('referer')??'');if(ref.origin===origin)target=ref;}catch{}
  const response=NextResponse.redirect(target,{status:303});
  response.cookies.set(INTERNAL_AUDIENCE,choice,{path:'/',maxAge:31536000,sameSite:'lax',secure:new URL(request.url).protocol==='https:'});
  return response;
}
