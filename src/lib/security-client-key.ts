import {isIP} from "node:net";
export function securityClientKey(request:Request):string{
 const hops=Number(process.env.TRUSTED_PROXY_HOPS??0);
 if(!Number.isSafeInteger(hops)||hops<1||hops>8)return "anonymous";
 const chain=(request.headers.get("x-forwarded-for")??"").split(",").map(v=>v.trim());
 if(chain.length<hops)return "anonymous";
 const candidate=chain[chain.length-hops];
 return isIP(candidate)?candidate:"anonymous";
}
