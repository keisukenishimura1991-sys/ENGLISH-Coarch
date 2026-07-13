window.App = window.App || {};

App.Dashboard = (() => {
  function computeStreak() {
    let streak = 0;
    let day = App.SRS.todayStr();
    while (true) {
      const a = App.state.activity[day];
      if (a && (a.reviewed > 0 || a.articles > 0)) {
        streak++;
        day = App.SRS.addDays(day, -1);
      } else {
        break;
      }
    }
    return streak;
  }

  function last7Days() {
    const days = [];
    let day = App.SRS.todayStr();
    for (let i = 0; i < 7; i++) {
      days.unshift(day);
      day = App.SRS.addDays(day, -1);
    }
    return days;
  }

  function weekStart() {
    const now = new Date();
    const dow = (now.getDay() + 6) % 7; // 0 = Monday
    now.setDate(now.getDate() - dow);
    return now.toISOString().slice(0, 10);
  }

  function render() {
    const { vocab, articles } = App.state;
    const today = App.SRS.todayStr();
    const dueCount = vocab.filter((c) => App.SRS.isDue(c, today)).length;
    const masteredCount = vocab.filter(App.SRS.isMastered).length;
    const articlesThisWeek = articles.filter((a) => a.date >= weekStart()).length;
    const streak = computeStreak();

    const days = last7Days();
    const counts = days.map((d) => App.state.activity[d]?.reviewed || 0);
    const maxReview = Math.max(1, ...counts);
    const bars = days
      .map((d, i) => {
        const count = counts[i];
        const pct = Math.round((count / maxReview) * 100);
        const label = d.slice(5).replace('-', '/');
        return `<div class="bar-col">
          <div class="bar-track"><div class="bar-fill" style="height:${pct}%"></div></div>
          <div class="bar-count">${count}</div>
          <div class="bar-label">${label}</div>
        </div>`;
      })
      .join('');

    return `
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-value">${vocab.length}</div><div class="stat-label">総単語数</div></div>
        <div class="stat-card ${dueCount > 0 ? 'stat-alert' : ''}"><div class="stat-value">${dueCount}</div><div class="stat-label">復習待ち</div></div>
        <div class="stat-card"><div class="stat-value">${masteredCount}</div><div class="stat-label">マスター済み</div></div>
        <div class="stat-card"><div class="stat-value">${articlesThisWeek}</div><div class="stat-label">今週のWSJ記事</div></div>
        <div class="stat-card"><div class="stat-value">${streak}🔥</div><div class="stat-label">連続学習日数</div></div>
      </div>
      <div class="panel">
        <h2>直近7日間の復習数</h2>
        <div class="bar-chart">${bars}</div>
      </div>
      <div class="panel">
        <h2>クイックアクション</h2>
        <div class="quick-actions">
          <button class="btn" data-goto="vocab">単語を復習する</button>
          <button class="btn" data-goto="articles">記事を記録する</button>
          <button class="btn" data-goto="templates">テンプレートを見る</button>
        </div>
      </div>
    `;
  }

  function attach() {
    document.querySelectorAll('[data-goto]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelector(`.tab-btn[data-tab="${btn.dataset.goto}"]`).click();
      });
    });
  }

  return { render, attach };
})();
