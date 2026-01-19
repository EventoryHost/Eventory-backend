# Frontend Prompt: Display EM Profile in Anonymous Chat

**Objective:**
Replace the generic "Event Manager" header in the Anonymous Chat widget with the actual Event Manager's name when they join the chat, and make it clickable to show their profile.

**Backend Data:**
- The backend now automatically assigns the `em_id` to the `Chat` model when an admin sends the first message.
- The `Chat` object (fetched via `getAnonymousChatStatus` or similar) contains `em_id`.
- You may need to fetch the EM's profile details (name, image) using this `em_id`.

**Requirements:**

1.  **Fetch EM Details**:
    - When loading the chat, check if `chat.em_id` exists.
    - If it exists, fetch the EM's public profile (e.g., `GET /api/emadmin/profile/:em_id` or equivalent).

2.  **Update Chat Header**:
    - **Default**: "Event Manager" (Subheading: "Support Team")
    - **If EM Assigned**: Display the EM's **Name** (e.g., "Rahul Sharma").
    - **Subheading**: Keep "Support Team" or use their designation if available.

3.  **Clickable Profile**:
    - Make the header clickable.
    - On click, open a modal or navigate to a profile view showing:
        - Name
        - Profile Image
        - Experience / Bio (if available)

4.  **Real-time Update**:
    - If the `em_id` is updated mid-chat (e.g., via socket event or polling), the header should update dynamically.

**Note**: Ensure this only applies when a real human (EM) has joined. System messages should still be attributed to "System" or "Bot" as per the previous prompt.
