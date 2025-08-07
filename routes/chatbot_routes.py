import os
import time
import requests
from flask import Blueprint, jsonify, render_template, request

chatbot_bp = Blueprint('chatbot', __name__)

# simple in-memory store for messages
MESSAGES = []


def post_to_teams(text, user="User"):
    """Send a message to Teams via an incoming webhook."""
    url = os.getenv('TEAMS_WEBHOOK_URL')
    if not url:
        return False
    payload = {"text": f"{user}: {text}"}
    try:
        requests.post(url, json=payload, timeout=5)
        return True
    except Exception:
        return False


def get_graph_token():
    """Obtain an access token for Microsoft Graph using client credentials."""
    tenant = os.getenv('GRAPH_TENANT_ID')
    client_id = os.getenv('GRAPH_CLIENT_ID')
    client_secret = os.getenv('GRAPH_CLIENT_SECRET')
    if not all([tenant, client_id, client_secret]):
        return None
    data = {
        'client_id': client_id,
        'client_secret': client_secret,
        'grant_type': 'client_credentials',
        'scope': 'https://graph.microsoft.com/.default'
    }
    token_url = f'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token'
    try:
        resp = requests.post(token_url, data=data, timeout=5)
        resp.raise_for_status()
        return resp.json().get('access_token')
    except Exception:
        return None


def fetch_channel_messages():
    """Fetch messages from a Teams channel via Microsoft Graph."""
    team_id = os.getenv('TEAM_ID')
    channel_id = os.getenv('CHANNEL_ID')
    token = get_graph_token()
    if not all([team_id, channel_id, token]):
        return []
    url = f'https://graph.microsoft.com/v1.0/teams/{team_id}/channels/{channel_id}/messages'
    headers = {'Authorization': f'Bearer {token}'}
    try:
        resp = requests.get(url, headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json().get('value', [])
        messages = []
        for item in data:
            sender = item.get('from', {}).get('user', {}).get('displayName', 'Teams')
            text = item.get('body', {}).get('content', '')
            messages.append({'sender': sender, 'text': text})
        return messages
    except Exception:
        return []


@chatbot_bp.route('/', methods=['GET'])
def chatbot_home():
    """Render the chatbot popup page."""
    return render_template('chatbot.html')


@chatbot_bp.route('/send', methods=['POST'])
def send_message():
    data = request.get_json(silent=True) or {}
    text = (data.get('text') or '').strip()
    user = data.get('user', 'User')
    if not text:
        return jsonify({'success': False, 'error': 'Empty message'}), 400
    MESSAGES.append({'sender': user, 'text': text})
    post_to_teams(text, user)
    return jsonify({'success': True})


@chatbot_bp.route('/poll', methods=['GET'])
def poll_messages():
    """Return messages from Teams."""
    messages = fetch_channel_messages()
    return jsonify(messages)
