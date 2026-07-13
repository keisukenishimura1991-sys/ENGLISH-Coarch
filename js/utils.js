window.App = window.App || {};

App.escapeHtml = function (str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
};

App.uid = function () {
  return crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
};
