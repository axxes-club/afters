import type {Pool} from 'pg';
import type {Registry,Receipt,UploadedFile} from './contracts.mjs';
export class PostgresRegistry implements Registry {
 constructor(pool:Pool);create(record:Receipt):Promise<void>;get(id:string):Promise<Receipt|null>;
 renewOnce(id:string,owner:string,run:(record:Receipt,transaction:unknown)=>Promise<unknown>):Promise<unknown>;
 completeOnce(id:string,owner:string,run:(record:Receipt,transaction:unknown)=>Promise<UploadedFile>):Promise<UploadedFile>;
}
