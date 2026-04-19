const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

navBtns.forEach(btn => {
btn.addEventListener('click', (e) => {
e.preventDefault();
navBtns.forEach(b => b.classList.remove('active'));
tabContents.forEach(t => t.classList.remove('active'));
btn.classList.add('active');
document.getElementById(btn.dataset.target).classList.add('active');
if (btn.dataset.target === 'journal-tab') {
renderJournalFeed();
renderTopCard();
}
if (btn.dataset.target === 'notes-tab') {
renderNotes();
}
});
});

const viewsWrapper = document.getElementById('views-wrapper');
const dotHeatmap = document.getElementById('dot-heatmap');
const dotCalendar = document.getElementById('dot-calendar');

viewsWrapper.addEventListener('scroll', () => {
const scrollLeft = viewsWrapper.scrollLeft;
const width = viewsWrapper.clientWidth;
if (scrollLeft > width / 2) {
dotHeatmap.classList.remove('active'); dotCalendar.classList.add('active');
} else {
dotHeatmap.classList.add('active'); dotCalendar.classList.remove('active');
}
});

const todayGlobal = new Date();
let currentViewDate = new Date(todayGlobal);

function formatDate(date) {
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
return `${year}-${month}-${day}`;
}

let activities = [];
let activityHistory = {};
let journalEntries = [];
let notesList = [];

try {
activityHistory = JSON.parse(localStorage.getItem('my_vibe_history')) || {};
journalEntries = JSON.parse(localStorage.getItem('daylio_journal')) || [];
notesList = JSON.parse(localStorage.getItem('my_vibe_notes')) || [];
} catch (e) {
activityHistory = {};
journalEntries = [];
notesList = [];
}

async function saveHistory() {
    try {
        await fetch('https://sol-backend-7j1v.onrender.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activityHistory)
        });
    } catch(e) {
        console.error(e);
    }
}

async function loadHistoryFromDB() {
    if (!currentUserId) return;
    try {
        const response = await fetch('https://sol-backend-7j1v.onrender.com?userId=' + currentUserId);
        const data = await response.json();
        if (Object.keys(data).length > 0) {
            activityHistory = data;
            updateActivityViews();
        }
    } catch(e) {
        console.error(e);
    }
}
async function saveJournal() {
    try {
        const latestEntry = journalEntries[0];
        latestEntry.user_id = currentUserId;
        await fetch('https://sol-backend-7j1v.onrender.com/api/journal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(latestEntry)
        });
    } catch(e) {
        console.error(e);
    }
}

async function saveNotes() {
    try {
        const latestNote = notesList[0];
        latestNote.user_id = currentUserId;
        await fetch('https://sol-backend-7j1v.onrender.com/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(latestNote)
        });
    } catch(e) {
        console.error(e);
    }
}
function updateActivityViews() {
const year = currentViewDate.getFullYear();
const month = currentViewDate.getMonth();
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
document.getElementById('current-month-display').textContent = `${monthNames[month]} ${year}`;
generateHeatmap(year, month);
generateCalendar(year, month);
calculateStreak();
}

function generateHeatmap(year, month) {
const graphContainer = document.getElementById('contribution-graph');
graphContainer.innerHTML = '';
const daysInMonth = new Date(year, month + 1, 0).getDate();
const firstDayIndex = new Date(year, month, 1).getDay(); 
for (let i = 0; i < firstDayIndex; i++) {
const emptySquare = document.createElement('div');
emptySquare.style.background = 'transparent'; emptySquare.style.pointerEvents = 'none';
emptySquare.style.border = 'none';
graphContainer.appendChild(emptySquare);
}
for (let d = 1; d <= daysInMonth; d++) {
const dateStr = formatDate(new Date(year, month, d));
const level = activityHistory[dateStr] || 0;
const square = document.createElement('div');
square.classList.add('day-square');
square.setAttribute('data-level', level);
square.addEventListener('click', () => {
let currentLvl = parseInt(square.getAttribute('data-level') || '0');
currentLvl = (currentLvl + 1) % 4;
square.setAttribute('data-level', currentLvl);
activityHistory[dateStr] = currentLvl;
saveHistory(); updateActivityViews();
});
graphContainer.appendChild(square);
}
}

function generateCalendar(year, month) {
const calGrid = document.getElementById('calendar-grid');
calGrid.innerHTML = `
<div class="cal-header-day">S</div><div class="cal-header-day">M</div><div class="cal-header-day">T</div>
<div class="cal-header-day">W</div><div class="cal-header-day">T</div><div class="cal-header-day">F</div><div class="cal-header-day">S</div>
`;
const daysInMonth = new Date(year, month + 1, 0).getDate();
const firstDayIndex = new Date(year, month, 1).getDay();
for (let i = 0; i < firstDayIndex; i++) { calGrid.appendChild(document.createElement('div')); }
for (let d = 1; d <= daysInMonth; d++) {
const dateStr = formatDate(new Date(year, month, d));
const level = activityHistory[dateStr] || 0;
const dayDiv = document.createElement('div');
dayDiv.classList.add('cal-day'); dayDiv.textContent = d; dayDiv.setAttribute('data-level', level);
if (dateStr === formatDate(todayGlobal)) dayDiv.classList.add('today');
dayDiv.addEventListener('click', () => {
let currentLvl = parseInt(dayDiv.getAttribute('data-level') || '0');
currentLvl = (currentLvl + 1) % 4;
dayDiv.setAttribute('data-level', currentLvl);
activityHistory[dateStr] = currentLvl;
saveHistory(); updateActivityViews();
});
calGrid.appendChild(dayDiv);
}
}

function calculateStreak() {
let streak = 0; let checkDate = new Date(todayGlobal);
while (true) {
if ((activityHistory[formatDate(checkDate)] || 0) > 0) { streak++; checkDate.setDate(checkDate.getDate() - 1); } 
else { break; }
}
document.getElementById('streak-counter').textContent = `${streak} Days`;
}

document.getElementById('prev-month-btn').addEventListener('click', (e) => { e.preventDefault(); currentViewDate.setMonth(currentViewDate.getMonth() - 1); updateActivityViews(); });
document.getElementById('next-month-btn').addEventListener('click', (e) => { e.preventDefault(); currentViewDate.setMonth(currentViewDate.getMonth() + 1); updateActivityViews(); });

async function loadActivities() {
    if (!currentUserId) return;
    try {
        const response = await fetch('https://sol-backend-7j1v.onrender.com/api/activities?userId=' + currentUserId);
        const data = await response.json();

        activities = data.map(dbItem => ({
            id: dbItem.id,
            title: dbItem.title,
            time: dbItem.scheduled_time ? dbItem.scheduled_time.substring(0, 5) : '', 
            ticked: dbItem.is_ticked === 1 
        }));

        renderActivities();
        updateTodayHistory();
    } catch (error) {
        console.error("Error loading activities from database:", error);
    }
}

function renderActivities() {
const list = document.getElementById('activity-list'); list.innerHTML = '';
activities.forEach(activity => {
const item = document.createElement('div'); item.classList.add('activity-item');
item.innerHTML = `
<div class="activity-info"><span class="activity-title">${activity.title}</span><span class="activity-time">⏰ ${activity.time}</span></div>
<div class="card-actions">
<button class="edit-btn" data-id="${activity.id}">✏️</button>
<button class="tick-btn ${activity.ticked ? 'ticked' : ''}" data-id="${activity.id}">✔️</button>
</div>`;

const editBtn = item.querySelector('.edit-btn');
editBtn.addEventListener('click', (e) => {
e.stopPropagation(); openModal(activity);
});

const tickBtn = item.querySelector('.tick-btn');
tickBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const newTickedState = !activity.ticked;

    try {
        await fetch(`https://sol-backend-7j1v.onrender.com/api/activities/${activity.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_ticked: newTickedState })
        });

        activity.ticked = newTickedState; 
        renderActivities(); 
        updateTodayHistory();
    } catch (error) {
        console.error("Error updating activity:", error);
    }
});

list.appendChild(item);
});
renderJournalHabits();
}

function updateTodayHistory() {
const total = activities.length; const ticked = activities.filter(a => a.ticked).length;
let newLevel = 0;
if (total > 0) {
const ratio = ticked / total;
if (ratio === 0) newLevel = 0; else if (ratio <= 0.5) newLevel = 1; else if (ratio < 1) newLevel = 2; else newLevel = 3;
}
activityHistory[formatDate(todayGlobal)] = newLevel; saveHistory(); updateActivityViews();
}

document.getElementById('add-activity-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    const title = document.getElementById('new-activity-input').value;
    const time = document.getElementById('new-activity-time').value;
    if (!title) return;

    const newActivity = {
        user_id: currentUserId, 
        title: title,
        scheduled_time: time,
        activity_date: formatDate(new Date()) 
    };

    try {
        const response = await fetch('https://sol-backend-7j1v.onrender.com/api/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newActivity)
        });

        if (!response.ok) {
            const errData = await response.json();
            console.error("Backend rejected the save:", errData);
            alert("Database Error! Check the Console.");
            return;
        }

        document.getElementById('new-activity-input').value = ''; 
        loadActivities(); 

    } catch (error) {
        console.error("Network Error:", error);
        alert("Could not reach the server. Is your Node.js running?");
    }
});

let currentEditingId = null;
function openModal(activity) {
currentEditingId = activity.id;
document.getElementById('edit-activity-title').value = activity.title;
document.getElementById('edit-activity-time').value = activity.time;

const miniChart = document.getElementById('modal-mini-chart');
miniChart.innerHTML = '';
const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
days.forEach((day, index) => {
const dayDiv = document.createElement('div');
dayDiv.classList.add('mini-day'); dayDiv.textContent = day;
if (Math.random() > 0.4 || (index === 6 && activity.ticked)) { dayDiv.classList.add('active'); }
miniChart.appendChild(dayDiv);
});
document.getElementById('activity-modal').classList.add('active');
}

document.getElementById('close-modal-btn').addEventListener('click', (e) => {
e.preventDefault();
document.getElementById('activity-modal').classList.remove('active');
});

document.getElementById('save-activity-btn').addEventListener('click', (e) => {
e.preventDefault();
const activity = activities.find(a => a.id === currentEditingId);
if (activity) {
activity.title = document.getElementById('edit-activity-title').value;
activity.time = document.getElementById('edit-activity-time').value;
renderActivities();
document.getElementById('activity-modal').classList.remove('active');
}
});

document.getElementById('delete-activity-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await fetch(`https://sol-backend-7j1v.onrender.com/api/activities/${currentEditingId}`, {
            method: 'DELETE'
        });

        activities = activities.filter(a => a.id !== currentEditingId);
        renderActivities(); 
        updateTodayHistory();
        document.getElementById('activity-modal').classList.remove('active');
    } catch (error) {
        console.error("Error deleting activity:", error);
    }
});

const avatarMap = {
'happy': '😃', 'good': '🙂', 'meh': '😐', 'bad': '😞', 'awful': '😫'
};

let composerState = {
moodObj: { mood: 'happy', emoji: '😃', color: '#d98a83' },
selectedActivities: [],
note: '',
image: null
};

function renderJournalHabits() {
const grid = document.getElementById('dynamic-habits-grid');
const section = document.getElementById('dynamic-activity-section');
if (!grid || !section) return;

if (activities.length === 0) {
section.style.display = 'none';
return;
}

section.style.display = 'block';
grid.innerHTML = '';

activities.forEach(act => {
const item = document.createElement('div');
item.classList.add('a-item');

const isSelected = composerState.selectedActivities.some(a => a.name === act.title);
if (isSelected) item.classList.add('selected');

item.dataset.act = act.title;
item.dataset.emoji = '🎯'; 

item.innerHTML = `
<div class="a-circle">🎯</div>
<span>${act.title}</span>
`;

item.addEventListener('click', () => {
item.classList.toggle('selected');
if (item.classList.contains('selected')) {
composerState.selectedActivities.push({ name: act.title, emoji: '🎯' });
} else {
composerState.selectedActivities = composerState.selectedActivities.filter(a => a.name !== act.title);
}
});

grid.appendChild(item);
});
}

function renderTopCard() {
const todayStr = formatDate(todayGlobal);
const todayEntries = journalEntries.filter(e => e.date === todayStr);
const latestEntry = todayEntries.length > 0 ? todayEntries[0] : null;

const displaySpan = document.getElementById('top-mood-display');
const emptyText = document.getElementById('top-mood-empty');
const avatarEmoji = document.getElementById('avatar-emoji');

if (latestEntry) {
displaySpan.textContent = latestEntry.moodObj.mood;
displaySpan.style.color = latestEntry.moodObj.color;
displaySpan.style.display = 'block';
emptyText.style.display = 'none';

if (avatarMap[latestEntry.moodObj.mood]) {
avatarEmoji.textContent = avatarMap[latestEntry.moodObj.mood];
} else {
avatarEmoji.textContent = '👧';
}

} else {
displaySpan.style.display = 'none';
emptyText.style.display = 'block';
avatarEmoji.textContent = '👧'; 
}
}

document.querySelectorAll('.m-item').forEach(item => {
item.addEventListener('click', () => {
document.querySelectorAll('.m-item').forEach(m => m.classList.remove('selected'));
item.classList.add('selected');

composerState.moodObj = {
mood: item.dataset.mood,
emoji: item.dataset.emoji,
color: item.dataset.color
};
});
});

const defaultHappy = document.querySelector('.m-item[data-mood="happy"]');
if (defaultHappy) defaultHappy.classList.add('selected');

document.querySelectorAll('.a-category:not(#dynamic-activity-section) .a-item').forEach(item => {
item.addEventListener('click', () => {
item.classList.toggle('selected');
const actName = item.dataset.act;
const actEmoji = item.dataset.emoji;

if (item.classList.contains('selected')) {
composerState.selectedActivities.push({ name: actName, emoji: actEmoji });
} else {
composerState.selectedActivities = composerState.selectedActivities.filter(a => a.name !== actName);
}
});
});

const attachPhotoInput = document.getElementById('attach-photo-input');
if (attachPhotoInput) {
attachPhotoInput.addEventListener('change', async function(e) {
const file = e.target.files[0];
if (file) {
const text = document.getElementById('photo-text');
if (text) text.textContent = 'Uploading...'; 

const formData = new FormData();
formData.append('photo', file);

try {
const response = await fetch('https://sol-backend-7j1v.onrender.com/api/upload', {
method: 'POST',
body: formData
});
const data = await response.json();

// Save the short URL instead of the giant text string!
composerState.image = data.imageUrl; 

const label = document.getElementById('add-photo-btn-label');
if (label) label.classList.add('attached');
if (text) text.textContent = 'Photo Ready';
} catch (error) {
console.error("Upload failed:", error);
if (text) text.textContent = 'Upload Failed';
}
}
});
}

function formatTimeAMPM(date) {
let hours = date.getHours();
let minutes = date.getMinutes();
const ampm = hours >= 12 ? 'PM' : 'AM';
hours = hours % 12;
hours = hours ? hours : 12; 
minutes = minutes < 10 ? '0' + minutes : minutes;
return hours + ':' + minutes + ' ' + ampm;
}

const saveJournalBtn = document.getElementById('save-journal-btn');
if (saveJournalBtn) {
saveJournalBtn.addEventListener('click', (e) => {
e.preventDefault();

const newEntry = {
id: Date.now(),
date: formatDate(new Date()),
time: formatTimeAMPM(new Date()),
moodObj: composerState.moodObj,
activities: [...composerState.selectedActivities],
note: composerState.note,
image: composerState.image
};

try {
journalEntries.unshift(newEntry); 
saveJournal();
} catch(err) {
journalEntries.shift();
return;
}

const noteInput = document.getElementById('journal-note-input');
if (noteInput) noteInput.value = '';

document.querySelectorAll('.a-item').forEach(i => i.classList.remove('selected'));
composerState.selectedActivities = [];
composerState.image = null;
composerState.note = '';

const label = document.getElementById('add-photo-btn-label');
if (label) label.classList.remove('attached');

const photoText = document.getElementById('photo-text');
if (photoText) photoText.textContent = 'Add Photo';

const fileInput = document.getElementById('attach-photo-input');
if (fileInput) fileInput.value = '';

saveJournalBtn.classList.add('success');
saveJournalBtn.textContent = 'Saved! ✔️';
setTimeout(() => {
saveJournalBtn.classList.remove('success');
saveJournalBtn.textContent = 'Save Vibe';
}, 2000);

renderJournalFeed();
renderTopCard();
});
}

async function loadJournalFromDB() {
    try {
        const response = await fetch('https://sol-backend-7j1v.onrender.com/api/journal?userId=' + currentUserId);
        const data = await response.json();
        
        journalEntries = data.map(entry => ({
            id: entry.id,
            date: entry.entry_date.split('T')[0],
            time: entry.entry_time,
            moodObj: {
                mood: entry.mood,
                emoji: entry.mood_emoji,
                color: entry.mood_color
            },
            activities: typeof entry.activities === 'string' ? JSON.parse(entry.activities) : entry.activities,
            note: entry.note,
            image: entry.image_data
        }));
        
        renderJournalFeed();
        renderTopCard();
    } catch (error) {
        console.error("Error loading journal:", error);
    }
}

function renderJournalFeed() {
const feed = document.getElementById('journal-feed');
if (!feed) return;
feed.innerHTML = '';

if (journalEntries.length === 0) {
feed.innerHTML = '<p class="empty-feed">No journal entries yet. Save how you feel above!</p>';
return;
}

const todayStr = formatDate(todayGlobal);
const yesterdayDate = new Date(todayGlobal);
yesterdayDate.setDate(yesterdayDate.getDate() - 1);
const yesterdayStr = formatDate(yesterdayDate);

journalEntries.forEach(entry => {
const card = document.createElement('div');
card.classList.add('feed-card');

const entryDateObj = new Date(entry.id);
let dateHeaderStr = entryDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase();

if (entry.date === todayStr) {
dateHeaderStr = `TODAY, ${dateHeaderStr}`;
} else if (entry.date === yesterdayStr) {
dateHeaderStr = `YESTERDAY, ${dateHeaderStr}`;
}

let activitiesHtml = '';
if (entry.activities && entry.activities.length > 0) {
activitiesHtml = `<div class="feed-activities">`;
entry.activities.forEach((act, index) => {
activitiesHtml += `<span class="feed-act-tag"><span>${act.emoji}</span> ${act.name}</span>`;
if (index < entry.activities.length - 1) activitiesHtml += ` • `;
});
activitiesHtml += `</div>`;
}

let noteHtml = entry.note ? `<div class="feed-note">${entry.note}</div>` : '';
let imgHtml = entry.image ? `<img src="${entry.image}" class="feed-img">` : '';

const moodColor = entry.moodObj ? entry.moodObj.color : '#d98a83';
let moodEmoji = '🙂';
if (entry.moodObj && entry.moodObj.mood && avatarMap[entry.moodObj.mood]) {
moodEmoji = avatarMap[entry.moodObj.mood];
} else if (entry.moodObj && entry.moodObj.emoji) {
moodEmoji = entry.moodObj.emoji;
}

const feedIconHtml = `<div class="feed-mood-icon" style="background: ${moodColor}; color: white;">${moodEmoji}</div>`;

const moodText = entry.moodObj ? entry.moodObj.mood : 'good';
const timeStr = entry.time || formatTimeAMPM(entryDateObj);

card.innerHTML = `
<div class="feed-card-header">
<span>${dateHeaderStr}</span>
<button class="delete-journal-btn" data-id="${entry.id}">🗑️</button>
</div>
<div class="feed-card-body">
${feedIconHtml}
<div class="feed-content">
<div class="feed-mood-text" style="color: ${moodColor};">${moodText} <span class="feed-time">${timeStr}</span></div>
${activitiesHtml}
${noteHtml}
${imgHtml}
</div>
</div>
`;
feed.appendChild(card);
});

feed.querySelectorAll('.delete-journal-btn').forEach(btn => {
btn.addEventListener('click', (e) => {
const entryId = parseInt(e.target.dataset.id);
journalEntries = journalEntries.filter(e => e.id !== entryId);
saveJournal();
renderJournalFeed();
renderTopCard();
});
});
}

function categorizeNote(note) {
if (note.completed) return 'completed';
if (!note.deadline) return 'general';

const today = new Date();
today.setHours(0, 0, 0, 0);
const deadlineDate = new Date(note.deadline);
deadlineDate.setHours(0, 0, 0, 0);

const diffTime = deadlineDate - today;
const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

if (diffDays < 0) return 'delayed';
if (diffDays <= 2) return 'soon';
return 'general';
}

function renderNotes() {
const sections = {
'delayed': document.getElementById('list-delayed'),
'soon': document.getElementById('list-soon'),
'general': document.getElementById('list-general'),
'completed': document.getElementById('list-completed')
};

Object.values(sections).forEach(container => { if (container) container.innerHTML = ''; });

notesList.sort((a, b) => b.id - a.id);

notesList.forEach(note => {
const category = categorizeNote(note);
if (!sections[category]) return;

const card = document.createElement('div');
card.classList.add('note-card', `priority-${note.priority}`);
if (note.completed) card.classList.add('completed');

let emoji = '✨';
let emojiClass = '';
if (note.priority === 'med') emoji = '⭐️';
if (note.priority === 'high') { emoji = '🚨'; emojiClass = 'alert'; }

let dateText = note.deadline ? `Due: ${note.deadline}` : 'Whenever ✨';

card.innerHTML = `
<div class="note-checkbox ${note.completed ? 'checked' : ''}">✔️</div>
<div class="note-content">
<div class="note-header-row">
<span class="note-title-text">${note.title}</span>
<span class="priority-badge ${emojiClass}">${emoji}</span>
</div>
<span class="note-meta">${dateText}</span>
</div>
<button class="delete-note-btn">🗑️</button>
`;

const checkbox = card.querySelector('.note-checkbox');
checkbox.addEventListener('click', () => {
note.completed = !note.completed;
saveNotes();
renderNotes();
});

const deleteBtn = card.querySelector('.delete-note-btn');
deleteBtn.addEventListener('click', () => {
notesList = notesList.filter(n => n.id !== note.id);
saveNotes();
renderNotes();
});
const editBtn = document.createElement('button');
editBtn.classList.add('edit-note-btn');
editBtn.textContent = '✏️';

editBtn.addEventListener('click', () => {
    document.getElementById('note-title').value = note.title;
    
    const prioritySelect = document.getElementById('note-priority');
    if (prioritySelect) prioritySelect.value = note.priority;
    
    const deadlineInput = document.getElementById('note-deadline');
    if (deadlineInput) deadlineInput.value = note.deadline;
    
    notesList = notesList.filter(n => n.id !== note.id);
    renderNotes();
});

card.appendChild(editBtn);

sections[category].appendChild(card);
});

['delayed', 'soon', 'general', 'completed'].forEach(cat => {
const sectionContainer = document.getElementById(`section-${cat}`);
if (sectionContainer && sections[cat]) {
if (sections[cat].children.length > 0) {
sectionContainer.style.display = 'block';
} else {
sectionContainer.style.display = 'none';
}
}
});
}

const addNoteBtn = document.getElementById('add-note-btn');
if (addNoteBtn) {
addNoteBtn.addEventListener('click', (e) => {
e.preventDefault();
const noteTitle = document.getElementById('note-title');
const notePriority = document.getElementById('note-priority');
const noteDeadline = document.getElementById('note-deadline');

if (!noteTitle || !noteTitle.value.trim()) return;

const newNote = {
id: Date.now(),
title: noteTitle.value.trim(),
priority: notePriority ? notePriority.value : 'low',
deadline: noteDeadline ? noteDeadline.value : '',
completed: false
};

notesList.unshift(newNote);
saveNotes();

if (noteTitle) noteTitle.value = '';
if (noteDeadline) noteDeadline.value = '';
if (notePriority) notePriority.value = 'low'; 

renderNotes();
});
}

updateActivityViews();
renderTopCard();
renderNotes();
async function loadNotesFromDB() {
    if (!currentUserId) return;
    try {
        const response = await fetch('https://sol-backend-7j1v.onrender.com' + currentUserId);
        const data = await response.json();
        notesList = data.map(dbNote => ({
            id: dbNote.id,
            title: dbNote.title,
            priority: dbNote.priority,
            deadline: dbNote.deadline,
            completed: dbNote.is_completed === 1
        }));
        renderNotes();
    } catch (error) {
        console.error(error);
    }
}
loadActivities();
loadNotesFromDB();
loadHistoryFromDB();
// --- USER ACCOUNTS & LOGIN ---
let currentUserId = localStorage.getItem('vibe_user_id');

if (!currentUserId) {
    document.getElementById('auth-modal').style.display = 'flex';
}

document.getElementById('auth-login-btn').addEventListener('click', async () => {
    const u = document.getElementById('auth-username').value;
    const p = document.getElementById('auth-password').value;
    const res = await fetch('https://sol-backend-7j1v.onrender.com/api/login', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: u, password: p})
    });
    const data = await res.json();
    if (data.userId) {
        localStorage.setItem('vibe_user_id', data.userId);
        window.location.reload(); // Refresh to load the app!
    } else { alert(data.error); }
});

document.getElementById('auth-register-btn').addEventListener('click', async () => {
    const u = document.getElementById('auth-username').value;
    const p = document.getElementById('auth-password').value;
    const res = await fetch('https://sol-backend-7j1v.onrender.com', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: u, password: p})
    });
    const data = await res.json();
    if (data.userId) {
        localStorage.setItem('vibe_user_id', data.userId);
        window.location.reload();
    } else { alert(data.error || 'Username taken'); }
});

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('vibe_user_id');
        window.location.reload();
    });
}