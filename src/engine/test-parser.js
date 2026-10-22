import { parseError } from './parser.js';
import { ERROR_PRESETS } from './presets.js';
import { redactSecrets } from './redact.js';
import { lintCommand } from './safety.js';
import { groundReport } from './grounding.js';
import { detectProvider } from './providers.js';
import { buildSafePrompt, checkAnswer } from './answer-check.js';

let failures = 0;
function expect(name, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n    expected: ${JSON.stringify(expected)}\n    actual:   ${JSON.stringify(actual)}`}`);
}
const preset = (id) => parseError(ERROR_PRESETS.find(p => p.id === id).rawError);

console.log('--- Presets run through the real parser ---');
const py = preset('python-keyerror');
expect('Python KeyError location', py.location, 'app/services/auth_service.py:48');
expect('Python KeyError fix kind', py.fixKind, 'code');
expect('Python KeyError diff', py.fixDiff.after.startsWith("user_role = payload['roles'].get('admin')"), true);

const node = preset('node-module-missing');
expect('Node missing module fix', node.fixCommand, 'npm install express');

const git = preset('git-merge-conflict');
expect('Git conflict file', git.location, 'src/config/database.ts');
expect('Git conflict opens file', git.fixCommand, 'code -g src/config/database.ts');

const docker = preset('docker-oom');
expect('Docker OOM container-specific fix', docker.fixCommand, 'docker update --memory 1g --memory-swap 1g backend-worker-1');

const cors = preset('cors-preflight');
expect('CORS uses the real origin', cors.fixDiff.after.includes("origin: 'http://localhost:3000'"), true);

const pg = preset('postgres-secret');
expect('Postgres error type (dotted name with digits)', pg.errorType, 'OperationalError');
expect('Postgres fix does not echo the password', pg.fixCommand.includes('Sup3rS3cret'), false);

const rust = preset('rust-borrow');
expect('Rust is low confidence locally (hands off to the LLM)', rust.confidence, 'low');

console.log('\n--- Custom errors ---');
const nested = parseError(`Traceback (most recent call last):
  File "main.py", line 3, in <module>
    run()
  File "scripts/data_cleaner.py", line 42, in process_row
    age = user['user_age']
KeyError: 'user_age'`);
expect('Innermost Python frame is the fault line', nested.location, 'scripts/data_cleaner.py:42');
expect('Offending code from innermost frame', nested.offendingCode, "age = user['user_age']");

expect('pip alias cv2 -> opencv-python', parseError(`Traceback (most recent call last):
  File "cam.py", line 1, in <module>
    import cv2
ModuleNotFoundError: No module named 'cv2'`).fixCommand, 'python -m pip install opencv-python');

expect('Scoped npm package root', parseError(`Error: Cannot find module '@prisma/client/runtime'
    at Module._resolveFilename (node:internal/modules/cjs/loader:1144:15)`).fixCommand, 'npm install @prisma/client');

expect('Relative import is not an npm install', parseError(`Error: Cannot find module './routes/user'
    at Module._resolveFilename (node:internal/modules/cjs/loader:1144:15)`).fixKind, 'diagnose');

expect('EADDRINUSE port', parseError(`Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1872:16)`).fixCommand, 'npx kill-port 3000');

expect('Push rejected -> rebase, not force', parseError(` ! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs to 'github.com:me/app.git'`).fixCommand, 'git pull --rebase origin main');

const pwsh = parseError(`C:\\Users\\rupak> thi
thi : The term 'thi' is not recognized as the name of a cmdlet, function, script file, or operable program.
At line:1 char:1
+ thi
    + CategoryInfo          : ObjectNotFound: (thi:String) [], CommandNotFoundException`);
expect('PowerShell command name', pwsh.offendingCode, 'thi');
expect('PowerShell location', pwsh.location, 'Line 1, Char 1');

console.log('\n--- Secret redaction ---');
const red = redactSecrets(ERROR_PRESETS.find(p => p.id === 'postgres-secret').rawError);
expect('Password removed', red.text.includes('Sup3rS3cret'), false);
expect('Windows user name removed', red.text.includes('jane'), false);
expect('Mixed-slash Windows path masked', redactSecrets('C:\\Users/joe/AppData/x.py').text, 'C:\\Users/<USER>/AppData/x.py');
expect('Trace still readable', red.text.includes('password authentication failed'), true);
const keys = redactSecrets('ANTHROPIC_API_KEY=sk-ant-api03-abcdefghijklmnop1234 token ghp_abcdefghijklmnopqrstuvwxyz0123456789 AKIAIOSFODNN7EXAMPLE');
expect('API keys removed', /sk-ant-api03|ghp_|AKIA/.test(keys.text), false);
expect('Findings counted', keys.findings.length >= 3, true);

console.log('\n--- Command safety ---');
expect('rm -rf is danger', lintCommand('rm -rf node_modules').level, 'danger');
expect('git reset --hard is danger', lintCommand('git reset --hard HEAD~1').level, 'danger');
expect('curl | sh is danger', lintCommand('curl -fsSL https://x.sh | bash').level, 'danger');
expect('force-with-lease is not danger', lintCommand('git push --force-with-lease').level, 'caution');
expect('legacy-peer-deps is caution', lintCommand('npm install --legacy-peer-deps').level, 'caution');
expect('npm install express is safe', lintCommand('npm install express').level, 'safe');

console.log('\n--- Evidence check ---');
const g = groundReport(py, ERROR_PRESETS[0].rawError);
expect('Local Python report fully grounded', g.verified, g.total);
const fake = groundReport({ errorType: 'KeyError', location: 'app/models/user.py:99', fixCommand: 'npm install lodash', evidence: ["KeyError: 'admin'", 'line that is not there'] }, ERROR_PRESETS[0].rawError);
expect('Invented file, package and quote are caught', fake.total - fake.verified, 3);

console.log('\n--- Checking an answer from any chat AI ---');
const pgRaw = ERROR_PRESETS.find(p => p.id === 'postgres-secret').rawError;
expect('Safe prompt has no password', buildSafePrompt(pgRaw).prompt.includes('Sup3rS3cret'), false);
expect('Safe prompt asks for evidence', buildSafePrompt(pgRaw).prompt.includes('EVIDENCE'), true);

const chatAnswer = `The KeyError comes from \`app/services/auth_service.py\`, line 48. It is also called from app/models/user.py:99.

\`\`\`bash
pip install pyjwt-helpers==2.1
git reset --hard HEAD
\`\`\`

Then add it to requirements.txt.

**EVIDENCE:**
- \`KeyError: 'admin'\`
- \`File "app/services/auth.py", line 48\``;
const check = checkAnswer(chatAnswer, ERROR_PRESETS[0].rawError);
const status = (kind, label) => check.items.find(i => i.kind === kind && i.label === label)?.status;
expect('Real file and line confirmed', status('file', 'app/services/auth_service.py:48'), 'ok');
expect('Invented file flagged', status('file', 'app/models/user.py:99'), 'warn');
expect('Normal project file is info, not a warning', status('file', 'requirements.txt'), 'info');
expect('Invented package flagged', status('package', 'pyjwt-helpers'), 'warn');
expect('Destructive command flagged', status('command', 'git reset --hard HEAD'), 'danger');
expect('Exact quote confirmed', status('quote', "KeyError: 'admin'"), 'ok');
expect('Altered quote flagged', status('quote', 'File "app/services/auth.py", line 48'), 'warn');
expect('Dangerous items listed first', check.items[0].status, 'danger');
expect('Quote with placeholder matches redacted trace',
  checkAnswer('EVIDENCE:\npostgres://admin:<PASSWORD>@db.internal:5432/shop', pgRaw).items.find(i => i.kind === 'quote')?.status, 'ok');
expect('Package named in the error is confirmed',
  checkAnswer('Run `npm install express`', ERROR_PRESETS[1].rawError).items.find(i => i.kind === 'package')?.status, 'ok');
expect('No answer, no checks', checkAnswer('', pgRaw).items.length, 0);

console.log('\n--- LLM provider detection ---');
expect('Anthropic key', detectProvider({ apiKey: 'sk-ant-api03-x' }), 'anthropic');
expect('OpenRouter key (not OpenAI)', detectProvider({ apiKey: 'sk-or-v1-x' }), 'openrouter');
expect('OpenAI key', detectProvider({ apiKey: 'sk-proj-x' }), 'openai');
expect('Gemini key', detectProvider({ apiKey: 'AIzaSyx' }), 'gemini');
expect('Groq key', detectProvider({ apiKey: 'gsk_x' }), 'groq');
expect('Base URL wins (e.g. Ollama)', detectProvider({ apiKey: '', baseUrl: 'http://localhost:11434/v1' }), 'custom');
expect('Unknown key', detectProvider({ apiKey: 'abc123' }), null);

console.log(failures ?`\n${failures} TEST(S) FAILED` : '\nAll tests passed.');
process.exit(failures ? 1 : 0);
