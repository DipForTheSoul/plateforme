/** Read every API page in a stable caller-defined order; never hide partial failures. */
export async function readPages<T>(page: (from:number,to:number)=>PromiseLike<{data:T[]|null;error:unknown}>, size=500):Promise<T[]> {
  const rows:T[]=[];
  for(let offset=0;;offset+=size){
    const result=await page(offset,offset+size-1);
    if(result.error)throw new Error('La lecture des données a échoué. Réessayez dans un instant.');
    const batch=result.data??[];rows.push(...batch);
    if(batch.length<size)return rows;
  }
}
