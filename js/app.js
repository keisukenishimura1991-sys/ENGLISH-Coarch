window.App = window.App || {};

(function () {
  App.state = App.Storage.load();
  App.currentTab = 'dashboard';
  App.vocabView = 'review';

  App.persist = function () {
    App.Storage.save(App.state);
  };

  App.logActivity = function (field, delta = 1) {
    const day = App.SRS.todayStr();
    if (!App.state.activity[day]) App.state.activity[day] = { reviewed: 0, articles: 0 };
    App.state.activity[day][field] += delta;
  };

  function switchTab(tab) {
    App.currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    render();
  }

  function render() {
    const root = document.getElementById('view');
    if (App.currentTab === 'dashboard') root.innerHTML = App.Dashboard.render();
    else if (App.currentTab === 'vocab') root.innerHTML = App.Vocab.render();
    else if (App.currentTab === 'articles') root.innerHTML = App.Articles.render();
    else if (App.currentTab === 'templates') root.innerHTML = App.Templates.render();
    attachHandlers();
  }
  App.render = render;

  function attachHandlers() {
    if (App.currentTab === 'dashboard') App.Dashboard.attach();
    else if (App.currentTab === 'vocab') App.Vocab.attach();
    else if (App.currentTab === 'articles') App.Articles.attach();
    else if (App.currentTab === 'templates') App.Templates.attach();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('export-btn').addEventListener('click', () => App.Storage.exportJSON(App.state));

    document.getElementById('import-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      App.Storage.importJSON(file, (err) => {
        if (err) {
          alert('インポートに失敗しました: ' + err.message);
          return;
        }
        App.state = App.Storage.load();
        render();
        alert('インポートが完了しました');
      });
      e.target.value = '';
    });

    render();
  });
})();
