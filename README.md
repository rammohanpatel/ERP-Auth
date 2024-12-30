# Auto ERP Login Extension

## Overview  
**Auto ERP Login Extension** is a Chrome extension designed to streamline the ERP login process by autofilling user credentials and dynamically answering security questions. This tool enhances user experience and saves time by automating repetitive tasks like entering login details and OTPs.

---

## Features  
✅ **Autofill Login Details**  
- Automatically fills in your `Login ID` and `Password` stored in Chrome's secure `storage.sync`.

✅ **Dynamic Question Handling**  
- Matches and fills answers for security questions dynamically based on stored user preferences.

✅ **OTP Autofill Support**  
- Provides mechanisms for clipboard-based OTP autofill or integration with custom backend APIs for seamless OTP handling.

✅ **Secure Storage**  
- Uses Chrome's `storage.sync` to securely store credentials and dynamic questions.

✅ **Update Option**  
- Prompts users to update their stored credentials easily if they already exist.

---

### Login Autofill  
![image](https://github.com/user-attachments/assets/f7f1f94d-1b48-4649-996d-7563901dec03) 

---

## How It Works  

### Step 1: Save Your Details  
- Open the extension popup.  
- Enter your `Login ID`, `Password`, and answers to dynamic security questions.  
- Click `Save`.

### Step 2: Automatic Login  
- Navigate to the ERP login page.  
- The extension autofills the credentials and answers and clicks the OTP button automatically.

---

### Manual Installation  
1. Clone or download this repository:  
   ``` git clone https://github.com/your-username/auto-erp-login.git ```
2. Open Chrome and navigate to chrome://extensions/.
3. Enable Developer mode.
4. Click Load unpacked and select the downloaded folder.
