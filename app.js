(() => {
  'use strict';

  const library = window.JP_DATA;
  const reference = window.JP_KANJI_REFERENCE || {};
  const byId = (id) => document.getElementById(id);
  const ui = {
    sidebar: byId('sidebar'), menuButton: byId('menu-button'), scrim: byId('mobile-scrim'),
    setCount: byId('set-count'), search: byId('search-input'), filters: byId('folder-filters'),
    setList: byId('set-list'), librarySummary: byId('library-summary'),
    breadcrumb: byId('breadcrumb-set'), title: byId('set-title'),
    description: byId('set-description'), details: byId('set-details'),
    quizletLink: byId('quizlet-link'), quizletOpen: byId('quizlet-open'),
    cardsTab: byId('cards-tab'), quizletTab: byId('quizlet-tab'),
    cardsView: byId('cards-view'), quizletView: byId('quizlet-view'),
    options: byId('card-options'), openOnly: byId('open-only'), shuffle: byId('shuffle-button'),
    counter: byId('card-counter'), knownCounter: byId('known-counter'),
    progressFill: byId('progress-fill'), flashcard: byId('flashcard'),
    cardLabel: byId('card-side-label'), cardMain: byId('card-main'),
    cardPrompt: byId('card-prompt'), previous: byId('previous-button'),
    next: byId('next-button'), known: byId('known-button'),
    analysisIntro: byId('analysis-intro'), subwordList: byId('subword-list'), kanjiList: byId('kanji-list'),
    frame: byId('quizlet-frame'), sourcesButton: byId('sources-button'),
    sourcesDialog: byId('sources-dialog')
  };

  if (!library || !Array.isArray(library.sets) || library.sets.length === 0) {
    ui.librarySummary.textContent = 'Keine Vokabeldaten gefunden.';
    ui.description.textContent = 'Bitte data.js mit build-data.ps1 erzeugen.';
    return;
  }

  const sortByTitle = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
  const sets = [...library.sets].sort((a, b) =>
    sortByTitle.compare(a.folder, b.folder) || sortByTitle.compare(a.title, b.title));
  const setMap = new Map(sets.map((set) => [set.id, set]));
  const courseWords = new Map();
  for (const set of sets) {
    for (const [term, definition] of set.cards) {
      if (/^[\u3400-\u9fff々]{2,}$/.test(term) && !courseWords.has(term)) {
        courseWords.set(term, definition);
      }
    }
  }
  const progressKey = 'kotoba-studio-progress-v1';
  const lastSetKey = 'kotoba-studio-last-set-v1';
  const learned = new Set(readStoredArray(progressKey));
  const initial = getStored(lastSetKey);
  const preferred = sets.find((set) => set.cards.some((card) => card[0] === '新聞'));
  const state = {
    set: setMap.get(initial) || preferred || sets[0],
    folder: 'Alle', query: '', cursor: 0, flipped: false,
    mode: 'cards', openOnly: false, shuffled: false, order: []
  };

  function getStored(key) {
    try { return window.localStorage.getItem(key); } catch (_) { return null; }
  }

  function saveStored(key, value) {
    try { window.localStorage.setItem(key, value); } catch (_) { /* Private browser mode may block storage. */ }
  }

  function readStoredArray(key) {
    try {
      const value = JSON.parse(window.localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }

  function cardKey(set, index) { return `${set.id}:${index}`; }
  function knownCount(set) {
    let count = 0;
    for (let i = 0; i < set.cards.length; i++) if (learned.has(cardKey(set, i))) count++;
    return count;
  }

  function displayFolder(folder) {
    if (folder === 'KanjiChallenge') return 'Kanji Challenge';
    if (folder === 'Opto_MNG_漢字') return 'Kanji Basics';
    if (folder === 'Minna Romaji Deutsch') return 'Minna Romaji';
    if (folder === 'Minna KANA - Deutsch') return 'Minna Kana';
    return folder;
  }

  function resetOrder() {
    state.order = state.set.cards.map((_, index) => index);
    if (state.shuffled) {
      for (let i = state.order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.order[i], state.order[j]] = [state.order[j], state.order[i]];
      }
    }
    state.cursor = 0;
    state.flipped = false;
  }

  function visibleOrder() {
    return state.openOnly
      ? state.order.filter((index) => !learned.has(cardKey(state.set, index)))
      : state.order;
  }

  function currentCard() {
    const visible = visibleOrder();
    if (visible.length === 0) return null;
    state.cursor = Math.min(Math.max(state.cursor, 0), visible.length - 1);
    const index = visible[state.cursor];
    return { index, value: state.set.cards[index], visibleLength: visible.length };
  }

  function selectSet(id) {
    const selected = setMap.get(id);
    if (!selected) return;
    state.set = selected;
    state.shuffled = false;
    state.openOnly = false;
    ui.openOnly.checked = false;
    ui.shuffle.setAttribute('aria-pressed', 'false');
    resetOrder();
    saveStored(lastSetKey, selected.id);
    ui.frame.removeAttribute('src');
    render();
    closeMobileMenu();
  }

  function makeElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderFilters() {
    ui.filters.replaceChildren();
    const folders = ['Alle', ...new Set(sets.map((set) => set.folder))];
    for (const folder of folders) {
      const button = makeElement('button', `folder-filter${state.folder === folder ? ' active' : ''}`,
        folder === 'Alle' ? 'Alle' : displayFolder(folder));
      button.type = 'button';
      button.setAttribute('aria-pressed', String(state.folder === folder));
      button.addEventListener('click', () => {
        state.folder = folder;
        renderFilters();
        renderSetList();
      });
      ui.filters.append(button);
    }
  }

  function renderSetList() {
    const query = state.query.trim().toLocaleLowerCase('de');
    const filtered = sets.filter((set) => {
      if (state.folder !== 'Alle' && set.folder !== state.folder) return false;
      if (!query) return true;
      const haystack = `${set.title} ${set.folder} ${set.cards.map((card) => card.join(' ')).join(' ')}`;
      return haystack.toLocaleLowerCase('de').includes(query);
    });
    ui.setCount.textContent = String(filtered.length);
    ui.setList.replaceChildren();
    if (filtered.length === 0) {
      ui.setList.append(makeElement('p', 'empty-list', 'Keine passenden Sets gefunden.'));
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const set of filtered) {
      const active = set.id === state.set.id;
      const button = makeElement('button', `set-row${active ? ' active' : ''}`);
      button.type = 'button';
      button.setAttribute('aria-current', active ? 'true' : 'false');
      button.title = set.title;
      const icon = makeElement('span', 'set-row-icon', set.folder.includes('Kanji') || set.folder.includes('漢字') ? '漢' : 'あ');
      icon.setAttribute('aria-hidden', 'true');
      const main = makeElement('span', 'set-row-main');
      main.append(makeElement('span', 'set-row-title', set.title));
      main.append(makeElement('span', 'set-row-sub', `${set.cards.length} Karten · ${knownCount(set)} gelernt`));
      const arrow = makeElement('span', 'set-row-arrow', '›');
      arrow.setAttribute('aria-hidden', 'true');
      button.append(icon, main, arrow);
      button.addEventListener('click', () => selectSet(set.id));
      fragment.append(button);
    }
    ui.setList.append(fragment);
  }

  function renderSetHeading() {
    const set = state.set;
    ui.breadcrumb.textContent = set.title;
    ui.title.textContent = set.title;
    ui.description.textContent = `Lerne die ${set.cards.length} Karten dieses Sets und entdecke die Bedeutung der Kanji in zusammengesetzten Wörtern.`;
    ui.details.replaceChildren();
    for (const text of [displayFolder(set.folder), `${set.cards.length} Vokabeln`, `${knownCount(set)} gelernt`]) {
      ui.details.append(makeElement('span', 'detail-chip', text));
    }
    ui.quizletLink.href = set.url;
    ui.quizletOpen.href = set.url;
  }

  function extractKanji(term) {
    return [...new Set(term.match(/[\u3400-\u9fff]/gu) || [])];
  }

  function courseMeaning(note) {
    if (!note) return '';
    const hyphen = note.indexOf(' - ');
    if (hyphen >= 0) return note.slice(hyphen + 3).trim();
    const parts = note.trim().split(/\s+/);
    if (parts.length >= 3) return parts.slice(2).join(' ');
    if (parts.length === 2) return parts[1];
    return note;
  }

  function kunExample(kanji, kunReadings) {
    for (const reading of kunReadings || []) {
      if (reading.startsWith('-') || !reading.includes('.')) continue;
      const [stem, ending] = reading.split('.');
      if (!stem || !ending || !/^[ぁ-ゖ]+$/.test(ending)) continue;
      return `${kanji}${ending}（${stem}${ending}）`;
    }
    return '';
  }

  function renderKanji(term) {
    ui.kanjiList.replaceChildren();
    ui.subwordList.replaceChildren();
    const runs = term.match(/[\u3400-\u9fff々]{2,}/gu) || [];
    const subwords = [...courseWords.entries()]
      .filter(([word]) => runs.some((run) => run !== word && run.includes(word)))
      .sort((a, b) => b[0].length - a[0].length)
      .slice(0, 4);
    ui.subwordList.classList.toggle('hidden', subwords.length === 0);
    if (subwords.length) {
      ui.subwordList.append(makeElement('p', 'subword-label', 'Teilwörter aus deinen Sets'));
      for (const [word, definition] of subwords) {
        const row = makeElement('div', 'subword-row');
        const wordNode = makeElement('span', 'subword-term', word);
        wordNode.lang = 'ja';
        row.append(wordNode, makeElement('span', 'subword-definition', definition));
        ui.subwordList.append(row);
      }
    }
    const characters = extractKanji(term);
    if (!characters.length) {
      ui.analysisIntro.textContent = 'Zu dieser Karte ist in der CSV keine Kanji-Schreibweise angegeben.';
      ui.kanjiList.append(makeElement('p', 'analysis-empty', 'Eine Zeichenzerlegung wäre hier spekulativ. Der Originaleintrag bleibt unverändert.'));
      return;
    }
    ui.analysisIntro.textContent = `${characters.length} Zeichen in dieser Vokabel. Die Bedeutung des ganzen Wortes steht auf der Rückseite der Karte.`;
    for (const character of characters) {
      const course = library.courseKanji[character];
      const lookup = reference[character];
      const item = makeElement('div', 'kanji-item');
      const top = makeElement('div', 'kanji-item-top');
      const glyph = makeElement('span', 'kanji-glyph', character);
      glyph.lang = 'ja';
      const info = makeElement('div', 'kanji-info');
      const meaning = course ? courseMeaning(course) : lookup?.meaning?.[0] || 'Bedeutung noch nicht hinterlegt';
      info.append(makeElement('div', 'kanji-meaning', meaning));
      info.append(makeElement('div', 'kanji-origin', course ? 'Kursangabe' : lookup ? 'KANJIDIC · EN' : 'Noch offen'));
      top.append(glyph, info);
      item.append(top);
      if (course) item.append(makeElement('p', 'kanji-detail', course));
      if (lookup) {
        const on = lookup.on?.length ? `On: ${lookup.on.join(' · ')}` : '';
        const kun = lookup.kun?.length ? `Kun: ${lookup.kun.join(' · ')}` : '';
        if (on || kun) item.append(makeElement('p', 'kanji-detail', [on, kun].filter(Boolean).join('  |  ')));
        const example = kunExample(character, lookup.kun);
        if (example) item.append(makeElement('p', 'kanji-detail kanji-example', `Eigenes Wort: ${example}`));
      }
      ui.kanjiList.append(item);
    }
  }

  function renderCard() {
    const set = state.set;
    const current = currentCard();
    const known = knownCount(set);
    const percentage = set.cards.length ? Math.round((known / set.cards.length) * 100) : 0;
    ui.knownCounter.textContent = `${known} / ${set.cards.length} gelernt`;
    ui.progressFill.style.width = `${percentage}%`;
    ui.flashcard.classList.toggle('flipped', state.flipped);

    if (!current) {
      ui.counter.textContent = 'Alles geschafft';
      ui.cardLabel.textContent = 'FERTIG';
      ui.cardMain.textContent = 'すばらしい！';
      ui.cardPrompt.textContent = 'Alle Karten dieses Sets sind markiert.';
      ui.flashcard.disabled = true;
      ui.known.disabled = true;
      ui.previous.disabled = true;
      ui.next.disabled = true;
      renderKanji('');
      return;
    }

    ui.flashcard.disabled = false;
    ui.known.disabled = false;
    ui.previous.disabled = current.visibleLength < 2;
    ui.next.disabled = current.visibleLength < 2;
    const [term, definition] = current.value;
    ui.counter.textContent = `Karte ${state.cursor + 1} / ${current.visibleLength}`;
    ui.cardLabel.textContent = state.flipped ? 'BEDEUTUNG' : 'BEGRIFF';
    ui.cardMain.textContent = state.flipped ? definition : term;
    ui.cardMain.lang = state.flipped ? 'de' : 'ja';
    ui.cardPrompt.textContent = state.flipped ? 'Klicken oder Leertaste zur Vorderseite' : 'Klicken oder Leertaste zum Aufdecken';
    const isKnown = learned.has(cardKey(set, current.index));
    ui.known.textContent = isKnown ? '✓ Als offen markieren' : '✓ Als gelernt markieren';
    ui.known.classList.toggle('is-known', isKnown);
    renderKanji(term);
  }

  function renderMode() {
    const cardsMode = state.mode === 'cards';
    ui.cardsView.classList.toggle('hidden', !cardsMode);
    ui.quizletView.classList.toggle('hidden', cardsMode);
    ui.options.classList.toggle('hidden', !cardsMode);
    ui.cardsTab.classList.toggle('active', cardsMode);
    ui.quizletTab.classList.toggle('active', !cardsMode);
    ui.cardsTab.setAttribute('aria-selected', String(cardsMode));
    ui.quizletTab.setAttribute('aria-selected', String(!cardsMode));
    if (!cardsMode && !ui.frame.getAttribute('src')) {
      ui.frame.src = `https://quizlet.com/${encodeURIComponent(state.set.id)}/match/embed`;
    }
  }

  function render() {
    renderSetList();
    renderSetHeading();
    renderCard();
    renderMode();
  }

  function move(delta) {
    const length = visibleOrder().length;
    if (length < 2) return;
    state.cursor = (state.cursor + delta + length) % length;
    state.flipped = false;
    renderCard();
  }

  function toggleKnown() {
    const current = currentCard();
    if (!current) return;
    const key = cardKey(state.set, current.index);
    if (learned.has(key)) learned.delete(key); else learned.add(key);
    saveStored(progressKey, JSON.stringify([...learned]));
    state.flipped = false;
    render();
  }

  function openMobileMenu() {
    ui.sidebar.classList.add('open');
    ui.scrim.classList.remove('hidden');
    ui.menuButton.setAttribute('aria-expanded', 'true');
  }

  function closeMobileMenu() {
    ui.sidebar.classList.remove('open');
    ui.scrim.classList.add('hidden');
    ui.menuButton.setAttribute('aria-expanded', 'false');
  }

  ui.search.addEventListener('input', () => {
    state.query = ui.search.value;
    renderSetList();
  });
  ui.flashcard.addEventListener('click', () => {
    if (!currentCard()) return;
    state.flipped = !state.flipped;
    renderCard();
  });
  ui.previous.addEventListener('click', () => move(-1));
  ui.next.addEventListener('click', () => move(1));
  ui.known.addEventListener('click', toggleKnown);
  ui.openOnly.addEventListener('change', () => {
    state.openOnly = ui.openOnly.checked;
    state.cursor = 0;
    state.flipped = false;
    renderCard();
  });
  ui.shuffle.addEventListener('click', () => {
    state.shuffled = !state.shuffled;
    ui.shuffle.setAttribute('aria-pressed', String(state.shuffled));
    resetOrder();
    renderCard();
  });
  ui.cardsTab.addEventListener('click', () => { state.mode = 'cards'; renderMode(); });
  ui.quizletTab.addEventListener('click', () => { state.mode = 'quizlet'; renderMode(); });
  ui.menuButton.addEventListener('click', () => {
    if (ui.sidebar.classList.contains('open')) closeMobileMenu(); else openMobileMenu();
  });
  ui.scrim.addEventListener('click', closeMobileMenu);
  ui.sourcesButton.addEventListener('click', () => ui.sourcesDialog.showModal());
  document.addEventListener('keydown', (event) => {
    if (ui.sourcesDialog.open) return;
    const target = event.target;
    if (target instanceof HTMLElement && (target.matches('input, textarea, button, a, select') || target.isContentEditable)) return;
    if (event.key === '/') { event.preventDefault(); ui.search.focus(); return; }
    if (state.mode !== 'cards') return;
    if (event.code === 'Space') { event.preventDefault(); ui.flashcard.click(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    if (event.key.toLowerCase() === 'm') { event.preventDefault(); toggleKnown(); }
  });

  ui.librarySummary.textContent = `${sets.length} Sets · ${sets.reduce((sum, set) => sum + set.cards.length, 0).toLocaleString('de-CH')} Karten`;
  resetOrder();
  renderFilters();
  render();
})();
