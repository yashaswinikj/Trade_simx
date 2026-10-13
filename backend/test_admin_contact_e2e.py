import requests
import json
import time

BASE_URL = "http://localhost:5000/api"

def run_admin_contact_tests():
    print("=" * 70)
    print("  TradeSimX Admin & Contact Us System Acceptance Test Suite")
    print("=" * 70)

    # -------------------------------------------------------------
    # TEST 1: Submit Contact Message as User/Guest
    # -------------------------------------------------------------
    print("\n--- TEST 1: Submit Contact Us Inquiry ---")
    ts = int(time.time())
    user_email = f"trader_{ts}@example.com"
    subject = "Question regarding paper trading leverage"
    msg_text = "Hello, I am testing the paper trading execution and wanted to ask about margin requirements."

    r_submit = requests.post(f"{BASE_URL}/contact", json={
        "name": "Alex Vance",
        "email": user_email,
        "subject": subject,
        "message": msg_text
    })
    assert r_submit.status_code == 200, f"Contact submission failed: {r_submit.text}"
    msg_id = r_submit.json().get("message_id")
    print(f"1. Contact Message Submitted (ID: {msg_id}): SUCCESS ({r_submit.json().get('message')})")

    # -------------------------------------------------------------
    # TEST 2 & 3: Admin Login Verification
    # -------------------------------------------------------------
    print("\n--- TEST 2 & 3: Admin Authentication & Password Security ---")
    admin_email = "admin@tradesimx.ai"
    admin_pass = "AdminPass123!"
    wrong_pass = "WrongAdminPass999!"

    # Test 3: Wrong Admin Password -> MUST FAIL 401
    r_bad_admin = requests.post(f"{BASE_URL}/admin/login", json={"email": admin_email, "password": wrong_pass})
    assert r_bad_admin.status_code == 401, f"Wrong admin password must fail with 401! Got {r_bad_admin.status_code}"
    print(f"2. Login with WRONG Admin Password: REJECTED with 401 ({r_bad_admin.json().get('error')})")

    # Test 2: Correct Admin Password -> MUST SUCCEED 200
    r_admin_login = requests.post(f"{BASE_URL}/admin/login", json={"email": admin_email, "password": admin_pass})
    assert r_admin_login.status_code == 200, f"Admin login failed: {r_admin_login.text}"
    admin_data = r_admin_login.json()["user"]
    admin_token = admin_data["token"]
    assert admin_data["role"] == "admin"
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(f"3. Login with CORRECT Admin Password: SUCCESS (Role: {admin_data['role']}, Token: {admin_token[:20]}...)")

    # -------------------------------------------------------------
    # TEST 4: Normal User Accessing Admin Endpoints -> MUST FAIL 403
    # -------------------------------------------------------------
    print("\n--- TEST 4: Role Security & Admin Protection ---")
    # Register normal user
    r_user = requests.post(f"{BASE_URL}/auth/register", json={
        "email": f"normal_user_{ts}@tradesimx.ai",
        "password": "UserPass123!",
        "confirmPassword": "UserPass123!",
        "name": "Normal Trader"
    }).json()["user"]
    user_headers = {"Authorization": f"Bearer {r_user['token']}"}

    r_user_access_admin = requests.get(f"{BASE_URL}/admin/dashboard/stats", headers=user_headers)
    assert r_user_access_admin.status_code in [401, 403], f"Normal user must be forbidden from admin routes! Got {r_user_access_admin.status_code}"
    print(f"4. Normal User Accessing Admin Stats: REJECTED with {r_user_access_admin.status_code} ({r_user_access_admin.json().get('error')})")

    # -------------------------------------------------------------
    # TEST 5, 6, 7: Admin Dashboard Stats & Message List
    # -------------------------------------------------------------
    print("\n--- TEST 5, 6 & 7: Admin Dashboard Stats & Message List ---")
    r_stats = requests.get(f"{BASE_URL}/admin/dashboard/stats", headers=admin_headers)
    assert r_stats.status_code == 200
    stats = r_stats.json()["stats"]
    print(f"5. Real Admin Dashboard Stats: {json.dumps(stats)}")

    r_msgs = requests.get(f"{BASE_URL}/admin/messages", headers=admin_headers)
    assert r_msgs.status_code == 200
    msgs = r_msgs.json()["messages"]
    found_msg = next((m for m in msgs if m["id"] == msg_id), None)
    assert found_msg is not None, "Submitted message must appear in admin list!"
    print(f"6. Admin Messages List Retrieved: {len(msgs)} total messages | Target Status: {found_msg['status']}")

    # Open Message Detail -> Updates status from 'new' to 'read'
    r_detail = requests.get(f"{BASE_URL}/admin/messages/{msg_id}", headers=admin_headers)
    assert r_detail.status_code == 200
    msg_detail = r_detail.json()["message"]
    assert msg_detail["status"] == "read", "Status must update to 'read' when admin opens message!"
    print(f"7. Admin Opened Message Detail: Status updated to '{msg_detail['status']}'")

    # -------------------------------------------------------------
    # TEST 8: Admin Reply to Message
    # -------------------------------------------------------------
    print("\n--- TEST 8: Admin Reply Workflow ---")
    reply_text = "Thank you for contacting TradeSimX support. Paper trading uses 100% virtual balance without real margin requirements."
    r_reply = requests.post(f"{BASE_URL}/admin/messages/{msg_id}/reply", json={"reply_message": reply_text}, headers=admin_headers)
    assert r_reply.status_code == 200
    reply_res = r_reply.json()
    print(f"8. Admin Reply Submitted: {reply_res['message']} (Delivered via SMTP: {reply_res['email_delivered']})")

    # Verify status changed to 'replied'
    r_detail_updated = requests.get(f"{BASE_URL}/admin/messages/{msg_id}", headers=admin_headers).json()["message"]
    assert r_detail_updated["status"] == "replied"
    assert r_detail_updated["admin_reply"] == reply_text
    print(f"9. Verified Status Update in MongoDB: Status='{r_detail_updated['status']}' | Reply='{r_detail_updated['admin_reply'][:40]}...'")

    print("\n" + "=" * 70)
    print("      ALL ADMIN & CONTACT US ACCEPTANCE TESTS PASSED 100%!")
    print("=" * 70)

if __name__ == "__main__":
    run_admin_contact_tests()
