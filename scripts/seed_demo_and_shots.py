#!/usr/bin/env python3
"""Seed enterprise-looking demo data and capture GUI screenshots.

Reads ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_API_KEY from docker/.env.
Does not print secrets. Writes PNGs under website/public/screenshots/.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCKER_ENV = ROOT.parent / "docker" / ".env"
SHOT_DIR = ROOT / "public" / "screenshots"
GUI = os.environ.get("MEMCHENTIC_GUI_URL", "http://127.0.0.1:18080")
API = os.environ.get("MEMCHENTIC_API_URL", "http://127.0.0.1:18081")

DEMO_PASSWORD = "NorthlineDemo1!"

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

GROUPS = [
    {
        "name": "Platform Engineering",
        "members": [
            "jordan.lee@northline.io",
            "priya.shah@northline.io",
            "marcus.chen@northline.io",
            "alex.kim@northline.io",
        ],
    },
    {
        "name": "Payments Core",
        "members": [
            "jordan.lee@northline.io",
            "priya.shah@northline.io",
            "sofia.ramos@northline.io",
        ],
    },
    {
        "name": "Incident Response",
        "members": [
            "marcus.chen@northline.io",
            "sofia.ramos@northline.io",
            "jordan.lee@northline.io",
        ],
    },
    {
        "name": "Agent Tooling",
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


def ensure_group(token: str, name: str) -> str:
    spaces = api_json("GET", "/api/spaces", token=token)
    assert isinstance(spaces, list)
    for space in spaces:
        if space.get("name") == name and space.get("kind") == "group":
            return str(space["id"])
    created = api_json("POST", "/api/spaces", token=token, body={"name": name})
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


def seed(admin_token: str) -> None:
    print("Ensuring users…")
    for user in USERS:
        uid = ensure_user(admin_token, user["email"], user["display_name"])
        print(f"  {user['display_name']} ({user['role']}) ok id={uid[:8]}…")

    # Create groups as Platform Lead so ownership looks natural
    lead_token = login("jordan.lee@northline.io", DEMO_PASSWORD)
    print("Ensuring groups…")
    group_ids: dict[str, str] = {}
    for group in GROUPS:
        gid = ensure_group(lead_token, group["name"])
        group_ids[group["name"]] = gid
        for email in group["members"]:
            if email == "jordan.lee@northline.io":
                continue
            add_member(lead_token, gid, email)
        print(f"  {group['name']} members={len(group['members'])}")

    # Tokens per user
    tokens = {
        u["email"]: login(u["email"], DEMO_PASSWORD) for u in USERS
    }

    print("Writing memories + guides…")

    remember(
        tokens["jordan.lee@northline.io"],
        title="Northline service ownership: Ledger vs Clearing",
        body=(
            "Ledger owns authoritative balances and double-entry postings. "
            "Clearing owns settlement batches and partner file exchange. "
            "Never write settlement state into Ledger tables — use the "
            "outbox event ledger.settlement_requested instead."
        ),
        type_="decision",
        tags=["architecture", "payments", "ownership"],
        group="Payments Core",
        path_hint="services/ledger",
        repo_hint="northline/platform",
    )
    remember(
        tokens["priya.shah@northline.io"],
        title="Idempotency keys required on all money-moving APIs",
        body=(
            "POST /v1/transfers and POST /v1/payouts require Idempotency-Key. "
            "Keys are scoped per API client for 72h. Replays must return the "
            "original response body and status, not 409."
        ),
        type_="instruction",
        tags=["api", "payments", "idempotency"],
        group="Payments Core",
        path_hint="services/payments-api",
        repo_hint="northline/platform",
    )
    remember(
        tokens["sofia.ramos@northline.io"],
        title="PCI: no PAN or CVV in application logs",
        body=(
            "Card numbers and CVVs must never appear in app logs, traces, or "
            "exception messages. Use the vault token (tok_…) in logs. Security "
            "reviews failed builds that print payment method dumps."
        ),
        type_="instruction",
        tags=["security", "pci", "logging"],
        group="Payments Core",
        path_hint="services/payments-api",
        repo_hint="northline/platform",
    )
    remember(
        tokens["marcus.chen@northline.io"],
        title="Postgres primary failover runbook (eu-west-1)",
        body=(
            "On primary unavailability: confirm Patroni lag < 30s on candidate, "
            "promote via northline-dbctl promote --cluster payments-eu, update "
            "Vault database/static-creds role lease, then bounce payments-api "
            "Deployment. Do not manually edit Endpoints."
        ),
        type_="fact",
        tags=["sre", "postgres", "runbook"],
        group="Incident Response",
        path_hint="ops/runbooks/postgres-failover.md",
        repo_hint="northline/runbooks",
    )
    remember(
        tokens["marcus.chen@northline.io"],
        title="SEV-2: clearing partner SFTP stalled overnight",
        body=(
            "2026-10-14: partner ACH file upload hung after TLS renegotiation. "
            "Root cause was stale NAT gateway connection tracking. Fix: recycle "
            "egress NAT and lower idle timeout to 350s. Alert: "
            "clearing_sftp_upload_age_seconds > 900."
        ),
        type_="insight",
        tags=["incident", "networking", "clearing"],
        group="Incident Response",
        path_hint="ops/incidents/2026-10-14-sftp.md",
        repo_hint="northline/runbooks",
    )
    remember(
        tokens["jordan.lee@northline.io"],
        title="Prefer Argo CD sync waves over Helm hooks",
        body=(
            "Platform chart migrations use sync-wave annotations, not Helm "
            "pre-install hooks. Hooks fight Argo's prune behavior. Documented "
            "in platform-charts README."
        ),
        type_="decision",
        tags=["gitops", "argo", "helm"],
        group="Platform Engineering",
        path_hint="charts/platform",
        repo_hint="northline/platform-charts",
    )
    remember(
        tokens["alex.kim@northline.io"],
        title="Console UI: greyscale dark is the only theme",
        body=(
            "Northline operator console stays greyscale dark. Do not introduce "
            "accent color themes without design review. Icons: Font Awesome 6 "
            "solid only in nav."
        ),
        type_="preference",
        tags=["frontend", "design", "console"],
        group="Platform Engineering",
        path_hint="apps/console",
        repo_hint="northline/console",
    )
    remember(
        tokens["priya.shah@northline.io"],
        title="gRPC deadlines: 3s read, 10s write for ledger",
        body=(
            "Client defaults: ledger.GetAccount 3s, ledger.PostEntry 10s. "
            "Retries with jitter only on UNAVAILABLE and DEADLINE_EXCEEDED "
            "for reads. Writes are not retried without a new idempotency key."
        ),
        type_="fact",
        tags=["grpc", "ledger", "timeouts"],
        group="Platform Engineering",
        path_hint="services/ledger",
        repo_hint="northline/platform",
    )
    remember(
        tokens["alex.kim@northline.io"],
        title="Agent memory plugin: recall before rediscovery",
        body=(
            "Cursor agents working in northline/* must call memory find/guide_find "
            "before re-investigating auth, payments, or deploy paths. Capture "
            "after verification only — no speculative notes."
        ),
        type_="instruction",
        tags=["agents", "memchentic", "workflow"],
        group="Agent Tooling",
        path_hint=".cursor",
        repo_hint="northline/platform",
    )
    remember(
        tokens["jordan.lee@northline.io"],
        title="OIDC groups claim maps to Northline auth groups",
        body=(
            "IdP group 'northline-admins' binds to Administrators. "
            "'northline-engineers' binds to Users. Personal spaces stay "
            "private; product memory goes in shared groups."
        ),
        type_="fact",
        tags=["auth", "oidc", "acl"],
        group="Agent Tooling",
    )
    remember(
        tokens["sofia.ramos@northline.io"],
        title="Feedback: vault lease renewal raced deploy",
        body=(
            "During the Oct deploy window, short DB leases caused 401s mid "
            "migration. Bump static role TTL to 24h for migrate Jobs only; "
            "keep app pods on short leases."
        ),
        type_="feedback",
        tags=["vault", "deploy", "database"],
        group="Incident Response",
        path_hint="ops/migrate",
        repo_hint="northline/platform-charts",
    )
    remember(
        tokens["priya.shah@northline.io"],
        title="Failed approach: shared Redis for ledger locks",
        body=(
            "Tried Redis Redlock for multi-region ledger writes. Abandoned: "
            "split-brain under partition violated double-entry invariants. "
            "Stay on Postgres advisory locks in the primary region."
        ),
        type_="insight",
        tags=["ledger", "locking", "redis"],
        group="Payments Core",
        path_hint="services/ledger",
        repo_hint="northline/platform",
    )

    # A few personal prefs (no group) so personal space looks alive for lead
    remember(
        tokens["jordan.lee@northline.io"],
        title="Prefer conventional commits on platform-charts",
        body=(
            "Imperative subjects, scoped (feat/fix/chore). No emoji. One "
            "logical change per PR when practical."
        ),
        type_="preference",
        tags=["git", "commits"],
        path_hint="charts",
        repo_hint="northline/platform-charts",
    )

    guide_write(
        tokens["jordan.lee@northline.io"],
        title="When changing money paths, require idempotency + audit",
        body=(
            "When X = editing transfer/payout/settlement code: do Y = keep "
            "Idempotency-Key semantics and emit audit events. Avoid Z = "
            "silent retries of writes or logging PANs."
        ),
        tags=["payments", "safety", "guide"],
        group="Payments Core",
    )
    guide_write(
        tokens["marcus.chen@northline.io"],
        title="When paging on datastore, check Patroni before failover",
        body=(
            "When X = Postgres primary looks down: do Y = verify Patroni "
            "member state and replication lag, then use northline-dbctl. "
            "Avoid Z = kubectl delete pod on the primary as a first step."
        ),
        tags=["sre", "postgres", "guide"],
        group="Incident Response",
    )
    guide_write(
        tokens["alex.kim@northline.io"],
        title="When starting agent work in northline repos, recall first",
        body=(
            "When X = unfamiliar path or recurring failure in northline/*: "
            "do Y = guide_find + find before rediscovery. Avoid Z = "
            "re-deriving ACL or payments rules from scratch."
        ),
        tags=["agents", "recall", "guide"],
        group="Agent Tooling",
    )
    print("Seed complete.")


def capture_screenshots(login_email: str, login_password: str) -> None:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Installing playwright…", flush=True)
        import subprocess

        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "--user", "playwright"],
        )
        subprocess.check_call(
            [sys.executable, "-m", "playwright", "install", "chromium"],
        )
        from playwright.sync_api import sync_playwright

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
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SHOT_DIR / "group-detail.png"), full_page=False)
        print(f"Wrote {SHOT_DIR / 'group-detail.png'}")

        page.goto(f"{GUI}/", wait_until="domcontentloaded")
        page.locator("table tbody tr").first.wait_for(timeout=30000)
        page.wait_for_timeout(800)
        page.locator("table tbody tr").first.click()
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SHOT_DIR / "memory-detail.png"), full_page=False)
        print(f"Wrote {SHOT_DIR / 'memory-detail.png'}")

        browser.close()


def main() -> int:
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

    admin_token = login(admin_email, admin_password)
    seed(admin_token)
    # Screenshot as Platform Lead so Owner/groups look like a real operator.
    capture_screenshots("jordan.lee@northline.io", DEMO_PASSWORD)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
