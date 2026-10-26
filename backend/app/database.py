import asyncio
import logging
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

logger = logging.getLogger("gridpulse.database")

# In-memory mock collection for seamless fallback if MongoDB is not running locally
class AsyncMockCursor:
    def __init__(self, docs: List[Dict[str, Any]]):
        self.docs = docs
        self._iter = iter(docs)

    def sort(self, key_or_list, direction=None):
        if isinstance(key_or_list, list):
            for k, d in reversed(key_or_list):
                reverse = d < 0 if isinstance(d, int) else False
                self.docs.sort(key=lambda x: x.get(k, 0), reverse=reverse)
        elif isinstance(key_or_list, str):
            reverse = direction < 0 if isinstance(direction, int) else False
            self.docs.sort(key=lambda x: x.get(key_or_list, 0), reverse=reverse)
        return self

    def limit(self, n: int):
        self.docs = self.docs[:n]
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        if length is not None:
            return [dict(d) for d in self.docs[:length]]
        return [dict(d) for d in self.docs]

    def __aiter__(self):
        self._iter = iter(self.docs)
        return self

    async def __anext__(self):
        try:
            return dict(next(self._iter))
        except StopIteration:
            raise StopAsyncIteration

class AsyncMockCollection:
    def __init__(self, name: str):
        self.name = name
        self._data: List[Dict[str, Any]] = []

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        for k, v in query.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches(doc, cond) for cond in v):
                    return False
                continue
            if isinstance(v, dict):
                # handle basic operators like $ne, $in, $gt
                if "$ne" in v and doc.get(k) == v["$ne"]:
                    return False
                if "$in" in v and doc.get(k) not in v["$in"]:
                    return False
                if "$gt" in v and not (doc.get(k, 0) > v["$gt"]):
                    return False
            else:
                if str(doc.get(k, "")).lower() != str(v).lower() and doc.get(k) != v:
                    return False
        return True

    def find(self, query: Optional[Dict[str, Any]] = None) -> AsyncMockCursor:
        query = query or {}
        matched = [d for d in self._data if self._matches(d, query)]
        return AsyncMockCursor(matched)

    async def find_one(self, query: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        query = query or {}
        for d in self._data:
            if self._matches(d, query):
                return dict(d)
        return None

    async def insert_one(self, doc: Dict[str, Any]):
        new_doc = dict(doc)
        if "_id" not in new_doc:
            new_doc["_id"] = f"id_{len(self._data) + 1}_{hash(str(new_doc)) % 100000}"
        self._data.append(new_doc)
        class InsertResult:
            inserted_id = new_doc["_id"]
        return InsertResult()

    async def insert_many(self, docs: List[Dict[str, Any]]):
        res = []
        for d in docs:
            r = await self.insert_one(d)
            res.append(r.inserted_id)
        class InsertManyResult:
            inserted_ids = res
        return InsertManyResult()

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        for d in self._data:
            if self._matches(d, query):
                if "$set" in update:
                    d.update(update["$set"])
                else:
                    d.update(update)
                class UpdateResult:
                    matched_count = 1
                    modified_count = 1
                return UpdateResult()
        class UpdateResultZero:
            matched_count = 0
            modified_count = 0
        return UpdateResultZero()

    async def delete_one(self, query: Dict[str, Any]):
        for i, d in enumerate(self._data):
            if self._matches(d, query):
                self._data.pop(i)
                class DeleteResult:
                    deleted_count = 1
                return DeleteResult()
        class DeleteResultZero:
            deleted_count = 0
        return DeleteResultZero()

    async def delete_many(self, query: Dict[str, Any]):
        initial_len = len(self._data)
        self._data = [d for d in self._data if not self._matches(d, query)]
        class DeleteManyResult:
            deleted_count = initial_len - len(self._data)
        return DeleteManyResult()

    async def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        query = query or {}
        return sum(1 for d in self._data if self._matches(d, query))

class AsyncMockDatabase:
    def __init__(self, name: str):
        self.name = name
        self._collections: Dict[str, AsyncMockCollection] = {}

    def __getitem__(self, item: str) -> AsyncMockCollection:
        if item not in self._collections:
            self._collections[item] = AsyncMockCollection(item)
        return self._collections[item]

    def get_collection(self, item: str) -> AsyncMockCollection:
        return self[item]

class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Any = None
    is_connected_to_real_mongo: bool = False

    async def connect(self):
        try:
            logger.info("Attempting MongoDB connection...")
            client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2500)
            # Ping database to check if server is running
            await client.admin.command('ping')
            self.client = client
            self.db = client[settings.DATABASE_NAME]
            self.is_connected_to_real_mongo = True
            print(f"[GridPulse DB] Successfully connected to live MongoDB (Database: {settings.DATABASE_NAME})")
        except Exception as e:
            logger.warning(f"Live MongoDB not available ({e}). Initializing high-speed async in-memory MongoDB layer.")
            print("[GridPulse DB] Live MongoDB connection failed. Initialized high-performance async in-memory document store.")
            self.client = None
            self.db = AsyncMockDatabase(settings.DATABASE_NAME)
            self.is_connected_to_real_mongo = False

    async def close(self):
        if self.client:
            self.client.close()

db_manager = DatabaseManager()

def get_database():
    return db_manager.db
