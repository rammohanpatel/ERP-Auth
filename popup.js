

document.addEventListener("DOMContentLoaded", () => {

  // ── Gmail connection ──────────────────────────────────────────────
  const gmailDot   = document.getElementById("gmail-dot");
  const gmailLabel = document.getElementById("gmail-label");
  const gmailBtn   = document.getElementById("gmail-btn");

  function setGmailStatus(connected) {
    if (connected) {
      gmailDot.style.background   = "#22c55e";
      gmailLabel.textContent      = "Gmail connected";
      gmailLabel.style.color      = "#22c55e";
      gmailBtn.textContent        = "Disconnect";
      gmailBtn.style.background   = "#333";
    } else {
      gmailDot.style.background   = "#ef4444";
      gmailLabel.textContent      = "Gmail not connected";
      gmailLabel.style.color      = "#ccc";
      gmailBtn.textContent        = "Connect Gmail";
      gmailBtn.style.background   = "linear-gradient(90deg,#FF6B6B,#4ECDC4)";
    }
  }

  // Check if a token already exists (non-interactive = silent check)
  chrome.identity.getAuthToken({ interactive: false }, (token) => {
    setGmailStatus(!!token && !chrome.runtime.lastError);
  });

  gmailBtn.addEventListener("click", () => {
    const isConnected = gmailLabel.textContent === "Gmail connected";

    if (isConnected) {
      // Revoke token
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (token) {
          chrome.identity.removeCachedAuthToken({ token }, () => {
            fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
            setGmailStatus(false);
          });
        }
      });
    } else {
      // Trigger consent screen
      gmailBtn.textContent  = "Connecting...";
      gmailBtn.disabled     = true;
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        gmailBtn.disabled = false;
        if (chrome.runtime.lastError || !token) {
          gmailLabel.textContent = "Access denied — try again";
          gmailLabel.style.color = "#ef4444";
          gmailBtn.textContent   = "Connect Gmail";
          return;
        }
        setGmailStatus(true);
      });
    }
  });
  // ─────────────────────────────────────────────────────────────────
  const loginIdInput = document.getElementById("loginId");
  const passwordInput = document.getElementById("password");
  const question1Input = document.getElementById("question1");
  const answer1Input = document.getElementById("answer1");
  const question2Input = document.getElementById("question2");
  const answer2Input = document.getElementById("answer2");
  const question3Input = document.getElementById("question3");
  const answer3Input = document.getElementById("answer3");
  const saveButton = document.getElementById("save");

  // Load existing data from chrome.storage.sync
  chrome.storage.sync.get(["loginId", "password", "questions"], (data) => {
    const { loginId, password, questions } = data;

    if (loginId || password || questions) {
      // Pre-fill the form with existing data
      if (loginId) loginIdInput.value = loginId;
      if (password) passwordInput.value = password;
      if (questions) {
        if (questions.question1) question1Input.value = questions.question1;
        if (questions.answer1) answer1Input.value = questions.answer1;
        if (questions.question2) question2Input.value = questions.question2;
        if (questions.answer2) answer2Input.value = questions.answer2;
        if (questions.question3) question3Input.value = questions.question3;
        if (questions.answer3) answer3Input.value = questions.answer3;
      }

      // Show a message to update details
      const updateMessage = document.createElement("h4");
      updateMessage.textContent = "Update your details";
      updateMessage.style.color = "#FF6B6B";
      document.body.insertBefore(updateMessage, document.body.firstChild);
    }
  });

  // Save or update data on button click
  saveButton.addEventListener("click", () => {
    const loginId = loginIdInput.value.trim();
    const password = passwordInput.value.trim();
    const questions = {
      question1: question1Input.value.trim(),
      answer1: answer1Input.value.trim(),
      question2: question2Input.value.trim(),
      answer2: answer2Input.value.trim(),
      question3: question3Input.value.trim(),
      answer3: answer3Input.value.trim(),
    };

    chrome.storage.sync.set({ loginId, password, questions }, () => {
      alert("Details saved successfully!");
    });
  });
});

  