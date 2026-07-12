"""
Festival Archive Layer — Phase 1: data layer and admin CRUD.

Public read endpoints require no auth. Write endpoints require an
admin JWT (see deps.get_admin_user). Every admin create/update/verify/
delete writes a ChangeLogEntry so /api/changelog reflects the full
history of the archive.
"""
import re
import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

from deps import db, get_admin_user, get_optional_user

archive_router = APIRouter(prefix="/api")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


# ============== MODELS ==============

class Festival(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    name: str
    slug: str
    promoter: Optional[str] = None
    founded_year: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class FestivalCreate(BaseModel):
    name: str
    promoter: Optional[str] = None
    founded_year: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None


class Edition(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    festival_id: str
    year: int
    edition_name: Optional[str] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    attendance: Optional[int] = None
    notes: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class EditionCreate(BaseModel):
    year: int
    edition_name: Optional[str] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    attendance: Optional[int] = None
    notes: Optional[str] = None


class Stage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    edition_id: str
    name: str
    sort_order: int = 0


class StageCreate(BaseModel):
    name: str
    sort_order: int = 0


SET_STATUS = Literal["verified", "unverified"]


class PerformanceSet(BaseModel):
    """One artist performance. Named PerformanceSet, not Set, to avoid
    shadowing the builtin — the collection/API path is still 'sets'."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    edition_id: str
    stage_id: str
    artist_name: str
    artist_id: Optional[str] = None
    set_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_b2b: bool = False
    b2b_partners: Optional[List[str]] = None
    notes: Optional[str] = None
    status: SET_STATUS = "unverified"
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class PerformanceSetCreate(BaseModel):
    artist_name: str
    artist_id: Optional[str] = None
    set_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_b2b: bool = False
    b2b_partners: Optional[List[str]] = None
    notes: Optional[str] = None


class PerformanceSetUpdate(PerformanceSetCreate):
    stage_id: str


SOURCE_TARGET_TYPE = Literal["set", "edition"]
SOURCE_TYPE = Literal[
    "flyer", "archived_web", "press", "photo", "recording_link", "contributor_attestation"
]


class Source(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    target_type: SOURCE_TARGET_TYPE
    target_id: str
    source_type: SOURCE_TYPE
    url: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    contributor_name: Optional[str] = None
    contributor_user_id: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class SourceCreate(BaseModel):
    target_type: SOURCE_TARGET_TYPE
    target_id: str
    source_type: SOURCE_TYPE
    url: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    contributor_name: Optional[str] = None
    contributor_user_id: Optional[str] = None


CHANGELOG_ACTION = Literal["created", "updated", "verified", "correction", "deleted"]


class ChangeLogEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    timestamp: str = Field(default_factory=now_iso)
    action: CHANGELOG_ACTION
    target_type: str
    target_id: str
    summary: str
    credited_to: str = "Foundation"
    version_note: Optional[str] = None


PROPOSAL_TYPE = Literal["new", "correction"]
PROPOSAL_STATUS = Literal["pending", "approved", "rejected"]


class Proposal(BaseModel):
    """A public "add or correct a set" submission awaiting admin review.
    Mirrors PerformanceSet fields plus a single required source, per spec.

    stage_name is free text rather than a stage_id: many editions (e.g. the
    seeded EDC scaffold) have zero stages yet, so contributors name the
    stage and approval resolves it to an existing or newly-created Stage -
    the same find-or-create pattern seed_festivals.py already uses.
    """
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    proposal_type: PROPOSAL_TYPE
    target_set_id: Optional[str] = None
    edition_id: str
    stage_name: str
    artist_name: str
    artist_id: Optional[str] = None
    set_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_b2b: bool = False
    b2b_partners: Optional[List[str]] = None
    notes: Optional[str] = None
    source_type: SOURCE_TYPE
    source_url: Optional[str] = None
    source_image_url: Optional[str] = None
    source_description: Optional[str] = None
    contributor_name: Optional[str] = None
    contributor_user_id: Optional[str] = None
    status: PROPOSAL_STATUS = "pending"
    reviewer_note: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class ProposalCreate(BaseModel):
    proposal_type: PROPOSAL_TYPE
    target_set_id: Optional[str] = None
    edition_id: str
    stage_name: str
    artist_name: str
    artist_id: Optional[str] = None
    set_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_b2b: bool = False
    b2b_partners: Optional[List[str]] = None
    notes: Optional[str] = None
    source_type: SOURCE_TYPE
    source_url: Optional[str] = None
    source_image_url: Optional[str] = None
    source_description: Optional[str] = None
    contributor_name: Optional[str] = None  # only used when submitting anonymously


class ProposalReject(BaseModel):
    reviewer_note: str


class ProposalOut(Proposal):
    festival_name: Optional[str] = None
    festival_slug: Optional[str] = None
    edition_label: Optional[str] = None


# ---- read/response shapes (not stored, just for nested API output) ----

class SetOut(PerformanceSet):
    sources: List[Source] = []


class StageOut(Stage):
    sets: List[SetOut] = []


class EditionDetail(Edition):
    festival_name: Optional[str] = None
    festival_slug: Optional[str] = None
    stages: List[StageOut] = []
    sources: List[Source] = []


class SetWithContext(PerformanceSet):
    stage_name: Optional[str] = None
    festival_id: Optional[str] = None
    festival_name: Optional[str] = None
    festival_slug: Optional[str] = None
    edition_year: Optional[int] = None
    edition_name: Optional[str] = None
    sources: List[Source] = []


class ChangelogPage(BaseModel):
    items: List[ChangeLogEntry]
    page: int
    page_size: int
    total: int


# ============== HELPERS ==============

def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or new_id()[:8]


async def unique_festival_slug(name: str, exclude_id: Optional[str] = None) -> str:
    base = slugify(name)
    slug = base
    suffix = 2
    while True:
        query = {"slug": slug}
        if exclude_id:
            query["id"] = {"$ne": exclude_id}
        existing = await db.festivals.find_one(query, {"_id": 0, "id": 1})
        if not existing:
            return slug
        slug = f"{base}-{suffix}"
        suffix += 1


async def write_changelog(
    action: CHANGELOG_ACTION,
    target_type: str,
    target_id: str,
    summary: str,
    credited_to: str = "Foundation",
    version_note: Optional[str] = None,
) -> ChangeLogEntry:
    entry = ChangeLogEntry(
        action=action,
        target_type=target_type,
        target_id=target_id,
        summary=summary,
        credited_to=credited_to,
        version_note=version_note,
    )
    await db.changelog_entries.insert_one(entry.model_dump())
    return entry


async def get_edition_label(edition_id: str) -> str:
    edition = await db.editions.find_one({"id": edition_id}, {"_id": 0})
    if not edition:
        return "an unknown edition"
    festival = await db.festivals.find_one({"id": edition["festival_id"]}, {"_id": 0})
    fname = festival["name"] if festival else "Unknown Festival"
    return edition.get("edition_name") or f"{fname} {edition['year']}"


def admin_credit(admin: dict) -> str:
    return admin.get("name") or "Foundation"


async def require_festival(festival_id: str) -> dict:
    festival = await db.festivals.find_one({"id": festival_id}, {"_id": 0})
    if not festival:
        raise HTTPException(status_code=404, detail="Festival not found")
    return festival


async def require_edition(edition_id: str) -> dict:
    edition = await db.editions.find_one({"id": edition_id}, {"_id": 0})
    if not edition:
        raise HTTPException(status_code=404, detail="Edition not found")
    return edition


async def require_stage(stage_id: str) -> dict:
    stage = await db.stages.find_one({"id": stage_id}, {"_id": 0})
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")
    return stage


async def require_set(set_id: str) -> dict:
    performance_set = await db.sets.find_one({"id": set_id}, {"_id": 0})
    if not performance_set:
        raise HTTPException(status_code=404, detail="Set not found")
    return performance_set


# ============== PUBLIC READ ROUTES ==============

@archive_router.get("/festivals", response_model=List[Festival])
async def list_festivals():
    return await db.festivals.find({}, {"_id": 0}).sort("name", 1).to_list(1000)


@archive_router.get("/festivals/{slug}", response_model=Festival)
async def get_festival(slug: str):
    festival = await db.festivals.find_one({"slug": slug}, {"_id": 0})
    if not festival:
        raise HTTPException(status_code=404, detail="Festival not found")
    return festival


@archive_router.get("/festivals/{slug}/editions", response_model=List[Edition])
async def list_festival_editions(slug: str):
    festival = await db.festivals.find_one({"slug": slug}, {"_id": 0})
    if not festival:
        raise HTTPException(status_code=404, detail="Festival not found")
    return await db.editions.find(
        {"festival_id": festival["id"]}, {"_id": 0}
    ).sort("year", 1).to_list(1000)


@archive_router.get("/editions/{edition_id}", response_model=EditionDetail)
async def get_edition(edition_id: str):
    edition = await db.editions.find_one({"id": edition_id}, {"_id": 0})
    if not edition:
        raise HTTPException(status_code=404, detail="Edition not found")

    festival = await db.festivals.find_one({"id": edition["festival_id"]}, {"_id": 0})

    stages = await db.stages.find({"edition_id": edition_id}, {"_id": 0}).sort(
        "sort_order", 1
    ).to_list(1000)
    sets = await db.sets.find({"edition_id": edition_id}, {"_id": 0}).sort(
        "set_date", 1
    ).to_list(5000)
    sources = await db.sources.find(
        {"target_type": {"$in": ["set", "edition"]}, "target_id": {"$in": [edition_id] + [s["id"] for s in sets]}},
        {"_id": 0},
    ).to_list(10000)

    sources_by_target = {}
    for source in sources:
        sources_by_target.setdefault(source["target_id"], []).append(source)

    sets_by_stage = {}
    for performance_set in sets:
        set_out = SetOut(**performance_set, sources=sources_by_target.get(performance_set["id"], []))
        sets_by_stage.setdefault(performance_set["stage_id"], []).append(set_out)

    stage_outs = [
        StageOut(**stage, sets=sets_by_stage.get(stage["id"], [])) for stage in stages
    ]

    return EditionDetail(
        **edition,
        festival_name=festival["name"] if festival else None,
        festival_slug=festival["slug"] if festival else None,
        stages=stage_outs,
        sources=sources_by_target.get(edition_id, []),
    )


@archive_router.get("/artists/{name}/sets", response_model=List[SetWithContext])
async def get_artist_sets(name: str):
    sets = await db.sets.find(
        {"artist_name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}}, {"_id": 0}
    ).sort("set_date", 1).to_list(5000)
    if not sets:
        return []

    edition_ids = list({s["edition_id"] for s in sets})
    stage_ids = list({s["stage_id"] for s in sets})
    set_ids = [s["id"] for s in sets]

    editions = await db.editions.find({"id": {"$in": edition_ids}}, {"_id": 0}).to_list(1000)
    editions_by_id = {e["id"]: e for e in editions}

    festival_ids = list({e["festival_id"] for e in editions})
    festivals = await db.festivals.find({"id": {"$in": festival_ids}}, {"_id": 0}).to_list(1000)
    festivals_by_id = {f["id"]: f for f in festivals}

    stages = await db.stages.find({"id": {"$in": stage_ids}}, {"_id": 0}).to_list(1000)
    stages_by_id = {st["id"]: st for st in stages}

    sources = await db.sources.find(
        {"target_type": "set", "target_id": {"$in": set_ids}}, {"_id": 0}
    ).to_list(10000)
    sources_by_set = {}
    for source in sources:
        sources_by_set.setdefault(source["target_id"], []).append(source)

    results = []
    for performance_set in sets:
        edition = editions_by_id.get(performance_set["edition_id"])
        festival = festivals_by_id.get(edition["festival_id"]) if edition else None
        stage = stages_by_id.get(performance_set["stage_id"])
        results.append(
            SetWithContext(
                **performance_set,
                stage_name=stage["name"] if stage else None,
                festival_id=festival["id"] if festival else None,
                festival_name=festival["name"] if festival else None,
                festival_slug=festival["slug"] if festival else None,
                edition_year=edition["year"] if edition else None,
                edition_name=edition.get("edition_name") if edition else None,
                sources=sources_by_set.get(performance_set["id"], []),
            )
        )
    return results


@archive_router.get("/changelog", response_model=ChangelogPage)
async def get_changelog(page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100)):
    total = await db.changelog_entries.count_documents({})
    items = await db.changelog_entries.find({}, {"_id": 0}).sort(
        "timestamp", -1
    ).skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return ChangelogPage(items=items, page=page, page_size=page_size, total=total)


# ============== PUBLIC: PROPOSALS (contribution flow) ==============

@archive_router.post("/proposals", response_model=Proposal)
async def create_proposal(
    data: ProposalCreate, current_user: Optional[dict] = Depends(get_optional_user)
):
    if data.proposal_type == "correction" and not data.target_set_id:
        raise HTTPException(
            status_code=400, detail="target_set_id is required for a correction proposal"
        )
    if not (data.source_url or data.source_image_url or data.source_description):
        raise HTTPException(
            status_code=400, detail="A source (url, image_url, or description) is required"
        )

    await require_edition(data.edition_id)
    if data.target_set_id:
        await require_set(data.target_set_id)

    proposal = Proposal(
        **data.model_dump(exclude={"contributor_name"}),
        contributor_user_id=current_user["id"] if current_user else None,
        contributor_name=current_user["name"] if current_user else data.contributor_name,
    )
    await db.proposals.insert_one(proposal.model_dump())
    return proposal


# ============== ADMIN: FESTIVALS ==============

@archive_router.post("/festivals", response_model=Festival)
async def create_festival(data: FestivalCreate, admin: dict = Depends(get_admin_user)):
    slug = await unique_festival_slug(data.name)
    festival = Festival(**data.model_dump(), slug=slug)
    await db.festivals.insert_one(festival.model_dump())
    await write_changelog(
        "created", "festival", festival.id, f"Added festival: {festival.name}", admin_credit(admin)
    )
    return festival


@archive_router.put("/festivals/{festival_id}", response_model=Festival)
async def update_festival(
    festival_id: str, data: FestivalCreate, admin: dict = Depends(get_admin_user)
):
    await require_festival(festival_id)
    update_doc = data.model_dump()
    update_doc["updated_at"] = now_iso()
    await db.festivals.update_one({"id": festival_id}, {"$set": update_doc})
    await write_changelog(
        "updated", "festival", festival_id, f"Updated festival: {data.name}", admin_credit(admin)
    )
    return await db.festivals.find_one({"id": festival_id}, {"_id": 0})


@archive_router.delete("/festivals/{festival_id}")
async def delete_festival(festival_id: str, admin: dict = Depends(get_admin_user)):
    festival = await require_festival(festival_id)

    editions = await db.editions.find({"festival_id": festival_id}, {"_id": 0, "id": 1}).to_list(1000)
    edition_ids = [e["id"] for e in editions]
    stages = await db.stages.find({"edition_id": {"$in": edition_ids}}, {"_id": 0, "id": 1}).to_list(1000)
    stage_ids = [s["id"] for s in stages]
    sets = await db.sets.find({"edition_id": {"$in": edition_ids}}, {"_id": 0, "id": 1}).to_list(5000)
    set_ids = [s["id"] for s in sets]

    await db.sources.delete_many(
        {"$or": [{"target_type": "edition", "target_id": {"$in": edition_ids}}, {"target_type": "set", "target_id": {"$in": set_ids}}]}
    )
    await db.sets.delete_many({"edition_id": {"$in": edition_ids}})
    await db.stages.delete_many({"edition_id": {"$in": edition_ids}})
    await db.editions.delete_many({"festival_id": festival_id})
    await db.festivals.delete_one({"id": festival_id})

    await write_changelog(
        "deleted",
        "festival",
        festival_id,
        f"Removed festival: {festival['name']} (and {len(edition_ids)} edition(s), {len(stage_ids)} stage(s), {len(set_ids)} set(s))",
        admin_credit(admin),
    )
    return {"message": "Festival deleted"}


# ============== ADMIN: EDITIONS ==============

@archive_router.post("/festivals/{festival_id}/editions", response_model=Edition)
async def create_edition(
    festival_id: str, data: EditionCreate, admin: dict = Depends(get_admin_user)
):
    await require_festival(festival_id)
    edition = Edition(**data.model_dump(), festival_id=festival_id)
    await db.editions.insert_one(edition.model_dump())
    label = edition.edition_name or f"edition {edition.year}"
    await write_changelog(
        "created", "edition", edition.id, f"Added edition: {label}", admin_credit(admin)
    )
    return edition


@archive_router.put("/editions/{edition_id}", response_model=Edition)
async def update_edition(
    edition_id: str, data: EditionCreate, admin: dict = Depends(get_admin_user)
):
    await require_edition(edition_id)
    update_doc = data.model_dump()
    update_doc["updated_at"] = now_iso()
    await db.editions.update_one({"id": edition_id}, {"$set": update_doc})
    label = data.edition_name or f"edition {data.year}"
    await write_changelog(
        "updated", "edition", edition_id, f"Updated edition: {label}", admin_credit(admin)
    )
    return await db.editions.find_one({"id": edition_id}, {"_id": 0})


@archive_router.delete("/editions/{edition_id}")
async def delete_edition(edition_id: str, admin: dict = Depends(get_admin_user)):
    edition = await require_edition(edition_id)

    stages = await db.stages.find({"edition_id": edition_id}, {"_id": 0, "id": 1}).to_list(1000)
    stage_ids = [s["id"] for s in stages]
    sets = await db.sets.find({"edition_id": edition_id}, {"_id": 0, "id": 1}).to_list(5000)
    set_ids = [s["id"] for s in sets]

    await db.sources.delete_many(
        {"$or": [{"target_type": "edition", "target_id": edition_id}, {"target_type": "set", "target_id": {"$in": set_ids}}]}
    )
    await db.sets.delete_many({"edition_id": edition_id})
    await db.stages.delete_many({"edition_id": edition_id})
    await db.editions.delete_one({"id": edition_id})

    label = edition.get("edition_name") or f"edition {edition['year']}"
    await write_changelog(
        "deleted",
        "edition",
        edition_id,
        f"Removed edition: {label} (and {len(stage_ids)} stage(s), {len(set_ids)} set(s))",
        admin_credit(admin),
    )
    return {"message": "Edition deleted"}


# ============== ADMIN: STAGES ==============

@archive_router.post("/editions/{edition_id}/stages", response_model=Stage)
async def create_stage(edition_id: str, data: StageCreate, admin: dict = Depends(get_admin_user)):
    await require_edition(edition_id)
    stage = Stage(**data.model_dump(), edition_id=edition_id)
    await db.stages.insert_one(stage.model_dump())
    edition_label = await get_edition_label(edition_id)
    await write_changelog(
        "created", "stage", stage.id, f"Added stage: {stage.name} ({edition_label})", admin_credit(admin)
    )
    return stage


@archive_router.put("/stages/{stage_id}", response_model=Stage)
async def update_stage(stage_id: str, data: StageCreate, admin: dict = Depends(get_admin_user)):
    stage = await require_stage(stage_id)
    await db.stages.update_one({"id": stage_id}, {"$set": data.model_dump()})
    edition_label = await get_edition_label(stage["edition_id"])
    await write_changelog(
        "updated", "stage", stage_id, f"Updated stage: {data.name} ({edition_label})", admin_credit(admin)
    )
    return await db.stages.find_one({"id": stage_id}, {"_id": 0})


@archive_router.delete("/stages/{stage_id}")
async def delete_stage(stage_id: str, admin: dict = Depends(get_admin_user)):
    stage = await require_stage(stage_id)
    sets = await db.sets.find({"stage_id": stage_id}, {"_id": 0, "id": 1}).to_list(5000)
    set_ids = [s["id"] for s in sets]

    await db.sources.delete_many({"target_type": "set", "target_id": {"$in": set_ids}})
    await db.sets.delete_many({"stage_id": stage_id})
    await db.stages.delete_one({"id": stage_id})

    await write_changelog(
        "deleted",
        "stage",
        stage_id,
        f"Removed stage: {stage['name']} (and {len(set_ids)} set(s))",
        admin_credit(admin),
    )
    return {"message": "Stage deleted"}


# ============== ADMIN: SETS ==============

@archive_router.post("/stages/{stage_id}/sets", response_model=PerformanceSet)
async def create_set(
    stage_id: str, data: PerformanceSetCreate, admin: dict = Depends(get_admin_user)
):
    stage = await require_stage(stage_id)
    performance_set = PerformanceSet(
        **data.model_dump(), edition_id=stage["edition_id"], stage_id=stage_id
    )
    await db.sets.insert_one(performance_set.model_dump())
    edition_label = await get_edition_label(stage["edition_id"])
    await write_changelog(
        "created",
        "set",
        performance_set.id,
        f"Added set: {performance_set.artist_name}, {stage['name']}, {edition_label}",
        admin_credit(admin),
    )
    return performance_set


@archive_router.put("/sets/{set_id}", response_model=PerformanceSet)
async def update_set(
    set_id: str, data: PerformanceSetUpdate, admin: dict = Depends(get_admin_user)
):
    existing = await require_set(set_id)
    await require_stage(data.stage_id)
    update_doc = data.model_dump()
    update_doc["edition_id"] = existing["edition_id"]
    update_doc["updated_at"] = now_iso()
    await db.sets.update_one({"id": set_id}, {"$set": update_doc})
    edition_label = await get_edition_label(existing["edition_id"])
    await write_changelog(
        "updated",
        "set",
        set_id,
        f"Updated set: {data.artist_name}, {edition_label}",
        admin_credit(admin),
    )
    return await db.sets.find_one({"id": set_id}, {"_id": 0})


@archive_router.patch("/sets/{set_id}/verify", response_model=PerformanceSet)
async def verify_set(set_id: str, admin: dict = Depends(get_admin_user)):
    existing = await require_set(set_id)
    await db.sets.update_one(
        {"id": set_id}, {"$set": {"status": "verified", "updated_at": now_iso()}}
    )
    edition_label = await get_edition_label(existing["edition_id"])
    await write_changelog(
        "verified",
        "set",
        set_id,
        f"Verified set: {existing['artist_name']}, {edition_label}",
        admin_credit(admin),
    )
    return await db.sets.find_one({"id": set_id}, {"_id": 0})


@archive_router.delete("/sets/{set_id}")
async def delete_set(set_id: str, admin: dict = Depends(get_admin_user)):
    existing = await require_set(set_id)
    await db.sources.delete_many({"target_type": "set", "target_id": set_id})
    await db.sets.delete_one({"id": set_id})
    edition_label = await get_edition_label(existing["edition_id"])
    await write_changelog(
        "deleted",
        "set",
        set_id,
        f"Removed set: {existing['artist_name']}, {edition_label}",
        admin_credit(admin),
    )
    return {"message": "Set deleted"}


# ============== ADMIN: SOURCES ==============

async def require_source_target(target_type: str, target_id: str) -> None:
    collection = db.sets if target_type == "set" else db.editions
    target = await collection.find_one({"id": target_id}, {"_id": 0, "id": 1})
    if not target:
        raise HTTPException(status_code=404, detail=f"{target_type.title()} not found")


@archive_router.post("/sources", response_model=Source)
async def create_source(data: SourceCreate, admin: dict = Depends(get_admin_user)):
    await require_source_target(data.target_type, data.target_id)
    source = Source(**data.model_dump())
    await db.sources.insert_one(source.model_dump())
    await write_changelog(
        "created",
        "source",
        source.id,
        f"Added source ({source.source_type}) for {source.target_type} {source.target_id}",
        admin_credit(admin),
    )
    return source


@archive_router.put("/sources/{source_id}", response_model=Source)
async def update_source(source_id: str, data: SourceCreate, admin: dict = Depends(get_admin_user)):
    existing = await db.sources.find_one({"id": source_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Source not found")
    await require_source_target(data.target_type, data.target_id)
    await db.sources.update_one({"id": source_id}, {"$set": data.model_dump()})
    await write_changelog(
        "updated",
        "source",
        source_id,
        f"Updated source ({data.source_type}) for {data.target_type} {data.target_id}",
        admin_credit(admin),
    )
    return await db.sources.find_one({"id": source_id}, {"_id": 0})


@archive_router.delete("/sources/{source_id}")
async def delete_source(source_id: str, admin: dict = Depends(get_admin_user)):
    existing = await db.sources.find_one({"id": source_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Source not found")
    await db.sources.delete_one({"id": source_id})
    await write_changelog(
        "deleted",
        "source",
        source_id,
        f"Removed source ({existing['source_type']}) for {existing['target_type']} {existing['target_id']}",
        admin_credit(admin),
    )
    return {"message": "Source deleted"}


# ============== ADMIN: PROPOSALS (moderation queue) ==============

@archive_router.get("/proposals", response_model=List[ProposalOut])
async def list_proposals(
    status_filter: Optional[PROPOSAL_STATUS] = Query(None, alias="status"),
    admin: dict = Depends(get_admin_user),
):
    query = {"status": status_filter} if status_filter else {}
    proposals = await db.proposals.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    if not proposals:
        return []

    edition_ids = list({p["edition_id"] for p in proposals})
    editions = await db.editions.find({"id": {"$in": edition_ids}}, {"_id": 0}).to_list(1000)
    editions_by_id = {e["id"]: e for e in editions}

    festival_ids = list({e["festival_id"] for e in editions})
    festivals = await db.festivals.find({"id": {"$in": festival_ids}}, {"_id": 0}).to_list(1000)
    festivals_by_id = {f["id"]: f for f in festivals}

    results = []
    for proposal in proposals:
        edition = editions_by_id.get(proposal["edition_id"])
        festival = festivals_by_id.get(edition["festival_id"]) if edition else None
        edition_label = None
        if edition:
            edition_label = edition.get("edition_name") or (
                f"{festival['name']} {edition['year']}" if festival else str(edition["year"])
            )
        results.append(
            ProposalOut(
                **proposal,
                festival_name=festival["name"] if festival else None,
                festival_slug=festival["slug"] if festival else None,
                edition_label=edition_label,
            )
        )
    return results


async def require_pending_proposal(proposal_id: str) -> dict:
    proposal = await db.proposals.find_one({"id": proposal_id}, {"_id": 0})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if proposal["status"] != "pending":
        raise HTTPException(status_code=400, detail="Proposal has already been reviewed")
    return proposal


@archive_router.post("/proposals/{proposal_id}/reject", response_model=Proposal)
async def reject_proposal(
    proposal_id: str, data: ProposalReject, admin: dict = Depends(get_admin_user)
):
    await require_pending_proposal(proposal_id)
    await db.proposals.update_one(
        {"id": proposal_id},
        {
            "$set": {
                "status": "rejected",
                "reviewer_note": data.reviewer_note,
                "reviewed_by": admin_credit(admin),
                "reviewed_at": now_iso(),
            }
        },
    )
    return await db.proposals.find_one({"id": proposal_id}, {"_id": 0})


@archive_router.post("/proposals/{proposal_id}/approve", response_model=Proposal)
async def approve_proposal(proposal_id: str, admin: dict = Depends(get_admin_user)):
    proposal = await require_pending_proposal(proposal_id)
    await require_edition(proposal["edition_id"])

    stage = await db.stages.find_one(
        {"edition_id": proposal["edition_id"], "name": proposal["stage_name"]}, {"_id": 0}
    )
    if not stage:
        stage = Stage(edition_id=proposal["edition_id"], name=proposal["stage_name"]).model_dump()
        await db.stages.insert_one(stage)
        edition_label = await get_edition_label(proposal["edition_id"])
        await write_changelog(
            "created", "stage", stage["id"], f"Added stage: {stage['name']} ({edition_label})",
            admin_credit(admin),
        )

    credited_to = proposal.get("contributor_name") or "Anonymous"
    edition_label = await get_edition_label(proposal["edition_id"])

    set_fields = {
        "edition_id": proposal["edition_id"],
        "stage_id": stage["id"],
        "artist_name": proposal["artist_name"],
        "artist_id": proposal.get("artist_id"),
        "set_date": proposal.get("set_date"),
        "start_time": proposal.get("start_time"),
        "end_time": proposal.get("end_time"),
        "is_b2b": proposal.get("is_b2b", False),
        "b2b_partners": proposal.get("b2b_partners"),
        "notes": proposal.get("notes"),
    }

    if proposal["proposal_type"] == "correction":
        existing_set = await require_set(proposal["target_set_id"])
        await db.sets.update_one(
            {"id": existing_set["id"]}, {"$set": {**set_fields, "updated_at": now_iso()}}
        )
        set_id = existing_set["id"]
        await write_changelog(
            "correction", "set", set_id,
            f"Corrected set: {proposal['artist_name']}, {edition_label} (credited to {credited_to})",
            credited_to,
        )
    else:
        new_set = PerformanceSet(**set_fields)
        await db.sets.insert_one(new_set.model_dump())
        set_id = new_set.id
        await write_changelog(
            "created", "set", set_id,
            f"Added set: {proposal['artist_name']}, {stage['name']}, {edition_label} (credited to {credited_to})",
            credited_to,
        )

    source = Source(
        target_type="set",
        target_id=set_id,
        source_type=proposal["source_type"],
        url=proposal.get("source_url"),
        image_url=proposal.get("source_image_url"),
        description=proposal.get("source_description"),
        contributor_name=proposal.get("contributor_name"),
        contributor_user_id=proposal.get("contributor_user_id"),
    )
    await db.sources.insert_one(source.model_dump())

    await db.proposals.update_one(
        {"id": proposal_id},
        {
            "$set": {
                "status": "approved",
                "reviewed_by": admin_credit(admin),
                "reviewed_at": now_iso(),
            }
        },
    )
    return await db.proposals.find_one({"id": proposal_id}, {"_id": 0})
