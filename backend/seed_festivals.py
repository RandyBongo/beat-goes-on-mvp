"""
Seed script for the festival archive layer.

Ingests a JSON file shaped like:

{
  "festival": {
    "name": "Electric Daisy Carnival",
    "promoter": "Insomniac",
    "founded_year": 1997,
    "description": "...",
    "image_url": "https://..."
  },
  "editions": [
    {
      "year": 2019,
      "edition_name": "EDC Las Vegas 2019",
      "venue": "Las Vegas Motor Speedway",
      "city": "Las Vegas",
      "country": "USA",
      "start_date": "2019-05-17",
      "end_date": "2019-05-19",
      "attendance": 465000,
      "notes": "",
      "sources": [
        {"source_type": "press", "url": "https://...", "description": "Official recap"}
      ],
      "stages": [
        {
          "name": "kineticFIELD",
          "sort_order": 1,
          "sets": [
            {
              "artist_name": "Carl Cox",
              "set_date": "2019-05-18",
              "start_time": "23:00",
              "end_time": "00:30",
              "is_b2b": false,
              "b2b_partners": [],
              "notes": "",
              "status": "verified",
              "sources": [
                {"source_type": "flyer", "image_url": "https://...", "description": "Official set times flyer"}
              ]
            }
          ]
        }
      ]
    }
  ]
}

Re-running with the same file is safe: festivals are matched by slug,
editions by (festival, year), stages by (edition, name), sets by
(stage, artist_name, set_date, start_time), and sources by
(target_id, source_type, url or image_url) — matching records are
left alone rather than duplicated.

Usage:
    python seed_festivals.py path/to/festival.json [--credited-to "Name"] [--dry-run]
"""
import argparse
import json
import os
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or new_id()[:8]


def unique_festival_slug(db, base: str) -> str:
    slug = base
    suffix = 2
    while db.festivals.find_one({"slug": slug}):
        slug = f"{base}-{suffix}"
        suffix += 1
    return slug


def upsert_festival(db, data: dict, dry_run: bool) -> dict:
    # Honor an explicit "slug" in the input (sanitized), falling back to
    # deriving one from the name - matches this scaffold's intent to control
    # its own URL rather than always getting an auto-generated one.
    base_slug = slugify(data["slug"]) if data.get("slug") else slugify(data["name"])
    existing = db.festivals.find_one({"slug": base_slug})
    if existing:
        print(f"  festival: reusing existing '{data['name']}' ({existing['id']})")
        return existing

    doc = {
        "id": new_id(),
        "name": data["name"],
        "slug": unique_festival_slug(db, base_slug),
        "promoter": data.get("promoter"),
        "founded_year": data.get("founded_year"),
        "description": data.get("description"),
        "image_url": data.get("image_url"),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    print(f"  festival: creating '{doc['name']}' (slug={doc['slug']})")
    if not dry_run:
        db.festivals.insert_one(doc)
    return doc


def upsert_edition(db, festival: dict, data: dict, dry_run: bool) -> dict:
    existing = db.editions.find_one({"festival_id": festival["id"], "year": data["year"]})
    if existing:
        print(f"    edition: reusing existing year {data['year']} ({existing['id']})")
        return existing

    doc = {
        "id": new_id(),
        "festival_id": festival["id"],
        "year": data["year"],
        "edition_name": data.get("edition_name"),
        "venue": data.get("venue"),
        "city": data.get("city"),
        "country": data.get("country"),
        "start_date": data.get("start_date"),
        "end_date": data.get("end_date"),
        "attendance": data.get("attendance"),
        "notes": data.get("notes"),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    print(f"    edition: creating year {doc['year']} ({doc.get('edition_name') or 'no name'})")
    if not dry_run:
        db.editions.insert_one(doc)
    return doc


def upsert_stage(db, edition: dict, data: dict, dry_run: bool) -> dict:
    existing = db.stages.find_one({"edition_id": edition["id"], "name": data["name"]})
    if existing:
        print(f"      stage: reusing existing '{data['name']}' ({existing['id']})")
        return existing

    doc = {
        "id": new_id(),
        "edition_id": edition["id"],
        "name": data["name"],
        "sort_order": data.get("sort_order", 0),
    }
    print(f"      stage: creating '{doc['name']}'")
    if not dry_run:
        db.stages.insert_one(doc)
    return doc


def upsert_set(db, edition: dict, stage: dict, data: dict, dry_run: bool) -> dict:
    match = {
        "edition_id": edition["id"],
        "stage_id": stage["id"],
        "artist_name": data["artist_name"],
        "set_date": data.get("set_date"),
        "start_time": data.get("start_time"),
    }
    existing = db.sets.find_one(match)
    if existing:
        print(f"        set: reusing existing '{data['artist_name']}' ({existing['id']})")
        return existing

    doc = {
        "id": new_id(),
        "edition_id": edition["id"],
        "stage_id": stage["id"],
        "artist_name": data["artist_name"],
        "artist_id": data.get("artist_id"),
        "set_date": data.get("set_date"),
        "start_time": data.get("start_time"),
        "end_time": data.get("end_time"),
        "is_b2b": data.get("is_b2b", False),
        "b2b_partners": data.get("b2b_partners"),
        "notes": data.get("notes"),
        "status": data.get("status", "unverified"),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    print(f"        set: creating '{doc['artist_name']}'")
    if not dry_run:
        db.sets.insert_one(doc)
    return doc


def upsert_source(db, target_type: str, target_id: str, data: dict, dry_run: bool) -> None:
    match = {
        "target_type": target_type,
        "target_id": target_id,
        "source_type": data["source_type"],
        "url": data.get("url"),
        "image_url": data.get("image_url"),
    }
    if db.sources.find_one(match):
        return

    doc = {
        "id": new_id(),
        "target_type": target_type,
        "target_id": target_id,
        "source_type": data["source_type"],
        "url": data.get("url"),
        "image_url": data.get("image_url"),
        "description": data.get("description"),
        "contributor_name": data.get("contributor_name"),
        "contributor_user_id": data.get("contributor_user_id"),
        "created_at": now_iso(),
    }
    print(f"          source: adding {doc['source_type']} for {target_type} {target_id}")
    if not dry_run:
        db.sources.insert_one(doc)


def write_changelog(db, festival_id: str, summary: str, credited_to: str, dry_run: bool) -> None:
    doc = {
        "id": new_id(),
        "timestamp": now_iso(),
        "action": "created",
        "target_type": "festival",
        "target_id": festival_id,
        "summary": summary,
        "credited_to": credited_to,
        "version_note": "Bulk seed import",
    }
    if not dry_run:
        db.changelog_entries.insert_one(doc)


def main():
    parser = argparse.ArgumentParser(description="Seed festival archive data from a JSON file")
    parser.add_argument("json_path", help="Path to a festival JSON file (see module docstring for shape)")
    parser.add_argument("--credited-to", default="Foundation", help="Changelog credit for this import")
    parser.add_argument("--dry-run", action="store_true", help="Print what would happen without writing to the database")
    args = parser.parse_args()

    payload = json.loads(Path(args.json_path).read_text())

    mongo_url = os.environ["MONGO_URL"]
    db = MongoClient(mongo_url)[os.environ["DB_NAME"]]

    festival_data = payload["festival"]
    print(f"Seeding '{festival_data['name']}'" + (" (dry run)" if args.dry_run else ""))
    festival = upsert_festival(db, festival_data, args.dry_run)

    edition_count = stage_count = set_count = source_count = 0
    for edition_data in payload.get("editions", []):
        edition = upsert_edition(db, festival, edition_data, args.dry_run)
        edition_count += 1

        for source_data in edition_data.get("sources", []):
            upsert_source(db, "edition", edition["id"], source_data, args.dry_run)
            source_count += 1

        for stage_data in edition_data.get("stages", []):
            stage = upsert_stage(db, edition, stage_data, args.dry_run)
            stage_count += 1

            for set_data in stage_data.get("sets", []):
                performance_set = upsert_set(db, edition, stage, set_data, args.dry_run)
                set_count += 1

                for source_data in set_data.get("sources", []):
                    upsert_source(db, "set", performance_set["id"], source_data, args.dry_run)
                    source_count += 1

    summary = (
        f"Bulk-imported {festival_data['name']}: {edition_count} edition(s), "
        f"{stage_count} stage(s), {set_count} set(s), {source_count} source(s)"
    )
    write_changelog(db, festival["id"], summary, args.credited_to, args.dry_run)
    print(summary)


if __name__ == "__main__":
    main()
