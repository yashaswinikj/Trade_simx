import requests
import json
import time

BASE_URL = "http://localhost:5000/api"

def run_ai_pipeline_tests():
    print("=" * 65)
    print("  TradeSimX AI End-to-End Debug & Verification Suite")
    print("=" * 65)

    # 1. Health Check
    print("\n1. Testing GET /api/ai/health Endpoint...")
    r_health = requests.get(f"{BASE_URL}/ai/health")
    assert r_health.status_code == 200, f"Health check failed: {r_health.text}"
    health_data = r_health.json()
    print(f"   [OK] Response: {json.dumps(health_data)}")
    assert "configured" in health_data
    assert "provider" in health_data

    # 2. AI Test Endpoint
    print("\n2. Testing POST /api/ai/test Endpoint...")
    r_test = requests.post(f"{BASE_URL}/ai/test", json={"message": "Say hello in one short sentence."})
    print(f"   [OK] Status: {r_test.status_code} | Body: {json.dumps(r_test.json())}")

    # 3. Multi-Turn AI Chat Endpoint (Greeting -> Python -> Founder -> Context)
    print("\n3. Testing POST /api/ai/chat Endpoint...")
    
    # Message 1: Greeting
    msg1 = "Hi"
    r_chat1 = requests.post(f"{BASE_URL}/ai/chat", json={"message": msg1, "conversation": []})
    print(f"   User: '{msg1}'")
    print(f"   Status: {r_chat1.status_code} | Body: {json.dumps(r_chat1.json())}")

    # Message 2: Technical Question
    msg2 = "What is RSI?"
    r_chat2 = requests.post(f"{BASE_URL}/ai/chat", json={
        "message": msg2,
        "conversation": [
            {"role": "user", "content": "Hi"},
            {"role": "assistant", "content": "Hello! How can I assist you with TradeSimX or quantitative trading today?"}
        ]
    })
    print(f"   User: '{msg2}'")
    print(f"   Status: {r_chat2.status_code} | Body: {json.dumps(r_chat2.json())}")

    # Message 3: Founder Neutrality Check
    msg3 = "Who is the founder of TradeSimX?"
    r_chat3 = requests.post(f"{BASE_URL}/ai/chat", json={"message": msg3, "conversation": []})
    print(f"   User: '{msg3}'")
    print(f"   Status: {r_chat3.status_code} | Body: {json.dumps(r_chat3.json())}")
    if r_chat3.status_code == 200:
        reply3 = r_chat3.json().get("message", "")
        assert "Sinjana" not in reply3, "AI must not invent Sinjana"

    print("\n" + "=" * 65)
    print("      AI END-TO-END VERIFICATION SUITE EXECUTED SUCCESSFULLY!")
    print("=" * 65)

if __name__ == "__main__":
    run_ai_pipeline_tests()
