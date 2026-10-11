import { ERROR_PRESETS } from './presets.js';

export function detectEnvironment(rawText) {
  if (!rawText) return null;
  const text = rawText.toLowerCase();

  if (text.includes('traceback (most recent call last)') || text.includes('.py') || text.includes('keyerror') || text.includes('syntaxerror') || text.includes('importerror')) {
    return 'Python';
  }
  if (text.includes('cannot find module') || text.includes('node:internal') || text.includes('package.json') || text.includes('npm err!') || text.includes('module_not_found')) {
    return 'Node.js';
  }
  if (text.includes('conflict (content)') || text.includes('merge conflict') || text.includes('fatal: not a git repository') || text.includes('git rebase')) {
    return 'Git';
  }
  if (text.includes('oomkilled') || text.includes('docker') || text.includes('exited with code 137') || text.includes('cgroup out of memory')) {
    return 'Docker';
  }
  if (text.includes('cors policy') || text.includes('access-control-allow-origin') || text.includes('preflight request')) {
    return 'Web / Network';
  }
  return 'Terminal / Generic';
}

export function parseError(rawText) {
  if (!rawText || !rawText.trim()) return null;

  const trimmed = rawText.trim();

  // Check exact preset matches first
  const matchedPreset = ERROR_PRESETS.find(
    p => p.rawError.trim() === trimmed || trimmed.includes(p.label) || (p.parsed.errorType && trimmed.includes(p.parsed.errorType))
  );

  if (matchedPreset) {
    return {
      ...matchedPreset.parsed,
      id: matchedPreset.id,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  // Dynamic heuristic parsing for custom inputs
  const env = detectEnvironment(trimmed);
  let errorType = 'Runtime Error';
  let location = 'Terminal Output';
  let severity = 5;
  let offendingCode = '';
  let plainExplanation = 'An unhandled exception stopped execution.';
  let rootCause = 'The process encountered an invalid state.';
  let fixCommand = 'npm test # or run with debug flag';
  let whyItWorks = 'Running with debug flags exposes deeper diagnostic stack frames.';

  if (env === 'Python') {
    const fileMatch = trimmed.match(/File "([^"]+)", line (\d+)(?:, in (.+))?/);
    const errMatch = trimmed.match(/([A-Z]\w+Error|Exception):\s*(.+)/);
    if (fileMatch) location = `${fileMatch[1]}:${fileMatch[2]}`;
    if (errMatch) {
      errorType = errMatch[1];
      plainExplanation = `Python raised a ${errMatch[1]}: ${errMatch[2]}`;
      rootCause = `The execution halted at ${location} due to an unhandled ${errMatch[1]}.`;
      severity = 6;
      fixCommand = `python -m pdb ${fileMatch ? fileMatch[1] : 'main.py'}`;
      whyItWorks = 'Launching in Python interactive debugger lets you step through variables before the fault line.';
    }
  } else if (env === 'Node.js') {
    const modMatch = trimmed.match(/Cannot find module '([^']+)'/);
    if (modMatch) {
      errorType = 'MODULE_NOT_FOUND';
      plainExplanation = `Node.js cannot find the package '${modMatch[1]}' in your project.`;
      rootCause = `Dependency '${modMatch[1]}' is imported but not installed in node_modules.`;
      severity = 5;
      fixCommand = `npm install ${modMatch[1]}`;
      whyItWorks = `Installs '${modMatch[1]}' and updates your package.json dependencies.`;
    } else {
      const typeMatch = trimmed.match(/(TypeError|ReferenceError|SyntaxError):\s*(.+)/);
      if (typeMatch) {
        errorType = typeMatch[1];
        plainExplanation = `Node.js encountered a ${typeMatch[1]}: ${typeMatch[2]}`;
        severity = 6;
      }
    }
  } else if (env === 'Git') {
    errorType = 'Git VCS State Error';
    plainExplanation = 'Git encountered a conflict or invalid branch state during the command.';
    fixCommand = 'git status';
    severity = 6;
    whyItWorks = 'Checking status reveals all untracked, conflicting, or staged files.';
  } else if (env === 'Docker') {
    errorType = 'Container Crash';
    plainExplanation = 'Docker engine terminated the container process.';
    fixCommand = 'docker logs --tail 50 <container_id>';
    severity = 8;
    whyItWorks = 'Tail logs output the last 50 lines before the container exit code.';
  }

  return {
    id: 'custom-' + Date.now(),
    environment: env,
    errorType,
    severity,
    location,
    offendingCode,
    plainExplanation,
    rootCause,
    fixCommand,
    whyItWorks,
    timestamp: new Date().toLocaleTimeString(),
  };
}
