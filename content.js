
chrome.storage.sync.get(["loginId", "password", "questions"], (data) => {
  const { loginId, password, questions } = data;

  // ─── Modal state ────────────────────────────────────────────────────────────
  let modalEl = null;
  let timerInterval = null;

  // ─── Build and inject the status modal ──────────────────────────────────────
  const createModal = () => {
    // Inject keyframe animations via a <style> tag (no inline JS, no CSP issue)
    if (!document.getElementById('erp-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'erp-modal-styles';
      style.textContent = `
        @keyframes erp-fadeIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes erp-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes erp-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes erp-shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
        /* Wrapper is a plain fixed overlay — NO transform here, so it never
           creates a stacking context that would break the card's centering. */
        #erp-otp-modal {
          position: fixed; inset: 0;
          display: flex; align-items: center; justify-content: center;
          z-index: 99998;
        }
        /* Animation lives on the card itself, not the wrapper */
        #erp-modal-card {
          animation: erp-fadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        #erp-spinner {
          width: 48px; height: 48px;
          border: 4px solid rgba(255,255,255,0.15);
          border-top-color: #fff;
          border-radius: 50%;
          animation: erp-spin 0.9s linear infinite;
        }
        .erp-dot {
          animation: erp-pulse 1.4s ease-in-out infinite;
        }
        .erp-dot:nth-child(2) { animation-delay: 0.2s; }
        .erp-dot:nth-child(3) { animation-delay: 0.4s; }
      `;
      document.head.appendChild(style);
    }

    const overlay = document.createElement('div');
    overlay.id = 'erp-otp-modal';
    overlay.innerHTML = `
      <div id="erp-modal-backdrop" style="
        position:fixed; inset:0;
        background: rgba(10,10,30,0.65);
        backdrop-filter: blur(4px);
        z-index: -1;
      "></div>

      <div id="erp-modal-card" style="
        position: relative;
        z-index: 1;
        width: 340px;
        background: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        border-radius: 20px;
        box-shadow: 0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08);
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #fff;
      ">
        <!-- Top accent bar -->
        <div style="height:3px; background: linear-gradient(90deg,#6c63ff,#48cae4,#06d6a0);"></div>

        <div style="padding: 32px 28px 24px;">

          <!-- Icon + spinner row -->
          <div style="display:flex; align-items:center; gap:18px; margin-bottom:22px;">
            <div id="erp-spinner"></div>
            <div>
              <div style="font-size:11px; text-transform:uppercase; letter-spacing:2px;
                          color:rgba(255,255,255,0.45); margin-bottom:4px;">
                ERP Auto-Login
              </div>
              <div id="erp-modal-title" style="font-size:18px; font-weight:700; line-height:1.2;">
                Sending OTP…
              </div>
            </div>
          </div>

          <!-- Status message -->
          <div id="erp-modal-msg" style="
            font-size:13.5px; color:rgba(255,255,255,0.72);
            line-height:1.6; min-height:40px; margin-bottom:20px;
          ">
            OTP request sent to the ERP server.<br>
            Waiting for your email to arrive
            <span class="erp-dot">.</span><span class="erp-dot">.</span><span class="erp-dot">.</span>
          </div>

          <!-- Countdown badge -->
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
            <div style="font-size:12px; color:rgba(255,255,255,0.4);">Fetching Gmail in</div>
            <div id="erp-countdown" style="
              font-size:22px; font-weight:800;
              background: linear-gradient(90deg,#6c63ff,#48cae4);
              -webkit-background-clip:text; -webkit-text-fill-color:transparent;
            ">10s</div>
          </div>

          <!-- Progress bar -->
          <div style="height:5px; background:rgba(255,255,255,0.1); border-radius:99px; overflow:hidden;">
            <div id="erp-progress" style="
              height:100%; width:100%;
              background: linear-gradient(90deg,#6c63ff,#48cae4,#06d6a0);
              border-radius:99px;
              transition: width 1s linear;
            "></div>
          </div>

          <!-- Step indicators -->
          <div style="display:flex; justify-content:space-between; margin-top:20px; gap:8px;">
            ${['Credentials', 'OTP Sent', 'Fetching', 'Signing In'].map((s, i) => `
              <div class="erp-step" data-step="${i}" style="
                flex:1; text-align:center; font-size:10px;
                color: ${i === 0 ? '#06d6a0' : 'rgba(255,255,255,0.3)'};
                font-weight: ${i === 0 ? '700' : '400'};
              ">
                <div style="
                  width:22px; height:22px; border-radius:50%; margin:0 auto 5px;
                  display:flex; align-items:center; justify-content:center;
                  font-size:11px; font-weight:700;
                  background: ${i === 0 ? '#06d6a0' : 'rgba(255,255,255,0.08)'};
                  color: ${i === 0 ? '#000' : 'rgba(255,255,255,0.3)'};
                  transition: all 0.4s ease;
                ">${i === 0 ? '✓' : i + 1}</div>
                ${s}
              </div>
            `).join('')}
          </div>

        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    modalEl = overlay;
  };

  // ─── Update which step is active ────────────────────────────────────────────
  const setStep = (stepIndex) => {
    if (!modalEl) return;
    modalEl.querySelectorAll('.erp-step').forEach((el, i) => {
      const dot = el.querySelector('div');
      if (i < stepIndex) {
        // completed
        el.style.color = '#06d6a0';
        el.style.fontWeight = '700';
        dot.style.background = '#06d6a0';
        dot.style.color = '#000';
        dot.textContent = '✓';
      } else if (i === stepIndex) {
        // active
        el.style.color = '#48cae4';
        el.style.fontWeight = '700';
        dot.style.background = 'linear-gradient(135deg,#6c63ff,#48cae4)';
        dot.style.color = '#fff';
        dot.textContent = i + 1;
      } else {
        // pending
        el.style.color = 'rgba(255,255,255,0.3)';
        el.style.fontWeight = '400';
        dot.style.background = 'rgba(255,255,255,0.08)';
        dot.style.color = 'rgba(255,255,255,0.3)';
        dot.textContent = i + 1;
      }
    });
  };

  // ─── Update modal text content ───────────────────────────────────────────────
  const setModalContent = (title, msg) => {
    if (!modalEl) return;
    const t = modalEl.querySelector('#erp-modal-title');
    const m = modalEl.querySelector('#erp-modal-msg');
    if (t) t.textContent = title;
    if (m) m.innerHTML = msg;
  };

  // ─── Countdown timer (10 → 0) ────────────────────────────────────────────────
  const startCountdown = (seconds, onDone) => {
    if (!modalEl) return;
    const countEl  = modalEl.querySelector('#erp-countdown');
    const progEl   = modalEl.querySelector('#erp-progress');
    let remaining  = seconds;

    const tick = () => {
      if (!modalEl) return;
      remaining--;
      if (countEl) countEl.textContent = remaining + 's';
      if (progEl)  progEl.style.width  = (remaining / seconds * 100) + '%';
      if (remaining <= 0) {
        clearInterval(timerInterval);
        onDone();
      }
    };

    if (progEl) progEl.style.width = '100%';
    timerInterval = setInterval(tick, 1000);
  };

  // ─── Dismiss modal with a success/failure flash ───────────────────────────────
  const closeModal = (success = true) => {
    if (!modalEl) return;
    clearInterval(timerInterval);

    const card = modalEl.querySelector('#erp-modal-card');
    if (card) {
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      card.style.opacity    = '0';
      card.style.transform  = 'translate(-50%, -48%) scale(0.95)';
    }
    const backdrop = modalEl.querySelector('#erp-modal-backdrop');
    if (backdrop) {
      backdrop.style.transition = 'opacity 0.5s ease';
      backdrop.style.opacity    = '0';
    }
    setTimeout(() => {
      if (modalEl) { modalEl.remove(); modalEl = null; }
    }, 500);
  };

  // ─── Helper function to set input field values ───────────────────────────────
  function setInput(selector, value) {
    const input = document.querySelector(selector);
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  // ─── Autofill login ID and password ──────────────────────────────────────────
  setInput("#user_id", loginId);
  // Dispatch blur so the page's jQuery handler fires the security-question AJAX call
  const userIdInput = document.querySelector("#user_id");
  if (userIdInput) {
    userIdInput.dispatchEvent(new Event("blur", { bubbles: true }));
  }
  setInput("#password", password);

  // ─── Wait for the answer_div to become visible ───────────────────────────────
  const waitForAnswerDiv = () => {
    const answerDiv = document.querySelector("#answer_div");
    if (answerDiv && !answerDiv.classList.contains("hidden")) {
      handleDynamicQuestion();
    } else {
      setTimeout(waitForAnswerDiv, 100);
    }
  };

  // ─── Handle the security question ────────────────────────────────────────────
  const handleDynamicQuestion = () => {
    const questionLabel = document.querySelector("#question");
    const answerInput   = document.querySelector("#answer");

    if (questionLabel && answerInput) {
      const questionText = questionLabel.textContent.trim();
      let answer;

      if (questionText === questions.question1)      answer = questions.answer1;
      else if (questionText === questions.question2) answer = questions.answer2;
      else if (questionText === questions.question3) answer = questions.answer3;

      if (answer) {
        setInput("#answer", answer);

        const sendOTPButton = document.querySelector("#getotp");
        if (sendOTPButton) {
          sendOTPButton.click();

          // Show the modal as soon as OTP is sent
          createModal();
          setStep(1); // "OTP Sent" step active

          // Start 10-second countdown; after it expires, start fetching
          startCountdown(10, () => {
            setModalContent(
              'Fetching OTP…',
              'Searching your Gmail inbox for the latest OTP<span class="erp-dot">.</span><span class="erp-dot">.</span><span class="erp-dot">.</span>'
            );
            setStep(2); // "Fetching" step active
            // Hide countdown badge when it's no longer relevant
            const cdEl = modalEl && modalEl.querySelector('#erp-countdown');
            if (cdEl) cdEl.closest('div').style.display = 'none';
            waitForOTPField();
          });
        }
      } else {
        console.error("No matching answer found for the question:", questionText);
      }
    }
  };

  // ─── Retry configuration ──────────────────────────────────────────────────────
  const MAX_OTP_RETRIES   = 5;   // max Gmail fetch attempts
  const RETRY_DELAY_MS    = 5000; // wait between retries (ms)
  const OTP_FIELD_TIMEOUT = 60;   // max polls for the OTP field (×500 ms = 30 s)

  // ─── Show or update the retry badge inside the modal ─────────────────────────
  const setRetryBadge = (attempt) => {
    if (!modalEl) return;
    let badge = modalEl.querySelector('#erp-retry-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'erp-retry-badge';
      badge.style.cssText = `
        margin-top: 14px;
        display: flex; align-items: center; gap: 10px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 12px; color: rgba(255,255,255,0.55);
      `;
      const inner = modalEl.querySelector('#erp-modal-card > div');
      if (inner) inner.appendChild(badge);
    }
    const dots = Array.from({ length: MAX_OTP_RETRIES }, (_, i) => {
      const active  = i < attempt;
      const current = i === attempt - 1;
      const color   = active
        ? (current ? '#f9c74f' : '#06d6a0')
        : 'rgba(255,255,255,0.15)';
      return `<span style="
        display:inline-block; width:8px; height:8px; border-radius:50%;
        background:${color}; transition:background 0.3s;
        ${current ? 'box-shadow:0 0 6px #f9c74f;' : ''}
      "></span>`;
    }).join('');
    badge.innerHTML = `
      <span>Attempt</span>
      <span style="font-weight:700; color:#f9c74f; font-size:13px;">
        ${attempt} / ${MAX_OTP_RETRIES}
      </span>
      <span style="display:flex; gap:4px; margin-left:4px;">${dots}</span>
    `;
  };

  // ─── Core OTP fetch with retry loop ──────────────────────────────────────────
  const attemptFetchOTP = (attempt) => {
    setRetryBadge(attempt);
    setModalContent(
      attempt === 1 ? 'Fetching OTP...' : `Retrying... (${attempt}/${MAX_OTP_RETRIES})`,
      'Searching your Gmail inbox for the latest OTP' +
      '<span class="erp-dot">.</span><span class="erp-dot">.</span><span class="erp-dot">.</span>'
    );

    chrome.runtime.sendMessage({ action: "fetchOTP" }, (response) => {
      if (response && response.success) {
        // ── Success ──────────────────────────────────────────────────────────
        setInput("#email_otp1", response.otp);
        setModalContent('OTP Filled! Signing in...', 'OTP found and entered. Submitting your login now...');
        setStep(3);
        const spinner = modalEl && modalEl.querySelector('#erp-spinner');
        if (spinner) spinner.style.borderTopColor = '#06d6a0';
        // Remove retry badge on success
        const badge = modalEl && modalEl.querySelector('#erp-retry-badge');
        if (badge) badge.remove();

        setTimeout(() => {
          const submitButton = document.querySelector("#loginFormSubmitButton");
          if (submitButton) submitButton.click();
          closeModal(true);
        }, 1200);

      } else if (attempt < MAX_OTP_RETRIES) {
        // ── Failed but retries remain — show countdown before next attempt ──
        console.warn(`OTP fetch attempt ${attempt} failed. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        let secsLeft = RETRY_DELAY_MS / 1000;

        const retryInterval = setInterval(() => {
          secsLeft--;
          setModalContent(
            `Retrying in ${secsLeft}s... (${attempt}/${MAX_OTP_RETRIES})`,
            'OTP not found in Gmail. Waiting before next attempt' +
            '<span class="erp-dot">.</span><span class="erp-dot">.</span><span class="erp-dot">.</span>'
          );
          if (secsLeft <= 0) {
            clearInterval(retryInterval);
            attemptFetchOTP(attempt + 1);
          }
        }, 1000);

      } else {
        // ── All retries exhausted ─────────────────────────────────────────
        console.error(`OTP fetch failed after ${MAX_OTP_RETRIES} attempts.`);
        setModalContent(
          'All Attempts Failed',
          `Could not retrieve OTP after ${MAX_OTP_RETRIES} attempts.<br>Please enter it manually in the OTP field.`
        );
        const spinner = modalEl && modalEl.querySelector('#erp-spinner');
        if (spinner) {
          spinner.style.animation        = 'none';
          spinner.style.border           = '4px solid #ff6b6b';
          spinner.style.display          = 'flex';
          spinner.style.alignItems       = 'center';
          spinner.style.justifyContent   = 'center';
          spinner.innerHTML = '<span style="font-size:22px;color:#ff6b6b">!</span>';
        }
        setTimeout(() => closeModal(false), 5000);
      }
    });
  };

  // ─── Wait for OTP field to appear, then kick off fetch ───────────────────────
  let otpFieldPolls = 0;
  const waitForOTPField = () => {
    const otpField = document.querySelector("#email_otp1");
    if (otpField) {
      attemptFetchOTP(1); // start at attempt 1
    } else if (otpFieldPolls < OTP_FIELD_TIMEOUT) {
      otpFieldPolls++;
      setTimeout(waitForOTPField, 500);
    } else {
      // OTP field never appeared — give up gracefully
      setModalContent(
        'Timeout',
        'The OTP input field did not appear. Please refresh and try again.'
      );
      setTimeout(() => closeModal(false), 4000);
    }
  };

  // ─── Start the flow ───────────────────────────────────────────────────────────
  waitForAnswerDiv();
});
