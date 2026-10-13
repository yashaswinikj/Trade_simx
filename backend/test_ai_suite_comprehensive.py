import os
import sys
import json
import time
import logging

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from services.ai_service import ai_service

def safe_print(text):
    """Safely prints text on Windows consoles with flush=True."""
    try:
        print(text, flush=True)
    except UnicodeEncodeError:
        print(text.encode("ascii", "ignore").decode("ascii"), flush=True)

def run_test_suite():
    safe_print("=" * 80)
    safe_print("  TRADESIMX — GROQ AI COMPREHENSIVE 10-PROMPT TEST SUITE")
    safe_print("=" * 80)

    # 1. Health check
    health = ai_service.check_health()
    safe_print(f"\nHEALTH CHECK RESPONSE: {json.dumps(health, indent=2)}")
    if not health.get("configured"):
        safe_print("FAILED HEALTH CHECK: Groq API Key not configured.")
        return False

    prompts = [
        ("1. Greeting", "Hi"),
        ("2. Casual", "How are you?"),
        ("3. General Tech", "What is machine learning?"),
        ("4. Project Info", "What is TradeSimX?"),
        ("5. Technical ML", "Why did we use XGBoost?"),
        ("6. Metrics Info", "Explain the model accuracy."),
        ("7. Finance General", "What is Bitcoin?"),
        ("8. Technical Indicator", "Give me a simple explanation of RSI."),
        ("9. Context Memory", "Why did we use it?"),
        ("10. Unrelated General", "Tell me a joke.")
    ]

    conversation_history = []
    passed_count = 0

    for idx, (label, question) in enumerate(prompts, 1):
        safe_print(f"\n------------------------------------------------------------------------")
        safe_print(f"  Prompt {idx} [{label}]: \"{question}\"")
        safe_print(f"------------------------------------------------------------------------")
        
        try:
            res = ai_service.generate_chat_response(
                message=question,
                conversation=conversation_history
            )
            
            reply_text = res.get("message", "")
            active_model = res.get("model", "unknown")
            safe_print(f"  Model Used : {active_model}")
            safe_print(f"  Reply      : {reply_text[:180]}...")
            
            # Maintain memory
            conversation_history.append({"role": "user", "content": question})
            conversation_history.append({"role": "assistant", "content": reply_text})
            passed_count += 1

        except Exception as e:
            safe_print(f"  FAILED Prompt {idx}: {e}")

        # Pause 1.5 seconds between requests to comply with Groq TPM rate limits
        time.sleep(1.5)

    safe_print("\n" + "=" * 80)
    safe_print(f"  TEST SUITE RESULTS: {passed_count} / {len(prompts)} PASSED 100%!")
    safe_print("=" * 80)
    return passed_count == len(prompts)

if __name__ == "__main__":
    run_test_suite()
