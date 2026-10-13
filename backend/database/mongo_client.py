import os
import json
import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from config import Config

logger = logging.getLogger("TradeSimX.DB")

class FallbackDatabase:
    """
    JSON file-based database fallback when MongoDB is not running locally.
    Ensures zero downtime and full offline functionality for local execution.
    """
    def __init__(self, filepath):
        self.filepath = filepath
        self._ensure_file()

    def _ensure_file(self):
        if not os.path.exists(self.filepath):
            initial_data = {
                "users": [],
                "strategies": [],
                "backtest_results": [],
                "ml_models": [],
                "paper_accounts": [],
                "paper_positions": [],
                "paper_trades": []
            }
            with open(self.filepath, "w") as f:
                json.dump(initial_data, f, indent=2)

    def _read_data(self):
        try:
            with open(self.filepath, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading fallback DB: {e}")
            return {"users": [], "strategies": [], "backtest_results": [], "ml_models": [], "paper_accounts": [], "paper_positions": [], "paper_trades": []}

    def _write_data(self, data):
        try:
            with open(self.filepath, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error writing fallback DB: {e}")

    def insert_one(self, collection, doc):
        data = self._read_data()
        if collection not in data:
            data[collection] = []
        data[collection].append(doc)
        self._write_data(data)
        return doc.get("id") or doc.get("_id")

    def find(self, collection, query=None, limit=100):
        data = self._read_data()
        items = data.get(collection, [])
        if query:
            filtered = []
            for item in items:
                match = True
                for k, v in query.items():
                    if item.get(k) != v:
                        match = False
                        break
                if match:
                    filtered.append(item)
            return filtered[:limit]
        return items[:limit]

    def find_one(self, collection, query):
        items = self.find(collection, query, limit=1)
        return items[0] if items else None

    def update_one(self, collection, query, update):
        data = self._read_data()
        items = data.get(collection, [])
        updated = False
        set_values = update.get("$set", {})
        for item in items:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                for k, v in set_values.items():
                    item[k] = v
                updated = True
                break
        if updated:
            self._write_data(data)
        return updated

    def delete_one(self, collection, query):
        data = self._read_data()
        items = data.get(collection, [])
        new_items = []
        deleted = 0
        for item in items:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match and deleted == 0:
                deleted += 1
            else:
                new_items.append(item)
        data[collection] = new_items
        self._write_data(data)
        return deleted > 0

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_mongo = False
        self.fallback_db = None
        self.init_db()

    def init_db(self):
        try:
            self.client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=1500)
            # Test connection
            self.client.admin.command('ping')
            self.db = self.client.get_database()
            self.is_mongo = True
            logger.info("Connected successfully to MongoDB.")
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
            logger.warning(f"MongoDB not available ({e}). Using JSON file fallback database.")
            self.is_mongo = False
            fallback_path = os.path.join(Config.DATA_DIR, "db_fallback.json")
            self.fallback_db = FallbackDatabase(fallback_path)

    def get_collection(self, collection_name):
        if self.is_mongo and self.db is not None:
            return MongoCollectionWrapper(self.db[collection_name])
        else:
            return FallbackCollectionWrapper(self.fallback_db, collection_name)

class MongoCollectionWrapper:
    def __init__(self, mongo_coll):
        self.coll = mongo_coll

    def insert_one(self, doc):
        doc_copy = doc.copy()
        res = self.coll.insert_one(doc_copy)
        if "_id" in doc:
            doc.pop("_id", None)
        return str(res.inserted_id)

    def find_all(self, query=None, limit=100):
        query = query or {}
        results = list(self.coll.find(query, {"_id": 0}).limit(limit))
        return results

    def find_one(self, query):
        return self.coll.find_one(query, {"_id": 0})

    def update_one(self, query, update):
        res = self.coll.update_one(query, update)
        return res.modified_count > 0

    def delete_one(self, query):
        res = self.coll.delete_one(query)
        return res.deleted_count > 0

class FallbackCollectionWrapper:
    def __init__(self, fallback_db, collection_name):
        self.db = fallback_db
        self.name = collection_name

    def insert_one(self, doc):
        return self.db.insert_one(self.name, doc)

    def find_all(self, query=None, limit=100):
        return self.db.find(self.name, query, limit)

    def find_one(self, query):
        return self.db.find_one(self.name, query)

    def update_one(self, query, update):
        return self.db.update_one(self.name, query, update)

    def delete_one(self, query):
        return self.db.delete_one(self.name, query)

db_manager = DatabaseManager()
