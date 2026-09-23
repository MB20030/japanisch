(() => {
  'use strict';

  const library = window.JP_DATA;
  const reference = window.JP_KANJI_REFERENCE || {};
  const materials = Array.isArray(window.JP_MATERIALS) ? window.JP_MATERIALS : [];
  const course = window.JP_COURSE_CONTENT || {};
  const byId = (id) => document.getElementById(id);
  const ui = {
    sidebar: byId('sidebar'), menuButton: byId('menu-button'), scrim: byId('mobile-scrim'),
    setCount: byId('set-count'), search: byId('search-input'), filters: byId('folder-filters'),
    setList: byId('set-list'), librarySummary: byId('library-summary'),
    breadcrumb: byId('breadcrumb-set'), title: byId('set-title'),
    description: byId('set-description'), details: byId('set-details'),
    artGlyph: byId('art-glyph'), artLabel: byId('art-label'), studyHeading: byId('study-heading'),
    quizletLink: byId('quizlet-link'), quizletOpen: byId('quizlet-open'),
    studyToolbar: byId('study-toolbar'), materialView: byId('material-view'),
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
  const materialMap = new Map(materials.map((material) => [material.id, material]));
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
  const materialProgressKey = 'kotoba-studio-material-progress-v1';
  const learned = new Set(readStoredArray(progressKey));
  const materialMastery = new Set(readStoredArray(materialProgressKey));
  const initial = getStored(lastSetKey);
  const linkedMaterial = new URLSearchParams(window.location.search).get('material');
  const initialMaterial = materialMap.get(linkedMaterial) || (initial?.startsWith('material:') ? materialMap.get(initial.slice(9)) : null);
  const preferred = sets.find((set) => set.cards.some((card) => card[0] === '新聞'));
  const state = {
    set: setMap.get(initial) || preferred || sets[0],
    material: initialMaterial || null,
    folder: 'Alle', query: '', cursor: 0, flipped: false,
    mode: 'cards', openOnly: false, shuffled: false, order: []
  };
  const materialSession = { activeId: '', panel: '', index: 0 };

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
    state.material = null;
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

  function selectMaterial(id) {
    const selected = materialMap.get(id);
    if (!selected) return;
    state.material = selected;
    state.mode = 'cards';
    saveStored(lastSetKey, `material:${selected.id}`);
    render();
    closeMobileMenu();
  }

  function makeElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function makeButton(className, text, onClick) {
    const button = makeElement('button', className, text);
    button.type = 'button';
    if (onClick) button.addEventListener('click', onClick);
    return button;
  }

  function masteredCount(materialId) {
    let count = 0;
    for (const key of materialMastery) if (key.startsWith(`${materialId}:`)) count++;
    return count;
  }

  function markMastered(key) {
    materialMastery.add(key);
    saveStored(materialProgressKey, JSON.stringify([...materialMastery]));
  }

  function renderFilters() {
    ui.filters.replaceChildren();
    const folders = ['Alle', ...new Set([...materials.map((item) => item.folder), ...sets.map((set) => set.folder)])];
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
    const entries = [
      ...materials.map((item) => ({ kind: 'material', item })),
      ...sets.map((item) => ({ kind: 'set', item }))
    ];
    const filtered = entries.filter(({ kind, item }) => {
      if (state.folder !== 'Alle' && item.folder !== state.folder) return false;
      if (!query) return true;
      const haystack = kind === 'material'
        ? `${item.title} ${item.folder} ${item.description} ${item.searchText || ''}`
        : `${item.title} ${item.folder} ${item.cards.map((card) => card.join(' ')).join(' ')}`;
      return haystack.toLocaleLowerCase('de').includes(query);
    });
    ui.setCount.textContent = String(filtered.length);
    ui.setList.replaceChildren();
    if (filtered.length === 0) {
      ui.setList.append(makeElement('p', 'empty-list', 'Keine passenden Sets gefunden.'));
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const { kind, item } of filtered) {
      const active = kind === 'material' ? item.id === state.material?.id : !state.material && item.id === state.set.id;
      const button = makeElement('button', `set-row${active ? ' active' : ''}`);
      button.type = 'button';
      button.setAttribute('aria-current', active ? 'true' : 'false');
      button.title = item.title;
      const iconText = kind === 'material' ? item.icon : item.folder.includes('Kanji') || item.folder.includes('漢字') ? '漢' : 'あ';
      const icon = makeElement('span', `set-row-icon${kind === 'material' ? ' material-icon' : ''}`, iconText);
      icon.setAttribute('aria-hidden', 'true');
      const main = makeElement('span', 'set-row-main');
      main.append(makeElement('span', 'set-row-title', item.title));
      const subline = kind === 'material'
        ? `${item.count} ${item.kind === 'course' ? 'Kapitel' : 'Übungen'} · ${masteredCount(item.id)} gelöst`
        : `${item.cards.length} Karten · ${knownCount(item)} gelernt`;
      main.append(makeElement('span', 'set-row-sub', subline));
      const arrow = makeElement('span', 'set-row-arrow', '›');
      arrow.setAttribute('aria-hidden', 'true');
      button.append(icon, main, arrow);
      button.addEventListener('click', () => kind === 'material' ? selectMaterial(item.id) : selectSet(item.id));
      fragment.append(button);
    }
    ui.setList.append(fragment);
  }

  function renderSetHeading() {
    if (state.material) {
      const material = state.material;
      ui.breadcrumb.textContent = material.title;
      ui.title.textContent = material.title;
      ui.description.textContent = material.description;
      ui.details.replaceChildren();
      for (const text of [material.folder, `${material.pages} PDF-Seiten`, `${masteredCount(material.id)} Übungen gelöst`]) {
        ui.details.append(makeElement('span', 'detail-chip', text));
      }
      ui.quizletLink.href = material.pdf;
      ui.quizletLink.replaceChildren(document.createTextNode('Original-PDF öffnen '), makeElement('span', '', '↗'));
      ui.artGlyph.textContent = material.icon;
      ui.artLabel.textContent = '読む · üben';
      ui.studyHeading.textContent = 'Interaktives Kursmaterial';
      return;
    }
    const set = state.set;
    ui.breadcrumb.textContent = set.title;
    ui.title.textContent = set.title;
    ui.description.textContent = `Lerne die ${set.cards.length} Karten dieses Sets und entdecke die Bedeutung der Kanji in zusammengesetzten Wörtern.`;
    ui.details.replaceChildren();
    for (const text of [displayFolder(set.folder), `${set.cards.length} Vokabeln`, `${knownCount(set)} gelernt`]) {
      ui.details.append(makeElement('span', 'detail-chip', text));
    }
    ui.quizletLink.href = set.url;
    ui.quizletLink.replaceChildren(document.createTextNode('Original auf Quizlet '), makeElement('span', '', '↗'));
    ui.quizletOpen.href = set.url;
    ui.artGlyph.textContent = '学';
    ui.artLabel.textContent = 'まなぶ · lernen';
    ui.studyHeading.textContent = 'Aktives Lernen';
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

  function shuffled(values) {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function ensureMaterialSession(defaultPanel) {
    if (materialSession.activeId === state.material.id) return;
    materialSession.activeId = state.material.id;
    materialSession.panel = new URLSearchParams(window.location.search).get('panel') || defaultPanel;
    materialSession.index = 0;
  }

  function renderMaterialTabs(tabs) {
    const nav = makeElement('div', 'material-tabs');
    nav.setAttribute('role', 'tablist');
    for (const [id, label] of tabs) {
      const active = materialSession.panel === id;
      const button = makeButton(`material-tab${active ? ' active' : ''}`, label, () => {
        materialSession.panel = id;
        materialSession.index = 0;
        renderMaterial();
      });
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', String(active));
      nav.append(button);
    }
    return nav;
  }

  function renderChoiceExercise({ key, eyebrow = 'Kurztraining', prompt, context, choices, answer, explanation, next }) {
    const card = makeElement('section', 'choice-exercise');
    card.append(makeElement('p', 'eyebrow', eyebrow));
    card.append(makeElement('h3', 'exercise-prompt', prompt));
    if (context) card.append(makeElement('p', 'exercise-context', context));
    const options = makeElement('div', 'choice-options');
    const feedback = makeElement('p', 'choice-feedback');
    feedback.setAttribute('aria-live', 'polite');
    let answered = false;
    for (const choice of choices) {
      const button = makeButton('choice-button', choice, () => {
        if (answered) return;
        answered = true;
        const correct = choice === answer;
        for (const option of options.querySelectorAll('button')) {
          option.disabled = true;
          if (option.textContent === answer) option.classList.add('correct');
        }
        button.classList.add(correct ? 'correct' : 'incorrect');
        feedback.textContent = `${correct ? 'Richtig.' : `Noch nicht – richtig ist „${answer}“.`} ${explanation || ''}`;
        feedback.classList.add(correct ? 'success' : 'error');
        if (correct) {
          markMastered(`${state.material.id}:${key}`);
          renderSetList();
        }
        if (next) card.append(makeButton('next-exercise', 'Nächste Aufgabe →', next));
      });
      options.append(button);
    }
    card.append(options, feedback);
    return card;
  }

  function renderAlphabetMaterial() {
    ensureMaterialSession('overview');
    ui.materialView.append(renderMaterialTabs([['overview', 'Alphabet'], ['quiz', 'Quiz']]));
    if (materialSession.panel === 'overview') {
      const intro = makeElement('div', 'lesson-callout');
      intro.append(makeElement('p', 'eyebrow', 'A bis Z'));
      intro.append(makeElement('h3', '', 'Tippe eine Karte an und decke die japanische Lesung auf.'));
      intro.append(makeElement('p', '', 'Die langen Vokale sind in der Vorlage doppelt geschrieben, zum Beispiel bii, tii und yuu.'));
      ui.materialView.append(intro);
      const grid = makeElement('div', 'alphabet-grid');
      for (const item of course.alphabet) {
        const button = makeButton('alphabet-card', '', () => {
          const open = button.classList.toggle('revealed');
          button.setAttribute('aria-expanded', String(open));
        });
        button.setAttribute('aria-expanded', 'false');
        button.append(makeElement('span', 'alphabet-letter', item.letter), makeElement('span', 'alphabet-reading', item.reading));
        grid.append(button);
      }
      ui.materialView.append(grid);
      return;
    }

    const item = course.alphabet[materialSession.index % course.alphabet.length];
    const other = shuffled(course.alphabet.filter((candidate) => candidate !== item)).slice(0, 3).map((candidate) => candidate.reading);
    ui.materialView.append(renderChoiceExercise({
      key: `alphabet-${item.letter}`,
      eyebrow: `Buchstabe ${materialSession.index + 1} von ${course.alphabet.length}`,
      prompt: `Wie heißt „${item.letter}“ auf Japanisch?`,
      context: 'Wähle die Lesung aus der PDF-Übersicht.',
      choices: shuffled([item.reading, ...other]), answer: item.reading,
      explanation: `${item.letter} wird ${item.reading} gesprochen.`,
      next: () => { materialSession.index = (materialSession.index + 1) % course.alphabet.length; renderMaterial(); }
    }));
  }

  function renderQuestionMaterial() {
    ensureMaterialSession('overview');
    ui.materialView.append(renderMaterialTabs([['overview', 'Fragewörter'], ['quiz', 'Satztraining']]));
    if (materialSession.panel === 'overview') {
      const intro = makeElement('div', 'lesson-callout');
      intro.append(makeElement('p', 'eyebrow', 'Funktion entscheidet'));
      intro.append(makeElement('h3', '', 'Fragewörter zusammen mit ihren Partikeln lernen.'));
      intro.append(makeElement('p', '', 'Klicke eine Karte an, um Beispielsatz und Übersetzung ein- oder auszublenden.'));
      ui.materialView.append(intro);
      const grid = makeElement('div', 'question-grid');
      for (const item of course.questionWords) {
        const button = makeButton('question-card', '', () => {
          const open = button.classList.toggle('revealed');
          button.setAttribute('aria-expanded', String(open));
        });
        button.setAttribute('aria-expanded', 'false');
        const top = makeElement('span', 'question-card-top');
        const kana = makeElement('span', 'question-kana', item.kana);
        kana.lang = 'ja';
        top.append(kana, makeElement('span', 'question-romaji', item.romaji));
        button.append(top, makeElement('span', 'question-meaning', item.meaning), makeElement('span', 'question-note', item.note));
        const example = makeElement('span', 'question-example');
        example.append(makeElement('span', 'question-jp', item.jp), makeElement('span', 'question-de', item.de));
        button.append(example);
        grid.append(button);
      }
      ui.materialView.append(grid);
      return;
    }

    const item = course.questionWords[materialSession.index % course.questionWords.length];
    const other = shuffled(course.questionWords.filter((candidate) => candidate !== item))
      .map((candidate) => candidate.romaji).filter((value, index, values) => values.indexOf(value) === index).slice(0, 3);
    ui.materialView.append(renderChoiceExercise({
      key: `question-${materialSession.index % course.questionWords.length}`,
      eyebrow: `Satz ${materialSession.index + 1} von ${course.questionWords.length}`,
      prompt: item.de,
      context: item.jp.replace(item.kana.split(' / ')[0], '＿＿'),
      choices: shuffled([item.romaji, ...other]), answer: item.romaji,
      explanation: `${item.kana} (${item.romaji}) bedeutet hier „${item.meaning}“. Vollständig: ${item.jp}`,
      next: () => { materialSession.index = (materialSession.index + 1) % course.questionWords.length; renderMaterial(); }
    }));
  }

  const numberReadings = ['', 'ichi', 'ni', 'san', 'yon', 'go', 'roku', 'nana', 'hachi', 'kyū'];
  const numberKanji = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

  function japaneseNumber(value) {
    let number = Math.max(0, Math.min(99999, Number.parseInt(value, 10) || 0));
    if (number === 0) return { romaji: 'zero / rei', kanji: '零' };
    const readings = [];
    const kanji = [];
    const addGroup = (amount, unit) => {
      if (!amount) return;
      if (unit === 10000) {
        const leading = japaneseNumber(amount);
        readings.push(`${leading.romaji}man`);
        kanji.push(`${leading.kanji}万`);
      } else if (unit === 1000) {
        const special = { 1: 'sen', 3: 'sanzen', 8: 'hassen' };
        readings.push(special[amount] || `${numberReadings[amount]}sen`);
        kanji.push(`${amount === 1 ? '' : numberKanji[amount]}千`);
      } else if (unit === 100) {
        const special = { 1: 'hyaku', 3: 'sanbyaku', 6: 'roppyaku', 8: 'happyaku' };
        readings.push(special[amount] || `${numberReadings[amount]}hyaku`);
        kanji.push(`${amount === 1 ? '' : numberKanji[amount]}百`);
      } else if (unit === 10) {
        readings.push(amount === 1 ? 'jū' : `${numberReadings[amount]}jū`);
        kanji.push(`${amount === 1 ? '' : numberKanji[amount]}十`);
      } else {
        readings.push(numberReadings[amount]);
        kanji.push(numberKanji[amount]);
      }
    };
    const tenThousands = Math.floor(number / 10000);
    if (tenThousands) { addGroup(tenThousands, 10000); number %= 10000; }
    const thousands = Math.floor(number / 1000);
    if (thousands) { addGroup(thousands, 1000); number %= 1000; }
    const hundreds = Math.floor(number / 100);
    if (hundreds) { addGroup(hundreds, 100); number %= 100; }
    const tens = Math.floor(number / 10);
    if (tens) { addGroup(tens, 10); number %= 10; }
    if (number) addGroup(number, 1);
    return { romaji: readings.join(''), kanji: kanji.join('') };
  }

  function renderNumberBuilder(container, initialValue = 2026) {
    const builder = makeElement('section', 'number-builder');
    const label = makeElement('label', 'number-input-label');
    label.append(makeElement('span', '', 'Zahl eingeben (0–99.999)'), Object.assign(document.createElement('input'), { type: 'number', min: '0', max: '99999', value: String(initialValue) }));
    const input = label.querySelector('input');
    const output = makeElement('div', 'number-output');
    const renderValue = () => {
      const value = Math.max(0, Math.min(99999, Number.parseInt(input.value, 10) || 0));
      const converted = japaneseNumber(value);
      output.replaceChildren(makeElement('span', 'number-kanji', converted.kanji), makeElement('strong', 'number-romaji', converted.romaji));
    };
    input.addEventListener('input', renderValue);
    builder.append(label, output);
    renderValue();
    container.append(builder);
  }

  function renderNumberMaterial() {
    ensureMaterialSession('builder');
    ui.materialView.append(renderMaterialTabs([['builder', 'Zahlentrainer'], ['quiz', 'Zufallsquiz']]));
    if (materialSession.panel === 'builder') {
      const intro = makeElement('div', 'lesson-callout');
      intro.append(makeElement('p', 'eyebrow', 'Bausteinprinzip'));
      intro.append(makeElement('h3', '', 'Japanische Zahlen werden von groß nach klein zusammengesetzt.'));
      intro.append(makeElement('p', '', 'Beispiele: 21 = nijūichi, 300 = sanbyaku, 600 = roppyaku, 3.000 = sanzen und 8.000 = hassen.'));
      ui.materialView.append(intro);
      renderNumberBuilder(ui.materialView);
      const irregular = makeElement('div', 'reference-strip');
      for (const [value, reading] of [['300', 'sanbyaku'], ['600', 'roppyaku'], ['800', 'happyaku'], ['3.000', 'sanzen'], ['8.000', 'hassen'], ['10.000', 'ichiman']]) {
        const item = makeElement('div', 'reference-item');
        item.append(makeElement('strong', '', value), makeElement('span', '', reading));
        irregular.append(item);
      }
      ui.materialView.append(irregular);
      return;
    }

    const number = 1 + Math.floor(Math.random() * 9999);
    const answer = japaneseNumber(number).romaji;
    const wrongValues = new Set();
    while (wrongValues.size < 3) {
      const offset = [1, 10, 100, -1, -10][Math.floor(Math.random() * 5)];
      const candidate = Math.max(1, Math.min(9999, number + offset));
      if (candidate !== number) wrongValues.add(japaneseNumber(candidate).romaji);
    }
    ui.materialView.append(renderChoiceExercise({
      key: `number-${number}`,
      prompt: `Wie liest man ${number.toLocaleString('de-CH')}?`,
      context: japaneseNumber(number).kanji,
      choices: shuffled([answer, ...wrongValues]), answer,
      explanation: `${number.toLocaleString('de-CH')} = ${japaneseNumber(number).kanji} = ${answer}.`,
      next: () => { materialSession.index++; renderMaterial(); }
    }));
  }

  function renderThemeLesson() {
    const callout = makeElement('div', 'lesson-callout');
    callout.append(makeElement('p', 'eyebrow', 'Thema + Rhema'));
    callout.append(makeElement('h3', '', 'Das Thema kündigt an, worüber gesprochen wird. Das Rhema liefert die neue Information.'));
    callout.append(makeElement('p', '', 'Die Partikel は (wa) schließt das Thema ab. Ein grammatisches Subjekt muss im Japanischen nicht ausgesprochen werden, wenn Bild oder Gesprächssituation es eindeutig machen.'));
    ui.materialView.append(callout);
    const sentence = makeElement('div', 'sentence-diagram');
    const topic = makeElement('div', 'sentence-part topic-part');
    topic.append(makeElement('span', 'eyebrow', 'Thema'), makeElement('strong', '', '私は'), makeElement('small', '', 'watashi wa'));
    const comment = makeElement('div', 'sentence-part comment-part');
    comment.append(makeElement('span', 'eyebrow', 'Rhema'), makeElement('strong', '', 'ボルボです。'), makeElement('small', '', 'borubo desu'));
    sentence.append(topic, comment);
    ui.materialView.append(sentence);
    const examples = makeElement('div', 'lesson-example-grid');
    for (const [jp, reading, de] of [
      ['日本は、おいしい。', 'nihon wa, oishii.', 'Mit dem Hähnchenbild als stillem Subjekt: „Was Japan betrifft: [Das Hähnchen] schmeckt gut.“'],
      ['私は、ビールです。', 'watashi wa, biiru desu.', 'In einer Bestellung: „Was mich betrifft: Bier.“'],
      ['夏は、ビールだ。', 'natsu wa, biiru da.', '„Was den Sommer betrifft: Das richtige Getränk ist Bier.“']
    ]) {
      const card = makeElement('article', 'lesson-example');
      card.append(makeElement('strong', 'jp-example', jp), makeElement('span', '', reading), makeElement('p', '', de));
      examples.append(card);
    }
    ui.materialView.append(examples);
    ui.materialView.append(renderChoiceExercise({
      key: 'course-theme', prompt: 'Welche Aussage beschreibt は am besten?',
      choices: shuffled(['Es markiert das Gesprächsthema.', 'Es markiert immer das direkte Objekt.', 'Es steht nur in Fragen.', 'Es zählt Personen.']),
      answer: 'Es markiert das Gesprächsthema.',
      explanation: 'は ist die Themapartikel. Das Subjekt kann mit dem Thema übereinstimmen, muss es aber nicht.'
    }));
  }

  function renderParticleLesson() {
    const callout = makeElement('div', 'lesson-callout');
    callout.append(makeElement('p', 'eyebrow', 'Navigationshilfen im Satz'));
    callout.append(makeElement('h3', '', 'Partikeln zeigen nachträglich die Funktion des Wortes vor ihnen.'));
    callout.append(makeElement('p', '', 'Achte auf die besondere Schreibweise: wa = は, o = を und e = へ.'));
    ui.materialView.append(callout);
    const grid = makeElement('div', 'particle-grid');
    for (const item of course.particles) {
      const card = makeButton('particle-card', '', () => card.classList.toggle('revealed'));
      const top = makeElement('span', 'particle-top');
      const kana = makeElement('strong', 'particle-kana', item.kana);
      kana.lang = 'ja';
      top.append(kana, makeElement('span', 'particle-romaji', item.romaji));
      card.append(top, makeElement('span', 'particle-function', item.function));
      const example = makeElement('span', 'particle-example');
      example.append(makeElement('span', 'jp-example', item.example), makeElement('span', '', item.translation));
      card.append(example);
      grid.append(card);
    }
    ui.materialView.append(grid);
    const drill = course.particleDrills[materialSession.index % course.particleDrills.length];
    ui.materialView.append(renderChoiceExercise({
      key: `course-particle-${materialSession.index % course.particleDrills.length}`,
      prompt: drill.prompt, context: drill.de, choices: shuffled(drill.options), answer: drill.answer,
      explanation: drill.explanation,
      next: () => { materialSession.index = (materialSession.index + 1) % course.particleDrills.length; renderMaterial(); }
    }));
  }

  const hourReadings = ['', 'ichiji', 'niji', 'sanji', 'yoji', 'goji', 'rokuji', 'shichiji', 'hachiji', 'kuji', 'jūji', 'jūichiji', 'jūniji'];
  const minuteEndings = ['', 'ippun', 'nifun', 'sanpun', 'yonpun', 'gofun', 'roppun', 'nanafun', 'happun', 'kyūfun'];

  function minuteReading(minute) {
    if (minute === 0) return '';
    if (minute === 30) return 'han';
    const tens = Math.floor(minute / 10);
    const ones = minute % 10;
    const tensReading = tens ? (tens === 1 ? 'jū' : `${numberReadings[tens]}jū`) : '';
    if (!ones) return `${tens === 1 ? 'jup' : `${numberReadings[tens]}jup`}pun`;
    return `${tensReading}${minuteEndings[ones]}`;
  }

  function renderTimeLesson() {
    const callout = makeElement('div', 'lesson-callout');
    callout.append(makeElement('p', 'eyebrow', 'Uhrzeit'));
    callout.append(makeElement('h3', '', 'Stunde + ji, Minute + fun/pun. Vier und neun haben eigene Stundenlesungen.'));
    callout.append(makeElement('p', '', '4 Uhr = yoji, 7 Uhr = shichiji, 9 Uhr = kuji. 30 Minuten kann mit han („halb“) ausgedrückt werden.'));
    ui.materialView.append(callout);
    const builder = makeElement('section', 'time-builder');
    const hourLabel = makeElement('label', '', 'Stunde');
    const hour = document.createElement('select');
    for (let i = 1; i <= 12; i++) hour.append(new Option(String(i), String(i)));
    const minuteLabel = makeElement('label', '', 'Minute');
    const minute = document.createElement('select');
    for (let i = 0; i < 60; i += 5) minute.append(new Option(String(i).padStart(2, '0'), String(i)));
    minute.value = '30';
    hourLabel.append(hour); minuteLabel.append(minute);
    const output = makeElement('div', 'time-output');
    const update = () => {
      const h = Number(hour.value); const m = Number(minute.value);
      output.textContent = `${h}:${String(m).padStart(2, '0')}  →  ${hourReadings[h]}${m ? ` ${minuteReading(m)}` : ''}`;
    };
    hour.addEventListener('change', update); minute.addEventListener('change', update);
    builder.append(hourLabel, minuteLabel, output); update();
    ui.materialView.append(builder);
    ui.materialView.append(renderChoiceExercise({
      key: 'course-time', prompt: 'Wie heißt 4:30 Uhr?',
      choices: shuffled(['yoji han', 'yonji sanjūfun', 'shiji han', 'kuji han']), answer: 'yoji han',
      explanation: '4 Uhr heißt yoji; eine halbe Stunde heißt han.'
    }));
  }

  const monthReadings = ['', 'ichigatsu', 'nigatsu', 'sangatsu', 'shigatsu', 'gogatsu', 'rokugatsu', 'shichigatsu', 'hachigatsu', 'kugatsu', 'jūgatsu', 'jūichigatsu', 'jūnigatsu'];
  const specialDays = { 1: 'tsuitachi', 2: 'futsuka', 3: 'mikka', 4: 'yokka', 5: 'itsuka', 6: 'muika', 7: 'nanoka', 8: 'yōka', 9: 'kokonoka', 10: 'tōka', 14: 'jūyokka', 20: 'hatsuka', 24: 'nijūyokka' };

  function dayReading(day) {
    return specialDays[day] || `${japaneseNumber(day).romaji}nichi`;
  }

  function renderDateLesson() {
    const callout = makeElement('div', 'lesson-callout');
    callout.append(makeElement('p', 'eyebrow', 'Datum'));
    callout.append(makeElement('h3', '', 'Japanische Daten folgen der Reihenfolge Jahr – Monat – Tag.'));
    callout.append(makeElement('p', '', 'Die Tage 1–10 sowie 14, 20 und 24 haben besondere Lesungen. Juli heißt shichigatsu, September kugatsu.'));
    ui.materialView.append(callout);
    const builder = makeElement('section', 'time-builder');
    const monthLabel = makeElement('label', '', 'Monat');
    const month = document.createElement('select');
    for (let i = 1; i <= 12; i++) month.append(new Option(String(i), String(i)));
    const dayLabel = makeElement('label', '', 'Tag');
    const day = document.createElement('select');
    for (let i = 1; i <= 31; i++) day.append(new Option(String(i), String(i)));
    month.value = '7'; day.value = '24';
    monthLabel.append(month); dayLabel.append(day);
    const output = makeElement('div', 'time-output');
    const update = () => { output.textContent = `${month.value}.${day.value}.  →  ${monthReadings[Number(month.value)]} ${dayReading(Number(day.value))}`; };
    month.addEventListener('change', update); day.addEventListener('change', update);
    builder.append(monthLabel, dayLabel, output); update();
    ui.materialView.append(builder);
    const special = makeElement('div', 'reference-strip');
    for (const dayNumber of [1, 2, 3, 4, 7, 8, 9, 10, 14, 20, 24]) {
      const item = makeElement('div', 'reference-item');
      item.append(makeElement('strong', '', `${dayNumber}.`), makeElement('span', '', dayReading(dayNumber)));
      special.append(item);
    }
    ui.materialView.append(special);
  }

  function adjectiveForms(adjective) {
    if (adjective.type === 'i') {
      const stem = adjective.word.slice(0, -1);
      return [
        ['Präsens positiv', adjective.word], ['Präsens negativ', `${stem}kunai`],
        ['Vergangenheit positiv', `${stem}katta`], ['Vergangenheit negativ', `${stem}kunakatta`],
        ['Vor einem Nomen', adjective.word]
      ];
    }
    return [
      ['Präsens positiv', `${adjective.word} desu`], ['Präsens negativ', `${adjective.word} de wa arimasen`],
      ['Vergangenheit positiv', `${adjective.word} deshita`], ['Vergangenheit negativ', `${adjective.word} de wa arimasen deshita`],
      ['Vor einem Nomen', `${adjective.word} na`]
    ];
  }

  function renderAdjectiveLesson() {
    const callout = makeElement('div', 'lesson-callout');
    callout.append(makeElement('p', 'eyebrow', 'i- und na-Adjektive'));
    callout.append(makeElement('h3', '', 'i-Adjektive beugen ihre Endung; na-Adjektive verwenden Hilfsformen.'));
    callout.append(makeElement('p', '', 'Vor einem Nomen bleibt das i erhalten. Ein na-Adjektiv erhält in attributiver Stellung ein na.'));
    ui.materialView.append(callout);
    const builder = makeElement('section', 'adjective-builder');
    const select = document.createElement('select');
    course.adjectives.forEach((item, index) => select.append(new Option(`${item.word} – ${item.meaning}`, String(index))));
    select.value = String(course.adjectives.findIndex((item) => item.word === 'takai'));
    const output = makeElement('div', 'conjugation-grid');
    const update = () => {
      const adjective = course.adjectives[Number(select.value)];
      output.replaceChildren();
      for (const [label, form] of adjectiveForms(adjective)) {
        const row = makeElement('div', 'conjugation-row');
        row.append(makeElement('span', '', label), makeElement('strong', '', form));
        output.append(row);
      }
    };
    select.addEventListener('change', update);
    builder.append(select, output); update();
    ui.materialView.append(builder);
    const vocabulary = makeElement('div', 'adjective-list');
    for (const item of course.adjectives) {
      const row = makeElement('div', 'adjective-item');
      row.append(makeElement('span', `type-badge ${item.type}-type`, `${item.type}-Adj`), makeElement('strong', '', item.word), makeElement('span', '', item.meaning));
      vocabulary.append(row);
    }
    ui.materialView.append(vocabulary);
    ui.materialView.append(renderChoiceExercise({
      key: 'course-adjective', prompt: 'Welche Form bedeutet „war nicht teuer“?',
      choices: shuffled(['takakunakatta', 'takakunai', 'taka katta', 'takai na']), answer: 'takakunakatta',
      explanation: 'Beim i-Adjektiv takai lautet die negative Vergangenheit taka + kunakatta.'
    }));
  }

  function renderCourseQuiz() {
    const drills = [
      ...course.particleDrills.map((item, index) => ({ ...item, key: `mix-particle-${index}` })),
      { key: 'mix-theme', prompt: 'Was liefert das Rhema?', de: 'Thema und Rhema', answer: 'Die neue Information zum Thema.', options: ['Die neue Information zum Thema.', 'Immer das Subjekt.', 'Nur eine Zeitangabe.', 'Die Aussprache des Kanji.'], explanation: 'Das Thema setzt den Rahmen; das Rhema teilt Neues dazu mit.' },
      { key: 'mix-date', prompt: 'Wie liest man den 20. Tag eines Monats?', de: 'Datum', answer: 'hatsuka', options: ['hatsuka', 'nijūnichi', 'yokka', 'tsuitachi'], explanation: 'Der 20. Tag ist eine der besonderen Datumslesungen.' },
      { key: 'mix-adjective', prompt: 'Welche Form steht vor „tatemono“, wenn das Gebäude eindrücklich ist?', de: 'Adjektive', answer: 'rippa na', options: ['rippa na', 'rippai', 'rippa kunai', 'rippa o'], explanation: 'Na-Adjektive erhalten vor einem Nomen ein na.' }
    ];
    const drill = drills[materialSession.index % drills.length];
    ui.materialView.append(renderChoiceExercise({
      key: `course-${drill.key}`, eyebrow: `Mischquiz ${materialSession.index + 1} von ${drills.length}`,
      prompt: drill.prompt, context: drill.de, choices: shuffled(drill.options), answer: drill.answer,
      explanation: drill.explanation,
      next: () => { materialSession.index = (materialSession.index + 1) % drills.length; renderMaterial(); }
    }));
  }

  function renderCourseMaterial() {
    ensureMaterialSession('theme');
    const tabs = [['theme', 'Satzbau'], ['particles', 'Partikeln'], ['numbers', 'Zahlen'], ['time', 'Uhrzeit'], ['date', 'Datum'], ['adjectives', 'Adjektive'], ['quiz', 'Mischquiz']];
    ui.materialView.append(renderMaterialTabs(tabs));
    if (materialSession.panel === 'theme') renderThemeLesson();
    else if (materialSession.panel === 'particles') renderParticleLesson();
    else if (materialSession.panel === 'numbers') {
      const callout = makeElement('div', 'lesson-callout');
      callout.append(makeElement('p', 'eyebrow', 'Zahlensystem'));
      callout.append(makeElement('h3', '', 'Die Einheiten jū, hyaku, sen und man strukturieren große Zahlen.'));
      callout.append(makeElement('p', '', 'Achte besonders auf sanbyaku, roppyaku, happyaku, sanzen und hassen. Probiere die Zusammensetzung direkt aus.'));
      ui.materialView.append(callout);
      renderNumberBuilder(ui.materialView, 52931);
      ui.materialView.append(makeButton('material-link-button', 'Zum vollständigen Zahlenquiz →', () => selectMaterial('pdf-numbers')));
    } else if (materialSession.panel === 'time') renderTimeLesson();
    else if (materialSession.panel === 'date') renderDateLesson();
    else if (materialSession.panel === 'adjectives') renderAdjectiveLesson();
    else renderCourseQuiz();
  }

  function renderMaterial() {
    if (!state.material) return;
    ui.materialView.replaceChildren();
    if (state.material.kind === 'alphabet') renderAlphabetMaterial();
    else if (state.material.kind === 'questions') renderQuestionMaterial();
    else if (state.material.kind === 'numbers') renderNumberMaterial();
    else renderCourseMaterial();
  }

  function renderMode() {
    if (state.material) {
      ui.cardsView.classList.add('hidden');
      ui.quizletView.classList.add('hidden');
      ui.studyToolbar.classList.add('hidden');
      ui.materialView.classList.remove('hidden');
      return;
    }
    const cardsMode = state.mode === 'cards';
    ui.materialView.classList.add('hidden');
    ui.studyToolbar.classList.remove('hidden');
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
    if (state.material) renderMaterial(); else renderCard();
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
    if (state.material) return;
    if (state.mode !== 'cards') return;
    if (event.code === 'Space') { event.preventDefault(); ui.flashcard.click(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    if (event.key.toLowerCase() === 'm') { event.preventDefault(); toggleKnown(); }
  });

  ui.librarySummary.textContent = `${materials.length} Module · ${sets.length} Sets · ${sets.reduce((sum, set) => sum + set.cards.length, 0).toLocaleString('de-CH')} Karten`;
  resetOrder();
  renderFilters();
  render();
})();
