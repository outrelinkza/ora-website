# OAuth Consent Screen Demo Video Guide

## What Google Needs to See

Google requires a **video demonstration** that clearly shows the OAuth consent screen workflow. Your previous video likely showed app functionality but didn't show Google's consent screen appearing.

## Video Requirements

The video must show:
1. ✅ User initiating OAuth (clicking "Connect with Google" or visiting login page)
2. ✅ **Google's OAuth consent screen appearing** (this is critical!)
3. ✅ User signing in with a test account
4. ✅ User seeing the permission requests (Gmail read-only, email, profile)
5. ✅ User clicking "Allow" or "Continue"
6. ✅ Successful redirect to callback page

## How to Record the Video

### Option 1: Record from Web Browser (Easiest)

1. **Open your browser** (Chrome or Safari)
2. **Start screen recording** (macOS: Cmd+Shift+5, Windows: Windows+G)
3. **Navigate to**: `https://myora.co/login`
4. **Click the "Test OAuth Consent Screen" button**
5. **Wait for Google's consent screen to appear** - This is the critical part Google needs to see!
6. **Sign in** with a test account (2FA disabled)
7. **Show the permission screen** - Make sure the camera captures:
   - The app name "ORA"
   - The requested permissions (Gmail read-only, email, profile)
   - The "Allow" button
8. **Click "Allow"**
9. **Show the redirect** to `https://myora.co/oauth/callback`
10. **Stop recording**

### Option 2: Record from Mobile App

1. **Open the ORA app** on your phone
2. **Start screen recording** (iOS: Settings → Control Center → Screen Recording)
3. **Navigate to Inbox Shield** or wherever the "Connect Gmail" button is
4. **Tap "Connect Gmail"** or similar button
5. **Show Google's consent screen appearing** (critical!)
6. **Sign in** with test account
7. **Show permissions** and tap "Allow"
8. **Show successful connection** in the app
9. **Stop recording**

## Video Tips

- **Duration**: 1-2 minutes is perfect
- **Quality**: 1080p minimum, clear audio if narrating
- **Focus**: Make sure Google's consent screen is clearly visible
- **Test Account**: Use an account with 2FA disabled (as required by Google)
- **Upload**: Upload to YouTube (unlisted) and share the link

## What to Include in the Video

### Opening (5 seconds)
- Show the login page: `https://myora.co/login`
- Or show the app's "Connect Gmail" screen

### Main Flow (30-60 seconds)
- Click/tap "Connect with Google"
- **Google's consent screen appears** ← This is what Google needs to see!
- Sign in with test account
- Show the permission screen with:
  - App name: "ORA"
  - Requested scopes clearly visible
- Click "Allow"

### Closing (10 seconds)
- Show successful redirect to callback page
- Or show successful connection in the app

## Upload and Share

1. **Upload to YouTube** (set to "Unlisted" so only people with the link can view)
2. **Copy the YouTube link**
3. **Reply to Google's email** with:
   ```
   Hello Google Developer Team,
   
   I have created a demo video showing the OAuth consent screen workflow.
   
   Video Link: [YOUR_YOUTUBE_LINK]
   
   The video demonstrates:
   - User initiating OAuth from https://myora.co/login
   - Google's OAuth consent screen appearing
   - User signing in with a test account
   - User granting permissions (Gmail read-only, email, profile)
   - Successful redirect to the callback page
   
   Thank you,
   ORA Team
   ```

## Common Mistakes to Avoid

❌ **Don't**: Just show the app working after OAuth
❌ **Don't**: Skip showing Google's consent screen
❌ **Don't**: Use an account with 2FA enabled
❌ **Don't**: Make the video too long (over 3 minutes)

✅ **Do**: Clearly show Google's consent screen appearing
✅ **Do**: Show all requested permissions
✅ **Do**: Show the "Allow" button being clicked
✅ **Do**: Show the successful redirect

## Direct OAuth URL for Testing

You can use this URL directly in your browser to test:
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=389124746401-70ht7non8183n0ags7m1mma8d0cumdb7.apps.googleusercontent.com&redirect_uri=https://myora.co/oauth/callback&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/userinfo.email%20https://www.googleapis.com/auth/userinfo.profile&access_type=offline&prompt=consent
```

Or visit: `https://myora.co/login` and click the button.

