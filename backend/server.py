from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from pymongo.errors import DuplicateKeyError, BulkWriteError

from deps import (
    client,
    db,
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_admin_user,
)
from archive import archive_router

# Create the main app
app = FastAPI(title="The Beat Goes On API")
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    is_pioneer: bool = False
    pioneer_number: Optional[int] = None
    is_admin: bool = False
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class Episode(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    block_number: int
    year_start: int
    year_end: int
    title: str
    subtitle: str
    description: str
    location: str
    pioneers: List[str]
    image_url: str
    version: str = "1.0.0"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class EpisodeCreate(BaseModel):
    block_number: int
    year_start: int
    year_end: int
    title: str
    subtitle: str
    description: str
    location: str
    pioneers: List[str]
    image_url: str

class Genre(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    year_emerged: Optional[int] = None
    parent_genre: Optional[str] = None

class GenreCreate(BaseModel):
    name: str
    category: str
    year_emerged: Optional[int] = None
    parent_genre: Optional[str] = None

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# ============== AUTH ROUTES ==============

@api_router.post("/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate):
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Count existing users to determine pioneer status
    user_count = await db.users.count_documents({})
    is_pioneer = user_count < 50
    pioneer_number = user_count + 1 if is_pioneer else None
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "is_pioneer": is_pioneer,
        "pioneer_number": pioneer_number,
        "is_admin": user_count == 0,  # First user is admin
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create token
    token = create_access_token({"sub": user_id})
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            is_pioneer=is_pioneer,
            pioneer_number=pioneer_number,
            is_admin=user_doc["is_admin"],
            created_at=user_doc["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user["id"]})
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            is_pioneer=user.get("is_pioneer", False),
            pioneer_number=user.get("pioneer_number"),
            is_admin=user.get("is_admin", False),
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        is_pioneer=current_user.get("is_pioneer", False),
        pioneer_number=current_user.get("pioneer_number"),
        is_admin=current_user.get("is_admin", False),
        created_at=current_user["created_at"]
    )

@api_router.get("/auth/pioneer-count")
async def get_pioneer_count():
    count = await db.users.count_documents({})
    remaining = max(0, 50 - count)
    return {"total_users": count, "pioneers_remaining": remaining}

# ============== EPISODE ROUTES ==============

@api_router.get("/episodes", response_model=List[Episode])
async def get_episodes():
    episodes = await db.episodes.find({}, {"_id": 0}).sort("block_number", 1).to_list(100)
    return episodes

@api_router.get("/episodes/{episode_id}", response_model=Episode)
async def get_episode(episode_id: str):
    episode = await db.episodes.find_one({"id": episode_id}, {"_id": 0})
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    return episode

@api_router.post("/episodes", response_model=Episode)
async def create_episode(episode_data: EpisodeCreate, admin: dict = Depends(get_admin_user)):
    episode = Episode(**episode_data.model_dump())
    doc = episode.model_dump()
    try:
        await db.episodes.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail=f"Block number {episode.block_number} already exists")
    return episode

@api_router.put("/episodes/{episode_id}", response_model=Episode)
async def update_episode(episode_id: str, episode_data: EpisodeCreate, admin: dict = Depends(get_admin_user)):
    existing = await db.episodes.find_one({"id": episode_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Episode not found")

    update_doc = episode_data.model_dump()
    update_doc["updated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        await db.episodes.update_one({"id": episode_id}, {"$set": update_doc})
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail=f"Block number {episode_data.block_number} already exists")
    updated = await db.episodes.find_one({"id": episode_id}, {"_id": 0})
    return updated

@api_router.delete("/episodes/{episode_id}")
async def delete_episode(episode_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.episodes.delete_one({"id": episode_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Episode not found")
    return {"message": "Episode deleted"}

# ============== GENRE ROUTES ==============

@api_router.get("/genres", response_model=List[Genre])
async def get_genres():
    genres = await db.genres.find({}, {"_id": 0}).to_list(1000)
    return genres

@api_router.post("/genres", response_model=Genre)
async def create_genre(genre_data: GenreCreate, admin: dict = Depends(get_admin_user)):
    genre = Genre(**genre_data.model_dump())
    doc = genre.model_dump()
    try:
        await db.genres.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail=f"Genre '{genre.name}' already exists")
    return genre

@api_router.post("/genres/bulk", response_model=List[Genre])
async def create_genres_bulk(genres_data: List[GenreCreate], admin: dict = Depends(get_admin_user)):
    genres = [Genre(**g.model_dump()) for g in genres_data]
    docs = [g.model_dump() for g in genres]
    if docs:
        try:
            await db.genres.insert_many(docs, ordered=False)
        except BulkWriteError as exc:
            write_errors = exc.details.get("writeErrors", [])
            if any(err.get("code") != 11000 for err in write_errors):
                raise
            dupe_names = [docs[err["index"]]["name"] for err in write_errors]
            raise HTTPException(
                status_code=400,
                detail=f"Genre(s) already exist: {', '.join(dupe_names)}",
            )
    return genres

@api_router.delete("/genres/{genre_id}")
async def delete_genre(genre_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.genres.delete_one({"id": genre_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Genre not found")
    return {"message": "Genre deleted"}

# ============== SEED DATA ==============

async def insert_many_ignoring_duplicates(collection, docs):
    """insert_many that tolerates a concurrent seed already having inserted
    some of these docs — the unique index (see ensure_indexes) still blocks
    any actual duplicate from landing, this just stops that from bubbling up
    as a 500 when it's simply a race with another /seed call."""
    if not docs:
        return
    try:
        await collection.insert_many(docs, ordered=False)
    except BulkWriteError as exc:
        write_errors = exc.details.get("writeErrors", [])
        if any(err.get("code") != 11000 for err in write_errors):
            raise

@api_router.post("/seed")
async def seed_data():
    """Seed initial episodes and genres if empty - idempotent operation.

    Fast-path check below is only an optimization to skip the work in the
    common case; the actual duplicate-proofing is the unique index on
    episodes.block_number / genres.name, so two concurrent calls (e.g. React
    StrictMode double-invoking an effect) can't both insert the full set.
    """
    existing_block_1 = await db.episodes.find_one({"block_number": 1})
    if existing_block_1:
        episode_count = await db.episodes.count_documents({})
        genre_count = await db.genres.count_documents({})
        return {"message": "Data already seeded", "episodes": episode_count, "genres": genre_count}
    
    # Seed episodes
    episodes = [
        Episode(
            block_number=1,
            year_start=1960,
            year_end=1969,
            title="The Soul Foundation",
            subtitle="Motown & The Birth of the Beat",
            description="The seeds of dance music were planted in Detroit's Motown studios. The Four Tops, The Supremes, and Stevie Wonder created the rhythmic foundation that would echo through decades.",
            location="Detroit, Michigan",
            pioneers=["Berry Gordy", "Holland-Dozier-Holland", "Smokey Robinson"],
            image_url="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800"
        ),
        Episode(
            block_number=2,
            year_start=1970,
            year_end=1977,
            title="The Loft",
            subtitle="David Mancuso's Private Revolution",
            description="In a downtown Manhattan loft, David Mancuso created the blueprint for club culture. 'Love Saves the Day' wasn't just a party—it was the birth of DJ culture as we know it.",
            location="New York City",
            pioneers=["David Mancuso", "Nicky Siano", "Francis Grasso"],
            image_url="https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=800"
        ),
        Episode(
            block_number=3,
            year_start=1977,
            year_end=1983,
            title="Paradise Garage",
            subtitle="Larry Levan's Cathedral of Sound",
            description="The Paradise Garage became the world's first superclub. Larry Levan's legendary sets defined what DJing could become—an art form, a spiritual experience, a journey.",
            location="New York City",
            pioneers=["Larry Levan", "Frankie Knuckles", "Mel Cheren"],
            image_url="https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800"
        ),
        Episode(
            block_number=4,
            year_start=1984,
            year_end=1988,
            title="Chicago House",
            subtitle="The Warehouse Revolution",
            description="Frankie Knuckles took what he learned in New York to Chicago's Warehouse. Combined with drum machines and synthesizers, the four-on-the-floor beat became House music.",
            location="Chicago, Illinois",
            pioneers=["Frankie Knuckles", "Ron Hardy", "Marshall Jefferson"],
            image_url="https://images.unsplash.com/photo-1705741426612-0fcf0d69d395?w=800"
        ),
        Episode(
            block_number=5,
            year_start=1985,
            year_end=1991,
            title="Detroit Techno",
            subtitle="The Belleville Three",
            description="Juan Atkins, Derrick May, and Kevin Saunderson created Techno—a vision of the future born from Detroit's post-industrial landscape, Kraftwerk, and Parliament-Funkadelic.",
            location="Detroit, Michigan",
            pioneers=["Juan Atkins", "Derrick May", "Kevin Saunderson"],
            image_url="https://images.unsplash.com/photo-1525109905800-e9bf8214e6c3?w=800"
        ),
        Episode(
            block_number=6,
            year_start=1988,
            year_end=1992,
            title="Second Summer of Love",
            subtitle="Acid House Conquers Britain",
            description="Acid House crossed the Atlantic and ignited the UK. Illegal warehouse raves, the smiley face, and a generation united under the 303 bassline changed British culture forever.",
            location="Manchester & London, UK",
            pioneers=["Paul Oakenfold", "Danny Rampling", "Graeme Park"],
            image_url="https://images.unsplash.com/photo-1634321117972-0395485f8a4d?w=800"
        ),
        Episode(
            block_number=7,
            year_start=1991,
            year_end=1995,
            title="Jungle/Drum & Bass",
            subtitle="The UK Breakbeat Revolution",
            description="Jamaican sound system culture met rave's energy. Sped-up breakbeats, sub-bass, and ragga vocals created Jungle—the most uniquely British contribution to electronic music.",
            location="London, UK",
            pioneers=["Goldie", "LTJ Bukem", "Roni Size"],
            image_url="https://images.unsplash.com/photo-1656595696314-e0142a965554?w=800"
        ),
        Episode(
            block_number=8,
            year_start=1995,
            year_end=2005,
            title="The Superclub Era",
            subtitle="Global Dancefloor",
            description="Ministry of Sound, Fabric, Berghain—clubs became cathedrals. The DJ became a superstar. Electronic music went from underground to the world stage.",
            location="Global",
            pioneers=["Sasha", "John Digweed", "Carl Cox"],
            image_url="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800"
        ),
        Episode(
            block_number=9,
            year_start=2006,
            year_end=2015,
            title="The Festival Explosion",
            subtitle="EDM Goes Mainstream",
            description="Tomorrowland, Ultra, EDC—electronic music became the dominant youth culture. The producer became the rockstar. The drop became the hook.",
            location="Global",
            pioneers=["Deadmau5", "Skrillex", "Swedish House Mafia"],
            image_url="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800"
        ),
        Episode(
            block_number=10,
            year_start=2016,
            year_end=2026,
            title="The Perpetual Protocol",
            subtitle="Genesis: The Documentation Begins",
            description="The story never ended—it was just never fully told. Now, with blockchain permanence and community contribution, the history of dance music becomes an immortal, evolving document.",
            location="Decentralized",
            pioneers=["You", "The Community", "The Foundation"],
            image_url="https://images.unsplash.com/photo-1772149394726-863195d5889f?w=800"
        )
    ]
    
    episode_docs = [e.model_dump() for e in episodes]
    await insert_many_ignoring_duplicates(db.episodes, episode_docs)

    # Seed genres
    genres = [
        # House variants
        Genre(name="House", category="House", year_emerged=1984),
        Genre(name="Deep House", category="House", year_emerged=1986, parent_genre="House"),
        Genre(name="Acid House", category="House", year_emerged=1987, parent_genre="House"),
        Genre(name="Chicago House", category="House", year_emerged=1984, parent_genre="House"),
        Genre(name="Tech House", category="House", year_emerged=1995, parent_genre="House"),
        Genre(name="Progressive House", category="House", year_emerged=1992, parent_genre="House"),
        Genre(name="Garage House", category="House", year_emerged=1986, parent_genre="House"),
        Genre(name="Tribal House", category="House", year_emerged=1990, parent_genre="House"),
        Genre(name="Funky House", category="House", year_emerged=1998, parent_genre="House"),
        Genre(name="Electro House", category="House", year_emerged=2000, parent_genre="House"),
        Genre(name="Bass House", category="House", year_emerged=2010, parent_genre="House"),
        Genre(name="Future House", category="House", year_emerged=2014, parent_genre="House"),
        Genre(name="Afro House", category="House", year_emerged=2010, parent_genre="House"),
        Genre(name="Jackin House", category="House", year_emerged=2008, parent_genre="House"),
        Genre(name="Soulful House", category="House", year_emerged=1990, parent_genre="House"),
        # Techno variants
        Genre(name="Techno", category="Techno", year_emerged=1985),
        Genre(name="Detroit Techno", category="Techno", year_emerged=1985, parent_genre="Techno"),
        Genre(name="Minimal Techno", category="Techno", year_emerged=1994, parent_genre="Techno"),
        Genre(name="Hard Techno", category="Techno", year_emerged=1990, parent_genre="Techno"),
        Genre(name="Acid Techno", category="Techno", year_emerged=1988, parent_genre="Techno"),
        Genre(name="Industrial Techno", category="Techno", year_emerged=1992, parent_genre="Techno"),
        Genre(name="Dub Techno", category="Techno", year_emerged=1993, parent_genre="Techno"),
        Genre(name="Peak Time Techno", category="Techno", year_emerged=2015, parent_genre="Techno"),
        Genre(name="Melodic Techno", category="Techno", year_emerged=2010, parent_genre="Techno"),
        Genre(name="Berlin Techno", category="Techno", year_emerged=1990, parent_genre="Techno"),
        # Drum & Bass variants
        Genre(name="Drum & Bass", category="DnB", year_emerged=1991),
        Genre(name="Jungle", category="DnB", year_emerged=1991, parent_genre="Drum & Bass"),
        Genre(name="Liquid Funk", category="DnB", year_emerged=2000, parent_genre="Drum & Bass"),
        Genre(name="Neurofunk", category="DnB", year_emerged=1998, parent_genre="Drum & Bass"),
        Genre(name="Jump Up", category="DnB", year_emerged=1996, parent_genre="Drum & Bass"),
        Genre(name="Darkstep", category="DnB", year_emerged=1995, parent_genre="Drum & Bass"),
        Genre(name="Intelligent DnB", category="DnB", year_emerged=1995, parent_genre="Drum & Bass"),
        Genre(name="Ragga Jungle", category="DnB", year_emerged=1992, parent_genre="Drum & Bass"),
        Genre(name="Halftime", category="DnB", year_emerged=2012, parent_genre="Drum & Bass"),
        Genre(name="Breakcore", category="DnB", year_emerged=1994, parent_genre="Drum & Bass"),
        # Trance variants
        Genre(name="Trance", category="Trance", year_emerged=1991),
        Genre(name="Progressive Trance", category="Trance", year_emerged=1994, parent_genre="Trance"),
        Genre(name="Psytrance", category="Trance", year_emerged=1995, parent_genre="Trance"),
        Genre(name="Goa Trance", category="Trance", year_emerged=1993, parent_genre="Trance"),
        Genre(name="Uplifting Trance", category="Trance", year_emerged=1997, parent_genre="Trance"),
        Genre(name="Tech Trance", category="Trance", year_emerged=2000, parent_genre="Trance"),
        Genre(name="Vocal Trance", category="Trance", year_emerged=1998, parent_genre="Trance"),
        Genre(name="Hard Trance", category="Trance", year_emerged=1993, parent_genre="Trance"),
        Genre(name="Dark Psytrance", category="Trance", year_emerged=2000, parent_genre="Trance"),
        Genre(name="Full On", category="Trance", year_emerged=2002, parent_genre="Trance"),
        # Dubstep & Bass
        Genre(name="Dubstep", category="Bass", year_emerged=2002),
        Genre(name="Brostep", category="Bass", year_emerged=2010, parent_genre="Dubstep"),
        Genre(name="Deep Dubstep", category="Bass", year_emerged=2006, parent_genre="Dubstep"),
        Genre(name="UK Garage", category="Bass", year_emerged=1994),
        Genre(name="2-Step", category="Bass", year_emerged=1997, parent_genre="UK Garage"),
        Genre(name="Grime", category="Bass", year_emerged=2002, parent_genre="UK Garage"),
        Genre(name="Bassline", category="Bass", year_emerged=2002, parent_genre="UK Garage"),
        Genre(name="Future Bass", category="Bass", year_emerged=2012),
        Genre(name="Wave", category="Bass", year_emerged=2015),
        Genre(name="Trap", category="Bass", year_emerged=2012),
        # Ambient & Downtempo
        Genre(name="Ambient", category="Ambient", year_emerged=1978),
        Genre(name="Downtempo", category="Ambient", year_emerged=1990),
        Genre(name="Chillout", category="Ambient", year_emerged=1990),
        Genre(name="Trip Hop", category="Ambient", year_emerged=1991),
        Genre(name="IDM", category="Ambient", year_emerged=1992),
        Genre(name="Ambient Techno", category="Ambient", year_emerged=1992),
        Genre(name="Dark Ambient", category="Ambient", year_emerged=1980),
        Genre(name="Drone", category="Ambient", year_emerged=1985),
        Genre(name="Organic Downtempo", category="Ambient", year_emerged=2015),
        Genre(name="Psybient", category="Ambient", year_emerged=2005),
        # Hardcore variants
        Genre(name="Hardcore", category="Hardcore", year_emerged=1990),
        Genre(name="Happy Hardcore", category="Hardcore", year_emerged=1992, parent_genre="Hardcore"),
        Genre(name="Gabber", category="Hardcore", year_emerged=1989, parent_genre="Hardcore"),
        Genre(name="Frenchcore", category="Hardcore", year_emerged=2005, parent_genre="Hardcore"),
        Genre(name="Speedcore", category="Hardcore", year_emerged=1992, parent_genre="Hardcore"),
        Genre(name="UK Hardcore", category="Hardcore", year_emerged=2000, parent_genre="Hardcore"),
        Genre(name="Hardstyle", category="Hardcore", year_emerged=1999),
        Genre(name="Rawstyle", category="Hardcore", year_emerged=2010, parent_genre="Hardstyle"),
        Genre(name="Euphoric Hardstyle", category="Hardcore", year_emerged=2005, parent_genre="Hardstyle"),
        Genre(name="Terrorcore", category="Hardcore", year_emerged=1994, parent_genre="Hardcore"),
        # Breakbeat
        Genre(name="Breakbeat", category="Breakbeat", year_emerged=1988),
        Genre(name="Big Beat", category="Breakbeat", year_emerged=1995, parent_genre="Breakbeat"),
        Genre(name="Nu Skool Breaks", category="Breakbeat", year_emerged=1999, parent_genre="Breakbeat"),
        Genre(name="Broken Beat", category="Breakbeat", year_emerged=2000),
        Genre(name="Baltimore Club", category="Breakbeat", year_emerged=1992, parent_genre="Breakbeat"),
        Genre(name="Florida Breaks", category="Breakbeat", year_emerged=1995, parent_genre="Breakbeat"),
        # Electro & Synth
        Genre(name="Electro", category="Electro", year_emerged=1982),
        Genre(name="Electroclash", category="Electro", year_emerged=2000, parent_genre="Electro"),
        Genre(name="Synthwave", category="Electro", year_emerged=2005),
        Genre(name="Darksynth", category="Electro", year_emerged=2012, parent_genre="Synthwave"),
        Genre(name="Outrun", category="Electro", year_emerged=2008, parent_genre="Synthwave"),
        Genre(name="EBM", category="Electro", year_emerged=1981),
        Genre(name="Industrial", category="Electro", year_emerged=1980),
        Genre(name="Synthpop", category="Electro", year_emerged=1978),
        Genre(name="Italo Disco", category="Electro", year_emerged=1977),
        Genre(name="Hi-NRG", category="Electro", year_emerged=1977),
        # Disco & Funk
        Genre(name="Disco", category="Disco", year_emerged=1970),
        Genre(name="Nu Disco", category="Disco", year_emerged=2002, parent_genre="Disco"),
        Genre(name="Cosmic Disco", category="Disco", year_emerged=1977, parent_genre="Disco"),
        Genre(name="Boogie", category="Disco", year_emerged=1980, parent_genre="Disco"),
        Genre(name="Funk", category="Disco", year_emerged=1965),
        Genre(name="G-Funk", category="Disco", year_emerged=1992, parent_genre="Funk"),
        # Modern EDM
        Genre(name="EDM", category="EDM", year_emerged=2010),
        Genre(name="Big Room", category="EDM", year_emerged=2012, parent_genre="EDM"),
        Genre(name="Future Bounce", category="EDM", year_emerged=2016, parent_genre="EDM"),
        Genre(name="Slap House", category="EDM", year_emerged=2019, parent_genre="EDM"),
        Genre(name="Melodic Bass", category="EDM", year_emerged=2015, parent_genre="EDM"),
        Genre(name="Color Bass", category="EDM", year_emerged=2018, parent_genre="EDM"),
    ]
    
    genre_docs = [g.model_dump() for g in genres]
    await insert_many_ignoring_duplicates(db.genres, genre_docs)

    episode_count = await db.episodes.count_documents({})
    genre_count = await db.genres.count_documents({})
    return {"message": "Data seeded successfully", "episodes": episode_count, "genres": genre_count}

# ============== STATUS ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "The Beat Goes On API v1.0.0", "status": "operational"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# Include the router
app.include_router(api_router)
app.include_router(archive_router)

app.add_middleware(
    CORSMiddleware,
    # Auth is a Bearer token in the Authorization header, not a cookie, so
    # there's nothing that needs allow_credentials=True — and leaving it on
    # is actively harmful here: per the CORS spec a browser rejects
    # `Access-Control-Allow-Origin: *` combined with
    # `Access-Control-Allow-Credentials: true`, so Starlette works around
    # it by echoing back whatever Origin the request came from, i.e.
    # "credentialed requests allowed from any origin" — far more permissive
    # than the plain wildcard this app actually needs.
    allow_credentials=False,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def ensure_indexes():
    # Backs the idempotency of /api/seed: even if two requests race past the
    # find-then-insert check below, the unique index rejects the second
    # insert of any given block_number/name instead of duplicating it.
    await db.episodes.create_index("block_number", unique=True)
    await db.genres.create_index("name", unique=True)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
