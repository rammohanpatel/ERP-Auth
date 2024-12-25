
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
        }
      } else {
        console.error("No matching answer found for the question:", questionText);
      }
    }
  };

  // Start waiting for the answer_div to become visible
  waitForAnswerDiv();
});

  