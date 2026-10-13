import os
import sys
from werkzeug.security import generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, ".env")

def setup_admin(email, password):
    email = email.strip().lower()
    password = password.strip()
    if not email or not password:
        print("Error: Email and password must not be empty.")
        return

    password_hash = generate_password_hash(password)
    
    # Update or append in .env
    lines = []
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            lines = f.readlines()

    new_lines = []
    has_email = False
    has_hash = False

    for line in lines:
        if line.startswith("ADMIN_EMAIL="):
            new_lines.append(f"ADMIN_EMAIL={email}\n")
            has_email = True
        elif line.startswith("ADMIN_PASSWORD_HASH="):
            new_lines.append(f"ADMIN_PASSWORD_HASH={password_hash}\n")
            has_hash = True
        else:
            new_lines.append(line)

    if not has_email:
        new_lines.append(f"ADMIN_EMAIL={email}\n")
    if not has_hash:
        new_lines.append(f"ADMIN_PASSWORD_HASH={password_hash}\n")

    with open(env_path, "w") as f:
        f.writelines(new_lines)

    print(f"Successfully configured administrator credentials:")
    print(f"  ADMIN_EMAIL: {email}")
    print(f"  ADMIN_PASSWORD_HASH: [HASHED & STORED IN .env]")

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        setup_admin(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python setup_admin.py <admin_email> <admin_password>")
        print("Example: python setup_admin.py admin@tradesimx.ai AdminPass123!")
