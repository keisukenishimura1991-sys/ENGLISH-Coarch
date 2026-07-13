window.App = window.App || {};

App.Storage = (() => {
  const KEY = 'eng-learning-app-v1';

  function defaultData() {
    return {
      vocab: [],
      articles: [],
      templates: [
        {
          id: 'seed-weekly-session',
          name: '週次コーチングセッション基本テンプレート',
          category: 'コーチング',
          content: [
            '1. 前回の振り返り (5分)',
            '   - 前週のWSJ記事の要約を英語で説明',
            '   - 新しく覚えた単語・表現を3つ使って一文作る',
            '2. 今週のWSJ記事ディスカッション (20分)',
            '   - 記事の要点を英語で説明',
            '   - 記事に関するKitamura-sanからの質問に回答',
            '   - 自分の意見・GLOBISでの学びと関連付けて話す',
            '3. フィードバック (10分)',
            '   - 発音・文法・語彙の指摘',
            '   - 次週までの宿題設定',
            '4. 次回までのアクション (5分)',
            '   - 次のWSJ記事を選定',
            '   - 復習する単語リストを確認',
          ].join('\n'),
          createdAt: new Date(0).toISOString(),
        },
      ],
      activity: {},
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultData();
      const data = JSON.parse(raw);
      return { ...defaultData(), ...data };
    } catch (e) {
      console.error('Failed to load data', e);
      return defaultData();
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function exportJSON(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `eng-learning-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file, onDone) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        save({ ...defaultData(), ...data });
        onDone(null);
      } catch (err) {
        onDone(err);
      }
    };
    reader.onerror = () => onDone(reader.error);
    reader.readAsText(file);
  }

  return { load, save, exportJSON, importJSON, defaultData };
})();
