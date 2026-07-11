# The Beat Goes On: Festival Archive Layer, Build Spec

## Context

This repo is currently a landing page (hero, era timeline, genre grid, Pioneer signup, admin dashboard) for a living archive of dance music history. This spec adds the first real archive vertical: festival lineups and set histories, with source citations and a public changelog. This is the wedge feature. No blockchain, no tokens, no voting in this phase. Reuse the existing stack (React + FastAPI + MongoDB), the existing JWT auth, and the existing admin dashboard patterns.

Design should match the existing dark Netflix/Apple TV+ aesthetic already in the frontend.

## Phase 1: Data layer and admin CRUD

### New MongoDB collections and Pydantic models

**Festival**
- id (uuid), name, slug (url-safe, unique), promoter, founded_year (int), description, image_url, created_at, updated_at

**Edition** (one festival year)
- id, festival_id, year (int), edition_name (optional, e.g. "EDC Las Vegas 2024"), venue, city, country, start_date, end_date, attendance (optional int), notes, created_at, updated_at

**Stage**
- id, edition_id, name, sort_order (int)

**Set** (one artist performance)
- id, edition_id, stage_id, artist_name, artist_id (optional, for later normalization), set_date, start_time (optional), end_time (optional), is_b2b (bool), b2b_partners (list of strings, optional), notes, status ("verified" | "unverified"), created_at, updated_at

**Source** (a citation attached to a Set or Edition)
- id, target_type ("set" | "edition"), target_id, source_type ("flyer" | "archived_web" | "press" | "photo" | "recording_link" | "contributor_attestation"), url (optional), image_url (optional, for flyer scans), description, contributor_name (optional), contributor_user_id (optional), created_at

**ChangeLogEntry**
- id, timestamp, action ("created" | "updated" | "verified" | "correction"), target_type, target_id, summary (human-readable, e.g. "Added set: Carl Cox, neonGARDEN, EDC LV 2019"), credited_to (contributor name or "Foundation"), version_note (optional)

### API endpoints (follow existing /api router patterns)

Public (no auth):
- GET /api/festivals (list), GET /api/festivals/{slug}
- GET /api/festivals/{slug}/editions, GET /api/editions/{id} (include stages and sets, with their sources)
- GET /api/artists/{name}/sets (all sets by artist name, case-insensitive, across all festivals)
- GET /api/changelog (paginated, newest first)

Admin (existing JWT admin auth):
- Full CRUD for festivals, editions, stages, sets, sources
- Every admin create/update/verify must automatically write a ChangeLogEntry

### Notes
- Slugs for festivals; ids elsewhere.
- Write a seed script stub (seed_festivals.py) that can ingest a JSON file of editions/stages/sets so seed data can be prepared outside the app.

## Phase 2: Public pages

1. **Festival page** (/festivals/{slug}): festival header, description, grid or list of all editions by year.
2. **Edition page** (/editions/{id}): the core page. Lineup grouped by stage, each set showing artist, times if known, b2b partners, and a small source indicator (icon or count) that expands to show citations. Sets marked "unverified" get a subtle visual tag.
3. **Artist page** (/artists/{name}): every set the artist has played across the archive, sorted by date. This is the shareable page; make it good.
4. **Changelog page** (/changelog): reverse-chronological list of ChangeLogEntries with dates and credits. This page demonstrates the "perpetual" format and should be linked in the main nav.

Add "Archive" to the main navigation, linking to the festivals list.

## Phase 3: Public contribution flow

1. **Submission form** (available on edition and artist pages, "Add or correct a set"): fields for festival/edition, stage, artist, times, and a REQUIRED source (url, upload of a flyer image, or attestation text). Logged-in Pioneers get their name attached; anonymous submissions allowed but marked.
2. Submissions land in a new collection **Proposal** (mirrors Set fields plus source fields, status: "pending" | "approved" | "rejected", reviewer_note).
3. **Moderation queue** in the existing admin dashboard: list pending proposals, approve (creates/updates the Set, creates the Source, writes a ChangeLogEntry crediting the contributor) or reject with a note.
4. Email is out of scope for now; no notifications.

## Out of scope (do not build yet)
- Blockchain, tokens, voting, IPFS
- Video hosting or playback
- Artist accounts or profiles beyond the generated artist page
- Genre relationships

## Working style
- Implement phase by phase. Stop after each phase for review.
- Ask before adding dependencies.
- Keep everything portable: no Emergent-specific code, environment config via .env only.
