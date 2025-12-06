/* app.ts */
interface EventItem {
  id: string;
  title: string;
  date: string;
  location?: string;
  description?: string;
  done?: boolean;
}

const STORAGE_KEY = 'campus_events_v1';

function uid(){ return Math.random().toString(36).slice(2,9); }
function loadEvents(): EventItem[]{ try{ const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch(e){ console.error(e); return []; } }
function saveEvents(items: EventItem[]){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

const form = document.getElementById('event-form') as HTMLFormElement;
const titleInput = document.getElementById('title') as HTMLInputElement;
const dateInput = document.getElementById('date') as HTMLInputElement;
const locInput = document.getElementById('location') as HTMLInputElement;
const descInput = document.getElementById('description') as HTMLTextAreaElement;
const eventsList = document.getElementById('events') as HTMLUListElement;
const emptyEl = document.getElementById('empty') as HTMLElement;
const filterSel = document.getElementById('filter') as HTMLSelectElement;
const searchInput = document.getElementById('search') as HTMLInputElement;
const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;

let events: EventItem[] = loadEvents();

function render(){
  const q = searchInput.value.trim().toLowerCase();
  const filter = filterSel.value;
  eventsList.innerHTML = '';
  const now = new Date();

  const filtered = events.filter(e=>{
    if(q){
      const hay = (e.title + ' ' + (e.location||'') + ' ' + (e.description||'')).toLowerCase();
      if(!hay.includes(q)) return false;
    }
    if(filter === 'upcoming') return new Date(e.date) >= startOfDay(now);
    if(filter === 'past') return new Date(e.date) < startOfDay(now);
    return true;
  }).sort((a,b)=> new Date(a.date).getTime() - new Date(b.date).getTime());

  emptyEl.style.display = filtered.length === 0 ? 'block' : 'none';

  for(const e of filtered){
    const li = document.createElement('li'); li.className = 'event';
    const left = document.createElement('div'); left.className = 'left';
    const h = document.createElement('h3'); h.textContent = e.title;
    const m = document.createElement('div'); m.className = 'meta'; m.textContent = `${formatDate(e.date)} • ${e.location || 'TBA'}`;
    left.appendChild(h); left.appendChild(m);

    const actions = document.createElement('div'); actions.className = 'actions';
    const doneBtn = document.createElement('button'); doneBtn.textContent = e.done ? 'Undo' : 'Done'; doneBtn.addEventListener('click', ()=> toggleDone(e.id));
    const editBtn = document.createElement('button'); editBtn.textContent = 'Edit'; editBtn.className = 'muted'; editBtn.addEventListener('click', ()=> fillFormForEdit(e.id));
    const delBtn = document.createElement('button'); delBtn.textContent = 'Delete'; delBtn.className = 'muted'; delBtn.addEventListener('click', ()=> deleteEvent(e.id));
    const badge = document.createElement('span'); badge.className = 'badge small'; badge.textContent = daysUntil(e.date) >= 0 ? `${daysUntil(e.date)}d` : 'past';

    actions.appendChild(badge); actions.appendChild(doneBtn); actions.appendChild(editBtn); actions.appendChild(delBtn);

    li.appendChild(left); li.appendChild(actions);
    if(e.done) li.style.opacity = '0.6';
    eventsList.appendChild(li);
  }
}

function startOfDay(d: Date){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function daysUntil(dateStr: string){ const d = new Date(dateStr); const diff = startOfDay(d).getTime() - startOfDay(new Date()).getTime(); return Math.ceil(diff / 86400000); }
function formatDate(iso: string){ return new Date(iso).toLocaleDateString(); }

function addEvent(data: Partial<EventItem>){ events.push({ id: uid(), title: data.title||'Untitled', date: data.date||new Date().toISOString().slice(0,10), location: data.location||'', description: data.description||'', done:false }); saveEvents(events); render(); }
function updateEvent(id:string, patch: Partial<EventItem>){ events = events.map(e => e.id === id ? {...e, ...patch} : e); saveEvents(events); render(); }
function deleteEvent(id:string){ if(confirm('Delete this event?')){ events = events.filter(e=> e.id !== id); saveEvents(events); render(); }}
function toggleDone(id:string){ updateEvent(id,{ done: !events.find(e=>e.id===id)?.done }); }

function fillFormForEdit(id:string){ const e = events.find(x=>x.id===id); if(!e) return; titleInput.value = e.title; dateInput.value = e.date; locInput.value = e.location||''; descInput.value = e.description||''; form.dataset.editing = id; }

form.addEventListener('submit', ev=>{ ev.preventDefault(); const data = { title:titleInput.value, date:dateInput.value, location:locInput.value, description:descInput.value }; const editId = form.dataset.editing; if(editId){ updateEvent(editId, data); delete form.dataset.editing; } else addEvent(data); form.reset(); });
clearBtn.addEventListener('click', ()=> form.reset());
filterSel.addEventListener('change', render);
searchInput.addEventListener('input', render);

render();
