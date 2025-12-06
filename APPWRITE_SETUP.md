# Appwrite Setup Instructions

To make the authentication work, you need to configure your Appwrite project as follows:

## 1. Auth Settings
1.  Go to your Appwrite Console > **Auth**.
2.  **Enable Email/Password**: In the "Settings" tab, ensure **Email/Password** is enabled.
3.  **Enable Google OAuth**:
    -   In the "Settings" tab, find **Google**.
    -   Enable it.
    -   You will need to paste your **App ID** (Client ID) and **App Secret** (Client Secret) from Google Cloud Console.
    -   **Important**: Add the "URI" shown in Appwrite (e.g., `https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/...`) to your Google Cloud Console "Authorized redirect URIs".

## 2. Database Collections
Ensure your `users` collection exists in the Database with ID defined in `.env.local` (variable `NEXT_PUBLIC_APPWRITE_DATABASE_ID`).

**Collection ID**: `users` (or allow "users" to be the ID if you created it manually).
**Attributes**:
-   `clerkId` (String, size 255) - *Legacy ID for migration safety, optional for new users*
-   `name` (String, size 255)
-   `email` (String, size 255)
-   `avatar` (String, size 1000, nullable)

## 3. Environment Variables
Ensure your `.env.local` has the following (you likely already have them):

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
```

## 4. Testing
1.  Restart your dev server (`npm run dev`).
2.  Go to `/signup` to create an account.
3.  Check both the **Auth > Users** section AND your **Database > users** collection to see the new user.
