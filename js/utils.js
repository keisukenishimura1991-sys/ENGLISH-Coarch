window.App = window.App || {};

App.escapeHtml = function (str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
};

App.uid = function () {
  return crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
};

App.speak = function (text, lang) {
  if (!('speechSynthesis' in window)) {
    alert('このブラウザは音声読み上げに対応していません。');
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang || 'en-US';
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
};
