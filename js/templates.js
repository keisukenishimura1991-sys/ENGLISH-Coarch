window.App = window.App || {};

App.Templates = (() => {
  let formState = null; // null | {} (new) | { id, name, category, content }
  let expandedId = null;

  function renderForm() {
    if (!formState) {
      return `<button class="btn" id="add-template-btn">+ テンプレートを追加</button>`;
    }
    const f = formState;
    return `
      <form id="template-form" class="inline-form form-wide">
        <input name="name" placeholder="テンプレート名" value="${App.escapeHtml(f.name || '')}" required />
        <input name="category" placeholder="カテゴリ (例: コーチング)" value="${App.escapeHtml(f.category || '')}" />
        <textarea name="content" placeholder="内容" rows="8">${App.escapeHtml(f.content || '')}</textarea>
        <div class="form-actions">
          <button type="submit" class="btn">${f.id ? '更新' : '追加'}</button>
          <button type="button" class="btn btn-ghost" id="cancel-template-form">キャンセル</button>
        </div>
      </form>
    `;
  }

  function render() {
    const items = App.state.templates
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((t) => {
        const isOpen = expandedId === t.id;
        return `
        <div class="card-item">
          <div class="card-item-header">
            <strong>${App.escapeHtml(t.name)}</strong>
            ${t.category ? `<span class="tag">${App.escapeHtml(t.category)}</span>` : ''}
          </div>
          <button class="icon-btn" data-toggle="${t.id}">${isOpen ? '閉じる' : '内容を見る'}</button>
          ${isOpen ? `<pre class="template-content">${App.escapeHtml(t.content)}</pre>` : ''}
          <div class="card-item-actions">
            <button class="icon-btn" data-copy="${t.id}">コピー</button>
            <button class="icon-btn" data-edit="${t.id}">編集</button>
            <button class="icon-btn danger" data-delete="${t.id}">削除</button>
          </div>
        </div>
      `;
      })
      .join('');

    return `
      <div class="panel">
        ${renderForm()}
        <div class="card-list">${items || '<div class="empty-state">まだテンプレートがありません</div>'}</div>
      </div>
    `;
  }

  function attach() {
    const addBtn = document.getElementById('add-template-btn');
    if (addBtn) addBtn.addEventListener('click', () => { formState = {}; App.render(); });

    const cancelBtn = document.getElementById('cancel-template-form');
    if (cancelBtn) cancelBtn.addEventListener('click', () => { formState = null; App.render(); });

    const form = document.getElementById('template-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const payload = {
          name: fd.get('name').trim(),
          category: fd.get('category').trim(),
          content: fd.get('content').trim(),
        };
        if (formState.id) {
          const idx = App.state.templates.findIndex((t) => t.id === formState.id);
          App.state.templates[idx] = { ...App.state.templates[idx], ...payload };
        } else {
          App.state.templates.push({ id: App.uid(), createdAt: new Date().toISOString(), ...payload });
        }
        App.persist();
        formState = null;
        App.render();
      });
    }

    document.querySelectorAll('[data-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        expandedId = expandedId === btn.dataset.toggle ? null : btn.dataset.toggle;
        App.render();
      });
    });

    document.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = App.state.templates.find((x) => x.id === btn.dataset.copy);
        navigator.clipboard?.writeText(t.content).then(
          () => { btn.textContent = 'コピー済み'; setTimeout(() => (btn.textContent = 'コピー'), 1500); },
          () => alert('コピーに失敗しました')
        );
      });
    });

    document.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = App.state.templates.find((x) => x.id === btn.dataset.edit);
        formState = { ...t };
        App.render();
      });
    });

    document.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('このテンプレートを削除しますか？')) return;
        App.state.templates = App.state.templates.filter((t) => t.id !== btn.dataset.delete);
        App.persist();
        App.render();
      });
    });
  }

  return { render, attach };
})();
