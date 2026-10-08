import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
test('tracked files contain no embedded Neon database credentials',()=>{
 const walk=(dir='.')=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>['node_modules','.pnpm-store','.git','.next','.env','coverage'].includes(e.name)||e.name.startsWith('.env')?[]:e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]);
 let files;try{files=execFileSync('git',['ls-files'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim().split('\n');}catch{files=walk();}
 const leaked=files.filter(f=>{try{return /postgres(?:ql)?:\/\/[^\s:@"'`]+:[^\s@"'`]+@[^\s/"'`]*neon\.tech/.test(readFileSync(f,'utf8'));}catch{return false;}});
 assert.deepEqual(leaked,[], 'credential literals must be supplied through environment variables');
});
