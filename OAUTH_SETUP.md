# Gmail API OAuth Setup Guide

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a project" dropdown → "New Project"
3. Enter project name (e.g., "ERP-Auth-Extension")
4. Click "Create"

## Step 2: Enable Gmail API

1. In your Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click on "Gmail API" and then "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace account)
3. Fill in the required fields:
   - **App name**: ERP Auth Extension
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click "Save and Continue"
5. On the "Scopes" page, click "Add or Remove Scopes"
6. Add the Gmail scope: `https://www.googleapis.com/auth/gmail.readonly`
7. Click "Save and Continue"
8. On the "Test users" page, add your Gmail address as a test user
9. Click "Save and Continue"

## Step 4: Create OAuth Credentials

**IMPORTANT**: Chrome extensions require special OAuth credentials!

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. **Choose "Chrome Extension" as application type** (NOT "Web application")
4. Enter a name (e.g., "ERP Auth Extension")
5. For "Extension ID", you'll need to:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select your extension folder
   - Copy the Extension ID that appears (e.g., `abcdefghijklmnopqrstuvwxyz123456`)
   - Enter this Extension ID in the Google Cloud Console form
6. Click "Create"
7. Copy the **Client ID**


## Step 5: Load and Configure Your Extension

✅ **OAuth Client ID is already configured in the extension!**

1. **Load your extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select your extension folder
   - The extension will appear with its own ID

2. **Configure your ERP credentials:**
   - Click your extension icon in Chrome
   - Fill in your ERP credentials:
     - Login ID
     - Password  
     - Security Questions and Answers
   - Click "Save"

**No need to enter the Client ID - it's already built into the extension!**

## Step 6: Test the Extension

1. Navigate to your ERP login page
2. The extension will automatically:
   - Fill login credentials
   - Answer security questions
   - Request OTP via email
   - Fetch OTP from Gmail automatically
   - Fill the OTP field and submit
3. First time: You'll see a Google OAuth consent screen - grant permissions
4. Subsequent logins: Everything happens automatically!
