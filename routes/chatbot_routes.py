import os
import requests
from flask import Blueprint, request, jsonify, render_template

chatbot_bp = Blueprint('chatbot', __name__)

# In-memory store for messages. In production, use persistent storage.
MESSAGES = []

@chatbot_bp.route('/', methods=['GET'])
def chatbot_home():
    """Render simple chatbot page."""
    return render_template('chatbot.html')

@chatbot_bp.route('/message', methods=['POST'])
def handle_message():
    """Receive a message from the user and forward to Microsoft Teams."""
    data = request.get_json() or {}
    text = data.get('text', '').strip()
    user = data.get('user', 'User')
    if not text:
        return jsonify({'success': False, 'message': 'Message text required'}), 400

    MESSAGES.append({'sender': user, 'text': text})

    webhook_url = os.getenv('TEAMS_WEBHOOK_URL')
    if webhook_url:
        payload = {'text': f"{user}: {text}"}
        try:
            requests.post(webhook_url, json=payload, timeout=5)
        except Exception:
            # If Teams webhook fails, still return success to user
            pass

    return jsonify({'success': True})

@chatbot_bp.route('/teams', methods=['POST'])
def teams_webhook():
    """Endpoint for Microsoft Teams outgoing webhook to post replies."""
    data = request.json or {}
    text = data.get('text', '').strip()
    if text:
        MESSAGES.append({'sender': 'Developer', 'text': text})
    # Teams expects a JSON response describing the message that will appear in the channel
    return jsonify({'type': 'message', 'text': 'Message received'})

@chatbot_bp.route('/messages', methods=['GET'])
def get_messages():
    """Return all chat messages."""
    return jsonify(MESSAGES)
