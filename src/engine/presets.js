// Sample inputs only. Presets run through the same parser as pasted errors;
// there are no canned answers.
export const ERROR_PRESETS = [
  {
    id: 'python-keyerror',
    label: 'Python KeyError',
    env: 'Python 3.11',
    rawError: `Traceback (most recent call last):
  File "app/services/auth_service.py", line 48, in authenticate_user
    user_role = payload['roles']['admin']
KeyError: 'admin'`,
  },
  {
    id: 'node-module-missing',
    label: 'Node.js Module Missing',
    env: 'Node.js 22',
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
  },
  {
    id: 'git-merge-conflict',
    label: 'Git Merge Conflict',
    env: 'Git CLI',
    rawError: `Auto-merging src/config/database.ts
CONFLICT (content): Merge conflict in src/config/database.ts
Automatic merge failed; fix conflicts and then commit the result.`,
  },
  {
    id: 'docker-oom',
    label: 'Docker OOMKilled',
    env: 'Docker Engine',
    rawError: `Container backend-worker-1 exited with code 137
Status: OOMKilled (Out of Memory)
Container exceeded memory limit of 512MB
Kernel message: [ 4812.192] Memory cgroup out of memory: Killed process 8129 (python3)`,
  },
  {
    id: 'cors-preflight',
    label: 'Browser CORS Block',
    env: 'Web / Network',
    rawError: `Access to fetch at 'https://api.myapp.dev/v1/auth' from origin 'http://localhost:3000'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
If an opaque response serves your needs, set the request's mode to 'no-cors'.`,
  },
  {
    id: 'postgres-secret',
    label: 'Postgres Auth (leaks a password)',
    env: 'Redaction demo',
    rawError: `Traceback (most recent call last):
  File "C:\\Users\\jane\\projects\\shop\\db.py", line 12, in connect
    conn = psycopg2.connect(DATABASE_URL)
psycopg2.OperationalError: connection to server at "db.internal" (10.0.0.5), port 5432 failed: FATAL:  password authentication failed for user "admin"

DATABASE_URL=postgres://admin:Sup3rS3cret!@db.internal:5432/shop`,
  },
  {
    id: 'rust-borrow',
    label: 'Rust Borrow Error',
    env: 'Needs Claude',
    rawError: `error[E0382]: borrow of moved value: \`names\`
 --> src/main.rs:5:22
  |
3 |     let names = vec![String::from("Ada")];
  |         ----- move occurs because \`names\` has type \`Vec<String>\`, which does not implement the \`Copy\` trait
4 |     let moved = names;
  |                 ----- value moved here
5 |     println!("{:?}", names);
  |                      ^^^^^ value borrowed here after move`,
  },
];
