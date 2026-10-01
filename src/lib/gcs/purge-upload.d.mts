import type {Store,Registry} from './contracts.mjs';
export function purgeCompletedUpload(options:{url:string;bucket:string;origins:string[];app:string;route:string;store:Store;registry:Registry}):Promise<boolean>;
