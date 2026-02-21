// ============================
// BLOQUE 3 — Notas, Proyectos,
// Calendario, Links, Salas v2
// ============================

// ============================
// NOTAS
// ============================
let notes = [];
let activeNote = null;

function loadNotes() {
  notes = JSON.parse(ld('notes') || '[]');
  renderNotesList();
}
function saveNotes() { sv('notes', JSON.stringify(notes)); }

function createNote() {
  const note = {
    id: Date.now(),
    title: 'Nueva nota',
    content: '',
    color: 'default',
    pinned: false,
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  };
  notes.unshift(note);
  saveNotes();
  renderNotesList();
  openNote(note.id);
  sndClick();
}

function openNote(id) {
  activeNote = id;
  const note = notes.find(n => n.id === id);
  if (!note) return;
  document.getElementById('note-editor-area').style.display = 'flex';
  document.getElementById('note-empty').style.display = 'none';
  document.getElementById('note-title-input').value = note.title;
  document.getElementById('note-content-input').value = note.content;
  document.getElementById('note-updated').textContent = `Actualizado: ${new Date(note.updated).toLocaleString('es-MX')}`;
  renderNotesList();
}

function saveActiveNote() {
  if (!activeNote) return;
  const note = notes.find(n => n.id === activeNote);
  if (!note) return;
  note.title = document.getElementById('note-title-input').value || 'Sin título';
  note.content = document.getElementById('note-content-input').value;
  note.updated = new Date().toISOString();
  saveNotes();
  renderNotesList();
  document.getElementById('note-updated').textContent = `Actualizado: ${new Date(note.updated).toLocaleString('es-MX')}`;
}

function deleteActiveNote() {
  if (!activeNote) return;
  if (!confirm('¿Eliminar esta nota?')) return;
  notes = notes.filter(n => n.id !== activeNote);
  activeNote = null;
  saveNotes();
  renderNotesList();
  document.getElementById('note-editor-area').style.display = 'none';
  document.getElementById('note-empty').style.display = 'flex';
  sndClick();
}

function togglePinNote() {
  if (!activeNote) return;
  const note = notes.find(n => n.id === activeNote);
  if (!note) return;
  note.pinned = !note.pinned;
  saveNotes();
  renderNotesList();
  sndClick();
}

function renderNotesList() {
  const list = document.getElementById('notes-list');
  const search = (document.getElementById('notes-search') || {}).value || '';
  let filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );
  const pinned = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);
  const sorted = [...pinned, ...unpinned];

  if (!sorted.length) {
    list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.82rem">Sin notas. Crea una ✨</div>';
    return;
  }
  list.innerHTML = sorted.map(n => `
    <div class="note-item${n.id === activeNote ? ' active' : ''}" onclick="openNote(${n.id})">
      <div class="note-item-title">${n.pinned ? '📌 ' : ''}${n.title}</div>
      <div class="note-item-preview">${n.content.slice(0, 60) || 'Sin contenido...'}</div>
      <div class="note-item-date">${new Date(n.updated).toLocaleDateString('es-MX')}</div>
    </div>
  `).join('');
}

// ============================
// PROYECTOS KANBAN
// ============================
const COLS = [
  { id: 'backlog', label: '📋 Backlog' },
  { id: 'todo', label: '📌 Por hacer' },
  { id: 'doing', label: '⚡ En progreso' },
  { id: 'done', label: '✅ Hecho' }
];
let kanban = {};
let dragCard = null;

function loadKanban() {
  kanban = JSON.parse(ld('kanban') || '{"backlog":[],"todo":[],"doing":[],"done":[]}');
  COLS.forEach(c => { if (!kanban[c.id]) kanban[c.id] = []; });
  renderKanban();
}
function saveKanban() { sv('kanban', JSON.stringify(kanban)); }

function addKanbanCard(colId) {
  const inp = document.getElementById(`kinp-${colId}`);
  const text = inp.value.trim();
  if (!text) return;
  kanban[colId].push({ id: Date.now(), text, priority: 'med', created: new Date().toISOString() });
  saveKanban();
  renderKanban();
  sndClick();
}

function deleteKanbanCard(colId, cardId) {
  kanban[colId] = kanban[colId].filter(c => c.id !== cardId);
  saveKanban();
  renderKanban();
}

function renderKanban() {
  COLS.forEach(col => {
    const colEl = document.getElementById(`kcol-${col.id}`);
    if (!colEl) return;
    const cards = kanban[col.id] || [];
    const count = document.getElementById(`kcount-${col.id}`);
    if (count) count.textContent = cards.length;
    const list = document.getElementById(`klist-${col.id}`);
    if (!list) return;
    list.innerHTML = cards.map(card => `
      <div class="k-card" draggable="true"
        ondragstart="dragCard={id:${card.id},from:'${col.id}'}"
        ondragend="dragCard=null">
        <div class="k-card-text">${card.text}</div>
        <button class="k-card-del" onclick="deleteKanbanCard('${col.id}',${card.id})">✕</button>
      </div>
    `).join('');
  });
}

function kanbanDrop(colId) {
  if (!dragCard) return;
  const card = kanban[dragCard.from].find(c => c.id === dragCard.id);
  if (!card) return;
  kanban[dragCard.from] = kanban[dragCard.from].filter(c => c.id !== dragCard.id);
  kanban[colId].push(card);
  saveKanban();
  renderKanban();
  sndClick();
}

// ============================
// CALENDARIO
// ============================
let calYear, calMonth;
let calEvents = {};

function loadCalendar() {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  calEvents = JSON.parse(ld('cal-events') || '{}');
  renderCalendar();
}
function saveCalEvents() { sv('cal-events', JSON.stringify(calEvents)); }

function renderCalendar() {
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  document.getElementById('cal-title').textContent = `${monthNames[calMonth]} ${calYear}`;

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();

  let html = '';
  // Headers
  ['D','L','M','X','J','V','S'].forEach(d => {
    html += `<div class="cal-header-cell">${d}</div>`;
  });
  // Empty cells
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-cell empty"></div>';
  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${calYear}-${calMonth+1}-${d}`;
    const evs = calEvents[key] || [];
    const isToday = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
    html += `<div class="cal-cell${isToday ? ' today' : ''}" onclick="calDayClick('${key}', ${d})">
      <div class="cal-day-num">${d}</div>
      ${evs.slice(0, 2).map(e => `<div class="cal-event-dot" title="${e}">${e.slice(0,12)}${e.length>12?'…':''}</div>`).join('')}
      ${evs.length > 2 ? `<div class="cal-more">+${evs.length-2}</div>` : ''}
    </div>`;
  }
  document.getElementById('cal-grid').innerHTML = html;
}

function calPrev() { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); }
function calNext() { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); }

function calDayClick(key, day) {
  const evs = calEvents[key] || [];
  const txt = prompt(`Eventos del día ${day}:\n${evs.join('\n') || 'Sin eventos'}\n\nEscribe un nuevo evento (o cancela):`);
  if (txt && txt.trim()) {
    if (!calEvents[key]) calEvents[key] = [];
    calEvents[key].push(txt.trim());
    saveCalEvents();
    renderCalendar();
    sndClick();
  }
}

function calDeleteEvents(key) {
  delete calEvents[key];
  saveCalEvents();
  renderCalendar();
}

// ============================
// LINKS
// ============================
let links = [];

function loadLinks() {
  links = JSON.parse(ld('links') || '[]');
  renderLinks();
}
function saveLinks() { sv('links', JSON.stringify(links)); }

function addLink() {
  const name = document.getElementById('link-name').value.trim();
  const url = document.getElementById('link-url').value.trim();
  const cat = document.getElementById('link-cat').value.trim() || 'General';
  if (!name || !url) return;
  const fullUrl = url.startsWith('http') ? url : 'https://' + url;
  links.unshift({ id: Date.now(), name, url: fullUrl, cat, created: Date.now() });
  saveLinks();
  renderLinks();
  document.getElementById('link-name').value = '';
  document.getElementById('link-url').value = '';
  document.getElementById('link-cat').value = '';
  sndClick();
}

function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

function renderLinks() {
  const cats = [...new Set(links.map(l => l.cat))];
  const search = (document.getElementById('links-search') || {}).value || '';
  const filtered = links.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.url.toLowerCase().includes(search.toLowerCase()) ||
    l.cat.toLowerCase().includes(search.toLowerCase())
  );
  const container = document.getElementById('links-container');
  if (!filtered.length) {
    container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:40px;font-size:0.85rem">Sin links guardados. Agrega uno ✨</div>';
    return;
  }
  const byCat = {};
  filtered.forEach(l => { if (!byCat[l.cat]) byCat[l.cat] = []; byCat[l.cat].push(l); });
  container.innerHTML = Object.entries(byCat).map(([cat, items]) => `
    <div class="links-group">
      <div class="links-cat-title">${cat}</div>
      <div class="links-grid">
        ${items.map(l => `
          <div class="link-card" onclick="window.open('${l.url}','_blank')">
            <img class="link-favicon" src="https://www.google.com/s2/favicons?domain=${l.url}&sz=32" alt="">
            <div class="link-info">
              <div class="link-name">${l.name}</div>
              <div class="link-url">${l.url.replace('https://','').slice(0,30)}${l.url.length>30?'…':''}</div>
            </div>
            <button class="link-del" onclick="event.stopPropagation();deleteLink(${l.id})">✕</button>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// ============================
// SALAS v2 — fondo + playlist
// ============================
const ROOM_PLAYLISTS = {
  1: 'https://www.youtube.com/results?search_query=lofi+hip+hop+cafe+study+music',
  2: 'https://www.youtube.com/results?search_query=dark+academia+classical+music+study',
  3: 'https://www.youtube.com/results?search_query=night+city+rain+ambient+music',
  4: 'https://www.youtube.com/results?search_query=forest+nature+sounds+study+music',
  5: 'https://www.youtube.com/results?search_query=lofi+rooftop+sunset+chill+beats',
  6: 'https://www.youtube.com/results?search_query=synthwave+retrowave+study+music',
};

const origEnterRoom = window.enterRoom;
window.enterRoom = function(id) {
  origEnterRoom(id);
  // Cambiar fondo de app al degradado de la sala
  const room = rooms.find(r => r.id === id);
  if (room) {
    document.body.style.background = `linear-gradient(135deg, ${room.c1}ee, ${room.c2}44)`;
    document.getElementById('room-badge').style.background = `linear-gradient(135deg, ${room.c1}, ${room.c2})`;
    document.getElementById('room-badge').style.color = '#fff';
    document.getElementById('room-badge').style.border = 'none';
  }
  // Abrir playlist correspondiente
  const pl = ROOM_PLAYLISTS[id];
  if (pl) {
    setTimeout(() => {
      if (confirm(`¿Abrir playlist de "${room ? room.name : 'esta sala'}" en YouTube?`)) {
        window.open(pl, '_blank');
      }
    }, 400);
  }
};

// ============================
// INYECTAR HTML SECCIONES
// ============================
function injectSections() {
  // NOTAS
  document.getElementById('section-notes').innerHTML = `
    <div class="section-header">
      <div><h2>Notas</h2><p>Captura y organiza tus ideas</p></div>
      <button class="btn btn-p" onclick="createNote()">+ Nueva nota</button>
    </div>
    <div class="notes-layout">
      <div class="notes-sidebar">
        <input class="notes-search" id="notes-search" placeholder="🔍 Buscar notas..." oninput="renderNotesList()">
        <div id="notes-list"></div>
      </div>
      <div class="notes-editor">
        <div id="note-empty" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-muted);gap:12px">
          <span style="font-size:3rem">📝</span>
          <span>Selecciona o crea una nota</span>
          <button class="btn btn-p" onclick="createNote()">+ Nueva nota</button>
        </div>
        <div id="note-editor-area" style="display:none;flex-direction:column;height:100%;gap:12px">
          <div style="display:flex;align-items:center;gap:10px">
            <input id="note-title-input" placeholder="Título..." style="flex:1;background:transparent;border:none;border-bottom:1px solid var(--glass-border);color:var(--text);font-family:var(--font-heading);font-size:1.3rem;padding:4px 0;outline:none" oninput="saveActiveNote()">
            <button class="pomo-btn" onclick="togglePinNote()" title="Fijar">📌</button>
            <button class="pomo-btn" onclick="deleteActiveNote()" title="Eliminar" style="color:#ff6b6b">🗑</button>
          </div>
          <textarea id="note-content-input" placeholder="Escribe tu nota aquí..." style="flex:1;background:var(--glass);border:1px solid var(--glass-border);border-radius:10px;color:var(--text);font-family:var(--font-ui);font-size:0.9rem;padding:14px;resize:none;outline:none;line-height:1.7" oninput="saveActiveNote()"></textarea>
          <div id="note-updated" style="font-size:0.72rem;color:var(--text-muted)"></div>
        </div>
      </div>
    </div>
  `;

  // PROYECTOS KANBAN
  document.getElementById('section-projects').innerHTML = `
    <div class="section-header">
      <div><h2>Proyectos</h2><p>Kanban board personal</p></div>
    </div>
    <div class="kanban-board" id="kanban-board">
      ${COLS.map(col => `
        <div class="k-col" ondragover="event.preventDefault()" ondrop="kanbanDrop('${col.id}')">
          <div class="k-col-header">
            <span>${col.label}</span>
            <span class="k-count" id="kcount-${col.id}">0</span>
          </div>
          <div class="k-list" id="klist-${col.id}"></div>
          <div class="k-add-row">
            <input class="k-inp" id="kinp-${col.id}" placeholder="Nueva tarjeta..." onkeydown="if(event.key==='Enter')addKanbanCard('${col.id}')">
            <button class="k-add-btn" onclick="addKanbanCard('${col.id}')">+</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // CALENDARIO
  document.getElementById('section-calendar').innerHTML = `
    <div class="section-header">
      <div><h2>Calendario</h2><p>Organiza tu tiempo y eventos</p></div>
    </div>
    <div class="glass-card" style="max-width:700px;margin:0 auto">
      <div class="cal-nav">
        <button class="pomo-btn" onclick="calPrev()">← Anterior</button>
        <span id="cal-title" style="font-family:var(--font-heading);font-size:1.1rem;color:var(--text)"></span>
        <button class="pomo-btn" onclick="calNext()">Siguiente →</button>
      </div>
      <div class="cal-grid" id="cal-grid"></div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:10px;text-align:center">Haz clic en un día para agregar un evento</div>
    </div>
  `;

  // LINKS
  document.getElementById('section-links').innerHTML = `
    <div class="section-header">
      <div><h2>Links</h2><p>Tus recursos favoritos organizados</p></div>
    </div>
    <div class="glass-card" style="margin-bottom:20px">
      <div class="links-add-row">
        <input id="link-name" placeholder="Nombre del link" class="task-input" style="flex:2">
        <input id="link-url" placeholder="URL (ej: youtube.com)" class="task-input" style="flex:3">
        <input id="link-cat" placeholder="Categoría" class="task-input" style="flex:1">
        <button class="btn btn-p" onclick="addLink()">+ Agregar</button>
      </div>
      <input id="links-search" class="task-input" placeholder="🔍 Buscar links..." style="width:100%;margin-top:10px" oninput="renderLinks()">
    </div>
    <div id="links-container"></div>
  `;
}

// ============================
// INYECTAR CSS BLOQUE 3
// ============================
function injectCSS() {
  const style = document.createElement('style');
  style.textContent = `
    /* NOTAS */
    .notes-layout{display:grid;grid-template-columns:260px 1fr;gap:20px;height:calc(100vh - 200px)}
    .notes-sidebar{background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--border-radius);overflow:hidden;display:flex;flex-direction:column}
    .notes-search{width:100%;padding:12px 14px;background:transparent;border:none;border-bottom:1px solid var(--glass-border);color:var(--text);font-family:var(--font-ui);font-size:0.85rem;outline:none}
    #notes-list{overflow-y:auto;flex:1}
    .note-item{padding:12px 14px;cursor:pointer;border-bottom:1px solid var(--glass-border);transition:background var(--transition)}
    .note-item:hover{background:var(--glass)}
    .note-item.active{background:rgba(124,58,237,0.2);border-left:3px solid var(--accent)}
    .note-item-title{font-size:0.88rem;font-weight:600;color:var(--text);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .note-item-preview{font-size:0.75rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .note-item-date{font-size:0.65rem;color:var(--text-muted);margin-top:4px}
    .notes-editor{background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--border-radius);padding:20px;display:flex;flex-direction:column}

    /* KANBAN */
    .kanban-board{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;align-items:start;overflow-x:auto}
    .k-col{background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--border-radius);padding:14px;min-height:300px;transition:border-color var(--transition)}
    .k-col:hover{border-color:var(--accent)}
    .k-col-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-size:0.85rem;font-weight:600;color:var(--text)}
    .k-count{background:var(--accent);color:#fff;border-radius:10px;padding:1px 8px;font-size:0.72rem}
    .k-list{min-height:40px;display:flex;flex-direction:column;gap:8px;margin-bottom:10px}
    .k-card{background:rgba(255,255,255,0.06);border:1px solid var(--glass-border);border-radius:8px;padding:10px 12px;cursor:grab;display:flex;align-items:flex-start;gap:6px;transition:all var(--transition)}
    .k-card:hover{border-color:var(--accent);background:rgba(124,58,237,0.1)}
    .k-card:active{cursor:grabbing}
    .k-card-text{flex:1;font-size:0.83rem;color:var(--text);line-height:1.4}
    .k-card-del{background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;opacity:0;transition:opacity var(--transition);flex-shrink:0;padding:0}
    .k-card:hover .k-card-del{opacity:1}
    .k-card-del:hover{color:#ff6b6b}
    .k-inp{width:100%;padding:7px 10px;background:var(--glass);border:1px solid var(--glass-border);border-radius:7px;color:var(--text);font-family:var(--font-ui);font-size:0.82rem;outline:none;margin-bottom:6px}
    .k-inp:focus{border-color:var(--accent)}
    .k-add-btn{width:100%;padding:6px;background:var(--glass);border:1px solid var(--glass-border);border-radius:7px;color:var(--text-muted);cursor:pointer;font-size:1rem;transition:all var(--transition)}
    .k-add-btn:hover{border-color:var(--accent);color:var(--accent2)}
    .k-add-row{display:flex;flex-direction:column;gap:4px}

    /* CALENDARIO */
    .cal-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
    .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
    .cal-header-cell{text-align:center;font-size:0.72rem;font-weight:600;color:var(--text-muted);padding:6px 0}
    .cal-cell{min-height:72px;border-radius:8px;border:1px solid var(--glass-border);padding:6px;cursor:pointer;transition:all var(--transition);background:rgba(255,255,255,0.02)}
    .cal-cell:hover{border-color:var(--accent);background:var(--glass)}
    .cal-cell.empty{border-color:transparent;cursor:default;background:transparent}
    .cal-cell.today{border-color:var(--accent2);background:rgba(168,85,247,0.12)}
    .cal-day-num{font-size:0.8rem;font-weight:600;color:var(--text);margin-bottom:3px}
    .cal-cell.today .cal-day-num{color:var(--accent2)}
    .cal-event-dot{font-size:0.62rem;background:var(--accent);color:#fff;border-radius:3px;padding:1px 4px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .cal-more{font-size:0.6rem;color:var(--text-muted)}

    /* LINKS */
    .links-add-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .links-group{margin-bottom:24px}
    .links-cat-title{font-size:0.8rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;padding-left:4px}
    .links-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
    .link-card{display:flex;align-items:center;gap:10px;padding:11px 14px;background:var(--glass);border:1px solid var(--glass-border);border-radius:10px;cursor:pointer;transition:all var(--transition)}
    .link-card:hover{border-color:var(--accent);transform:translateY(-1px)}
    .link-favicon{width:20px;height:20px;border-radius:4px;flex-shrink:0}
    .link-info{flex:1;min-width:0}
    .link-name{font-size:0.85rem;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .link-url{font-size:0.7rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .link-del{background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;opacity:0;transition:opacity var(--transition);flex-shrink:0}
    .link-card:hover .link-del{opacity:1}
    .link-del:hover{color:#ff6b6b}

    /* GLASS CARD */
    .glass-card{background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--border-radius);padding:20px}
  `;
  document.head.appendChild(style);
}

// ============================
// INIT BLOQUE 3
// ============================
function initBloque3() {
  injectCSS();
  injectSections();
  loadNotes();
  loadKanban();
  loadCalendar();
  loadLinks();
}

// Esperar a que bloque2 termine su init
setTimeout(initBloque3, 500);
