
chrome.storage.sync.get(["loginId", "password", "questions"], (data) => {
  const { loginId, password, questions } = data;

  // Helper function to set input field values
  function setInput(selector, value) {
    const input = document.querySelector(selector);
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  // Autofill login ID and password
  setInput("#user_id", loginId);
  setInput("#password", password);

  // Wait for the answer_div to become visible
  const waitForAnswerDiv = () => {
    const answerDiv = document.querySelector("#answer_div");
    if (answerDiv && !answerDiv.classList.contains("hidden")) {
      handleDynamicQuestion();
    } else {
      setTimeout(waitForAnswerDiv, 100); // Check again after 100ms
    }
  };

  // Function to handle dynamic question
  const handleDynamicQuestion = () => {
    const questionLabel = document.querySelector("#question");
    const answerInput = document.querySelector("#answer");

    if (questionLabel && answerInput) {
      const questionText = questionLabel.textContent.trim();
      let answer;

      // Match the question text with stored answers
      if (questionText === questions.question1) {
        answer = questions.answer1;
      } else if (questionText === questions.question2) {
        answer = questions.answer2;
      } else if (questionText === questions.question3) {
        answer = questions.answer3;
      }

      if (answer) {
        setInput("#answer", answer);

        // Trigger the "Send OTP" button
        const sendOTPButton = document.querySelector("#getotp");
        if (sendOTPButton) {
          sendOTPButton.click();
          
          // Wait for OTP field to appear and then fetch OTP automatically
          setTimeout(() => {
            waitForOTPField();
          }, 10000); // Wait 10 seconds for OTP to be sent
        }
      } else {
        console.error("No matching answer found for the question:", questionText);
      }
    }
  };

  // Function to wait for OTP field and auto-fetch OTP
  const waitForOTPField = () => {
    const otpField = document.querySelector("#email_otp1");
    if (otpField) {
      // OTP field found, now fetch OTP from Gmail
      chrome.runtime.sendMessage({ action: "fetchOTP" }, (response) => {
        if (response && response.success) {
          setInput("#email_otp1", response.otp);
          
          // Optionally auto-submit the form after filling OTP
          setTimeout(() => {
            const submitButton = document.querySelector("input[type='submit'], button[type='submit']");
            if (submitButton) {
              submitButton.click();
            }
          }, 1000);
        } else {
          console.error("Failed to fetch OTP:", response?.error);
          // Show a notification to user
          showOTPNotification("Failed to fetch OTP automatically. Please enter manually.");
        }
      });
    } else {
      // OTP field not found yet, keep checking
      setTimeout(waitForOTPField, 500);
    }
  };

  // Function to show notification to user
  const showOTPNotification = (message) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #FF6B6B;
      color: white;
      padding: 15px;
      border-radius: 8px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      max-width: 300px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  };

  // Start waiting for the answer_div to become visible
  waitForAnswerDiv();
});

  