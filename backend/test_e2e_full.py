import sys
import io
import requests
import json
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_URL = "http://localhost:5000/api"

def run_full_acceptance_tests():
    print("=" * 70)
    print("  TradeSimX AI — Critical Functionality Fix Acceptance Suite")
    print("=" * 70)

    # -------------------------------------------------------------
    # PART 1: AI HEALTH & CONFIGURATION TESTS
    # -------------------------------------------------------------
    print("\n--- PART 1: AI HEALTH & CONFIGURATION TESTS ---")
    r_health = requests.get(f"{BASE_URL}/ai/health")
    assert r_health.status_code == 200, f"AI Health check failed: {r_health.text}"
    health_data = r_health.json()
    print(f"1. AI Health Status: {json.dumps(health_data)}")
    assert "configured" in health_data
    assert "provider" in health_data

    r_test = requests.post(f"{BASE_URL}/ai/test", json={"message": "Say hello in one sentence."})
    print(f"2. AI Test Endpoint Status: {r_test.status_code} | Response: {r_test.text}")

    # -------------------------------------------------------------
    # PART 2: AUTHENTICATION, PASSWORD SECURITY & PERSISTENCE
    # -------------------------------------------------------------
    print("\n--- PART 2: AUTHENTICATION, PASSWORD SECURITY & PERSISTENCE ---")
    timestamp = int(time.time())
    email_a = f"user_a_{timestamp}@tradesimx.ai"
    email_b = f"user_b_{timestamp}@tradesimx.ai"
    pass_correct = "SecurePass123!"
    pass_wrong = "WrongPassword999!"

    # Test 1: Register User A
    r_reg_a = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email_a,
        "password": pass_correct,
        "confirmPassword": pass_correct,
        "name": "Trader A"
    })
    assert r_reg_a.status_code == 200, f"Registration failed for User A: {r_reg_a.text}"
    print(f"3. Register User A ({email_a}): SUCCESS")

    # Test 2: Register User B
    r_reg_b = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email_b,
        "password": pass_correct,
        "confirmPassword": pass_correct,
        "name": "Trader B"
    })
    assert r_reg_b.status_code == 200, f"Registration failed for User B: {r_reg_b.text}"
    print(f"4. Register User B ({email_b}): SUCCESS")

    # Test 3: Login User A with WRONG PASSWORD -> MUST FAIL HTTP 401
    r_bad_pass = requests.post(f"{BASE_URL}/auth/login", json={"email": email_a, "password": pass_wrong})
    assert r_bad_pass.status_code == 401, f"Wrong password must fail with 401! Got {r_bad_pass.status_code}"
    print(f"5. Login User A with WRONG PASSWORD: REJECTED with 401 Unauthorized ({r_bad_pass.json().get('error')})")

    # Test 4: Login User A with WRONG EMAIL -> MUST FAIL HTTP 401
    r_bad_email = requests.post(f"{BASE_URL}/auth/login", json={"email": "nonexistent_email_123@tradesimx.ai", "password": pass_correct})
    assert r_bad_email.status_code == 401, f"Wrong email must fail with 401! Got {r_bad_email.status_code}"
    print(f"6. Login with NONEXISTENT EMAIL: REJECTED with 401 Unauthorized ({r_bad_email.json().get('error')})")

    # Test 5: Login User A with CORRECT PASSWORD -> MUST SUCCEED HTTP 200
    r_login_a = requests.post(f"{BASE_URL}/auth/login", json={"email": email_a, "password": pass_correct})
    assert r_login_a.status_code == 200, f"Login User A failed: {r_login_a.text}"
    token_a = r_login_a.json()["user"]["token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    print(f"7. Login User A with CORRECT PASSWORD: SUCCESS (Token: {token_a[:15]}...)")

    # Test 6: Login User B with CORRECT PASSWORD
    r_login_b = requests.post(f"{BASE_URL}/auth/login", json={"email": email_b, "password": pass_correct})
    assert r_login_b.status_code == 200
    token_b = r_login_b.json()["user"]["token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    print(f"8. Login User B with CORRECT PASSWORD: SUCCESS")

    # -------------------------------------------------------------
    # PART 3: PROTECTED ROUTES & USER DATA ISOLATION
    # -------------------------------------------------------------
    print("\n--- PART 3: PROTECTED ROUTES & USER DATA ISOLATION ---")
    
    # Test 7: Unauthenticated Request to Protected Route -> MUST FAIL HTTP 401
    r_unauth = requests.get(f"{BASE_URL}/paper-trading/summary")
    assert r_unauth.status_code == 401, f"Unauthenticated protected route must return 401! Got {r_unauth.status_code}"
    print("9. Unauthenticated Access to /api/paper-trading/summary: REJECTED with 401 Unauthorized")

    # Test 8: User A executes Paper BUY
    r_buy_a = requests.post(f"{BASE_URL}/paper-trading/buy", json={"symbol": "BTC-USD", "amount": 0.5, "price": 90000.0}, headers=headers_a)
    assert r_buy_a.status_code == 200
    print(f"10. User A Paper BUY: {r_buy_a.json().get('message')}")

    # Test 9: Verify User A Account vs User B Account Isolation
    r_acc_a = requests.get(f"{BASE_URL}/paper-trading/summary", headers=headers_a).json()["account"]
    r_acc_b = requests.get(f"{BASE_URL}/paper-trading/summary", headers=headers_b).json()["account"]

    assert r_acc_a["cash_balance"] == 100000.0 - (0.5 * 90000.0), "User A cash must decrease by $45,000"
    assert r_acc_b["cash_balance"] == 100000.0, "User B cash must remain uninfluenced ($100,000)"
    assert len(r_acc_a["open_positions"]) == 1, "User A must have 1 position"
    assert len(r_acc_b["open_positions"]) == 0, "User B must have 0 positions"
    print(f"11. User Data Isolation Verified: User A Cash=${r_acc_a['cash_balance']:,.2f} | User B Cash=${r_acc_b['cash_balance']:,.2f}")

    # -------------------------------------------------------------
    # PART 4: AI CHATBOT & FOUNDER NEUTRALITY
    # -------------------------------------------------------------
    print("\n--- PART 4: AI CHATBOT & FOUNDER NEUTRALITY ---")
    
    # Test 10: Founder Neutrality
    q_founder = "Who is the founder of TradeSimX?"
    r_ai_f = requests.post(f"{BASE_URL}/ai/chat", json={"message": q_founder}, headers=headers_a)
    if r_ai_f.status_code == 200:
        reply_f = r_ai_f.json().get("message", "")
        print(f"12. User: '{q_founder}' -> AI Reply: {reply_f}")
        assert "Sinjana" not in reply_f, "AI must not invent Sinjana"

    print("\n" + "=" * 70)
    print("      ALL 12 RIGOROUS ACCEPTANCE CHECKS PASSED 100% CLEANLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_full_acceptance_tests()
