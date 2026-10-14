import { ERROR_PRESETS } from './presets.js';

export function detectEnvironment(rawText) {
  if (!rawText) return null;
  const text = rawText.toLowerCase();

  if (
    text.includes('traceback (most recent call last)') ||
    text.includes('.py') ||
    text.includes('keyerror:') ||
    text.includes('indexerror:') ||
    text.includes('attributeerror:') ||
    text.includes('typeerror:') ||
    text.includes('syntaxerror:') ||
    text.includes('importerror:') ||
    text.includes('modulenotfounderror:')
  ) {
    return 'Python';
  }
  if (
    text.includes('cannot find module') ||
    text.includes('node:internal') ||
    text.includes('package.json') ||
    text.includes('npm err!') ||
    text.includes('module_not_found') ||
    text.includes('referenceerror:') ||
    text.includes('uncaught exception')
  ) {
    return 'Node.js';
  }
  if (
    text.includes('conflict (content)') ||
    text.includes('merge conflict') ||
    text.includes('fatal: not a git repository') ||
    text.includes('git rebase') ||
    text.includes('automatic merge failed')
  ) {
    return 'Git';
  }
  if (
    text.includes('oomkilled') ||
    text.includes('docker') ||
    text.includes('exited with code 137') ||
    text.includes('cgroup out of memory') ||
    text.includes('container')
  ) {
    return 'Docker';
  }
  if (
    text.includes('cors policy') ||
    text.includes('access-control-allow-origin') ||
    text.includes('preflight request')
  ) {
    return 'Web / Network';
  }
  return 'Terminal / Generic';
}

export function parseError(rawText) {
  if (!rawText || !rawText.trim()) return null;

  const trimmed = rawText.trim();

  // ONLY match a preset if the input EXACTLY matches the preset's rawError
  const matchedPreset = ERROR_PRESETS.find(
    p => p.rawError.trim() === trimmed
  );

  if (matchedPreset) {
    return {
      ...matchedPreset.parsed,
      id: matchedPreset.id,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  // Dynamic parser for real custom inputs
  const env = detectEnvironment(trimmed);
  const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);

  let errorType = 'Runtime Error';
  let location = 'Terminal Output';
  let severity = 5;
  let offendingCode = '';
  let plainExplanation = 'An unhandled exception stopped execution.';
  let rootCause = 'The process encountered an unexpected failure during execution.';
  let fixCommand = 'npm test # or run with debug flags';
  let whyItWorks = 'Running with debug flags exposes deeper diagnostic stack frames.';
  let fixDiff = null;

  // --- PYTHON PARSER ---
  if (env === 'Python') {
    const fileMatch = trimmed.match(/File "([^"]+)", line (\d+)(?:, in (.+))?/);
    const errMatch = trimmed.match(/([A-Z]\w+Error|Exception):\s*(.*)/);

    // Extract offending code line (usually between File line and Error line)
    const rawLines = trimmed.split('\n');
    const fileIdx = rawLines.findIndex(l => l.includes('File "') && l.includes('line '));
    if (fileIdx !== -1 && rawLines[fileIdx + 1] && !rawLines[fileIdx + 1].includes('Error:')) {
      offendingCode = rawLines[fileIdx + 1].trim();
    }

    if (fileMatch) {
      location = `${fileMatch[1]}:${fileMatch[2]}`;
    }

    if (errMatch) {
      errorType = errMatch[1];
      const detail = errMatch[2] || '';

      switch (errorType) {
        case 'KeyError':
          severity = 6;
          plainExplanation = `Python crashed because you tried to access a dictionary key ${detail || ''} that does not exist.`;
          rootCause = `The key ${detail || ''} was not found in the dictionary at ${location}.`;
          fixCommand = `python -c "import ${fileMatch ? fileMatch[1].replace('.py', '') : 'main'}"`;
          fixDiff = {
            before: offendingCode || `value = my_dict[${detail}]`,
            after: `value = my_dict.get(${detail}, None) # Safe lookup with fallback`,
          };
          whyItWorks = `Using .get() returns a default value instead of throwing a KeyError crash when a key is missing.`;
          break;

        case 'IndexError':
          severity = 6;
          plainExplanation = `List index out of range: You tried to access an item at an index that doesn't exist in the list.`;
          rootCause = `The list has fewer items than the index accessed at ${location}.`;
          fixCommand = `python -m pdb ${fileMatch ? fileMatch[1] : 'main.py'}`;
          whyItWorks = `Check the list length with len(your_list) before accessing indices.`;
          break;

        case 'AttributeError':
          severity = 7;
          plainExplanation = `Attribute error: You tried to access an attribute or method that does not exist on this object.`;
          rootCause = `The variable at ${location} is likely None or an unexpected object type: ${detail}`;
          fixCommand = `python -m pdb ${fileMatch ? fileMatch[1] : 'main.py'}`;
          whyItWorks = `Check if the variable is None before calling methods on it: if obj is not None: obj.method()`;
          break;

        case 'TypeError':
          severity = 6;
          plainExplanation = `Type mismatch: An operation was performed on incompatible data types.`;
          rootCause = `${detail} at ${location}.`;
          fixCommand = `python -m pdb ${fileMatch ? fileMatch[1] : 'main.py'}`;
          whyItWorks = `Ensure variables are cast to the expected type (e.g. str(), int(), float()) before operations.`;
          break;

        case 'ModuleNotFoundError':
        case 'ImportError':
          severity = 5;
          const pkgMatch = detail.match(/No module named '([^']+)'/);
          const pkg = pkgMatch ? pkgMatch[1] : 'package_name';
          errorType = 'ModuleNotFoundError';
          plainExplanation = `Python cannot find the module '${pkg}'. It is not installed in your current Python environment.`;
          rootCause = `Module '${pkg}' is imported at ${location} but missing from site-packages.`;
          fixCommand = `pip install ${pkg}`;
          whyItWorks = `Installs '${pkg}' into your active virtual environment.`;
          break;

        default:
          severity = 6;
          plainExplanation = `Python raised an unhandled ${errorType}: ${detail}`;
          rootCause = `Execution halted at ${location} due to ${errorType}: ${detail}`;
          fixCommand = `python -m pdb ${fileMatch ? fileMatch[1] : 'main.py'}`;
          whyItWorks = `Launching in Python interactive debugger (pdb) allows you to inspect variables at the crash point.`;
      }
    }
  }

  // --- NODE.JS / JAVASCRIPT PARSER ---
  else if (env === 'Node.js') {
    const modMatch = trimmed.match(/Cannot find module '([^']+)'/);
    const typeMatch = trimmed.match(/(TypeError|ReferenceError|SyntaxError):\s*(.+)/);
    const fileMatch = trimmed.match(/at (?:.* \()?([^\s)]+):(\d+):(\d+)\)?/);

    if (fileMatch) {
      location = `${fileMatch[1]}:${fileMatch[2]}`;
    }

    if (modMatch) {
      const pkg = modMatch[1];
      errorType = 'MODULE_NOT_FOUND';
      severity = 5;
      plainExplanation = `Node.js cannot find the package '${pkg}' in your local node_modules directory.`;
      rootCause = `Dependency '${pkg}' is required in your code but has not been installed.`;
      fixCommand = `npm install ${pkg}`;
      whyItWorks = `Running 'npm install ${pkg}' fetches the package from the npm registry and updates package.json.`;
    } else if (typeMatch) {
      errorType = typeMatch[1];
      const msg = typeMatch[2];
      severity = 6;
      if (msg.includes('Cannot read properties of undefined') || msg.includes('Cannot read property')) {
        plainExplanation = `You tried to read a property on a variable that is undefined (null or not yet loaded).`;
        rootCause = `${msg} at ${location}.`;
        fixCommand = `npm test`;
        whyItWorks = `Use optional chaining (e.g. user?.profile?.name) to safely access nested properties without crashing.`;
      } else {
        plainExplanation = `JavaScript ${errorType}: ${msg}`;
        rootCause = `Execution threw a ${errorType} at ${location}.`;
        fixCommand = `node --trace-uncaught ${fileMatch ? fileMatch[1] : 'index.js'}`;
        whyItWorks = `Running node with --trace-uncaught prints the full stack trace including asynchronous callers.`;
      }
    } else {
      errorType = 'Node Execution Error';
      plainExplanation = lines[0] || 'Node.js process exited with an error.';
      fixCommand = 'npm test';
    }
  }

  // --- GIT PARSER ---
  else if (env === 'Git') {
    if (trimmed.includes('CONFLICT') || trimmed.includes('Merge conflict')) {
      errorType = 'Merge Conflict';
      severity = 7;
      const conflictFile = trimmed.match(/Merge conflict in (.+)/);
      location = conflictFile ? conflictFile[1] : 'Working Directory';
      plainExplanation = `Git couldn't automatically merge changes because two branches modified the exact same lines.`;
      rootCause = `Divergent commits in ${location}.`;
      fixCommand = `git status && git diff --name-only --diff-filter=U`;
      whyItWorks = `Lists all files currently in conflict so you can review the conflict markers and choose the right code.`;
    } else {
      errorType = 'Git Command Failure';
      plainExplanation = lines[0] || 'Git command failed to execute.';
      fixCommand = 'git status';
      whyItWorks = 'Running git status reveals untracked files, uncommitted changes, and active branch state.';
    }
  }

  // --- DOCKER PARSER ---
  else if (env === 'Docker') {
    if (trimmed.includes('137') || trimmed.includes('OOMKilled')) {
      errorType = 'OOMKilled (Exit 137)';
      severity = 9;
      location = 'Container Memory Limits';
      plainExplanation = `The Linux kernel abruptly killed your Docker container because it exceeded its allocated RAM limit.`;
      rootCause = `Out Of Memory (OOM): Container process consumed more memory than allowed by cgroups policy.`;
      fixCommand = `docker compose down && docker compose up -d --build`;
      whyItWorks = `Rebuilding with increased mem_limit gives the container process adequate memory headroom.`;
    } else {
      errorType = 'Docker Engine Failure';
      plainExplanation = lines[0] || 'Docker container exited unexpectedly.';
      fixCommand = 'docker logs --tail 50 <container_name>';
      whyItWorks = 'Viewing the last 50 container log entries reveals the exact line where the container crashed.';
    }
  }

  // --- GENERIC / OTHER ---
  else {
    errorType = 'Terminal Error';
    plainExplanation = lines[0] || 'The terminal process returned a non-zero exit code.';
    rootCause = lines.slice(0, 2).join(' — ');
    fixCommand = 'echo $? && history | tail -5';
    whyItWorks = 'Checking the exit status code and recent command history helps identify what triggered the failure.';
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
    fixDiff,
    timestamp: new Date().toLocaleTimeString(),
  };
}
