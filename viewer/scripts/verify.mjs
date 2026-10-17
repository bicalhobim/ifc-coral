import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('..',import.meta.url));
for(const args of [
 ['--experimental-strip-types','--test','tests/*.test.mjs'],
 ['node_modules/typescript/bin/tsc','--noEmit'],
 ['--experimental-strip-types','src/ifc/schedule.selfcheck.ts'],
 ['--experimental-strip-types','src/ui/gantt.selfcheck.ts'],
 ['--experimental-strip-types','src/ui/tree.selfcheck.ts'],
 ['node_modules/vite/bin/vite.js','build'],
]){
 const result=spawnSync(process.execPath,args,{cwd,stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status??1);
}
