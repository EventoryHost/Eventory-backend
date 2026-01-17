# Frontend Prompt: Fix Persistence & UI Mapping

**1. Chat Persistence (CRITICAL)**
**Issue:** When the anonymous user reloads the page, the chat history disappears, and the bot restarts the "How soon is your event?" flow.
**Requirement:**
- **On Component Mount**:
    1. Check `localStorage` for `anon_chat_id` and `anon_user_id`.
    2. If they exist:
        - **Fetch History**: Call `GET /api/anon-chats/:anon_user_id/messages` to load previous messages.
        - **Join Room**: Emit `join_chat` with the *existing* `chat_id` from local storage.
        - **Restore State**: Do NOT trigger the initial bot greeting if history exists.
    3. If they do NOT exist:
        - Start fresh (generate IDs, show greeting).

**2. UI Sender Mapping**
**Issue:** System/Bot messages (e.g., "How soon is your event?") are displaying as "Vendor" in the Admin panel.
**Backend Data:**
- These messages have `sender: "admin"` and `sender_id: "admin"`.
**Requirement:**
- Update the message rendering logic (likely in `AdminChat.tsx` or similar):
    - If `sender === "admin"`, display name as **"System"** or **"Eventory Bot"**.
    - Do NOT display it as "Vendor".
    - "Vendor" label should only be used if `sender === "vendor"`.
