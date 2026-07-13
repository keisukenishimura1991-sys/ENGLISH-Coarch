window.App = window.App || {};

App.Articles = (() => {
  let formState = null; // null | {} (new) | { id, title, url, notionUrl, date, summary, notes, completed }

  function vocabCount(articleId) {
    return App.state.vocab.filter((c) => c.sourceArticleId === articleId).length;
  }

  function renderForm() {
    if (!formState) {
      return `<button class="btn" id="add-article-btn">+ 記事を追加</button>`;
    }
    const f = formState;
    return `
      <form id="article-form" class="inline-form form-wide">
        <input name="title" placeholder="記事タイトル" value="${App.escapeHtml(f.title || '')}" required />
        <input name="date" type="date" value="${f.date || App.SRS.todayStr()}" required />
        <input name="url" placeholder="WSJ記事URL (任意)" value="${App.escapeHtml(f.url || '')}" />
        <input name="notionUrl" placeholder="NotionページURL (任意)" value="${App.escapeHtml(f.notionUrl || '')}" />
        <textarea name="summary" placeholder="要約 (高校生レベルの英語で)" rows="3">${App.escapeHtml(f.summary || '')}</textarea>
        <textarea name="notes" placeholder="メモ・感想" rows="2">${App.escapeHtml(f.notes || '')}</textarea>
        <label class="checkbox-label">
          <input type="checkbox" name="completed" ${f.completed ? 'checked' : ''} /> 学習完了
        </label>
        <div class="form-actions">
          <button type="submit" class="btn">${f.id ? '更新' : '追加'}</button>
          <button type="button" class="btn btn-ghost" id="cancel-article-form">キャンセル</button>
        </div>
      </form>
    `;
  }

  function render() {
    const items = App.state.articles
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(
        (a) => `
        <div class="card-item">
          <div class="card-item-header">
            <span class="${a.completed ? 'status-done' : 'status-pending'}">${a.completed ? '✅' : '📖'}</span>
            <strong>${App.escapeHtml(a.title)}</strong>
            <span class="muted">${a.date}</span>
          </div>
          ${a.summary ? `<p class="card-summary">${App.escapeHtml(a.summary)}</p>` : ''}
          <div class="card-item-meta">
            ${a.url ? `<a href="${App.escapeHtml(a.url)}" target="_blank" rel="noopener">WSJ記事</a>` : ''}
            ${a.notionUrl ? `<a href="${App.escapeHtml(a.notionUrl)}" target="_blank" rel="noopener">Notionページ</a>` : ''}
            <span class="muted">単語 ${vocabCount(a.id)}件</span>
          </div>
          <div class="card-item-actions">
            <button class="icon-btn" data-edit="${a.id}">編集</button>
            <button class="icon-btn danger" data-delete="${a.id}">削除</button>
          </div>
        </div>
      `
      )
      .join('');

    return `
      <div class="panel">
        ${renderForm()}
        <div class="card-list">${items || '<div class="empty-state">まだ記事が登録されていません</div>'}</div>
      </div>
    `;
  }

  function attach() {
    const addBtn = document.getElementById('add-article-btn');
    if (addBtn) addBtn.addEventListener('click', () => { formState = {}; App.render(); });

    const cancelBtn = document.getElementById('cancel-article-form');
    if (cancelBtn) cancelBtn.addEventListener('click', () => { formState = null; App.render(); });

    const form = document.getElementById('article-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const wasCompleted = formState.completed;
        const payload = {
          title: fd.get('title').trim(),
          date: fd.get('date'),
          url: fd.get('url').trim(),
          notionUrl: fd.get('notionUrl').trim(),
          summary: fd.get('summary').trim(),
          notes: fd.get('notes').trim(),
          completed: fd.get('completed') === 'on',
        };
        if (formState.id) {
          const idx = App.state.articles.findIndex((a) => a.id === formState.id);
          App.state.articles[idx] = { ...App.state.articles[idx], ...payload };
          if (!wasCompleted && payload.completed) App.logActivity('articles');
        } else {
          App.state.articles.push({ id: App.uid(), createdAt: new Date().toISOString(), ...payload });
          if (payload.completed) App.logActivity('articles');
        }
        App.persist();
        formState = null;
        App.render();
      });
    }

    document.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const article = App.state.articles.find((a) => a.id === btn.dataset.edit);
        formState = { ...article };
        App.render();
      });
    });

    document.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('この記事を削除しますか？')) return;
        App.state.articles = App.state.articles.filter((a) => a.id !== btn.dataset.delete);
        App.persist();
        App.render();
      });
    });
  }

  return { render, attach };
})();
