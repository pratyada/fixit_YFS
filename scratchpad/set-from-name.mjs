// One-shot: set a friendly From display name on fixit-marketing-api without
// touching any other env var, and without ever printing/echoing secrets.
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';

const FN = 'fixit-marketing-api';
const REGION = 'us-east-1';
const NEW_FROM = 'FIXIT by YourFormSux <noreply@yourformsux.com>';

const cur = JSON.parse(
  execFileSync('aws', [
    'lambda', 'get-function-configuration',
    '--function-name', FN, '--region', REGION,
    '--query', 'Environment.Variables', '--output', 'json',
  ], { encoding: 'utf8' })
);

cur.MARKETING_FROM_EMAIL = NEW_FROM;

const tmp = '/tmp/fixit-from-name-update.json';
writeFileSync(tmp, JSON.stringify({
  FunctionName: FN,
  Environment: { Variables: cur },
}));

try {
  execFileSync('aws', [
    'lambda', 'update-function-configuration',
    '--region', REGION,
    '--cli-input-json', `file://${tmp}`,
    '--query', 'Environment.Variables.MARKETING_FROM_EMAIL',
    '--output', 'text',
  ], { stdio: 'inherit' });
} finally {
  unlinkSync(tmp);
}
console.log('\nDone. From set to:', NEW_FROM);
