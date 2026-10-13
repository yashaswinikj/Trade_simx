import os
import sys
import json
import time
import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.mongo_client import db_manager
from services.auth_service import auth_service
from config import Config

BASE_URL = "http://localhost:5000/api"

def run_admin_auth_tests():
    print("=" * 80)
    print("  TRADESIMX — COMPREHENSIVE ADMIN AUTHENTICATION TEST SUITE")
    print("=" * 80)

    admin_email = Config.ADMIN_EMAIL
    admin_password = Config.ADMIN_PASSWORD

    print(f"\nTarget Admin Email: '{admin_email}'")
    print("Configured Password Source: backend/.env / Config\n")

    # 1. DATABASE INSPECTION TEST
    print("-" * 60)
    print("TEST 1: DATABASE ADMIN ACCOUNT INSPECTION")
    print("-" * 60)
    users_coll = db_manager.get_collection("users")
    admin_doc = users_coll.find_one({"email": admin_email})
    assert admin_doc is not None, f"Admin account '{admin_email}' was not found in MongoDB!"
    hash_val = str(admin_doc.get("password_hash", ""))
    assert hash_val != "None" and not hash_val.startswith("pbkdf2_sha256"), f"Invalid hash format: {hash_val[:30]}"
    assert hash_val.startswith("scrypt:") or hash_val.startswith("pbkdf2:"), f"Expected Werkzeug hash format, got {hash_val[:30]}"
    print(f"  [PASSED] Admin account found: YES")
    print(f"  [PASSED] Role: '{admin_doc.get('role')}'")
    print(f"  [PASSED] Password hash format: VALID WERKZEUG HASH ({hash_val[:20]}...)")

    # 2. CORRECT EMAIL + CORRECT PASSWORD -> HTTP 200 SUCCESS
    print("\n" + "-" * 60)
    print("TEST 2: CORRECT EMAIL + CORRECT PASSWORD (LOGIN SUCCESS)")
    print("-" * 60)
    r_success = requests.post(f"{BASE_URL}/admin/login", json={
        "email": admin_email,
        "password": admin_password
    })
    print(f"Response Status Code: {r_success.status_code}")
    assert r_success.status_code == 200, f"Expected 200 OK, got {r_success.status_code}: {r_success.text}"
    body_success = r_success.json()
    assert body_success.get("success") is True, "Expected success == True"
    user_payload = body_success.get("user", {})
    assert user_payload.get("role") == "admin", "Expected role == 'admin'"
    assert "token" in user_payload and user_payload["token"].startswith("token_admin_"), "Missing or invalid admin token"
    # Ensure sensitive hashes are NEVER returned to frontend
    assert "password_hash" not in user_payload, "SECURITY ERROR: password_hash returned to frontend!"
    assert "password" not in user_payload, "SECURITY ERROR: password returned to frontend!"
    admin_token = user_payload["token"]
    print("  [PASSED] Correct credentials accepted with HTTP 200!")
    print(f"  [PASSED] Admin token generated: {admin_token[:25]}...")
    print("  [PASSED] Security check: password_hash and raw password NOT exposed to frontend.")

    # 3. CORRECT EMAIL + WRONG PASSWORD -> HTTP 401 FAILURE
    print("\n" + "-" * 60)
    print("TEST 3: CORRECT EMAIL + WRONG PASSWORD (REJECTED)")
    print("-" * 60)
    r_bad_pass = requests.post(f"{BASE_URL}/admin/login", json={
        "email": admin_email,
        "password": "WrongPassword999!"
    })
    print(f"Response Status Code: {r_bad_pass.status_code}")
    assert r_bad_pass.status_code == 401, f"Expected 401 Unauthorized, got {r_bad_pass.status_code}"
    body_bad_pass = r_bad_pass.json()
    assert body_bad_pass.get("success") is False
    print(f"  [PASSED] Wrong password rejected with HTTP 401 ({body_bad_pass.get('error')})")

    # 4. WRONG EMAIL + CORRECT PASSWORD -> HTTP 401 FAILURE
    print("\n" + "-" * 60)
    print("TEST 4: WRONG EMAIL + CORRECT PASSWORD (REJECTED)")
    print("-" * 60)
    r_bad_email = requests.post(f"{BASE_URL}/admin/login", json={
        "email": "imposter_admin@tradesimx.ai",
        "password": admin_password
    })
    print(f"Response Status Code: {r_bad_email.status_code}")
    assert r_bad_email.status_code == 401, f"Expected 401 Unauthorized, got {r_bad_email.status_code}"
    print(f"  [PASSED] Wrong email rejected with HTTP 401 ({r_bad_email.json().get('error')})")

    # 5. WRONG EMAIL + WRONG PASSWORD -> HTTP 401 FAILURE
    print("\n" + "-" * 60)
    print("TEST 5: WRONG EMAIL + WRONG PASSWORD (REJECTED)")
    print("-" * 60)
    r_bad_both = requests.post(f"{BASE_URL}/admin/login", json={
        "email": "invalid_user@tradesimx.ai",
        "password": "FakePassword123!"
    })
    print(f"Response Status Code: {r_bad_both.status_code}")
    assert r_bad_both.status_code == 401, f"Expected 401 Unauthorized, got {r_bad_both.status_code}"
    print(f"  [PASSED] Wrong email + wrong password rejected with HTTP 401 ({r_bad_both.json().get('error')})")

    # 6. PROTECTED ENDPOINT AUTHORIZATION CHECK
    print("\n" + "-" * 60)
    print("TEST 6: PROTECTED ADMIN ENDPOINT AUTHORIZATION")
    print("-" * 60)
    # Unauthenticated request -> MUST FAIL 401/403
    r_no_auth = requests.get(f"{BASE_URL}/admin/dashboard/stats")
    assert r_no_auth.status_code in [401, 403], f"Unauthenticated request must fail, got {r_no_auth.status_code}"
    print("  [PASSED] Unauthenticated access to protected dashboard stats rejected.")

    # Authenticated request -> MUST SUCCEED 200
    headers = {"Authorization": f"Bearer {admin_token}"}
    r_auth = requests.get(f"{BASE_URL}/admin/dashboard/stats", headers=headers)
    assert r_auth.status_code == 200, f"Authenticated request failed, got {r_auth.status_code}: {r_auth.text}"
    stats_body = r_auth.json()
    assert stats_body.get("success") is True
    print(f"  [PASSED] Authenticated access with admin Bearer token succeeded!")

    print("\n" + "=" * 80)
    print("  ALL 6 ADMIN AUTHENTICATION TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 80)

if __name__ == "__main__":
    run_admin_auth_tests()
