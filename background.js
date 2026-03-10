chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchOTP") {
    fetchOTPFromGmail(request.sentAt)
      .then(otp => {
        sendResponse({ success: true, otp: otp });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
});

async function fetchOTPFromGmail(sentAt) {
  try {
    const token = await getGoogleAuthToken();

    const searchQuery = 'subject:(OTP OR "one time password" OR "verification code") newer_than:5m';
    const messagesResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=10`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!messagesResponse.ok) throw new Error(`Gmail API error: ${messagesResponse.status}`);

    const messagesData = await messagesResponse.json();
    if (!messagesData.messages || messagesData.messages.length === 0) {
      throw new Error("No OTP email found yet");
    }

    for (const { id } of messagesData.messages) {
      // Cheap metadata fetch first — just need internalDate to check freshness
      const metaRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=subject`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!metaRes.ok) continue;

      const meta = await metaRes.json();

      // Skip emails that clearly pre-date the OTP request.
      // We subtract a 15-second buffer to account for browser/Gmail clock skew —
      // if the browser clock is ahead of Google's servers, a freshly sent email
      // can appear to have internalDate < sentAt and get incorrectly rejected.
      const CLOCK_SKEW_BUFFER_MS = 15000;
      if (sentAt && parseInt(meta.internalDate, 10) < (sentAt - CLOCK_SKEW_BUFFER_MS)) continue;

      // Fresh email — fetch full body and extract OTP
      const fullRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!fullRes.ok) continue;

      const otp = extractOTPFromMessage(await fullRes.json());
      if (otp) return otp;
    }

    throw new Error("No fresh OTP email found yet");
  } catch (error) {
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