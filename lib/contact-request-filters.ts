export interface ContactRequestFilters {practitioner?:string;from?:string;to?:string;q?:string}
export function contactRequestFilters(params:URLSearchParams|ContactRequestFilters):ContactRequestFilters{
  const get=(key:string)=>params instanceof URLSearchParams?params.get(key)??undefined:params[key as keyof ContactRequestFilters];
  return {practitioner:get("practitioner"),from:get("from"),to:get("to"),q:get("q")?.trim().slice(0,120)};
}

export function applyContactRequestFilters<T extends {eq:(column:string,value:string)=>T;gte:(column:string,value:string)=>T;lte:(column:string,value:string)=>T;or:(filters:string)=>T}>(query:T,filters:ContactRequestFilters):T{
  let next=query;
  if(filters.practitioner)next=next.eq("practitioner_id",filters.practitioner);
  if(filters.from)next=next.gte("created_at",`${filters.from}T00:00:00.000Z`);
  if(filters.to)next=next.lte("created_at",`${filters.to}T23:59:59.999Z`);
  if(filters.q){const safe=filters.q.replace(/[,%()]/g," ");next=next.or(`visitor_name.ilike.%${safe}%,visitor_email.ilike.%${safe}%,message.ilike.%${safe}%`);}
  return next;
}
