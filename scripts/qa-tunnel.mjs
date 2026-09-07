// Only loopback ports; Colima must run with --port-forwarder none.
import {spawn} from 'node:child_process';
import {homedir} from 'node:os';
import {readFile} from 'node:fs/promises';
const profile=`${homedir()}/.colima/forthesoul-qa/colima.yaml`;
if(!/^portForwarder: none$/m.test(await readFile(profile,'utf8')))throw new Error('Start forthesoul-qa with --port-forwarder none before opening QA ports.');
const args=['-F',`${homedir()}/.colima/_lima/colima-forthesoul-qa/ssh.config`,'-o','ExitOnForwardFailure=yes','-N'];
for(const port of [54321,54322,54324])args.push('-L',`127.0.0.1:${port}:127.0.0.1:${port}`);
args.push('lima-colima-forthesoul-qa');
const child=spawn('ssh',args,{stdio:'inherit'});
process.on('SIGINT',()=>child.kill('SIGINT'));process.on('SIGTERM',()=>child.kill('SIGTERM'));child.on('exit',code=>process.exit(code??1));
