# Google OAuth Setup for Supabase

## Step-by-Step Guide

### 1. Create Google OAuth Credentials

1. **Go to Google Cloud Console:**
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Sign in with your Google account

2. **Create a New Project (or select existing):**
   - Click "Select a project" → "New Project"
   - Name it "PH-DVault" (or any name)
   - Click "Create"

3. **Enable Google+ API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - If prompted, configure OAuth consent screen first:
     - User Type: External
     - App name: PH-DVault
     - User support email: your email
     - Developer contact: your email
     - Click "Save and Continue"
     - Scopes: Just click "Save and Continue" (use default)
     - Test users: Add your email, click "Save and Continue"
   - Application type: **Web application**
   - Name: PH-DVault Web
   - **Authorized JavaScript origins:**
     - Add: `https://twdewozswgopjpwjrxmk.supabase.co`
   - **Authorized redirect URIs:**
     - Add: `https://twdewozswgopjpwjrxmk.supabase.co/auth/v1/callback`
   - Click "Create"
   - **Copy the Client ID and Client Secret** (you'll need these)

### 2. Configure in Supabase

1. **Go to Supabase Dashboard:**
   - Click "Authentication" in left sidebar
   - Click "Providers" (or "Providers" tab)

2. **Enable Google Provider:**
   - Find "Google" in the list
   - Toggle it ON
   - Enter:
     - **Client ID (for OAuth):** Paste your Google Client ID
     - **Client Secret (for OAuth):** Paste your Google Client Secret
   - Click "Save"

### 3. Test It

- Go to your app's Sign In page
- Click "Continue With Google"
- It should redirect to Google login

---

**Note:** For local development, you may also need to add:
- `http://localhost:5173` to Authorized JavaScript origins
- `http://localhost:5173/auth/v1/callback` to Authorized redirect URIs
