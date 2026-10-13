import os
import sys
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from database.mongo_client import db_manager

def inspect_database():
    print("=" * 80)
    print("  TRADESIMX — LIVE DATABASE INSPECTION REPORT")
    print("=" * 80)

    print(f"\nDatabase Connection Mode: {'MongoDB (Live)' if db_manager.is_mongo else 'JSON File Fallback (db_fallback.json)'}\n")

    collections = ["users", "contact_messages", "paper_accounts", "paper_positions", "paper_trades", "strategies"]

    for coll_name in collections:
        coll = db_manager.get_collection(coll_name)
        docs = coll.find_all({}, limit=10)
        
        print(f"------------------------------------------------------------------------")
        print(f"Collection: '{coll_name}' | Total Retrieved Records: {len(docs)}")
        print(f"------------------------------------------------------------------------")
        
        # Sanitize sensitive fields for display
        sanitized_docs = []
        for d in docs:
            d_copy = d.copy()
            if "password_hash" in d_copy:
                d_copy["password_hash"] = "[PROTECTED WERKZEUG HASH]"
            if "password" in d_copy:
                d_copy["password"] = "[PROTECTED]"
            sanitized_docs.append(d_copy)

        if sanitized_docs:
            print(json.dumps(sanitized_docs, indent=2, default=str))
        else:
            print("   (Collection is empty)")
        print("\n")

if __name__ == "__main__":
    inspect_database()
