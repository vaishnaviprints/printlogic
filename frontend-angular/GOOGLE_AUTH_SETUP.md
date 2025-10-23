# Google OAuth Setup Guide

## Overview

I've replaced the third-party Google authentication with **Google Identity Services**, which is the modern, recommended approach by Google.

## Why Google Identity Services?

✅ **Official Google Solution** - Recommended by Google  
✅ **No Third-Party Dependencies** - Direct integration  
✅ **Better Security** - Following Google's latest security practices  
✅ **Modern API** - Uses the latest Google Sign-In standards  
✅ **Customizable** - Full control over button appearance  

## Setup Instructions

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure OAuth consent screen (if not done already)
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: **Vaishnavi Printers Web Client**
   - Authorized JavaScript origins: `http://localhost:4200` (for development)
   - Authorized redirect URIs: `http://localhost:4200`
7. Copy the **Client ID**

### Step 2: Update the Code

Replace `YOUR_GOOGLE_CLIENT_ID` in the following file:

**File:** `src/app/pages/customer-login-page/customer-login-page.component.ts`

```typescript
initializeGoogleSignIn(): void {
  google.accounts.id.initialize({
    client_id: 'YOUR_GOOGLE_CLIENT_ID', // ← Replace this
    callback: this.handleGoogleResponse.bind(this)
  });
  // ...
}
```

### Step 3: Update Backend API

Your backend needs to handle the Google credential token. Update your backend endpoint:

**Endpoint:** `POST /api/auth/google`

```python
# Backend should verify the Google credential token
# and return user data + access token
```

### Step 4: Test

1. Run the Angular app: `npm start`
2. Navigate to `/login`
3. Click the Google Sign-In button
4. Select your Google account
5. Verify the login flow

## Alternative: Firebase Authentication

If you prefer using Firebase, here's an alternative approach:

### Option A: Firebase Authentication

```bash
npm install firebase @angular/fire
```

```typescript
// Initialize Firebase
import { AngularFireAuth } from '@angular/fire/auth';

async signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await this.afAuth.signInWithPopup(provider);
  // Handle result
}
```

## Current Implementation

✅ **Google Identity Services** - Currently implemented  
✅ **Script Loading** - Auto-loads Google SDK  
✅ **Button Rendering** - Customizable button  
✅ **Credential Handling** - Sends to backend API  
✅ **Error Handling** - User-friendly error messages  

## Backend Integration

Your backend should:

1. Receive the credential from frontend
2. Verify the Google token
3. Extract user information
4. Create or update user account
5. Generate JWT access token
6. Return user data + token

Example backend endpoint:

```python
@app.post("/api/auth/google")
async def google_login(credential: dict):
    # Verify Google credential
    # Create/get user
    # Return access token
    return {"access_token": "...", "user": {...}}
```

## Troubleshooting

### Button Not Showing
- Check browser console for errors
- Verify Google Client ID is correct
- Ensure script loads successfully

### Login Fails
- Verify backend endpoint is working
- Check network tab for API calls
- Ensure backend verifies Google token correctly

### CORS Issues
- Add your domain to authorized origins in Google Cloud Console
- Update backend CORS configuration

## Security Notes

- Never expose your Google Client Secret in frontend
- Always verify tokens on backend
- Use HTTPS in production
- Implement proper error handling
- Add rate limiting on backend

## Support

For more information:
- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)
