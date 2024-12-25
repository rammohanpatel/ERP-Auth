document.getElementById('save').addEventListener('click', () => {
    const loginId = document.getElementById('loginId').value;
    const password = document.getElementById('password').value;
  
    const questions = {
      question1: document.getElementById('question1').value,
      answer1: document.getElementById('answer1').value,
      question2: document.getElementById('question2').value,
      answer2: document.getElementById('answer2').value,
      question3: document.getElementById('question3').value,
      answer3: document.getElementById('answer3').value,
    };
  
    // chrome.storage.local.set({ loginId, password, questions }, () => {
    //   alert('Credentials and dynamic questions saved!');
    // });
    chrome.storage.sync.set({ loginId, password, questions }, () => {
        console.log('Data saved to local storage',loginId,password,questions);
        alert('Credentials and dynamic questions saved!');
      });
    
  });
  