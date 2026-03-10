// Runs in the page's MAIN world (not the extension's isolated world),
// so it has direct access to the page's window.alert.
// Silently dismisses only the "OTP sent" confirmation alert.
window.alert = (function (origAlert) {
  return function (msg) {
    if (msg && msg.toString().toLowerCase().includes('otp')) return;
    origAlert.apply(window, arguments);
  };
})(window.alert);
