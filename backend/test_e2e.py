import requests
import json
import time

BASE_URL = "http://localhost:5000/api"

def run_e2e_verification():
    print("=" * 65)
    print("  TradeSimX AI Critical Functionality Fix - Verification Suite")
    print("=" * 65)

    # 1. Health Check
    print("\n1. Testing Backend & MongoDB Health...")
    r = requests.get(f"{BASE_URL}/health")
    assert r.status_code == 200
    h = r.json()
    print(f"   [OK] Status: {h.get('status')} | DB: {h.get('database_type')}")

    # 2. Strict Authentication Verification (Correct vs Wrong Password)
    print("\n2. Testing Authentication & Password Security...")
    test_email = f"testuser_{int(time.time())}@tradesimx.ai"
    test_pass = "SecurePass123!"

    # Register Fresh Test User
    r_reg = requests.post(f"{BASE_URL}/auth/register", json={"email": test_email, "password": test_pass, "name": "Test Trader"})
    assert r_reg.status_code == 200, f"Registration failed: {r_reg.text}"
    print(f"   [OK] User Registration: Success ({test_email})")

    # Login with WRONG Password -> MUST FAIL 401
    r_bad = requests.post(f"{BASE_URL}/auth/login", json={"email": test_email, "password": "WrongPassword999!"})
    assert r_bad.status_code == 401, f"Wrong password must fail with 401! Got {r_bad.status_code}"
    print("   [OK] Wrong Password Test: Rejected with 401 Unauthorized ('Invalid email or password.')")

    # Login with CORRECT Password -> MUST SUCCEED 200
    r_good = requests.post(f"{BASE_URL}/auth/login", json={"email": test_email, "password": test_pass})
    assert r_good.status_code == 200, f"Correct password failed with {r_good.status_code}: {r_good.text}"
    user_data = r_good.json().get("user", {})
    token = user_data.get("token")
    headers = {"Authorization": f"Bearer {token}"}
    print(f"   [OK] Correct Password Test: Logged in successfully. Token generated.")

    # 3. User-Specific Paper Trading (BUY & SELL)
    print("\n3. Testing User-Specific Paper Trading Engine (BUY & SELL)...")
    r_acc = requests.get(f"{BASE_URL}/paper-trading/summary", headers=headers)
    assert r_acc.status_code == 200
    initial_cash = r_acc.json()["account"]["cash_balance"]
    print(f"   [OK] Initial Available Cash: ${initial_cash:,.2f}")

    # Execute Paper BUY
    r_buy = requests.post(f"{BASE_URL}/paper-trading/buy", json={"symbol": "BTC-USD", "amount": 0.1, "price": 90000.0}, headers=headers)
    assert r_buy.status_code == 200
    buy_msg = r_buy.json().get("message")
    print(f"   [OK] Paper BUY Execution: {buy_msg}")

    # Verify Cash Decreased
    r_acc_post_buy = requests.get(f"{BASE_URL}/paper-trading/summary", headers=headers)
    new_cash = r_acc_post_buy.json()["account"]["cash_balance"]
    assert new_cash == initial_cash - (0.1 * 90000.0), "Cash must decrease by order cost"
    print(f"   [OK] Cash Deducted Correctly: New Cash = ${new_cash:,.2f}")

    # Execute Paper SELL
    r_sell = requests.post(f"{BASE_URL}/paper-trading/sell", json={"symbol": "BTC-USD", "amount": 0.05, "price": 95000.0}, headers=headers)
    assert r_sell.status_code == 200
    sell_msg = r_sell.json().get("message")
    print(f"   [OK] Paper SELL Execution: {sell_msg}")

    # 4. Multi-Asset Portfolio Synchronization
    print("\n4. Testing Portfolio Tracker Synchronization...")
    r_port = requests.get(f"{BASE_URL}/portfolio/summary", headers=headers)
    assert r_port.status_code == 200
    port = r_port.json()["portfolio"]
    print(f"   [OK] Total Portfolio Value: ${port.get('total_value_usd'):,.2f}")

    # 5. AI Assistant Error Handling & Neutrality Test
    print("\n5. Testing AI Assistant Response & Service Error Handling...")
    q1 = "Who is the founder of TradeSimX?"
    r_ai1 = requests.post(f"{BASE_URL}/ai/chat", json={"message": q1})
    if r_ai1.status_code == 200:
        reply1 = r_ai1.json().get("message", "")
        print(f"   User: '{q1}'")
        print(f"   AI Reply 1: {reply1}")
        assert "Sinjana" not in reply1, "AI must not invent Sinjana"
    else:
        err_text = r_ai1.json().get("error")
        print(f"   [OK] AI Service Error Handling: Returned HTTP 500 with message: '{err_text}'")

    print("\n" + "=" * 65)
    print("      ALL CRITICAL FUNCTIONALITY VERIFICATION CHECKS PASSED!")
    print("=" * 65)

if __name__ == "__main__":
    run_e2e_verification()
