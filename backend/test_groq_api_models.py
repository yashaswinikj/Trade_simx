import os
from dotenv import load_dotenv
from groq import Groq

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(env_path)

api_key = os.getenv("GROQ_API_KEY")
print(f"Loaded GROQ_API_KEY: {'Configured (len=' + str(len(api_key)) + ')' if api_key else 'Missing'}")

client = Groq(api_key=api_key)

candidate_models = [
    "groq/compound",
    "groq/compound-mini",
    "qwen/qwen3.6-27b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "allam-2-7b",
    "llama-3.1-8b-instant",
    "llama3-70b-8192"
]

print("\n--- Testing Groq Model Candidates ---")
valid_models = []

for model_name in candidate_models:
    try:
        res = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": "Hello! Reply with 'OK' if working."}],
            max_tokens=20,
            temperature=0.7
        )
        ans = res.choices[0].message.content.strip()
        print(f"SUCCESS: Model '{model_name}' returned -> '{ans}'")
        valid_models.append(model_name)
    except Exception as err:
        print(f"FAILED: Model '{model_name}' -> {err}")

print(f"\nFinal Valid Active Models: {valid_models}")
