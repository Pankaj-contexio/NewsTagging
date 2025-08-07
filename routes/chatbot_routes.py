import os
import requests
from flask import Blueprint, request, jsonify, render_template
from flask_socketio import SocketIO, emit

chatbot_bp = Blueprint('chatbot', __name__)

# Socket.IO instance will be initialized with the Flask app in main.py
socketio = SocketIO()

# In-memory store for messages. In production, use persistent storage.
MESSAGES = []

@chatbot_bp.route('/', methods=['GET'])
def chatbot_home():
    """Render simple chatbot page."""
    return render_template('chatbot.html')

@socketio.on('send_message')
def handle_socket_message(data):
    """Receive a message via Socket.IO and forward to Microsoft Teams."""
    data = data or {}
    text = (data.get('text') or '').strip()
    user = data.get('user', 'User')
    if not text:
        return

    MESSAGES.append({'sender': user, 'text': text})

    webhook_url = os.getenv('TEAMS_WEBHOOK_URL')
    if webhook_url:
        payload = {'text': f"{user}: {text}"}
        try:
            requests.post(webhook_url, json=payload, timeout=5)
        except Exception:
            pass

    emit('new_message', {'sender': user, 'text': text}, broadcast=True)

@chatbot_bp.route('/teams', methods=['POST'])
def teams_webhook():
    """Endpoint for Microsoft Teams outgoing webhook to post replies."""

    # Teams may send JSON or form-encoded data depending on configuration. Try both.
    data = request.get_json(silent=True) or request.form.to_dict() or {}

    text = data.get('text', '').strip()
    if text:
        msg = {'sender': 'Developer', 'text': text}
        MESSAGES.append(msg)
        socketio.emit('new_message', msg, broadcast=True)
    # Teams expects a JSON response describing the message that will appear in the channel
    return jsonify({'type': 'message', 'text': 'Message received'})

@chatbot_bp.route('/messages', methods=['GET'])
def get_messages():
    """Return all chat messages."""
    return jsonify(MESSAGES)


@socketio.on('connect')
def handle_connect():
    """Send existing messages to newly connected clients."""
    emit('init_messages', MESSAGES)
