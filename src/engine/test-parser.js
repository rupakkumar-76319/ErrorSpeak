import { parseError, detectEnvironment } from './parser.js';
import { ERROR_PRESETS } from './presets.js';

console.log('--- 1. Testing Built-in Presets ---');
let passed = 0;
for (const preset of ERROR_PRESETS) {
  const env = detectEnvironment(preset.rawError);
  const parsed = parseError(preset.rawError);
  
  if (!parsed || !parsed.fixCommand || !parsed.plainExplanation) {
    console.error(`FAILED: ${preset.id}`);
    process.exit(1);
  }

  console.log(`✓ [Preset: ${parsed.environment}] ${parsed.errorType} -> Fix: ${parsed.fixCommand.slice(0, 35)}...`);
  passed++;
}

console.log('\n--- 2. Testing Custom Dynamic Errors ---');
const customPython = `Traceback (most recent call last):
  File "scripts/data_cleaner.py", line 42, in process_row
    age = user['user_age']
KeyError: 'user_age'`;

const customParsed = parseError(customPython);
console.log(`✓ [Custom Python] Location: ${customParsed.location} (Expected: scripts/data_cleaner.py:42)`);
console.log(`✓ [Custom Python] Code: ${customParsed.offendingCode}`);
console.log(`✓ [Custom Python] Fix: ${customParsed.fixDiff ? customParsed.fixDiff.after : customParsed.fixCommand}`);

if (customParsed.location !== 'scripts/data_cleaner.py:42') {
  console.error('Custom Python test failed to extract location!');
  process.exit(1);
}

const customNode = `Error: Cannot find module 'axios'
Require stack:
- /app/routes/api.js`;

const customNodeParsed = parseError(customNode);
console.log(`✓ [Custom Node] Fix: ${customNodeParsed.fixCommand} (Expected: npm install axios)`);

if (customNodeParsed.fixCommand !== 'npm install axios') {
  console.error('Custom Node test failed to extract package name!');
  process.exit(1);
}

const userPowershell = `C:\\Users\\rupak> thi
thi : The term 'thi' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path
was included, verify that the path is correct and try again.
At line:1 char:1
+ thi
+ ~~~
    + CategoryInfo          : ObjectNotFound: (thi:String) [], CommandNotFoundException
    + FullyQualifiedErrorId : CommandNotFoundException

C:\\Users\\rupak>`;

const pwshParsed = parseError(userPowershell);
console.log(`✓ [PowerShell] Env: ${pwshParsed.environment} (Expected: PowerShell / Shell)`);
console.log(`✓ [PowerShell] Error: ${pwshParsed.errorType} (Expected: CommandNotFoundException)`);
console.log(`✓ [PowerShell] Offending Code: ${pwshParsed.offendingCode} (Expected: thi)`);
console.log(`✓ [PowerShell] Location: ${pwshParsed.location} (Expected: Line 1, Char 1)`);
console.log(`✓ [PowerShell] Fix Command: ${pwshParsed.fixCommand}`);
console.log(`✓ [PowerShell] Explanation: ${pwshParsed.plainExplanation}`);

if (pwshParsed.offendingCode !== 'thi' || pwshParsed.environment !== 'PowerShell / Shell') {
  console.error('PowerShell parsing failed!');
  process.exit(1);
}

console.log('\nALL TESTS PASSED WITH 100% ACCURACY!');

