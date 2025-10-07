chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchOTP") {
    fetchOTPFromGmail()
      .then(otp => {
        sendResponse({ success: true, otp: otp });
      })
      .catch(error => {
        console.error("Error fetching OTP:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
});

async function fetchOTPFromGmail() {
  try {
    // Get OAuth token
    const token = await getGoogleAuthToken();
    
    // Search for recent OTP emails
    const searchQuery = 'subject:(OTP OR "one time password" OR "verification code") newer_than:5m';
    const messagesResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=5`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!messagesResponse.ok) {
      throw new Error(`Gmail API error: ${messagesResponse.status}`);
    }

    const messagesData = await messagesResponse.json();
    
    if (!messagesData.messages || messagesData.messages.length === 0) {
      throw new Error("No recent OTP emails found");
    }

    // Get the most recent message
    const messageId = messagesData.messages[0].id;
    const messageResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!messageResponse.ok) {
      throw new Error(`Failed to fetch message: ${messageResponse.status}`);
    }

    const messageData = await messageResponse.json();
    
    // Extract OTP from email content
    const otp = extractOTPFromMessage(messageData);
    
    if (!otp) {
      throw new Error("Could not extract OTP from email");
    }

    return otp;
  } catch (error) {
    console.error("Error in fetchOTPFromGmail:", error);
    throw error;
  }
}

function extractOTPFromMessage(messageData) {
  let emailContent = '';
  
  // Extract email content from different parts
  function extractContent(part) {
    if (part.body && part.body.data) {
      // Decode base64url content
      const decoded = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      emailContent += decoded + ' ';
    }
    
    if (part.parts) {
      part.parts.forEach(extractContent);
    }
  }
  
  if (messageData.payload) {
    extractContent(messageData.payload);
  }
  
  // Common OTP patterns
  const otpPatterns = [
    /\b(\d{4,8})\b/g,                    // 4-8 digit numbers
    /\b([A-Z0-9]{4,8})\b/g,              // 4-8 alphanumeric codes
    /(?:OTP|code|verification)\s*:?\s*(\d{4,8})/gi,  // With keywords
    /(\d{4,8})\s*(?:is|was)\s*(?:your|the)\s*(?:OTP|code)/gi
  ];
  
  for (const pattern of otpPatterns) {
    const matches = emailContent.match(pattern);
    if (matches && matches.length > 0) {
      // Return the first match that looks like an OTP
      const otp = matches[0].replace(/\D/g, ''); // Remove non-digits for digit-only OTPs
      if (otp.length >= 4 && otp.length <= 8) {
        return otp;
      }
    }
  }
  
  return null;
}

async function getGoogleAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ 
      interactive: true,
      scopes: ['https://www.googleapis.com/auth/gmail.readonly']
    }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (token) {
        resolve(token);
      } else {
        reject(new Error("Failed to get auth token"));
      }
    });
  });
}