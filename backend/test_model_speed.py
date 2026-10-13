import os
from dotenv import load_dotenv
from groq import Groq

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(env_path)

api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

models_to_test = ["openai/gpt-oss-20b", "qwen/qwen3.6-27b", "allam-2-7b"]

for m in models_to_test:
    try:
        res = client.chat.completions.create(
            model=m,
            messages=[{"role": "user", "content": "Explain machine learning in 2 sentences."}],
            max_tokens=100
        )
        print(f"SUCCESS '{m}': {res.choices[0].message.content.strip()[:100]}...\n")
    except Exception as e:
        print(f"FAILED '{m}': {e}\n")
