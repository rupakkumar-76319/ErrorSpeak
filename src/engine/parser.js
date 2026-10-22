// Local, rule-based triage engine. Runs in the browser with no network calls.
// Every report carries a fixKind ("shell" | "code" | "diagnose") and a confidence
// ("high" | "medium" | "low") so the UI can be honest about what it knows.

export function detectEnvironment(rawText) {
  if (!rawText) return null;
  const text = rawText.toLowerCase();

  if (
    text.includes('traceback (most recent call last)') ||
    /file ".+\.py", line \d+/.test(text) ||
    /\b(keyerror|indexerror|attributeerror|nameerror|zerodivisionerror|indentationerror|modulenotfounderror|importerror|valueerror|filenotfounderror):/.test(text)
  ) {
    return 'Python';
  }
  if (
    text.includes('cannot find module') ||
    text.includes('cannot find package') ||
    text.includes('node:internal') ||
    text.includes('npm err!') ||
    text.includes('npm error') ||
    text.includes('module_not_found') ||
    text.includes('eaddrinuse') ||
    text.includes('eresolve') ||
    text.includes('referenceerror:') ||
    /\b(typeerror|rangeerror): (cannot read propert|cannot set propert|cannot destructure|.+ is not a function|.+ is not iterable)/.test(text) ||
    /at .+\.(m?js|cjs|ts):\d+:\d+/.test(text)
  ) {
    return 'Node.js';
  }
  if (
    text.includes('conflict (content)') ||
    text.includes('merge conflict in') ||
    text.includes('not a git repository') ||
    text.includes('automatic merge failed') ||
    text.includes('non-fast-forward') ||
    text.includes('failed to push some refs') ||
    text.includes('permission denied (publickey)')
  ) {
    return 'Git';
  }
  if (
    text.includes('oomkilled') ||
    text.includes('docker') ||
    text.includes('exited with code 137') ||
    text.includes('cgroup out of memory') ||
    text.includes('port is already allocated')
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
  if (
    text.includes('commandnotfoundexception') ||
    text.includes('is not recognized as the name of a cmdlet') ||
    text.includes('is not recognized as an internal or external command') ||
    text.includes('command not found')
  ) {
    return 'PowerShell / Shell';
  }
  return 'Terminal / Generic';
}

// Import names that differ from their pip package names
const PIP_PACKAGES = {
  cv2: 'opencv-python', PIL: 'Pillow', sklearn: 'scikit-learn', yaml: 'PyYAML',
  bs4: 'beautifulsoup4', dotenv: 'python-dotenv', dateutil: 'python-dateutil',
};

const openAt = (file, line) => `code -g ${quoteIfSpaced(line ? `${file}:${line}` : file)}`;
const quoteIfSpaced = (s) => (/\s/.test(s) ? `"${s}"` : s);

export function parseError(rawText) {
  if (!rawText || !rawText.trim()) return null;

  const trimmed = cleanLog(rawText).trim();
  const env = detectEnvironment(trimmed);
  const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);

  const r = {
    errorType: 'Runtime Error',
    location: 'Terminal output',
    severity: 5,
    offendingCode: '',
    plainExplanation: 'A command or program failed.',
    rootCause: 'The process returned an error.',
    fixKind: 'diagnose',
    fixCommand: '',
    whyItWorks: '',
    fixDiff: null,
    confidence: 'medium',
  };

  if (env === 'Python') parsePython(trimmed, r);
  else if (env === 'Node.js') parseNode(trimmed, lines, r);
  else if (env === 'Git') parseGit(trimmed, lines, r);
  else if (env === 'Docker') parseDocker(trimmed, lines, r);
  else if (env === 'Web / Network') parseCors(trimmed, r);
  else if (env === 'PowerShell / Shell') parseShell(trimmed, lines, r);
  else parseGeneric(lines, r);

  return {
    id: 'local-' + Date.now(),
    source: 'local',
    environment: env,
    ...r,
    timestamp: new Date().toLocaleTimeString(),
  };
}

// CI logs prefix every line with timestamps or annotations; terminals add colour codes
const LOG_PREFIX = /^\s*(?:\d{4}-\d{2}-\d{2}[T ][\d:.,]+Z?\s+|\[?\d{1,2}:\d{2}:\d{2}(?:[.,]\d+)?\]?\s+|##\[(?:error|warning|debug)\]\s*)/;
const ANSI = /\x1b\[[0-9;?]*[A-Za-z]/g;
export function cleanLog(text) {
  return text.replace(ANSI, '').split('\n').map(l => l.replace(LOG_PREFIX, '')).join('\n');
}

// Library and interpreter frames, where a beginner can't (and shouldn't) edit the code
const isLibraryFrame = (f) => /site-packages|dist-packages|<frozen |[\\/]lib[\\/]python\d|hostedtoolcache|<string>|<stdin>/.test(f);

// Python prints each traceback as: header, frames, then the exception as the first
// unindented line after the last frame. Plain ("File "x", line N") and Rich
// ("x.py:N in fn" inside a box) formats are both read.
function readTraceback(block) {
  const lines = block.split('\n');
  const frames = [];
  lines.forEach((l, i) => {
    const plain = l.match(/File "([^"]+)", line (\d+)/);
    const rich = !plain && l.match(/([^\s│|"]+\.py):(\d+) in [\w<>.]+/);
    const m = plain || rich;
    if (m) frames.push({ file: m[1], line: m[2], idx: i, rich: !!rich });
  });
  const last = frames[frames.length - 1];
  const start = last ? last.idx + 1 : 0;
  let exception = null;
  for (let i = start; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim() || /^\s/.test(l) || /^[│╰╭─|]/.test(l)) continue;
    const m = l.match(/^([A-Za-z_][\w.]*)(?::\s?(.*))?$/);
    if (m && /[A-Z]/.test(m[1]) && !/^(During|The above|Traceback)/.test(l)) exception = { name: m[1], detail: (m[2] || '').trim() };
    break;
  }
  let code = '';
  if (last && !last.rich) {
    const next = (lines[last.idx + 1] || '').trim();
    if (next && /^\s/.test(lines[last.idx + 1]) && !/^[\^~\s]+$/.test(next) && !/^File "/.test(next)) code = next;
  } else if (last) {
    const marked = lines.slice(last.idx).find(l => /❱\s*\d+\s*│/.test(l));
    if (marked) code = marked.replace(/^.*❱\s*\d+\s*│\s?/, '').replace(/\s*│\s*$/, '').trim();
  }
  return { frames, exception, code };
}

// --- PYTHON ---
function parsePython(text, r) {
  // Use the last traceback that actually ends in an exception line; logs often cut the final one off
  const blocks = text.split(/^.*Traceback \(most recent call last\).*$/m).slice(1);
  const parsed = (blocks.length ? blocks : [text]).map(readTraceback);
  const tb = [...parsed].reverse().find(p => p.exception) || parsed[parsed.length - 1];
  const inner = tb.frames[tb.frames.length - 1];
  const userFrame = [...tb.frames].reverse().find(f => !isLibraryFrame(f.file));
  const file = inner?.file, line = inner?.line;
  if (inner) r.location = `${file}:${line}`;
  r.offendingCode = tb.code;

  // Without a traceback, fall back to a bare "SomethingError: message" line
  let exc = tb.exception;
  if (!exc) {
    const bare = text.split('\n').reverse().find(l => /^[A-Za-z_][\w.]*(Error|Exception)\b:/.test(l));
    const m = bare && bare.match(/^([A-Za-z_][\w.]*)(?::\s?(.*))?$/);
    if (m) exc = { name: m[1], detail: (m[2] || '').trim() };
  }
  if (!exc) {
    r.confidence = 'low';
    r.fixCommand = userFrame ? openAt(userFrame.file, userFrame.line) : '';
    r.fixKind = userFrame ? 'code' : 'diagnose';
    r.whyItWorks = 'The traceback was cut off before the error message, so only the last frame is known. Opens it so you can inspect it.';
    return;
  }

  r.errorType = exc.name.split('.').pop();
  const detail = exc.detail;
  r.confidence = 'high';
  r.fixKind = 'code';
  // Open the deepest frame in the user's own code, not inside a library
  r.fixCommand = userFrame ? openAt(userFrame.file, userFrame.line) : 'python -X dev your_script.py';
  r.severity = 6;
  if (inner && userFrame && inner !== userFrame) {
    r.whyItWorksPrefix = `The error surfaced inside a library (${file.split(/[\\/]/).pop()}), but the call that triggered it is in your code at ${userFrame.file}:${userFrame.line}. `;
  }

  switch (r.errorType) {
    case 'KeyError': {
      r.plainExplanation = `Your code looked up the key ${detail} in a dictionary, but that key isn't there. Python stops instead of guessing.`;
      r.rootCause = `Missing dictionary key ${detail} at ${r.location}.`;
      if (r.offendingCode.includes(`[${detail}]`)) {
        r.fixDiff = {
          before: r.offendingCode,
          after: r.offendingCode.replace(`[${detail}]`, `.get(${detail})`) + '  # returns None instead of crashing',
        };
      }
      r.whyItWorks = '.get() returns None (or a default you pass) when the key is missing. If the key should always exist, check where the dictionary is built instead.';
      break;
    }
    case 'IndexError':
      r.plainExplanation = 'Your code asked for an item position that the list does not have, for example item 5 of a 3-item list.';
      r.rootCause = `${detail} at ${r.location}.`;
      r.whyItWorks = 'Check len(your_list) before indexing, or loop over the list directly instead of by position.';
      break;
    case 'AttributeError':
      r.severity = 7;
      if (/'NoneType' object has no attribute/.test(detail)) {
        r.plainExplanation = `A variable was None (empty) when your code tried to use ${detail.match(/attribute '([^']+)'/)?.[1] || 'an attribute'} on it. Usually a function returned nothing or a lookup found nothing.`;
        r.whyItWorks = 'Find where the variable is assigned and handle the "nothing found" case before using it: if obj is not None: ...';
      } else {
        r.plainExplanation = `The object doesn't have the attribute or method your code asked for: ${detail}`;
        r.whyItWorks = 'Check the spelling and the object type (print(type(obj))) on the failing line.';
      }
      r.rootCause = `${detail} at ${r.location}.`;
      break;
    case 'TypeError':
      r.plainExplanation = `Two values of the wrong types were combined or a function got the wrong arguments: ${detail}`;
      r.rootCause = `${detail} at ${r.location}.`;
      r.whyItWorks = 'Convert values to the type the operation expects (str(), int(), float()) or fix the arguments passed.';
      break;
    case 'NameError':
      r.plainExplanation = `Python doesn't know the name used on this line: ${detail}. It is misspelled, not imported, or defined later.`;
      r.rootCause = `${detail} at ${r.location}.`;
      r.whyItWorks = 'Fix the spelling, add the missing import, or define the variable before this line.';
      break;
    case 'SyntaxError':
    case 'IndentationError':
    case 'TabError':
      r.severity = 4;
      r.plainExplanation = `Python couldn't read this line because it breaks the language rules: ${detail}. Nothing ran yet.`;
      r.rootCause = `${r.errorType}: ${detail} at ${r.location}.`;
      r.whyItWorks = 'Look for a missing colon, bracket or quote on this line or the one above, and keep indentation consistent (spaces only).';
      break;
    case 'ZeroDivisionError':
      r.plainExplanation = 'Your code divided by zero.';
      r.rootCause = `${detail} at ${r.location}.`;
      r.whyItWorks = 'Check the divisor before dividing: result = a / b if b else 0';
      break;
    case 'FileNotFoundError':
      r.plainExplanation = `The file your code tried to open doesn't exist at that path: ${detail}. Relative paths are resolved from the folder you ran Python in.`;
      r.rootCause = `${detail} at ${r.location}.`;
      r.fixKind = 'diagnose';
      r.fixCommand = 'python -c "import os; print(os.getcwd())"';
      r.whyItWorks = 'Prints the folder Python is running in, so you can see why the relative path does not resolve.';
      break;
    case 'ModuleNotFoundError':
    case 'ImportError': {
      const mod = (detail.match(/No module named '([^']+)'/) || [])[1];
      if (mod) {
        const top = mod.split('.')[0];
        const pkg = PIP_PACKAGES[top] || top;
        r.errorType = 'ModuleNotFoundError';
        r.severity = 5;
        r.fixKind = 'shell';
        r.fixCommand = `python -m pip install ${pkg}`;
        r.plainExplanation = `Python can't find the module '${top}'. It isn't installed in the Python environment you are running.`;
        r.rootCause = `'${top}' is imported at ${r.location} but missing from site-packages.`;
        r.whyItWorks = `"python -m pip" installs into the same Python that runs your script, which avoids the common mix-up where pip belongs to a different Python.` +
          (pkg !== top ? ` The package is called '${pkg}' even though you import '${top}'.` : '');
      } else {
        r.plainExplanation = `An import failed: ${detail}`;
        r.rootCause = `${detail} at ${r.location}.`;
        r.whyItWorks = 'Check that the name you import exists in the installed version of the package.';
      }
      break;
    }
    case 'OperationalError':
      if (/password authentication failed/i.test(detail)) {
        const user = (detail.match(/for user "([^"]+)"/) || [])[1];
        r.severity = 7;
        r.fixKind = 'diagnose';
        r.fixCommand = `python -c "import os; print(repr(os.environ.get('DATABASE_URL')))"`;
        r.plainExplanation = `The database rejected the password for user ${user ? `'${user}'` : 'your user'}. Your code reached the server, so the network is fine; the credentials are wrong or not the ones you think are loaded.`;
        r.rootCause = `PostgreSQL password authentication failed${user ? ` for ${user}` : ''}.`;
        r.whyItWorks = 'Prints the connection string your program actually sees, which catches a stale .env file or a typo. Never paste the real password into chats or issues.';
        break;
      }
      // falls through
    default:
      r.plainExplanation = `Python raised ${r.errorType}: ${detail}`;
      r.rootCause = `${r.errorType}: ${detail} at ${r.location}.`;
      r.confidence = 'medium';
      r.whyItWorks = 'Opens the line that raised the error so you can inspect the values involved.';
  }
  if (r.whyItWorksPrefix) {
    r.whyItWorks = r.whyItWorksPrefix + r.whyItWorks;
    delete r.whyItWorksPrefix;
  }
}

// --- NODE.JS ---
function parseNode(text, lines, r) {
  // Stack frames may be file:// URLs (ESM) or http(s) URLs (browser bundles)
  text = text.replace(/file:\/\//g, '').replace(/https?:\/\/[^/\s)]+/g, '');
  // First stack frame in user code (skip node internals and dependencies)
  const frame = [...text.matchAll(/at (?:.*? \()?((?:[A-Za-z]:)?[^\s():]+):(\d+):(\d+)\)?/g)]
    .find(m => !m[1].startsWith('node:') && !m[1].includes('node_modules'));
  if (frame) r.location = `${frame[1]}:${frame[2]}`;
  r.confidence = 'high';

  const port = (text.match(/EADDRINUSE[^\n]*?:(\d{2,5})\b/) || text.match(/port (\d{2,5})/i) || [])[1];
  const mod = text.match(/Cannot find (?:module|package) '([^']+)'/);

  if (/EADDRINUSE/.test(text)) {
    r.errorType = 'EADDRINUSE';
    r.severity = 4;
    r.fixKind = 'shell';
    r.fixCommand = `npx kill-port ${port || '3000'}`;
    r.location = port ? `Port ${port}` : 'Network port';
    r.plainExplanation = `Another program, often an older copy of your own server, is already using port ${port || 'that port'}. Two programs can't listen on the same port.`;
    r.rootCause = `listen EADDRINUSE on port ${port || '?'}.`;
    r.whyItWorks = 'Stops whatever process holds the port so your server can start. Alternatively start yours on another port (PORT=3001).';
  } else if (/ERESOLVE/.test(text)) {
    r.errorType = 'ERESOLVE';
    r.severity = 4;
    r.fixKind = 'shell';
    r.fixCommand = 'npm install --legacy-peer-deps';
    r.location = 'npm dependency tree';
    r.plainExplanation = 'Two of your packages want different versions of the same peer dependency, so npm refuses to pick one.';
    r.rootCause = 'npm peer dependency conflict (ERESOLVE).';
    r.whyItWorks = 'Installs using the pre-npm-7 rules that ignore peer conflicts. Safer long-term: upgrade the package named in the error to a version that supports your setup.';
  } else if (mod) {
    const name = mod[1];
    r.errorType = 'MODULE_NOT_FOUND';
    r.severity = 5;
    if (/^(\.|\/|[A-Za-z]:)/.test(name)) {
      r.fixKind = 'diagnose';
      r.fixCommand = `node -e "console.log(require('path').resolve('${name.replace(/\\/g, '/')}'))"`;
      r.plainExplanation = `Node can't find your own file '${name}'. The path is wrong, the file was moved, or the extension is missing.`;
      r.rootCause = `Relative import '${name}' does not resolve.`;
      r.whyItWorks = 'Prints the full path Node is looking for, so you can compare it with where the file really is.';
    } else if (name.startsWith('node:')) {
      r.fixKind = 'diagnose';
      r.fixCommand = 'node --version';
      r.plainExplanation = `'${name}' is a built-in module that your Node.js version doesn't have. Your Node is probably too old.`;
      r.rootCause = `Built-in ${name} missing; outdated Node.js runtime.`;
      r.whyItWorks = 'Shows your Node version; install the current LTS from nodejs.org if it is older than the package requires.';
    } else {
      const pkg = name.startsWith('@') ? name.split('/').slice(0, 2).join('/') : name.split('/')[0];
      r.fixKind = 'shell';
      r.fixCommand = `npm install ${pkg}`;
      r.plainExplanation = `Node can't find the package '${pkg}'. It isn't installed in this project's node_modules folder.`;
      r.rootCause = `Dependency '${pkg}' is required but not installed.`;
      r.whyItWorks = `Downloads '${pkg}' into node_modules and records it in package.json. If it is already in package.json, a plain "npm install" restores it.`;
    }
  } else {
    const typeMatch = text.match(/(TypeError|ReferenceError|SyntaxError|RangeError):\s*(.+)/);
    if (typeMatch) {
      r.errorType = typeMatch[1];
      const msg = typeMatch[2];
      r.severity = 6;
      r.fixKind = frame ? 'code' : 'diagnose';
      r.fixCommand = frame ? openAt(frame[1], frame[2]) : 'node --trace-uncaught your_script.js';
      const prop = (msg.match(/\(reading '([^']+)'\)/) || [])[1];
      if (/Cannot read propert/.test(msg)) {
        r.plainExplanation = `Your code tried to read ${prop ? `'${prop}'` : 'a property'} from something that is undefined or null, usually data that hasn't loaded yet or a misspelled field.`;
        if (prop) r.fixDiff = { before: `value.${prop}`, after: `value?.${prop}  // undefined instead of a crash` };
        r.whyItWorks = 'Optional chaining (?.) stops safely when the value is missing. Also check why it was undefined: an await you forgot, or an API returning a different shape.';
      } else if (r.errorType === 'ReferenceError') {
        r.plainExplanation = `A variable is used that doesn't exist here: ${msg}. It's misspelled, not imported, or out of scope.`;
        r.whyItWorks = 'Fix the name, import it, or declare it before use.';
      } else {
        r.plainExplanation = `JavaScript ${r.errorType}: ${msg}`;
        r.whyItWorks = 'Opens the failing line so you can inspect the values involved.';
      }
      r.rootCause = `${r.errorType}: ${msg} at ${r.location}.`;
    } else {
      r.errorType = 'Node.js Error';
      r.confidence = 'low';
      r.plainExplanation = lines.find(l => /error/i.test(l)) || lines[0];
      r.rootCause = r.plainExplanation;
      r.fixCommand = 'npm ls --depth=0';
      r.whyItWorks = 'Lists installed top-level packages to spot missing or broken dependencies.';
    }
  }
}

// --- GIT ---
function parseGit(text, lines, r) {
  r.confidence = 'high';
  // Real git output only: the word "conflict" in prose is not a conflict
  if (/^CONFLICT \(|Merge conflict in |Automatic merge failed/m.test(text)) {
    const files = [...new Set([...text.matchAll(/Merge conflict in ([^\s`'"]+)/g)].map(m => m[1].replace(/[.,;:]+$/, '')))];
    r.errorType = 'Merge Conflict';
    r.severity = 7;
    r.location = files[0] || 'Working directory';
    r.fixKind = 'code';
    r.fixCommand = files.length ? openAt(files[0]) : 'git diff --name-only --diff-filter=U';
    r.plainExplanation = `Both branches changed the same lines${files.length ? ` in ${files.map(f => f.split('/').pop()).join(', ')}` : ''}, so Git needs you to choose which version to keep.`;
    r.rootCause = `Divergent edits to ${files.length > 1 ? `${files.length} files: ${files.slice(0, 5).join(', ')}${files.length > 5 ? ', ...' : ''}` : r.location}.`;
    r.fixDiff = {
      before: '<<<<<<< HEAD\nyour version\n=======\ntheir version\n>>>>>>> branch',
      after: 'the version you want to keep',
    };
    r.whyItWorks = `Open the file, keep the right code and delete the <<<<<<< ======= >>>>>>> markers, then run: git add ${files[0] || '<file>'} && git commit`;
  } else if (/non-fast-forward|\[rejected\]|failed to push some refs/i.test(text)) {
    const branch = (text.match(/\[rejected\]\s+(\S+)\s+->/) || [])[1] || 'main';
    r.errorType = 'Push Rejected (non-fast-forward)';
    r.severity = 5;
    r.location = `Branch ${branch}`;
    r.fixKind = 'shell';
    if (/\(stale info\)/.test(text)) {
      r.fixCommand = `git fetch origin ${branch}`;
      r.plainExplanation = '--force-with-lease refused the push because your copy of the remote branch is out of date. It is protecting commits you have not seen yet.';
      r.rootCause = `Lease check failed: the local tracking ref for ${branch} is stale.`;
      r.whyItWorks = `Updates your view of the remote branch. Check what changed (git log HEAD..origin/${branch}) before pushing again.`;
    } else {
      r.fixCommand = `git pull --rebase origin ${branch}`;
      r.plainExplanation = 'The remote branch has commits you do not have yet, so Git refuses to overwrite them.';
      r.rootCause = `Local ${branch} is behind origin/${branch}.`;
      r.whyItWorks = 'Downloads the new remote commits and replays yours on top. Then git push works. Avoid --force, which would delete your teammates\' commits.';
    }
  } else if (/not a git repository/i.test(text)) {
    r.errorType = 'Not a Git Repository';
    r.severity = 3;
    r.location = 'Current folder';
    r.fixKind = 'diagnose';
    r.fixCommand = 'git rev-parse --show-toplevel';
    r.plainExplanation = 'You ran a Git command in a folder that is not inside a Git project. Usually you are one folder too high or low.';
    r.rootCause = 'No .git directory in this folder or its parents.';
    r.whyItWorks = 'Confirms whether you are inside a repository. cd into your project folder, or run "git init" if this is a brand-new project.';
  } else if (/Permission denied \(publickey\)/i.test(text)) {
    r.errorType = 'SSH Permission Denied';
    r.severity = 5;
    r.location = 'SSH authentication';
    r.fixKind = 'diagnose';
    r.fixCommand = 'ssh -T git@github.com';
    r.plainExplanation = 'GitHub did not accept your SSH key, so it does not know who you are.';
    r.rootCause = 'No SSH key registered with the Git host, or the agent is not offering it.';
    r.whyItWorks = 'Tests the SSH login directly. If it fails, add your public key (~/.ssh/id_ed25519.pub) in GitHub settings, or clone with the HTTPS URL instead.';
  } else {
    r.errorType = 'Git Command Failure';
    r.confidence = 'low';
    r.plainExplanation = lines.find(l => /^(fatal|error):/i.test(l)) || lines[0];
    r.rootCause = r.plainExplanation;
    r.fixCommand = 'git status';
    r.whyItWorks = 'Shows the branch, staged changes and anything in progress (merge, rebase).';
  }
}

// --- DOCKER ---
function parseDocker(text, lines, r) {
  r.confidence = 'high';
  const container = (text.match(/Container (\S+) exited/i) || text.match(/container (\S+)/i) || [])[1];
  if (/137|OOMKilled/i.test(text)) {
    const limit = (text.match(/limit of (\d+\s*[MG]i?B?)/i) || [])[1];
    r.errorType = 'OOMKilled (Exit 137)';
    r.severity = 9;
    r.location = container ? `Container ${container}` : 'Container memory limit';
    r.fixKind = 'shell';
    r.fixCommand = `docker update --memory 1g --memory-swap 1g ${container || '<container>'}`;
    r.plainExplanation = `Your container used more memory than it is allowed${limit ? ` (${limit})` : ''}, so the Linux kernel killed it. Exit code 137 means "killed".`;
    r.rootCause = 'Out of memory: the process exceeded its cgroup memory limit.';
    if (limit) {
      r.fixDiff = {
        before: `mem_limit: ${limit.replace(/\s|B/gi, '').toLowerCase()}`,
        after: 'mem_limit: 1g  # in docker-compose.yml, so the fix survives a rebuild',
      };
    }
    r.whyItWorks = 'Raises the memory limit on the running container. Make it permanent in docker-compose.yml, and check whether the app loads too much data at once.';
  } else if (/port is already allocated/i.test(text)) {
    const port = (text.match(/:(\d{2,5}) failed: port is already allocated/) || text.match(/0\.0\.0\.0:(\d{2,5})/) || [])[1];
    r.errorType = 'Port Already Allocated';
    r.severity = 4;
    r.location = port ? `Host port ${port}` : 'Host port';
    r.fixKind = 'diagnose';
    r.fixCommand = port ? `docker ps --filter publish=${port}` : 'docker ps';
    r.plainExplanation = `Another container or program already uses port ${port || 'that port'} on your computer.`;
    r.rootCause = 'Host port binding conflict.';
    r.whyItWorks = 'Shows which container holds the port; stop it with docker stop <name> or map yours to another port.';
  } else if (/Cannot connect to the Docker daemon|error during connect|docker_engine/i.test(text)) {
    r.errorType = 'Docker Daemon Not Running';
    r.severity = 3;
    r.location = 'Docker engine';
    r.fixKind = 'diagnose';
    r.fixCommand = 'docker info';
    r.plainExplanation = 'The Docker command works, but the Docker engine behind it is not running.';
    r.rootCause = 'Docker daemon unreachable.';
    r.whyItWorks = 'Start Docker Desktop (or "sudo systemctl start docker" on Linux), then docker info should succeed.';
  } else {
    r.errorType = 'Docker Error';
    r.confidence = 'low';
    r.plainExplanation = lines[0];
    r.rootCause = lines.slice(0, 2).join(' ');
    r.fixCommand = `docker logs --tail 50 ${container || '<container>'}`;
    r.whyItWorks = 'Shows the last 50 log lines, which usually contain the real error.';
  }
}

// --- WEB / CORS ---
function parseCors(text, r) {
  r.confidence = 'high';
  const origin = (text.match(/from origin '([^']+)'/) || [])[1] || 'http://localhost:3000';
  const target = (text.match(/(?:fetch|XMLHttpRequest) at '([^']+)'/) || [])[1];
  let targetOrigin = null;
  try { targetOrigin = target && new URL(target).origin; } catch { /* malformed URL in trace */ }
  r.errorType = /preflight/i.test(text) ? 'CORS Preflight Blocked' : 'CORS Blocked';
  r.severity = 6;
  r.location = targetOrigin ? `Server at ${targetOrigin}` : 'API server response headers';
  r.fixKind = 'code';
  r.fixCommand = 'npm install cors';
  r.plainExplanation = `Your browser blocked the request because the API server didn't say that pages from ${origin} are allowed to call it. The fix goes on the server, not in the browser code.`;
  r.rootCause = 'Missing Access-Control-Allow-Origin header on the server response.';
  r.fixDiff = {
    before: 'const app = express();',
    after: `const app = express();\nconst cors = require('cors');\napp.use(cors({ origin: '${origin}' }));`,
  };
  r.whyItWorks = `For an Express server: the cors middleware answers the browser's preflight check and allows ${origin}. Don't use mode: 'no-cors' in fetch; it hides the response from your code.`;
}

// --- SHELL / POWERSHELL ---
function parseShell(text, lines, r) {
  r.confidence = 'high';
  const pwsh = text.match(/The term '([^']+)' is not recognized/i);
  const cmd = text.match(/'([^']+)' is not recognized as an internal or external command/i);
  const bash = text.match(/([\w.\-]+):\s*command not found/i);
  const lineMatch = text.match(/At line:(\d+)\s+char:(\d+)/i);
  const bad = (pwsh || cmd || bash || [])[1] || (lines[0] || '').replace(/^.*[>#$]\s*/, '').split(' ')[0] || 'command';

  r.errorType = pwsh ? 'CommandNotFoundException' : 'Command Not Found';
  r.severity = 3;
  r.location = lineMatch ? `Line ${lineMatch[1]}, Char ${lineMatch[2]}` : 'Terminal prompt';
  r.offendingCode = bad;
  r.plainExplanation = `Your shell doesn't know a command called '${bad}'. It's either a typo, or the program isn't installed or isn't on your PATH.`;
  r.rootCause = `'${bad}' was not found in any directory on PATH.`;
  r.fixKind = 'diagnose';
  r.fixCommand = pwsh || cmd ? `winget search ${bad}` : `type ${bad}`;
  r.whyItWorks = pwsh || cmd
    ? `Searches the Windows package manager for '${bad}'. If nothing matches, check the spelling. After installing, open a new terminal so PATH refreshes.`
    : `Shows whether '${bad}' exists anywhere on PATH. If not, install it with your package manager or fix the spelling.`;
}

// --- GENERIC ---
function parseGeneric(lines, r) {
  r.errorType = 'Unrecognized Error';
  r.confidence = 'low';
  r.location = '';
  r.severity = 5;
  r.plainExplanation = `The local engine doesn't have a rule for this error yet. The first line says: "${lines[0]}"`;
  r.rootCause = lines.slice(0, 2).join(' — ');
  r.fixCommand = '';
  r.whyItWorks = 'Ask your connected LLM for a full diagnosis of this error.';
}
