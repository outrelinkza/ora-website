# Email Reply Template for Google OAuth Verification

## Subject: Re: OAuth Verification Request - Demo Video Added

---

Hello Google Developer Team,

Thank you for reviewing our OAuth verification request. I have created a demo video that shows the OAuth consent screen workflow as requested.

**Demo Video Link:** [YOUR_YOUTUBE_LINK_HERE]

The video demonstrates the complete OAuth workflow:

1. **User initiates OAuth** from our login page at https://myora.co/login
2. **Google's OAuth consent screen appears** - showing the app name "ORA" and requested permissions
3. **User signs in** with a test account (2FA disabled as required)
4. **Permission screen is displayed** - showing the three requested scopes:
   - Gmail read-only access
   - User email address
   - Basic profile information
5. **User grants permissions** by clicking "Allow"
6. **Successful redirect** to https://myora.co/oauth/callback confirming the OAuth flow works correctly

The video clearly shows the OAuth consent screen workflow from start to finish, demonstrating how users interact with Google's consent screen when connecting their Gmail account to ORA.

**Testing Instructions:**
- Login page: https://myora.co/login
- Direct OAuth URL is available on the login page for easy testing
- Test accounts should have 2FA disabled (as per requirements)

Please let me know if you need any additional information or clarification.

Thank you,
ORA Team

---

## Instructions:

1. **Record the video** following the guide in `OAUTH_VIDEO_GUIDE.md`
2. **Upload to YouTube** (set to "Unlisted")
3. **Copy the YouTube link**
4. **Replace `[YOUR_YOUTUBE_LINK_HERE]`** in the email above with your actual link
5. **Reply directly to Google's email** with this message

## Important Notes:

- The video MUST show Google's consent screen appearing (not just the app working)
- Use a test account with 2FA disabled
- Keep the video under 2 minutes
- Make sure the consent screen is clearly visible and readable
- Show the "Allow" button being clicked

