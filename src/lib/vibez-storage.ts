import { objectKeyFromUrl } from "@/lib/gcs/core.mjs";
// An isolated syntactic helper; imports are NOT authorized by parsing alone.
export function fileKeyFromUrl(url:string):string|null {
 try { const parsed=new URL(url); if(parsed.protocol!=="https:"||parsed.username||parsed.password||parsed.port)return null;
 if((parsed.hostname==="utfs.io"||/^[a-z0-9-]+\.ufs\.sh$/.test(parsed.hostname))&&/^\/f\/[A-Za-z0-9_.-]+$/.test(parsed.pathname)){const key=parsed.pathname.slice(3);if(key==="."||key==="..")return null;return "imports/uploadthing/"+key;}
 return objectKeyFromUrl(url,{bucket:process.env.GCS_ASSETS_BUCKET||"gravy-meta-axxes-production-assets",origins:[process.env.GCS_ASSETS_PUBLIC_ORIGIN||"https://afters.am"]});
 }catch{return null;}
}
// The authenticated purge job calls this only after the restore retention window.
export async function purgeStoredFile(url:string):Promise<boolean>{const{purgeVibezUpload}=await import("@/lib/gcs/server");return await purgeVibezUpload(url);}
