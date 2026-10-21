"""Collect real error traces from public GitHub issues for the ErrorSpeak evaluation.

Method (fixed in advance, no hand-picking):
  - one search query per category, sorted by newest issue first, before a fixed cut-off date
  - walk the results in order and keep the first PER_QUERY issues whose body contains
    an extractable trace (a code block, or the lines around the marker)
  - store the trace text, its source URL and the query it came from

Run:  python eval/collect.py                 -> dataset.json  (development set: eligible results 1-5)
      python eval/collect.py --heldout       -> heldout.json  (held-out set: eligible results 6-10)
Uses the unauthenticated GitHub search API.
"""
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

CUTOFF = "2026-10-01"  # issues created before this date, so the set is reproducible
PER_QUERY = 5
HELDOUT = "--heldout" in sys.argv
OUT = Path(__file__).parent / ("heldout.json" if HELDOUT else "dataset.json")

# (category, search phrase, marker that must appear in the extracted trace)
QUERIES = [
    ("python", '"Traceback (most recent call last)" "KeyError"', "Traceback (most recent call last)"),
    ("python", '"Traceback (most recent call last)" "ModuleNotFoundError"', "Traceback (most recent call last)"),
    ("python", '"Traceback (most recent call last)" "AttributeError"', "Traceback (most recent call last)"),
    ("python", '"Traceback (most recent call last)" "TypeError"', "Traceback (most recent call last)"),
    ("node", '"Error: Cannot find module" "Require stack"', "Cannot find module"),
    ("node", '"TypeError: Cannot read properties of undefined"', "Cannot read properties of undefined"),
    ("node", '"EADDRINUSE: address already in use"', "EADDRINUSE"),
    ("node", '"npm error code ERESOLVE"', "ERESOLVE"),
    ("git", '"CONFLICT (content): Merge conflict in"', "Merge conflict in"),
    ("git", '"failed to push some refs" "rejected"', "failed to push some refs"),
    ("docker", '"exited with code 137"', "137"),
    ("docker", '"port is already allocated"', "port is already allocated"),
    ("unsupported", '"error[E0382]" "borrow of moved value"', "error[E0382]"),
    ("unsupported", '"panic: runtime error: invalid memory address or nil pointer dereference"', "panic: runtime error"),
    ("unsupported", '"Exception in thread \\"main\\" java.lang.NullPointerException"', "Exception in thread"),
]

FENCE = re.compile(r"```[^\n]*\n(.*?)```", re.S)


def search(phrase):
    q = f"{phrase} is:issue created:<{CUTOFF}"
    url = "https://api.github.com/search/issues?" + urllib.parse.urlencode(
        {"q": q, "sort": "created", "order": "desc", "per_page": 50}
    )
    req = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json", "User-Agent": "errorspeak-eval"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)["items"]
        except urllib.error.HTTPError as e:
            if e.code not in (403, 429) or attempt == 3:
                raise
            time.sleep(65)  # secondary rate limit: wait it out and retry


def extract(body, marker):
    body = (body or "").replace("\r\n", "\n")
    for block in FENCE.findall(body):
        if marker in block:
            lines = block.strip("\n").split("\n")
            return "\n".join(lines[-80:])  # tracebacks end with the error; keep the tail
    if marker in body:
        lines = body.split("\n")
        i = next(n for n, l in enumerate(lines) if marker in l)
        return "\n".join(lines[max(0, i - 25): i + 25]).strip()
    return None


def main():
    items, seen = [], set()
    dev = Path(__file__).parent / "dataset.json"
    if HELDOUT and dev.exists():  # skip the development set's issues, so the held-out set is the next 5
        seen |= {d["source"] for d in json.loads(dev.read_text(encoding="utf-8"))}
    for n, (category, phrase, marker) in enumerate(QUERIES):
        if n:
            time.sleep(7)  # unauthenticated search limit is 10 requests a minute
        try:
            results = search(phrase)
        except Exception as e:  # keep going; a failed query is reported, not hidden
            print(f"query failed: {phrase}: {e}", file=sys.stderr)
            continue
        kept = 0
        for issue in results:
            if kept == PER_QUERY:
                break
            if issue["html_url"] in seen:
                continue
            trace = extract(issue.get("body"), marker)
            if not trace or len(trace) < 40:
                continue
            seen.add(issue["html_url"])
            items.append({
                "id": f"{'h-' if HELDOUT else ''}{category}-{len(items) + 1:03d}",
                "category": category,
                "query": phrase,
                "source": issue["html_url"],
                "trace": trace,
            })
            kept += 1
        print(f"{category:12s} {kept}/{PER_QUERY}  {phrase}")
    OUT.write_text(json.dumps(items, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n{len(items)} traces -> {OUT}")


if __name__ == "__main__":
    main()
