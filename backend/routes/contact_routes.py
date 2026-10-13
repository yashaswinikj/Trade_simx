import re
import time
import uuid
import smtplib
import threading
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Blueprint, jsonify, request

from services.auth_service import auth_service
from database.mongo_client import db_manager
from config import Config

logger = logging.getLogger("TradeSimX.ContactRoutes")

contact_bp = Blueprint("contact", __name__, url_prefix="/api")

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"

def send_smtp_email(to_email, subject, body_text):
    """Sends email via SMTP server if configured in backend/.env."""
    if not Config.SMTP_HOST or not Config.SMTP_USERNAME or not Config.SMTP_PASSWORD:
        logger.info(f"SMTP is not configured. Skipping live email dispatch to {to_email}.")
        return False

    try:
        msg = MIMEMultipart()
        msg["From"] = Config.SMTP_USERNAME
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body_text, "plain"))

        server = smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=10)
        server.starttls()
        server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"Successfully delivered email via SMTP to {to_email}.")
        return True
    except Exception as e:
        logger.error(f"Failed to deliver SMTP email to {to_email}: {e}")
        return False

# ==============================================================================
# PUBLIC CONTACT US ENDPOINT
# ==============================================================================

@contact_bp.route("/contact", methods=["POST"])
def submit_contact_message():
    """Public route for users/guests to submit Contact Us inquiries."""
    try:
        data = request.get_json() or {}
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        subject = (data.get("subject") or "").strip()
        message = (data.get("message") or "").strip()

        if not name or not email or not subject or not message:
            return jsonify({"success": False, "error": "Please complete all required fields."}), 400

        if not re.match(EMAIL_REGEX, email):
            return jsonify({"success": False, "error": "Please enter a valid email address."}), 400

        # Check if user is logged in
        user = auth_service.get_user_from_request(request)
        user_id = user["id"] if user else None

        msg_id = f"msg_{str(uuid.uuid4())[:8]}"
        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ")

        doc = {
            "id": msg_id,
            "user_id": user_id,
            "name": name,
            "email": email,
            "subject": subject,
            "message": message,
            "status": "new",
            "created_at": timestamp,
            "updated_at": timestamp,
            "admin_reply": None,
            "replied_at": None
        }

        contact_coll = db_manager.get_collection("contact_messages")
        contact_coll.insert_one(doc)

        # Notify Admin via Email in background thread if configured
        if Config.ADMIN_EMAIL:
            admin_subject = f"New TradeSimX Contact Message: {subject}"
            admin_body = f"New message received on TradeSimX:\n\nName: {name}\nEmail: {email}\nSubject: {subject}\n\nMessage:\n{message}\n\nPlease log into the Admin Dashboard to respond."
            threading.Thread(target=send_smtp_email, args=(Config.ADMIN_EMAIL, admin_subject, admin_body), daemon=True).start()

        return jsonify({
            "success": True,
            "message": "Message sent successfully! Our team will review your message and get back to you.",
            "message_id": msg_id
        })
    except Exception as e:
        logger.error(f"Error submitting contact message: {e}")
        return jsonify({"success": False, "error": "Unable to send your message right now. Please try again."}), 500

# ==============================================================================
# PROTECTED ADMIN ENDPOINTS (/api/admin/*)
# ==============================================================================

def _require_admin():
    admin = auth_service.get_admin_from_request(request)
    if not admin:
        raise PermissionError("Access denied. Administrator privileges required.")
    return admin

@contact_bp.route("/admin/login", methods=["POST"])
def admin_login():
    """Dedicated endpoint for administrator login."""
    try:
        data = request.get_json() or {}
        email = data.get("email", "")
        password = data.get("password", "")

        admin_data = auth_service.login_admin(email, password)
        return jsonify({
            "success": True,
            "message": "Administrator authenticated successfully.",
            "user": admin_data
        })
    except PermissionError as pe:
        return jsonify({"success": False, "error": str(pe)}), 401
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 401
    except Exception as e:
        logger.error(f"Admin login error: {e}")
        return jsonify({"success": False, "error": "Invalid administrator credentials."}), 401

@contact_bp.route("/admin/dashboard/stats", methods=["GET"])
def get_admin_dashboard_stats():
    """Returns real database metrics for the Admin Dashboard."""
    try:
        _require_admin()
        contact_coll = db_manager.get_collection("contact_messages")
        users_coll = db_manager.get_collection("users")

        all_msgs = contact_coll.find_all()
        all_users = users_coll.find_all()

        total_messages = len(all_msgs)
        new_messages = sum(1 for m in all_msgs if m.get("status") == "new")
        read_messages = sum(1 for m in all_msgs if m.get("status") == "read")
        replied_messages = sum(1 for m in all_msgs if m.get("status") == "replied")
        registered_users = len(all_users)

        return jsonify({
            "success": True,
            "stats": {
                "total_messages": total_messages,
                "new_messages": new_messages,
                "read_messages": read_messages,
                "replied_messages": replied_messages,
                "registered_users": registered_users
            }
        })
    except PermissionError as pe:
        return jsonify({"success": False, "error": str(pe)}), 403
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@contact_bp.route("/admin/messages", methods=["GET"])
def get_admin_messages():
    """Lists, searches, filters, and sorts contact messages for Admin."""
    try:
        _require_admin()
        status_filter = request.args.get("status", "all").lower()
        search_query = (request.args.get("search") or "").strip().lower()
        sort_order = request.args.get("sort", "newest").lower()

        contact_coll = db_manager.get_collection("contact_messages")
        messages = contact_coll.find_all()

        # Filtering
        if status_filter != "all":
            messages = [m for m in messages if m.get("status") == status_filter]

        if search_query:
            messages = [
                m for m in messages
                if search_query in m.get("name", "").lower()
                or search_query in m.get("email", "").lower()
                or search_query in m.get("subject", "").lower()
                or search_query in m.get("message", "").lower()
            ]

        # Sorting
        messages.sort(key=lambda x: x.get("created_at", ""), reverse=(sort_order == "newest"))

        return jsonify({
            "success": True,
            "count": len(messages),
            "messages": messages
        })
    except PermissionError as pe:
        return jsonify({"success": False, "error": str(pe)}), 403
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@contact_bp.route("/admin/messages/<msg_id>", methods=["GET"])
def get_admin_message_detail(msg_id):
    """Fetches message details and updates status from new -> read."""
    try:
        _require_admin()
        contact_coll = db_manager.get_collection("contact_messages")
        msg = contact_coll.find_one({"id": msg_id})

        if not msg:
            return jsonify({"success": False, "error": "Message not found."}), 404

        # Automatically mark new message as read upon opening
        if msg.get("status") == "new":
            updated_at = time.strftime("%Y-%m-%dT%H:%M:%SZ")
            contact_coll.update_one({"id": msg_id}, {"$set": {"status": "read", "updated_at": updated_at}})
            msg["status"] = "read"
            msg["updated_at"] = updated_at

        return jsonify({"success": True, "message": msg})
    except PermissionError as pe:
        return jsonify({"success": False, "error": str(pe)}), 403
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@contact_bp.route("/admin/messages/<msg_id>/reply", methods=["POST"])
def reply_to_contact_message(msg_id):
    """Saves Admin reply in MongoDB and sends email to user if SMTP is configured."""
    try:
        _require_admin()
        data = request.get_json() or {}
        reply_text = (data.get("reply") or data.get("reply_message") or "").strip()

        if not reply_text:
            return jsonify({"success": False, "error": "Reply message content cannot be empty."}), 400

        contact_coll = db_manager.get_collection("contact_messages")
        msg = contact_coll.find_one({"id": msg_id})

        if not msg:
            return jsonify({"success": False, "error": "Message not found."}), 404

        replied_at = time.strftime("%Y-%m-%dT%H:%M:%SZ")
        contact_coll.update_one(
            {"id": msg_id},
            {"$set": {"status": "replied", "admin_reply": reply_text, "replied_at": replied_at, "updated_at": replied_at}}
        )

        # Attempt SMTP email delivery to user
        email_sent = False
        if msg.get("email"):
            email_subject = f"Re: {msg.get('subject', 'Your TradeSimX Query')}"
            email_body = f"Hello {msg.get('name', 'Trader')},\n\nThank you for contacting TradeSimX AI.\n\nOur team's response:\n{reply_text}\n\nOriginal Message:\n\"{msg.get('message')}\"\n\nBest regards,\nTradeSimX Support Team"
            email_sent = send_smtp_email(msg.get("email"), email_subject, email_body)

        status_msg = "Reply sent and delivered to user email successfully." if email_sent else "Reply saved successfully. Email delivery is not configured."

        return jsonify({
            "success": True,
            "message": status_msg,
            "email_delivered": email_sent,
            "replied_at": replied_at
        })
    except PermissionError as pe:
        return jsonify({"success": False, "error": str(pe)}), 403
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@contact_bp.route("/admin/messages/<msg_id>", methods=["DELETE"])
def delete_contact_message(msg_id):
    """Deletes a contact message document from MongoDB."""
    try:
        _require_admin()
        contact_coll = db_manager.get_collection("contact_messages")
        deleted = contact_coll.delete_one({"id": msg_id})

        if deleted:
            return jsonify({"success": True, "message": "Contact message deleted successfully."})
        return jsonify({"success": False, "error": "Message not found or already deleted."}), 404
    except PermissionError as pe:
        return jsonify({"success": False, "error": str(pe)}), 403
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@contact_bp.route("/admin/users", methods=["GET"])
def get_admin_users():
    """Lists registered normal users for Administrator without revealing password hashes."""
    try:
        _require_admin()
        users_coll = db_manager.get_collection("users")
        all_users = users_coll.find_all()

        user_list = [
            {
                "id": u.get("id"),
                "name": u.get("name"),
                "email": u.get("email"),
                "role": u.get("role", "user"),
                "created_at": u.get("created_at")
            }
            for u in all_users
        ]

        return jsonify({
            "success": True,
            "count": len(user_list),
            "users": user_list
        })
    except PermissionError as pe:
        return jsonify({"success": False, "error": str(pe)}), 403
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
