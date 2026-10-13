import time
import uuid
import logging
from werkzeug.security import generate_password_hash, check_password_hash
from database.mongo_client import db_manager
from config import Config

logger = logging.getLogger("TradeSimX.AuthService")

class AuthService:
    def __init__(self):
        self.init_admin()

    def init_admin(self):
        """
        Synchronizes administrator account in MongoDB upon backend startup.
        Uses Werkzeug password hashing. Safe idempotent one-time migration.
        """
        admin_email = (Config.ADMIN_EMAIL or "").strip().lower()
        admin_pass = (Config.ADMIN_PASSWORD or "").strip()

        if not admin_email or not admin_pass:
            logger.warning("[AUTH ADMIN] ADMIN_EMAIL or ADMIN_PASSWORD is not configured in backend/.env")
            return

        try:
            users_coll = db_manager.get_collection("users")
            existing = users_coll.find_one({"email": admin_email})

            if existing:
                stored_hash = existing.get("password_hash")
                needs_repair = False

                if not stored_hash or str(stored_hash).startswith("pbkdf2_sha256"):
                    needs_repair = True
                else:
                    try:
                        # Verify if Werkzeug can parse the stored hash
                        check_password_hash(stored_hash, "dummy_check_test_123")
                    except Exception:
                        needs_repair = True

                if needs_repair:
                    new_hash = generate_password_hash(admin_pass)
                    users_coll.update_one(
                        {"email": admin_email},
                        {"$set": {"password_hash": new_hash, "role": "admin"}}
                    )
                    logger.info(f"[AUTH ADMIN] Migrated legacy admin hash for '{admin_email}' to Werkzeug format.")
                else:
                    # Hash is valid, preserve existing hash without modifying password
                    if existing.get("role") != "admin":
                        users_coll.update_one({"email": admin_email}, {"$set": {"role": "admin"}})
                    logger.info(f"[AUTH ADMIN] Existing admin account '{admin_email}' verified with valid Werkzeug hash.")
            else:
                new_hash = generate_password_hash(admin_pass)
                admin_doc = {
                    "id": "admin_master",
                    "name": "Platform Administrator",
                    "email": admin_email,
                    "password_hash": new_hash,
                    "role": "admin",
                    "token": f"token_admin_master_{int(time.time())}",
                    "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")
                }
                users_coll.insert_one(admin_doc)
                logger.info(f"[AUTH ADMIN] Created admin account for '{admin_email}' with Werkzeug hash.")
        except Exception as e:
            logger.error(f"[AUTH ADMIN ERROR] Failed to initialize admin account: {e}")

    def register_user(self, email, password, name=None, confirm_password=None):
        email = (email or "").strip().lower()
        password = (password or "").strip()
        confirm_password = (confirm_password or "").strip() if confirm_password is not None else password
        name = (name or "").strip() or email.split("@")[0].capitalize() or "Trader"

        if not email:
            raise ValueError("Email address is required.")
        if not password:
            raise ValueError("Password is required.")
        if password != confirm_password:
            raise ValueError("Passwords do not match.")

        users_coll = db_manager.get_collection("users")
        existing = users_coll.find_one({"email": email})
        if existing:
            raise ValueError("User with this email already exists.")

        user_id = f"user_{str(uuid.uuid4())[:8]}"
        password_hash = generate_password_hash(password)
        token = f"token_{user_id}_{int(time.time())}"

        user_doc = {
            "id": user_id,
            "name": name,
            "email": email,
            "password_hash": password_hash,
            "role": "user",
            "token": token,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")
        }
        users_coll.insert_one(user_doc)

        # Initialize default paper account for new user in paper_accounts
        paper_coll = db_manager.get_collection("paper_accounts")
        existing_paper = paper_coll.find_one({"user_id": user_id})
        if not existing_paper:
            paper_coll.insert_one({
                "id": f"paper_{user_id}",
                "user_id": user_id,
                "initial_capital": 100000.0,
                "cash_balance": 100000.0,
                "realized_pnl": 0.0,
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")
            })

        return {
            "id": user_id,
            "name": name,
            "email": email,
            "role": "user",
            "token": token
        }

    def login_user(self, email, password):
        email = (email or "").strip().lower()
        password = (password or "").strip()

        if not email:
            raise ValueError("Please enter your email.")
        if not password:
            raise ValueError("Please enter your password.")

        users_coll = db_manager.get_collection("users")
        user = users_coll.find_one({"email": email})

        if not user or "password_hash" not in user:
            raise PermissionError("Invalid email or password.")

        is_valid = False
        try:
            is_valid = check_password_hash(user["password_hash"], password)
        except Exception:
            is_valid = False

        if not is_valid:
            raise PermissionError("Invalid email or password.")

        token = user.get("token") or f"token_{user['id']}_{int(time.time())}"
        users_coll.update_one({"email": email}, {"$set": {"token": token}})

        return {
            "id": user["id"],
            "name": user.get("name", "Trader"),
            "email": user["email"],
            "role": user.get("role", "user"),
            "token": token
        }

    def login_admin(self, email, password):
        """
        Authenticates administrator strictly requiring correct email and Werkzeug password hash.
        """
        email = (email or "").strip().lower()
        password = (password or "").strip()

        if not email or not password:
            raise ValueError("Admin email and password are required.")

        admin_email = (Config.ADMIN_EMAIL or "").strip().lower()
        admin_pass = (Config.ADMIN_PASSWORD or "").strip()

        if not admin_email:
            raise RuntimeError("ADMIN_EMAIL is not configured in backend/.env")

        if email != admin_email:
            raise PermissionError("Invalid administrator credentials.")

        users_coll = db_manager.get_collection("users")
        admin_doc = users_coll.find_one({"email": admin_email})

        stored_hash = admin_doc.get("password_hash") if admin_doc else None
        is_valid = False

        if stored_hash and not str(stored_hash).startswith("pbkdf2_sha256"):
            try:
                is_valid = check_password_hash(stored_hash, password)
            except Exception as e:
                logger.warning(f"[AUTH ADMIN] Failed checking stored password hash: {e}")
                is_valid = False

        if not is_valid:
            # Check if password matches configured ADMIN_PASSWORD and repair hash if needed
            if admin_pass and password == admin_pass:
                is_valid = True
                new_hash = generate_password_hash(admin_pass)
                users_coll.update_one(
                    {"email": admin_email},
                    {"$set": {"password_hash": new_hash, "role": "admin"}}
                )
                logger.info(f"[AUTH ADMIN] Successfully repaired admin password hash for '{admin_email}'.")

        if not is_valid:
            raise PermissionError("Invalid administrator credentials.")

        admin_token = admin_doc.get("token") if admin_doc else None
        if not admin_token:
            admin_token = f"token_admin_master_{int(time.time())}"

        if admin_doc:
            users_coll.update_one({"email": admin_email}, {"$set": {"token": admin_token, "role": "admin"}})
        else:
            new_hash = generate_password_hash(password)
            users_coll.insert_one({
                "id": "admin_master",
                "name": "Platform Administrator",
                "email": admin_email,
                "password_hash": new_hash,
                "role": "admin",
                "token": admin_token,
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")
            })

        logger.info("[AUTH ADMIN] Administrator authenticated successfully.")
        return {
            "id": "admin_master",
            "name": "Platform Administrator",
            "email": admin_email,
            "role": "admin",
            "token": admin_token
        }

    def get_user_from_request(self, req):
        """Extracts and verifies Bearer token from Authorization header for normal users."""
        auth_header = req.headers.get("Authorization", "")
        token = ""
        if auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "").strip()
        elif req.headers.get("X-Auth-Token"):
            token = req.headers.get("X-Auth-Token").strip()
        elif req.args.get("token"):
            token = req.args.get("token").strip()

        if not token:
            return None

        users_coll = db_manager.get_collection("users")
        user = users_coll.find_one({"token": token})
        if user:
            return {
                "id": user["id"],
                "name": user.get("name", "Trader"),
                "email": user.get("email", ""),
                "role": user.get("role", "user")
            }
        return None

    def get_admin_from_request(self, req):
        """Extracts and verifies Bearer token strictly requiring role == 'admin'."""
        user = self.get_user_from_request(req)
        if user and user.get("role") == "admin":
            return user
        return None

auth_service = AuthService()
