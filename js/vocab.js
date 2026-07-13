window.App = window.App || {};

App.Vocab = (() => {
  let reviewIndex = 0;
  let showAnswer = false;
  let formState = null; // null | {} (new) | { id, term, meaning, example, sourceArticleId }

  function dueCards() {
    const today = App.SRS.todayStr();
    return App.state.vocab.filter((c) => App.SRS.isDue(c, today));
  }

  function render() {
    return `
      <div class="subtabs">
        <button class="subtab-btn ${App.vocabView === 'review' ? 'active' : ''}" data-view="review">復習 (${dueCards().length})</button>
        <button class="subtab-btn ${App.vocabView === 'list' ? 'active' : ''}" data-view="list">単語帳 (${App.state.vocab.length})</button>
      </div>
      ${App.vocabView === 'review' ? renderReview() : renderList()}
    `;
  }

  function renderReview() {
    const cards = dueCards();
    if (cards.length === 0) {
      return `<div class="empty-state">🎉 今日の復習は全て完了しました！</div>`;
    }
    if (reviewIndex >= cards.length) reviewIndex = 0;
    const card = cards[reviewIndex];
    return `
      <div class="flashcard-wrap">
        <div class="progress-text">${reviewIndex + 1} / ${cards.length}</div>
        <div class="flashcard ${showAnswer ? 'flipped' : ''}" id="flashcard">
          <div class="flashcard-term">${App.escapeHtml(card.term)}</div>
          ${
            showAnswer
              ? `
            <div class="flashcard-meaning">${App.escapeHtml(card.meaning)}</div>
            ${card.example ? `<div class="flashcard-example">"${App.escapeHtml(card.example)}"</div>` : ''}
          `
              : `<div class="flashcard-hint">クリックして答えを表示</div>`
          }
        </div>
        ${
          showAnswer
            ? `
          <div class="review-actions">
            <button class="btn btn-danger" data-grade="wrong">覚えていない</button>
            <button class="btn btn-success" data-grade="right">覚えている</button>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  function renderForm() {
    if (!formState) {
      return `<button class="btn" id="add-vocab-btn">+ 単語を追加</button>`;
    }
    const f = formState;
    const articleOptions = App.state.articles
      .map((a) => `<option value="${a.id}" ${f.sourceArticleId === a.id ? 'selected' : ''}>${App.escapeHtml(a.title)}</option>`)
      .join('');
    return `
      <form id="vocab-form" class="inline-form">
        <input name="term" placeholder="単語・表現" value="${App.escapeHtml(f.term || '')}" required />
        <input name="meaning" placeholder="意味" value="${App.escapeHtml(f.meaning || '')}" required />
        <input name="example" placeholder="例文 (任意)" value="${App.escapeHtml(f.example || '')}" />
        <select name="sourceArticleId">
          <option value="">出典記事 (任意)</option>
          ${articleOptions}
        </select>
        <div class="form-actions">
          <button type="submit" class="btn">${f.id ? '更新' : '追加'}</button>
          <button type="button" class="btn btn-ghost" id="cancel-vocab-form">キャンセル</button>
        </div>
      </form>
    `;
  }

  function renderList() {
    const items = App.state.vocab
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(
        (c) => `
        <tr>
          <td>${App.escapeHtml(c.term)}</td>
          <td>${App.escapeHtml(c.meaning)}</td>
          <td>Box ${c.box}${App.SRS.isMastered(c) ? ' ✅' : ''}</td>
          <td>${c.dueDate}</td>
          <td>
            <button class="icon-btn" data-edit="${c.id}">編集</button>
            <button class="icon-btn danger" data-delete="${c.id}">削除</button>
          </td>
        </tr>
      `
      )
      .join('');
    return `
      <div class="panel">
        ${renderForm()}
        <table class="data-table">
          <thead><tr><th>単語</th><th>意味</th><th>状態</th><th>次回復習</th><th></th></tr></thead>
          <tbody>${items || '<tr><td colspan="5" class="empty-state">まだ単語がありません</td></tr>'}</tbody>
        </table>
      </div>
    `;
  }

  function attach() {
    document.querySelectorAll('.subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        App.vocabView = btn.dataset.view;
        reviewIndex = 0;
        showAnswer = false;
        App.render();
      });
    });

    if (App.vocabView === 'review') {
      const fc = document.getElementById('flashcard');
      if (fc) {
        fc.addEventListener('click', () => {
          showAnswer = true;
          App.render();
        });
      }
      document.querySelectorAll('[data-grade]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const cards = dueCards();
          const card = cards[reviewIndex];
          const idx = App.state.vocab.findIndex((c) => c.id === card.id);
          const updated = App.SRS.review(card, btn.dataset.grade === 'right');
          App.state.vocab[idx] = { ...card, ...updated };
          App.logActivity('reviewed');
          App.persist();
          showAnswer = false;
          App.render();
        });
      });
      return;
    }

    const addBtn = document.getElementById('add-vocab-btn');
    if (addBtn) addBtn.addEventListener('click', () => { formState = {}; App.render(); });

    const cancelBtn = document.getElementById('cancel-vocab-form');
    if (cancelBtn) cancelBtn.addEventListener('click', () => { formState = null; App.render(); });

    const form = document.getElementById('vocab-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const term = fd.get('term').trim();
        const meaning = fd.get('meaning').trim();
        const example = fd.get('example').trim();
        const sourceArticleId = fd.get('sourceArticleId') || null;
        if (formState.id) {
          const idx = App.state.vocab.findIndex((c) => c.id === formState.id);
          App.state.vocab[idx] = { ...App.state.vocab[idx], term, meaning, example, sourceArticleId };
        } else {
          App.state.vocab.push({
            id: App.uid(),
            term,
            meaning,
            example,
            sourceArticleId,
            createdAt: new Date().toISOString(),
            ...App.SRS.newCard(),
          });
        }
        App.persist();
        formState = null;
        App.render();
      });
    }

    document.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = App.state.vocab.find((c) => c.id === btn.dataset.edit);
        formState = { ...card };
        App.render();
      });
    });

    document.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('この単語を削除しますか？')) return;
        App.state.vocab = App.state.vocab.filter((c) => c.id !== btn.dataset.delete);
        App.persist();
        App.render();
      });
    });
  }

  return { render, attach };
})();
