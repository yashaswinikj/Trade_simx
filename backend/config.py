import os
from dotenv import load_dotenv

# Ensure .env is explicitly loaded from backend directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=env_path)

class Config:
    PORT = int(os.getenv("PORT", 5000))
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/tradesimx")
    
    # Central AI Configurations
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
    GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b").strip()
    GROQ_TEMPERATURE = float(os.getenv("GROQ_TEMPERATURE", "0.7"))
    GROQ_MAX_TOKENS = int(os.getenv("GROQ_MAX_TOKENS", "1200"))
    
    # Administrator Configuration
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "sinchanak2005@gmail.com").strip().lower()
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "sinchu").strip()

    # SMTP Configuration
    SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME", "").strip()
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()

    DEFAULT_SYMBOL = os.getenv("DEFAULT_SYMBOL", "BTC-USD")
    BASE_DIR = BASE_DIR
    DATA_DIR = os.path.join(BASE_DIR, "data")
    REPORTS_DIR = os.path.join(BASE_DIR, "reports")

os.makedirs(Config.DATA_DIR, exist_ok=True)
os.makedirs(Config.REPORTS_DIR, exist_ok=True)
