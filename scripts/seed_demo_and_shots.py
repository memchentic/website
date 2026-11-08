#!/usr/bin/env python3
"""Seed enterprise-looking demo data and capture GUI screenshots.

Reads ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_API_KEY from docker/.env.
Does not print secrets. Writes PNGs under website/public/screenshots/.
"""

from __future__ import annotations

import json
import os
import random
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import UTC, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCKER_DIR = ROOT.parent / "docker"
DOCKER_ENV = DOCKER_DIR / ".env"
SHOT_DIR = ROOT / "public" / "screenshots"
GUI = os.environ.get("MEMCHENTIC_GUI_URL", "http://127.0.0.1:18080")
API = os.environ.get("MEMCHENTIC_API_URL", "http://127.0.0.1:18081")

DEMO_PASSWORD = "NorthlineDemo1!"
TARGET_TOTAL = int(os.environ.get("MEMCHENTIC_DEMO_TARGET", "2000"))
CORPUS_TAG = "demo-corpus"
ENTRY_TYPES = [
    "fact",
    "preference",
    "decision",
    "instruction",
    "feedback",
    "insight",
    "note",
]
TAG_POOL = [
    "payments",
    "ledger",
    "clearing",
    "sre",
    "postgres",
    "kubernetes",
    "argo",
    "vault",
    "security",
    "pci",
    "api",
    "idempotency",
    "grpc",
    "frontend",
    "console",
    "agents",
    "memchentic",
    "auth",
    "oidc",
    "networking",
    "incident",
    "runbook",
    "gitops",
    "observability",
    "latency",
    "deploy",
    "ownership",
    "architecture",
    "timeouts",
    "locking",
]
TOPIC_STEMS = [
    ("Ledger posting", "ledger", "services/ledger"),
    ("Clearing batch", "clearing", "services/clearing"),
    ("Patroni failover", "postgres", "ops/runbooks"),
    ("Argo sync wave", "gitops", "charts/platform"),
    ("Vault lease", "vault", "ops/migrate"),
    ("Idempotency key", "api", "services/payments-api"),
    ("gRPC deadline", "grpc", "services/ledger"),
    ("Console theme", "frontend", "apps/console"),
    ("OIDC group map", "auth", "apps/auth"),
    ("NAT idle timeout", "networking", "ops/incidents"),
    ("Agent recall", "agents", ".cursor"),
    ("Audit trail", "security", "services/audit"),
    ("Outbox event", "architecture", "services/ledger"),
    ("SEV triage", "incident", "ops/runbooks"),
    ("SLO burn rate", "observability", "ops/slo"),
    ("Deploy freeze", "deploy", "ops/change"),
    ("Redis lock", "locking", "services/ledger"),
    ("Partner SFTP", "clearing", "services/clearing"),
    ("PCI redaction", "pci", "services/payments-api"),
    ("Ownership boundary", "ownership", "docs/architecture"),
]

USERS = [
    {
        "email": "jordan.lee@northline.io",
        "display_name": "Jordan Lee",
        "role": "Platform Lead",
    },
    {
        "email": "priya.shah@northline.io",
        "display_name": "Priya Shah",
        "role": "Backend Engineer",
    },
    {
        "email": "marcus.chen@northline.io",
        "display_name": "Marcus Chen",
        "role": "SRE",
    },
    {
        "email": "sofia.ramos@northline.io",
        "display_name": "Sofia Ramos",
        "role": "Security Engineer",
    },
    {
        "email": "alex.kim@northline.io",
        "display_name": "Alex Kim",
        "role": "Frontend Engineer",
    },
]

# owner creates the group (delete control); members always include the owner.
GROUPS = [
    {
        "name": "Platform Engineering",
        "owner": "jordan.lee@northline.io",
        "members": [
            "jordan.lee@northline.io",
            "priya.shah@northline.io",
            "marcus.chen@northline.io",
            "alex.kim@northline.io",
        ],
    },
    {
        "name": "Payments Core",
        "owner": "jordan.lee@northline.io",
        "members": [
            "jordan.lee@northline.io",
            "priya.shah@northline.io",
            "sofia.ramos@northline.io",
        ],
    },
    {
        "name": "Incident Response",
        "owner": "marcus.chen@northline.io",
        "members": [
            "marcus.chen@northline.io",
            "sofia.ramos@northline.io",
            "jordan.lee@northline.io",
        ],
    },
    {
        "name": "Agent Tooling",
        "owner": "alex.kim@northline.io",
        "members": [
            "alex.kim@northline.io",
            "jordan.lee@northline.io",
            "priya.shah@northline.io",
        ],
    },
]


def load_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        out[key.strip()] = val.strip().strip("'").strip('"')
    return out


def api_json(
    method: str,
    path: str,
    token: str | None = None,
    body: dict | None = None,
    ok: tuple[int, ...] = (200, 201),
) -> dict | list | None:
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        f"{API}{path}",
        data=data,
        method=method,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            raw = res.read()
            if not raw:
                return None
            return json.loads(raw.decode())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")
        if exc.code in ok:
            return json.loads(detail) if detail else None
        # Idempotent-ish: already exists
        if exc.code in (400, 409) and (
            "already" in detail.lower() or "exists" in detail.lower()
        ):
            return {"_exists": True, "detail": detail}
        raise RuntimeError(f"{method} {path} -> {exc.code}: {detail[:400]}") from exc


def login(email: str, password: str) -> str:
    data = api_json(
        "POST",
        "/api/auth/login",
        body={"email": email, "password": password, "remember": True},
    )
    assert isinstance(data, dict)
    return str(data["access_token"])


def ensure_user(admin_token: str, email: str, display_name: str) -> str:
    """Register user (admin can always register). Return user id via login+me."""
    created = api_json(
        "POST",
        "/api/auth/register",
        token=admin_token,
        body={
            "email": email,
            "password": DEMO_PASSWORD,
            "display_name": display_name,
        },
        ok=(200, 201, 400, 409),
    )
    if isinstance(created, dict) and created.get("id") and not created.get("_exists"):
        return str(created["id"])
    token = login(email, DEMO_PASSWORD)
    me = api_json("GET", "/api/me", token=token)
    assert isinstance(me, dict)
    return str(me["id"])


def ensure_group(owner_token: str, admin_token: str, name: str, owner_id: str) -> str:
    """Return group id owned by ``owner_id``; recreate if owned by someone else."""
    spaces = api_json("GET", "/api/spaces", token=admin_token)
    assert isinstance(spaces, list)
    for space in spaces:
        if space.get("name") != name or space.get("kind") != "group":
            continue
        detail = api_json("GET", f"/api/spaces/{space['id']}", token=admin_token)
        assert isinstance(detail, dict)
        if detail.get("created_by") == owner_id:
            return str(space["id"])
        # Wrong owner (older seed) — admin break-glass delete, then recreate.
        api_json("DELETE", f"/api/spaces/{space['id']}", token=admin_token)
        break
    created = api_json("POST", "/api/spaces", token=owner_token, body={"name": name})
    assert isinstance(created, dict)
    return str(created["id"])


def add_member(token: str, space_id: str, email: str) -> None:
    api_json(
        "POST",
        f"/api/spaces/{space_id}/members",
        token=token,
        body={"email": email},
        ok=(200, 201, 400, 409),
    )


def remember(
    token: str,
    *,
    title: str,
    body: str,
    type_: str,
    tags: list[str],
    group: str | None = None,
    path_hint: str | None = None,
    repo_hint: str | None = None,
    expires_at: str | None = None,
) -> None:
    payload: dict = {
        "title": title,
        "body": body,
        "type": type_,
        "tags": tags,
        "force": True,
    }
    if group:
        payload["group"] = group
    if path_hint:
        payload["path_hint"] = path_hint
    if repo_hint:
        payload["repo_hint"] = repo_hint
    if expires_at:
        payload["expires_at"] = expires_at
    api_json("POST", "/api/memories", token=token, body=payload)


def guide_write(
    token: str,
    *,
    title: str,
    body: str,
    tags: list[str],
    group: str | None = None,
) -> None:
    payload: dict = {"title": title, "body": body, "tags": tags}
    if group:
        payload["group"] = group
    api_json("POST", "/api/guides", token=token, body=payload)


def psql(sql: str) -> str:
    """Run SQL as the Compose postgres superuser (BYPASSRLS)."""
    proc = subprocess.run(
        [
            "docker",
            "compose",
            "exec",
            "-T",
            "postgres",
            "psql",
            "-U",
            "memchentic",
            "-d",
            "memchentic",
            "-v",
            "ON_ERROR_STOP=1",
            "-At",
            "-F",
            "\t",
        ],
        input=sql.encode(),
        cwd=DOCKER_DIR,
        capture_output=True,
        check=False,
    )
    if proc.returncode != 0:
        err = (proc.stderr or proc.stdout).decode(errors="replace")[:800]
        raise RuntimeError(f"psql failed: {err}")
    return proc.stdout.decode()


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sql_array(values: list[str]) -> str:
    if not values:
        return "ARRAY[]::varchar[]"
    return "ARRAY[" + ", ".join(sql_quote(v) for v in values) + "]::varchar[]"


def memory_count() -> int:
    return int(psql("SELECT count(*) FROM memories;").strip() or "0")


def title_exists(title: str) -> bool:
    out = psql(f"SELECT 1 FROM memories WHERE title = {sql_quote(title)} LIMIT 1;")
    return bool(out.strip())


def wipe_corpus() -> int:
    # Prefer provenance flag; also clear legacy rows tagged demo-corpus.
    out = psql(
        "WITH d AS ("
        "DELETE FROM memories WHERE "
        f"(provenance ? 'demo_corpus') OR ({sql_quote(CORPUS_TAG)} = ANY(tags)) "
        "RETURNING 1) SELECT count(*) FROM d;"
    )
    return int(out.strip() or "0")


def personal_space_ids(tokens: dict[str, str]) -> dict[str, str]:
    out: dict[str, str] = {}
    for email, token in tokens.items():
        me = api_json("GET", "/api/me", token=token)
        assert isinstance(me, dict) and me.get("personal_space_id")
        out[email] = str(me["personal_space_id"])
    return out


def fill_corpus(
    *,
    tokens: dict[str, str],
    owner_ids: dict[str, str],
    group_ids: dict[str, str],
    personal_ids: dict[str, str],
    target: int,
) -> int:
    """Bulk-insert balanced demo rows via SQL so Metrics charts look full."""
    wiped = wipe_corpus()
    if wiped:
        print(f"  wiped prior corpus rows: {wiped}")

    current = memory_count()
    need = max(0, target - current)
    if need == 0:
        print(f"  already at {current} memories (target {target})")
        return 0

    print(f"  inserting {need} corpus memories (now {current}, target {target})…")
    rng = random.Random(42)
    emails = [u["email"] for u in USERS]
    group_names = [g["name"] for g in GROUPS]
    zero_vec = "[" + ",".join(["0"] * 384) + "]"
    now = datetime.now(UTC)

    # Mild growth over 90 days so the time chart isn't a single spike.
    day_weights = [0.55 + 0.45 * (d / 89.0) for d in range(90)]
    weight_sum = sum(day_weights)

    rows: list[str] = []
    for i in range(need):
        email = emails[i % len(emails)]
        is_guide = (i % 10) < 3  # ~30% guides
        stem, tag_hint, path = TOPIC_STEMS[i % len(TOPIC_STEMS)]
        # Space mix: ~18% personal, rest evenly across groups.
        if (i % 17) == 0:
            space_id = personal_ids[email]
            group_label = "personal"
        else:
            gname = group_names[i % len(group_names)]
            space_id = group_ids[gname]
            group_label = gname

        # Keep demo marker in provenance only — do not pollute top-tags charts.
        tags = {tag_hint}
        tags.add(TAG_POOL[(i * 3) % len(TAG_POOL)])
        tags.add(TAG_POOL[(i * 7 + 5) % len(TAG_POOL)])
        if i % 4 == 0:
            tags.add(TAG_POOL[(i * 11 + 2) % len(TAG_POOL)])

        # Sample a day with replacement weighted toward recent.
        pick = rng.random() * weight_sum
        acc = 0.0
        day = 89
        for d, w in enumerate(day_weights):
            acc += w
            if pick <= acc:
                day = d
                break
        created = now - timedelta(days=89 - day, hours=rng.randint(0, 23), minutes=rng.randint(0, 59))
        expires_sql = "NULL"
        if (not is_guide) and (i % 25) == 0:
            exp = now + timedelta(days=rng.randint(2, 13))
            expires_sql = sql_quote(exp.isoformat())

        title = f"{stem} note {i + 1:04d} ({group_label})"
        if is_guide:
            title = f"When working on {stem.lower()} #{i + 1:04d}"
            body = (
                f"When X = {stem.lower()} work item {i + 1}: do Y = check prior "
                f"notes in {group_label} and follow Northline runbooks. "
                f"Avoid Z = reinventing ownership or skipping idempotency."
            )
            kind_sql = "'guide'::memory_kind"
            type_sql = "NULL"
            conf_sql = "1.0"
        else:
            et = ENTRY_TYPES[i % len(ENTRY_TYPES)]
            body = (
                f"{stem} detail #{i + 1} for Northline ({et}). "
                f"Owner context: {email.split('@')[0]} in {group_label}. "
                f"Keep path hints honest; capture after verification only."
            )
            kind_sql = "'entry'::memory_kind"
            type_sql = f"'{et}'::entry_type"
            conf_sql = "1.0"

        rows.append(
            "("
            + ", ".join(
                [
                    "gen_random_uuid()",
                    sql_quote(space_id) + "::uuid",
                    kind_sql,
                    type_sql,
                    sql_quote(title[:512]),
                    sql_quote(body),
                    sql_array(sorted(tags)),
                    sql_quote(path),
                    sql_quote("northline/platform"),
                    expires_sql,
                    conf_sql,
                    f"'{zero_vec}'::vector",
                    "'{\"demo_corpus\": true}'::jsonb",
                    sql_quote(owner_ids[email]) + "::uuid",
                    sql_quote(created.isoformat()),
                    sql_quote(created.isoformat()),
                ]
            )
            + ")"
        )

    batch = 150
    inserted = 0
    for start in range(0, len(rows), batch):
        chunk = rows[start : start + batch]
        sql = (
            "INSERT INTO memories ("
            "id, space_id, kind, entry_type, title, body, tags, path_hint, "
            "repo_hint, expires_at, confidence, embedding, provenance, "
            "created_by_user_id, created_at, updated_at"
            ") VALUES\n"
            + ",\n".join(chunk)
            + ";\n"
        )
        psql(sql)
        inserted += len(chunk)
        if inserted % 600 == 0 or inserted == need:
            print(f"    …{inserted}/{need}")

    # Soft-balance hero timestamps too so charts aren't a one-day cliff.
    psql(
        f"""
        UPDATE memories
        SET created_at = now()
              - (((abs(hashtext(id::text)) % 80)::text || ' days')::interval)
              - (((abs(hashtext(title)) % 20)::text || ' hours')::interval),
            updated_at = created_at
        WHERE NOT (provenance ? 'demo_corpus')
          AND created_at > now() - interval '2 days';
        """
    )
    return inserted


def seed(admin_token: str) -> None:
    print("Ensuring users…")
    for user in USERS:
        uid = ensure_user(admin_token, user["email"], user["display_name"])
        print(f"  {user['display_name']} ({user['role']}) ok id={uid[:8]}…")

    print("Ensuring groups…")
    tokens = {u["email"]: login(u["email"], DEMO_PASSWORD) for u in USERS}
    owner_ids = {
        email: str(api_json("GET", "/api/me", token=tok)["id"])  # type: ignore[index]
        for email, tok in tokens.items()
    }
    group_ids: dict[str, str] = {}
    for group in GROUPS:
        owner_email = str(group["owner"])
        owner_token = tokens[owner_email]
        gid = ensure_group(
            owner_token, admin_token, group["name"], owner_ids[owner_email]
        )
        group_ids[group["name"]] = gid
        for email in group["members"]:
            if email == owner_email:
                continue
            add_member(owner_token, gid, email)
        print(
            f"  {group['name']} owner={owner_email.split('@')[0]} "
            f"members={len(group['members'])}"
        )

    print("Writing hero memories + guides…")
    heroes: list[tuple] = [
        (
            remember,
            {
                "token": tokens["jordan.lee@northline.io"],
                "title": "Northline service ownership: Ledger vs Clearing",
                "body": (
                    "Ledger owns authoritative balances and double-entry postings. "
                    "Clearing owns settlement batches and partner file exchange. "
                    "Never write settlement state into Ledger tables — use the "
                    "outbox event ledger.settlement_requested instead."
                ),
                "type_": "decision",
                "tags": ["architecture", "payments", "ownership"],
                "group": "Payments Core",
                "path_hint": "services/ledger",
                "repo_hint": "northline/platform",
            },
        ),
        (
            remember,
            {
                "token": tokens["priya.shah@northline.io"],
                "title": "Idempotency keys required on all money-moving APIs",
                "body": (
                    "POST /v1/transfers and POST /v1/payouts require Idempotency-Key. "
                    "Keys are scoped per API client for 72h. Replays must return the "
                    "original response body and status, not 409."
                ),
                "type_": "instruction",
                "tags": ["api", "payments", "idempotency"],
                "group": "Payments Core",
                "path_hint": "services/payments-api",
                "repo_hint": "northline/platform",
            },
        ),
        (
            remember,
            {
                "token": tokens["sofia.ramos@northline.io"],
                "title": "PCI: no PAN or CVV in application logs",
                "body": (
                    "Card numbers and CVVs must never appear in app logs, traces, or "
                    "exception messages. Use the vault token (tok_…) in logs. Security "
                    "reviews failed builds that print payment method dumps."
                ),
                "type_": "instruction",
                "tags": ["security", "pci", "logging"],
                "group": "Payments Core",
                "path_hint": "services/payments-api",
                "repo_hint": "northline/platform",
            },
        ),
        (
            remember,
            {
                "token": tokens["marcus.chen@northline.io"],
                "title": "Postgres primary failover runbook (eu-west-1)",
                "body": (
                    "On primary unavailability: confirm Patroni lag < 30s on candidate, "
                    "promote via northline-dbctl promote --cluster payments-eu, update "
                    "Vault database/static-creds role lease, then bounce payments-api "
                    "Deployment. Do not manually edit Endpoints."
                ),
                "type_": "fact",
                "tags": ["sre", "postgres", "runbook"],
                "group": "Incident Response",
                "path_hint": "ops/runbooks/postgres-failover.md",
                "repo_hint": "northline/runbooks",
            },
        ),
        (
            remember,
            {
                "token": tokens["marcus.chen@northline.io"],
                "title": "SEV-2: clearing partner SFTP stalled overnight",
                "body": (
                    "2026-10-14: partner ACH file upload hung after TLS renegotiation. "
                    "Root cause was stale NAT gateway connection tracking. Fix: recycle "
                    "egress NAT and lower idle timeout to 350s. Alert: "
                    "clearing_sftp_upload_age_seconds > 900."
                ),
                "type_": "insight",
                "tags": ["incident", "networking", "clearing"],
                "group": "Incident Response",
                "path_hint": "ops/incidents/2026-10-14-sftp.md",
                "repo_hint": "northline/runbooks",
            },
        ),
        (
            remember,
            {
                "token": tokens["jordan.lee@northline.io"],
                "title": "Prefer Argo CD sync waves over Helm hooks",
                "body": (
                    "Platform chart migrations use sync-wave annotations, not Helm "
                    "pre-install hooks. Hooks fight Argo's prune behavior. Documented "
                    "in platform-charts README."
                ),
                "type_": "decision",
                "tags": ["gitops", "argo", "helm"],
                "group": "Platform Engineering",
                "path_hint": "charts/platform",
                "repo_hint": "northline/platform-charts",
            },
        ),
        (
            remember,
            {
                "token": tokens["alex.kim@northline.io"],
                "title": "Console UI: greyscale dark is the only theme",
                "body": (
                    "Northline operator console stays greyscale dark. Do not introduce "
                    "accent color themes without design review. Icons: Font Awesome 6 "
                    "solid only in nav."
                ),
                "type_": "preference",
                "tags": ["frontend", "design", "console"],
                "group": "Platform Engineering",
                "path_hint": "apps/console",
                "repo_hint": "northline/console",
            },
        ),
        (
            remember,
            {
                "token": tokens["priya.shah@northline.io"],
                "title": "gRPC deadlines: 3s read, 10s write for ledger",
                "body": (
                    "Client defaults: ledger.GetAccount 3s, ledger.PostEntry 10s. "
                    "Retries with jitter only on UNAVAILABLE and DEADLINE_EXCEEDED "
                    "for reads. Writes are not retried without a new idempotency key."
                ),
                "type_": "fact",
                "tags": ["grpc", "ledger", "timeouts"],
                "group": "Platform Engineering",
                "path_hint": "services/ledger",
                "repo_hint": "northline/platform",
            },
        ),
        (
            remember,
            {
                "token": tokens["alex.kim@northline.io"],
                "title": "Agent memory plugin: recall before rediscovery",
                "body": (
                    "Cursor agents working in northline/* must call memory find/guide_find "
                    "before re-investigating auth, payments, or deploy paths. Capture "
                    "after verification only — no speculative notes."
                ),
                "type_": "instruction",
                "tags": ["agents", "memchentic", "workflow"],
                "group": "Agent Tooling",
                "path_hint": ".cursor",
                "repo_hint": "northline/platform",
            },
        ),
        (
            remember,
            {
                "token": tokens["jordan.lee@northline.io"],
                "title": "OIDC groups claim maps to Northline auth groups",
                "body": (
                    "IdP group 'northline-admins' binds to Administrators. "
                    "'northline-engineers' binds to Users. Personal spaces stay "
                    "private; product memory goes in shared groups."
                ),
                "type_": "fact",
                "tags": ["auth", "oidc", "acl"],
                "group": "Agent Tooling",
            },
        ),
        (
            remember,
            {
                "token": tokens["sofia.ramos@northline.io"],
                "title": "Feedback: vault lease renewal raced deploy",
                "body": (
                    "During the Oct deploy window, short DB leases caused 401s mid "
                    "migration. Bump static role TTL to 24h for migrate Jobs only; "
                    "keep app pods on short leases."
                ),
                "type_": "feedback",
                "tags": ["vault", "deploy", "database"],
                "group": "Incident Response",
                "path_hint": "ops/migrate",
                "repo_hint": "northline/platform-charts",
                "expires_at": (datetime.now(UTC) + timedelta(days=10)).isoformat(),
            },
        ),
        (
            remember,
            {
                "token": tokens["priya.shah@northline.io"],
                "title": "Failed approach: shared Redis for ledger locks",
                "body": (
                    "Tried Redis Redlock for multi-region ledger writes. Abandoned: "
                    "split-brain under partition violated double-entry invariants. "
                    "Stay on Postgres advisory locks in the primary region."
                ),
                "type_": "insight",
                "tags": ["ledger", "locking", "redis"],
                "group": "Payments Core",
                "path_hint": "services/ledger",
                "repo_hint": "northline/platform",
            },
        ),
        (
            remember,
            {
                "token": tokens["jordan.lee@northline.io"],
                "title": "Prefer conventional commits on platform-charts",
                "body": (
                    "Imperative subjects, scoped (feat/fix/chore). No emoji. One "
                    "logical change per PR when practical."
                ),
                "type_": "preference",
                "tags": ["git", "commits"],
                "path_hint": "charts",
                "repo_hint": "northline/platform-charts",
            },
        ),
        (
            guide_write,
            {
                "token": tokens["jordan.lee@northline.io"],
                "title": "When changing money paths, require idempotency + audit",
                "body": (
                    "When X = editing transfer/payout/settlement code: do Y = keep "
                    "Idempotency-Key semantics and emit audit events. Avoid Z = "
                    "silent retries of writes or logging PANs."
                ),
                "tags": ["payments", "safety", "guide"],
                "group": "Payments Core",
            },
        ),
        (
            guide_write,
            {
                "token": tokens["marcus.chen@northline.io"],
                "title": "When paging on datastore, check Patroni before failover",
                "body": (
                    "When X = Postgres primary looks down: do Y = verify Patroni "
                    "member state and replication lag, then use northline-dbctl. "
                    "Avoid Z = kubectl delete pod on the primary as a first step."
                ),
                "tags": ["sre", "postgres", "guide"],
                "group": "Incident Response",
            },
        ),
        (
            guide_write,
            {
                "token": tokens["alex.kim@northline.io"],
                "title": "When starting agent work in northline repos, recall first",
                "body": (
                    "When X = unfamiliar path or recurring failure in northline/*: "
                    "do Y = guide_find + find before rediscovery. Avoid Z = "
                    "re-deriving ACL or payments rules from scratch."
                ),
                "tags": ["agents", "recall", "guide"],
                "group": "Agent Tooling",
            },
        ),
    ]
    for fn, kwargs in heroes:
        title = str(kwargs["title"])
        if title_exists(title) and fn is remember:
            continue
        fn(**kwargs)  # type: ignore[misc]

    print("Filling balanced corpus…")
    personal_ids = personal_space_ids(tokens)
    added = fill_corpus(
        tokens=tokens,
        owner_ids=owner_ids,
        group_ids=group_ids,
        personal_ids=personal_ids,
        target=TARGET_TOTAL,
    )
    total = memory_count()
    print(f"Seed complete. corpus_added={added} total_memories={total}")


def ensure_shots_interpreter() -> None:
    """Re-exec under website/.venv-shots when Playwright is needed."""
    venv_py = ROOT / ".venv-shots" / "bin" / "python"
    if not venv_py.is_file():
        return
    if Path(sys.executable).resolve() == venv_py.resolve():
        return
    os.execv(
        str(venv_py),
        [str(venv_py), str(Path(__file__).resolve()), *sys.argv[1:]],
    )


def capture_screenshots(
    login_email: str,
    login_password: str,
    *,
    metrics_email: str | None = None,
    metrics_password: str | None = None,
) -> None:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print(
            "Playwright missing. Create website/.venv-shots and:\n"
            "  .venv-shots/bin/pip install playwright && "
            ".venv-shots/bin/playwright install chromium",
            file=sys.stderr,
        )
        raise

    SHOT_DIR.mkdir(parents=True, exist_ok=True)
    viewport = {"width": 1440, "height": 900}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport=viewport,
            device_scale_factor=2,
            color_scheme="dark",
        )
        page = context.new_page()
        page.goto(f"{GUI}/sign-in", wait_until="domcontentloaded")
        page.wait_for_selector('input[type="email"]', timeout=30000)
        page.fill('input[type="email"]', login_email)
        page.fill('input[type="password"]', login_password)
        page.click('button[type="submit"]')
        page.wait_for_url(lambda url: "/sign-in" not in url, timeout=30000)
        page.get_by_role("heading", name="Memories").wait_for(timeout=30000)
        page.wait_for_timeout(2000)

        # Memories list (SSE keeps networkidle from settling)
        page.goto(f"{GUI}/", wait_until="domcontentloaded")
        page.get_by_role("heading", name="Memories").wait_for(timeout=30000)
        page.locator("table tbody tr").first.wait_for(timeout=30000)
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SHOT_DIR / "memories.png"), full_page=False)
        print(f"Wrote {SHOT_DIR / 'memories.png'}")

        page.locator("nav a[href='/groups'], a[href='/groups']").first.click()
        page.wait_for_url("**/groups", timeout=30000)
        page.locator("h2.page-header-title").wait_for(timeout=30000)
        page.wait_for_timeout(2000)
        title = page.locator("h2.page-header-title").inner_text()
        print(f"Groups page title={title!r} url={page.url}")
        if "Group" not in title:
            page.screenshot(path=str(SHOT_DIR / "debug-groups.png"), full_page=False)
            raise RuntimeError(f"expected Groups page, got {title!r}")
        page.locator("table tbody tr").first.wait_for(timeout=30000)
        page.wait_for_timeout(800)
        page.screenshot(path=str(SHOT_DIR / "groups.png"), full_page=False)
        print(f"Wrote {SHOT_DIR / 'groups.png'}")

        page.locator("table tbody tr", has_text="Platform Engineering").first.click()
        page.wait_for_url("**/groups/**", timeout=30000)
        # Owned group: Rename + Delete (trash); remove-member trash on roster.
        page.locator("button[aria-label='Delete']").wait_for(timeout=10000)
        page.locator("button[aria-label='Remove']").first.wait_for(timeout=10000)
        page.wait_for_timeout(1200)
        page.screenshot(path=str(SHOT_DIR / "group-detail.png"), full_page=False)
        print(f"Wrote {SHOT_DIR / 'group-detail.png'}")

        page.goto(f"{GUI}/", wait_until="domcontentloaded")
        page.locator("table tbody tr").first.wait_for(timeout=30000)
        page.wait_for_timeout(800)
        page.locator("table tbody tr").first.click()
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SHOT_DIR / "memory-detail.png"), full_page=False)
        print(f"Wrote {SHOT_DIR / 'memory-detail.png'}")

        # Metrics — prefer admin so the shot shows the full corpus pulse.
        m_email = metrics_email or login_email
        m_password = metrics_password or login_password
        if (m_email, m_password) != (login_email, login_password):
            context.clear_cookies()
            page.goto(f"{GUI}/sign-in", wait_until="domcontentloaded")
            page.wait_for_selector('input[type="email"]', timeout=30000)
            page.fill('input[type="email"]', m_email)
            page.fill('input[type="password"]', m_password)
            page.click('button[type="submit"]')
            page.wait_for_url(lambda url: "/sign-in" not in url, timeout=30000)
            page.wait_for_timeout(800)
        page.goto(f"{GUI}/metrics", wait_until="domcontentloaded")
        page.get_by_role("heading", name="Metrics").wait_for(timeout=30000)
        page.locator(".metrics-kpi-value").first.wait_for(timeout=30000)
        page.locator(".recharts-responsive-container").first.wait_for(timeout=30000)
        page.wait_for_timeout(1800)
        page.screenshot(path=str(SHOT_DIR / "metrics.png"), full_page=False)
        print(f"Wrote {SHOT_DIR / 'metrics.png'}")

        browser.close()


def main() -> int:
    seed_only = "--seed-only" in sys.argv
    shots_only = "--shots-only" in sys.argv
    if seed_only and shots_only:
        print("Use only one of --seed-only / --shots-only", file=sys.stderr)
        return 1
    if not DOCKER_ENV.is_file():
        print(f"Missing {DOCKER_ENV}", file=sys.stderr)
        return 1
    env = load_env(DOCKER_ENV)
    admin_key = env.get("ADMIN_API_KEY") or ""
    admin_email = env.get("ADMIN_EMAIL") or ""
    admin_password = env.get("ADMIN_PASSWORD") or ""
    if not admin_key or not admin_email or not admin_password:
        print("docker/.env missing ADMIN_* values", file=sys.stderr)
        return 1

    if not seed_only:
        ensure_shots_interpreter()

    if not shots_only:
        admin_token = login(admin_email, admin_password)
        seed(admin_token)
        if seed_only:
            return 0
    # Groups/detail as Platform Lead; Metrics as admin for the full corpus.
    capture_screenshots(
        "jordan.lee@northline.io",
        DEMO_PASSWORD,
        metrics_email=admin_email,
        metrics_password=admin_password,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
