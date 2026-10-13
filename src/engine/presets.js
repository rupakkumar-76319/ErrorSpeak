export const ERROR_PRESETS = [
  {
    id: 'python-keyerror',
    label: 'Python KeyError',
    env: 'Python 3.11',
    category: 'Runtime Error',
    rawError: `Traceback (most recent call last):
  File "app/services/auth_service.py", line 48, in authenticate_user
    user_role = payload['roles']['admin']
KeyError: 'admin'`,
    parsed: {
      environment: 'Python',
      errorType: 'KeyError',
      severity: 6,
      location: 'app/services/auth_service.py:48',
      offendingCode: "user_role = payload['roles']['admin']",
      plainExplanation: "Python crashed because you tried to access a dictionary key ('admin') that doesn't exist inside 'roles'.",
      rootCause: "The 'roles' dictionary is missing the 'admin' key, triggering an unhandled KeyError at line 48.",
      fixCommand: "python -m pytest tests/test_auth.py -k test_admin_role",
      fixDiff: {
        before: "user_role = payload['roles']['admin']",
        after: "user_role = payload.get('roles', {}).get('admin', 'default_user')",
      },
      whyItWorks: "Using `.get()` with safe defaults prevents runtime KeyError crashes when optional dictionary keys are absent.",
    }
  },
  
  {
    id: 'node-module-missing',
    label: 'Node.js Module Missing',
    env: 'Node.js 22',
    category: 'Dependency Error',
    rawError: `node:internal/modules/cjs/loader:1147
  throw err;
  ^

Error: Cannot find module 'express'
Require stack:
- M:\\projects\\api-server\\src\\index.js
- M:\\projects\\api-server\\server.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1144:15)
    at Module._load (node:internal/modules/cjs/loader:985:27) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [ 'M:\\\\projects\\\\api-server\\\\src\\\\index.js' ]
}`,
    parsed: {
      environment: 'Node.js',
      errorType: 'MODULE_NOT_FOUND',
      severity: 5,
      location: 'src/index.js:1',
      offendingCode: "const express = require('express');",
      plainExplanation: "Node.js cannot find the 'express' package in your local node_modules folder.",
      rootCause: "The dependency 'express' is required in src/index.js but has not been installed in package.json.",
      fixCommand: "npm install express",
      fixDiff: {
        before: "// Missing express in package.json",
        after: "npm i express # Adds package to dependencies",
      },
      whyItWorks: "Running `npm install express` fetches the package from the registry and adds it to your node_modules directory.",
    }
  },
  {
    id: 'git-merge-conflict',
    label: 'Git Merge Conflict',
    env: 'Git CLI',
    category: 'VCS Conflict',
    rawError: `Auto-merging src/config/database.ts
CONFLICT (content): Merge conflict in src/config/database.ts
Automatic merge failed; fix conflicts and then commit the result.`,
    parsed: {
      environment: 'Git',
      errorType: 'Merge Conflict',
      severity: 7,
      location: 'src/config/database.ts:14',
      offendingCode: `<<<<<<< HEAD\nconst DB_HOST = process.env.LOCAL_HOST;\n=======\nconst DB_HOST = process.env.REMOTE_HOST;\n>>>>>>> feature/cloud`,
      plainExplanation: "Git cannot automatically combine your changes because both branches edited the exact same lines in database.ts.",
      rootCause: "Divergent commits modified database host configuration in both the target branch and the incoming branch.",
      fixCommand: "git status && git diff --name-only --diff-filter=U",
      fixDiff: {
        before: "<<<<<<< HEAD\nLOCAL_HOST\n=======\nREMOTE_HOST\n>>>>>>>",
        after: "const DB_HOST = process.env.DATABASE_URL || 'localhost';",
      },
      whyItWorks: "Inspect unresolved conflict markers, pick the intended configuration value, and stage the resolved file.",
    }
  },
  {
    id: 'docker-oom',
    label: 'Docker OOMKilled',
    env: 'Docker Engine',
    category: 'Container Failure',
    rawError: `Container backend-worker-1 exited with code 137
Status: OOMKilled (Out of Memory)
Container exceeded memory limit of 512MB
Kernel message: [ 4812.192] Memory cgroup out of memory: Killed process 8129 (python3)`,
    parsed: {
      environment: 'Docker',
      errorType: 'OOMKilled (Exit 137)',
      severity: 9,
      location: 'docker-compose.yml:24',
      offendingCode: "mem_limit: 512m",
      plainExplanation: "The Linux kernel abruptly terminated your container because its memory consumption exceeded the 512MB limit.",
      rootCause: "The worker process allocated more heap memory than permitted by the cgroup container policy.",
      fixCommand: "docker compose down && docker compose up -d --build",
      fixDiff: {
        before: "mem_limit: 512m",
        after: "mem_limit: 1536m # Bump memory allocation or optimize worker batching",
      },
      whyItWorks: "Increasing memory allocation gives the worker adequate buffer, or chunking queries lowers memory pressure.",
    }
  },
  {
    id: 'cors-preflight',
    label: 'Browser CORS Block',
    env: 'Web / Network',
    category: 'Security Policy',
    rawError: `Access to fetch at 'https://api.myapp.dev/v1/auth' from origin 'http://localhost:3000' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource. 
If an opaque response serves your needs, set the request's mode to 'no-cors'.`,
    parsed: {
      environment: 'Web / Network',
      errorType: 'CORS Preflight Blocked',
      severity: 6,
      location: 'server.js (CORS Middleware)',
      offendingCode: "app.use('/v1', apiRoutes); // Missing CORS headers",
      plainExplanation: "Your browser security sandbox blocked the API request because the backend server didn't explicitly permit requests from localhost:3000.",
      rootCause: "The server did not include 'Access-Control-Allow-Origin' headers in its HTTP OPTIONS preflight response.",
      fixCommand: "npm install cors",
      fixDiff: {
        before: "const app = express();",
        after: "const app = express();\nconst cors = require('cors');\napp.use(cors({ origin: 'http://localhost:3000', credentials: true }));",
      },
      whyItWorks: "Configuring the CORS middleware instructs the server to reply to preflight OPTIONS requests with allowable origin headers.",
    }
  }
];
