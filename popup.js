

document.addEventListener("DOMContentLoaded", () => {
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

  