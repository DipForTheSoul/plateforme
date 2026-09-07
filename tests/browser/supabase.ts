// Test-only storage: no request reaches a live account. Actual compression still runs.
const urls = new Map<string,string>();
export function createClient() { return {
  auth: {getUser:async()=>({data:{user:{id:'local-test'}}})},
  storage:{from:()=>({upload:async(path:string,blob:Blob)=>{urls.set(path,URL.createObjectURL(blob));return {error:null};},getPublicUrl:(path:string)=>({data:{publicUrl:urls.get(path)}})})},
}; }
