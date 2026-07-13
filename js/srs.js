window.App = window.App || {};

// Simple Leitner-box spaced repetition: box 1..6, each box has a review interval.
App.SRS = (() => {
  const INTERVALS = [1, 2, 4, 7, 14, 30]; // days, indexed by box - 1
  const MAX_BOX = INTERVALS.length;

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDays(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function newCard() {
    return { box: 1, dueDate: todayStr() };
  }

  function review(card, correct) {
    const box = correct ? Math.min(card.box + 1, MAX_BOX) : 1;
    return { box, dueDate: addDays(todayStr(), INTERVALS[box - 1]) };
  }

  function isDue(card, ref = todayStr()) {
    return card.dueDate <= ref;
  }

  function isMastered(card) {
    return card.box >= MAX_BOX;
  }

  return { todayStr, addDays, newCard, review, isDue, isMastered, MAX_BOX, INTERVALS };
})();
