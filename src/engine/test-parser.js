import { parseError, detectEnvironment } from './parser.js';
import { ERROR_PRESETS } from './presets.js';

console.log('Running ErrorSpeak Triage Engine Verification...');

let passed = 0;
for (const preset of ERROR_PRESETS) {
  const env = detectEnvironment(preset.rawError);
  const parsed = parseError(preset.rawError);
  
  if (!parsed) {
    console.error(`FAILED: ${preset.id} failed to parse`);
    process.exit(1);
  }
  
  if (!parsed.fixCommand || !parsed.plainExplanation) {
    console.error(`FAILED: ${preset.id} missing fixCommand or plainExplanation`);
    process.exit(1);
  }

  console.log(`✓ [${parsed.environment}] ${parsed.errorType} -> Fix: ${parsed.fixCommand.slice(0, 35)}...`);
  passed++;
}

console.log(`\nALL ${passed}/${ERROR_PRESETS.length} PRESETS VERIFIED SUCCESSFULLY!`);
