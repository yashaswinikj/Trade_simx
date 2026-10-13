import requests
import json

BASE_URL = "http://localhost:5000/api"

prompts = [
    "Hi",
    "How are you?",
    "What is Python?",
    "What is machine learning?",
    "Explain RSI."
]

def test_prompts():
    print("=" * 70)
    print("  Testing Live Groq LLM End-to-End Chat Responses")
    print("=" * 70)
    
    conversation = []
    for p in prompts:
        print(f"\nUser: '{p}'")
        r = requests.post(f"{BASE_URL}/ai/chat", json={
            "message": p,
            "conversation": conversation
        })
        assert r.status_code == 200, f"Error for '{p}': {r.text}"
        data = r.json()
        reply = data.get("message")
        print(f"AI ({data.get('model')}): {reply}")
        conversation.append({"role": "user", "content": p})
        conversation.append({"role": "assistant", "content": reply})

    print("\n" + "=" * 70)
    print("      ALL REAL GROQ LLM CHAT PROMPTS SUCCEEDED 100%!")
    print("=" * 70)

if __name__ == "__main__":
    test_prompts()
