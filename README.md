# NewsTagging

## Chatbot with Microsoft Teams

This project now includes a real-time chatbot interface powered by Socket.IO
that forwards user messages to a Microsoft Teams channel. Developers can reply
from Teams and their responses will instantly appear in the chatbot UI.

### Configuration

1. Create an **Incoming Webhook** in Microsoft Teams and copy the provided
   URL.
2. Optionally create an **Outgoing Webhook** in Teams pointing to
   `/chatbot/teams` on this application to send developer replies back to the
   chatbot.
3. Set the environment variable `TEAMS_WEBHOOK_URL` with the incoming webhook
   URL.

### Usage

Start the Flask application and visit `/chatbot` to interact with the chat
interface.
