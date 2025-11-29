document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
     const API_BASE = ''; 
    const EMAILJS_SERVICE_ID = 'service_kwlk82f'; 
    const EMAILJS_TEMPLATE_ID = 'template_002mw6n';
    const EMAILJS_PUBLIC_KEY = '_6icnrlX1050Z356L';

    // --- STATE ---
    let teacherName = "", classesData = [], timetableData = [], notificationsData = [], attendanceData = [], examsData = [];
    let currentView = 'Dashboard'; 

    const loginScreen = document.getElementById('login-screen'), appScreen = document.getElementById('app-screen');
    const loginForm = document.getElementById('login-form'), signupForm = document.getElementById('signup-form'), loginError = document.getElementById('login-error');

    // --- AUTH ---
    document.getElementById('show-signup').addEventListener('click', (e) => { e.preventDefault(); loginForm.classList.add('hidden'); signupForm.classList.remove('hidden'); });
    document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); signupForm.classList.add('hidden'); loginForm.classList.remove('hidden'); });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/api/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email: val('email'), password: val('password') }) });
            if (res.ok) { teacherName = (await res.json()).name; initializeApp(); } else { loginError.textContent = 'Invalid credentials'; loginError.classList.remove('hidden'); }
        } catch (err) { loginError.textContent = 'Server Error'; loginError.classList.remove('hidden'); }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/api/signup`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name: val('signup-name'), email: val('signup-email'), password: val('signup-password') }) });
            if (res.ok) { teacherName = (await res.json()).name; initializeApp(); } else { loginError.textContent = 'Signup Failed'; loginError.classList.remove('hidden'); }
        } catch (err) { loginError.textContent = 'Server Error'; loginError.classList.remove('hidden'); }
    });

    async function initializeApp() {
        loginScreen.classList.add('hidden'); appScreen.classList.remove('hidden');
        try { emailjs.init(EMAILJS_PUBLIC_KEY); } catch(e) {}
        await loadAllData(); renderAppShell();
    }

    async function loadAllData() {
        try {
            const [c, t, n, a, e] = await Promise.all([ fetch(`${API_BASE}/api/classes`), fetch(`${API_BASE}/api/timetable`), fetch(`${API_BASE}/api/notifications`), fetch(`${API_BASE}/api/attendance`), fetch(`${API_BASE}/api/exams`) ]);
            if(c.ok) classesData = await c.json(); if(t.ok) timetableData = await t.json(); if(n.ok) notificationsData = await n.json(); if(a.ok) attendanceData = await a.json(); if(e.ok) examsData = await e.json();
        } catch (err) { console.error(err); }
    }

    // --- RENDER SHELL ---
    function renderAppShell() {
        appScreen.innerHTML = `<div class="flex h-screen bg-gray-100"><aside id="sidebar" class="w-64 bg-gray-800 text-white flex flex-col"></aside><div class="flex-1 flex flex-col overflow-hidden"><header class="bg-white shadow-md px-6 h-16 flex items-center justify-between"><h1 class="text-xl font-semibold">${currentView}</h1><span class="font-medium">Welcome, ${teacherName}!</span></header><main id="main-content" class="flex-1 overflow-y-auto p-6"></main></div></div>`;
        renderSidebar(); renderPage(currentView);
    }

    function renderSidebar() {
        const links = [
            { name: 'Dashboard', icon: 'layout-dashboard' }, { name: 'Class Lists', icon: 'users' },
            { name: 'Timetable', icon: 'calendar' }, { name: 'Notifications', icon: 'bell' },
            { name: 'Attendance', icon: 'user-check' }, { name: 'Exams', icon: 'clipboard-list' },
            { name: 'Assignments', icon: 'mail' }, { name: 'Reports', icon: 'bar-chart-2' }
        ];
        document.getElementById('sidebar').innerHTML = `<div class="h-16 flex items-center justify-center text-2xl font-bold border-b border-gray-700">EduMate</div><nav class="flex-1 p-2 space-y-2">${links.map(l => `<a href="#" class="sidebar-link flex items-center px-4 py-2.5 rounded hover:bg-gray-700 ${currentView===l.name?'active':''}" data-page="${l.name}"><i data-lucide="${l.icon}" class="w-5 h-5 mr-3"></i> ${l.name}</a>`).join('')}</nav><div class="p-4 border-t border-gray-700"><button onclick="location.reload()" class="w-full flex items-center px-4 py-2 hover:bg-red-600 rounded"><i data-lucide="log-out" class="w-5 h-5 mr-3"></i> Logout</button></div>`;
        document.querySelectorAll('.sidebar-link').forEach(l => l.addEventListener('click', (e) => renderPage(e.currentTarget.dataset.page)));
        lucide.createIcons();
    }

    function renderPage(p) {
        currentView = p; document.querySelectorAll('.sidebar-link').forEach(l => l.classList.toggle('active', l.dataset.page === p));
        const m = document.getElementById('main-content');
        if(p==='Dashboard') renderDashboard(m); else if(p==='Class Lists') renderClassLists(m); else if(p==='Timetable') renderTimetable(m); else if(p==='Notifications') renderNotifications(m); else if(p==='Attendance') renderAttendancePage(m); else if(p==='Exams') renderExamsPage(m); else if(p==='Reports') renderReportsPage(m); else if(p==='Assignments') renderAssignmentsPage(m);
        lucide.createIcons();
    }

    // --- DASHBOARD ---
    function renderDashboard(c) {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const tc = timetableData.filter(t => t.day === today).sort((a,b) => a.time.localeCompare(b.time));
        c.innerHTML = `<div class="grid md:grid-cols-3 gap-6"><div class="bg-white p-6 rounded shadow flex items-center"><i data-lucide="users" class="w-8 h-8 text-indigo-600 mr-4"></i><div><p class="text-gray-500">Students</p><h2 class="text-2xl font-bold">${classesData.reduce((acc,cl)=>acc+cl.students.length,0)}</h2></div></div><div class="bg-white p-6 rounded shadow flex items-center"><i data-lucide="book-open" class="w-8 h-8 text-green-600 mr-4"></i><div><p class="text-gray-500">Classes</p><h2 class="text-2xl font-bold">${classesData.length}</h2></div></div><div class="bg-white p-6 rounded shadow col-span-1 md:col-span-3"><h2 class="text-xl font-bold mb-4">Today's Schedule (${today})</h2>${tc.length ? tc.map(t=>`<div class="p-3 bg-gray-50 rounded mb-2 font-semibold">${t.time} - ${t.subject}</div>`).join('') : '<p>No classes today.</p>'}</div></div>`;
    }

    // --- CLASS LISTS ---
    function renderClassLists(c) {
        c.innerHTML = `<div class="flex justify-between mb-6"><h2 class="text-2xl font-bold">Classes</h2><button onclick="addClass()" class="px-4 py-2 bg-green-600 text-white rounded">Add Class</button></div><div class="grid md:grid-cols-3 gap-6">${classesData.map(cls => `<div class="bg-white p-6 rounded shadow relative"><button class="absolute top-4 right-4 text-red-500" onclick="delClass('${cls.id}')"><i data-lucide="trash-2"></i></button><h3 class="text-xl font-bold text-indigo-700">${cls.name}</h3><p class="text-sm text-gray-600 mb-4">${cls.coordinatorName}</p><button class="w-full bg-indigo-600 text-white py-2 rounded" onclick="viewClass('${cls.id}')">View Students</button></div>`).join('')}</div>`;
        window.addClass = () => showModal(`<h2 class="text-xl font-bold mb-4">Add Class</h2><input id="n-cn" placeholder="Name" class="w-full border p-2 mb-2"><input id="n-cc" placeholder="Coordinator" class="w-full border p-2 mb-2"><input id="n-cp" placeholder="Phone" class="w-full border p-2 mb-4"><div class="flex justify-end gap-2"><button onclick="closeModal()" class="bg-gray-200 px-4 py-2 rounded">Cancel</button><button onclick="saveClass()" class="bg-indigo-600 text-white px-4 py-2 rounded">Save</button></div>`);
        window.saveClass = async () => { await apiCall('/api/classes', 'POST', { name: val('n-cn'), coordinatorName: val('n-cc'), coordinatorPhone: val('n-cp') }); closeModal(); await loadAllData(); renderPage('Class Lists'); };
        window.delClass = async (id) => { if(confirm('Delete?')) { await apiCall(`/api/classes/${id}`, 'DELETE'); await loadAllData(); renderPage('Class Lists'); }};
        
        window.viewClass = (cid) => {
            const cls = classesData.find(c => c.id === cid);
            c.innerHTML = `<button onclick="renderPage('Class Lists')" class="mb-4 text-indigo-600">Back</button><div class="bg-white p-6 rounded shadow"><div class="flex justify-between mb-4"><h2 class="text-2xl font-bold">${cls.name}</h2><button onclick="addStudent('${cid}')" class="bg-indigo-600 text-white px-4 py-2 rounded">Add Student</button></div><table class="w-full text-left"><thead><tr><th class="p-2">Roll</th><th class="p-2">Name</th><th class="p-2"></th></tr></thead><tbody>${cls.students.map(s=>`<tr><td class="p-2 border-b">${s.roll}</td><td class="p-2 border-b"><a href="#" onclick="openProfile('${s.id}')" class="text-indigo-600 hover:underline font-medium">${s.name}</a><br><span class="text-xs text-gray-400">${s.email}</span></td><td class="p-2 border-b text-right"><button onclick="delStud('${s.id}','${cid}')" class="text-red-500"><i data-lucide="trash-2" class="w-4"></i></button></td></tr>`).join('')}</tbody></table></div>`;
            lucide.createIcons();
        };

        window.openProfile = (sid) => {
            const s = classesData.flatMap(c=>c.students).find(st=>st.id===sid);
            showModal(`
                <h2 class="text-2xl font-bold mb-2">${s.name}</h2>
                <div class="space-y-3 mb-4">
                    <div class="flex justify-between border-b pb-2"><span>Status:</span> <span class="font-bold">${s.status}</span></div>
                    <div class="flex justify-between items-center border-b pb-2"><span>Phone:</span> <div>${s.phone} <a href="tel:${s.phone}" class="bg-green-100 text-green-700 px-2 rounded text-xs ml-2">Call</a></div></div>
                    <div class="flex justify-between items-center border-b pb-2"><span>Parent Phone:</span> <div>${s.parentPhone} <a href="tel:${s.parentPhone}" class="bg-green-100 text-green-700 px-2 rounded text-xs ml-2">Call</a></div></div>
                    <div><label class="block text-sm font-bold">Address</label><textarea id="p-addr" class="w-full border p-2 rounded">${s.address}</textarea></div>
                    <div><label class="block text-sm font-bold">Previous Sem Marks</label><textarea id="p-marks" class="w-full border p-2 rounded h-20">${s.previousMarks}</textarea></div>
                </div>
                <div class="flex justify-end gap-2"><button onclick="closeModal()" class="bg-gray-200 px-4 py-2 rounded">Close</button><button onclick="updateProfile('${s.id}')" class="bg-indigo-600 text-white px-4 py-2 rounded">Save Changes</button></div>
            `);
        };

        window.updateProfile = async (sid) => {
            await apiCall(`/api/students/${sid}`, 'PUT', { address: val('p-addr'), previousMarks: val('p-marks') });
            alert('Profile Saved'); closeModal(); await loadAllData();
        };

        window.addStudent = (cid) => showModal(`<h2 class="text-xl font-bold mb-4">Add Student</h2><input id="n-sn" placeholder="Name" class="w-full border p-2 mb-2"><input id="n-sr" placeholder="Roll" class="w-full border p-2 mb-2"><input id="n-se" placeholder="Email" class="w-full border p-2 mb-2"><select id="n-ss" class="w-full border p-2 mb-2"><option>Day Scholar</option><option>Hosteller</option></select><input id="n-sp" placeholder="Student Phone" class="w-full border p-2 mb-2"><input id="n-pp" placeholder="Parent Phone" class="w-full border p-2 mb-4"><div class="flex justify-end gap-2"><button onclick="closeModal()" class="bg-gray-200 px-4 py-2 rounded">Cancel</button><button onclick="saveStud('${cid}')" class="bg-indigo-600 text-white px-4 py-2 rounded">Save</button></div>`);
        
        window.saveStud = async (cid) => { 
            const res = await apiCall(`/api/classes/${cid}/students`, 'POST', { name: val('n-sn'), roll: val('n-sr'), email: val('n-se'), status: val('n-ss'), phone: val('n-sp'), parentPhone: val('n-pp') }); 
            if(res.error) { alert(res.error); }
            else { closeModal(); await loadAllData(); viewClass(cid); }
        };
        
        window.delStud = async (sid, cid) => { if(confirm('Delete?')) { await apiCall(`/api/students/${sid}`, 'DELETE'); await loadAllData(); viewClass(cid); }};
    }

    // --- TIMETABLE ---
    function renderTimetable(c) {
        c.innerHTML = `<h2 class="text-2xl font-bold mb-6">Timetable</h2><div class="space-y-6">${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d=>`<div class="bg-white p-6 rounded shadow"><h3 class="font-bold mb-2">${d}</h3>${timetableData.filter(t=>t.day===d).sort((a,b)=>a.time.localeCompare(b.time)).map(t=>`<div class="flex justify-between p-2 bg-gray-50 mb-1"><span><b>${t.time}</b> ${t.subject}</span><button onclick="delTime('${t.id}')" class="text-red-500">x</button></div>`).join('')}<button onclick="addTime('${d}')" class="text-indigo-600 text-sm mt-2">+ Add</button></div>`).join('')}</div>`;
        window.addTime=(d)=>showModal(`<h2 class="text-xl font-bold mb-4">Add to ${d}</h2><input type="hidden" id="t-d" value="${d}"><input type="time" id="t-t" class="w-full border p-2 mb-2"><input id="t-s" placeholder="Subject" class="w-full border p-2 mb-2"><input id="t-l" placeholder="Location" class="w-full border p-2 mb-4"><div class="flex justify-end gap-2"><button onclick="closeModal()" class="bg-gray-200 px-4 py-2 rounded">Cancel</button><button onclick="saveTime()" class="bg-indigo-600 text-white px-4 py-2 rounded">Save</button></div>`);
        window.saveTime=async()=>{ await apiCall('/api/timetable','POST',{day:val('t-d'),time:val('t-t'),subject:val('t-s'),location:val('t-l')}); closeModal(); await loadAllData(); renderPage('Timetable'); };
        window.delTime=async(id)=>{ if(confirm('Delete?')){ await apiCall(`/api/timetable/${id}`,'DELETE'); await loadAllData(); renderPage('Timetable'); }};
    }

    // --- ATTENDANCE ---
    function renderAttendancePage(c) {
        c.innerHTML = `<div class="flex justify-between mb-6"><h2 class="text-2xl font-bold">Attendance</h2><button onclick="takeAtt()" class="bg-green-600 text-white px-4 py-2 rounded">Take Attendance</button></div><div class="bg-white rounded shadow overflow-hidden"><table class="w-full text-left"><thead class="bg-gray-100"><tr><th class="p-4">Date</th><th class="p-4">Class</th><th class="p-4">Status</th></tr></thead><tbody>${attendanceData.length?attendanceData.map(r=>`<tr><td class="p-4 border-b">${r.date}</td><td class="p-4 border-b">${r.className}</td><td class="p-4 border-b">${r.studentName}: <b>${r.status}</b></td></tr>`).slice(0,20).join(''):'<tr><td colspan="3" class="p-4">No records.</td></tr>'}</tbody></table></div>`;
        window.takeAtt=()=>showModal(`<h2 class="text-xl font-bold mb-4">Take Attendance</h2><select id="att-c" onchange="loadAttList()" class="w-full border p-2 mb-2"><option value="">Select Class</option>${classesData.map(c=>`<option value="${c.id}">${c.name}</option>`)}</select><input type="date" id="att-d" class="w-full border p-2 mb-4" value="${new Date().toISOString().split('T')[0]}"><div id="att-l" class="max-h-60 overflow-y-auto mb-4"></div><div class="flex justify-end gap-2"><button onclick="closeModal()" class="bg-gray-200 px-4 py-2 rounded">Cancel</button><button onclick="saveAtt()" class="bg-indigo-600 text-white px-4 py-2 rounded">Submit</button></div>`);
        window.loadAttList=()=>{ const cls=classesData.find(c=>c.id===val('att-c')); document.getElementById('att-l').innerHTML=cls?cls.students.map(s=>`<div class="flex justify-between items-center p-2 border-b" data-id="${s.id}" data-name="${s.name}"><span>${s.name}</span><div><button onclick="setSt(this,'P')" class="px-2 bg-green-500 text-white rounded mr-1">P</button><button onclick="setSt(this,'A')" class="px-2 bg-gray-200 rounded">A</button></div></div>`).join(''):''; };
        window.setSt=(b,s)=>{const p=b.parentElement; p.dataset.status=s; p.querySelectorAll('button').forEach(btn=>btn.className='px-2 rounded '+(btn.textContent===s?(s==='P'?'bg-green-500 text-white':'bg-red-500 text-white'):'bg-gray-200'));};
        window.saveAtt=async()=>{ const rows=document.querySelectorAll('#att-l > div'); const d=Array.from(rows).map(r=>({date:val('att-d'),studentId:r.dataset.id,studentName:r.dataset.name,className:classesData.find(c=>c.id===val('att-c')).name,status:r.querySelector('div').dataset.status||'P'})); await apiCall('/api/attendance','POST',d); closeModal(); await loadAllData(); renderPage('Attendance'); };
    }

    // --- EXAMS ---
    function renderExamsPage(c) {
        c.innerHTML = `<div class="bg-white p-6 rounded shadow mb-6"><div class="flex justify-between mb-4"><h2 class="text-xl font-bold">Exams</h2><button onclick="mkEx()" class="bg-indigo-600 text-white px-4 py-2 rounded">Create</button></div><div id="ex-l" class="grid md:grid-cols-3 gap-6">${examsData.map(e=>`<div class="bg-white p-6 rounded shadow relative"><button onclick="rmEx('${e.id}')" class="absolute top-4 right-4 text-red-500"><i data-lucide="trash-2" class="w-4"></i></button><h3 class="font-bold text-lg text-indigo-700">${e.title}</h3><p class="mb-4 font-bold">Max: ${e.totalMarks}</p><button onclick="entM('${e.id}','${e.classId}')" class="w-full bg-green-600 text-white py-2 rounded">Marks</button></div>`).join('')}</div></div>`;
        window.mkEx=()=>showModal(`<h2 class="text-xl font-bold mb-4">New Exam</h2><select id="ne-c" class="w-full border p-2 mb-2"><option value="">Class</option>${classesData.map(c=>`<option value="${c.id}">${c.name}</option>`)}</select><input id="ne-t" placeholder="Title" class="w-full border p-2 mb-2"><input id="ne-m" placeholder="Max" type="number" class="w-full border p-2 mb-4"><div class="flex justify-end gap-2"><button onclick="closeModal()" class="bg-gray-200 px-4 py-2 rounded">Cancel</button><button onclick="svEx()" class="bg-indigo-600 text-white px-4 py-2 rounded">Save</button></div>`);
        window.svEx=async()=>{await apiCall('/api/exams','POST',{title:val('ne-t'),totalMarks:val('ne-m'),classId:val('ne-c')}); closeModal(); await loadAllData(); renderPage('Exams');};
        window.rmEx=async(id)=>{if(confirm('Delete?')){await apiCall(`/api/exams/${id}`,'DELETE'); await loadAllData(); renderPage('Exams');}};
        window.entM=async(eid,cid)=>{ const res=await fetch(`${API_BASE}/api/scores?examId=${eid}`); const sc=await res.json(); const cls=classesData.find(c=>c.id===cid); showModal(`<h2 class="text-xl font-bold mb-4">Marks</h2><div class="max-h-60 overflow-y-auto mb-4 space-y-2">${cls.students.map(s=>`<div class="flex justify-between"><span class="w-2/3">${s.name}</span><input class="m-ip border p-1 w-20 rounded" data-sid="${s.id}" value="${sc.find(x=>x.studentId===s.id)?.marks||''}" placeholder="0"></div>`).join('')}</div><div class="flex justify-end gap-2"><button onclick="closeModal()" class="bg-gray-200 px-4 py-2 rounded">Cancel</button><button onclick="svM('${eid}')" class="bg-indigo-600 text-white px-4 py-2 rounded">Save</button></div>`);};
        window.svM=async(eid)=>{ const d=Array.from(document.querySelectorAll('.m-ip')).map(i=>({examId:eid,studentId:i.dataset.sid,marks:i.value||0})); await apiCall('/api/scores','POST',d); alert('Saved!'); closeModal(); };
    }

    // --- ASSIGNMENTS (WITH UPLOAD & LINK) ---
    function renderAssignmentsPage(c) {
        c.innerHTML = `
            <div class="bg-white p-6 rounded shadow max-w-2xl mx-auto">
                <h2 class="text-2xl font-bold mb-4">Send Assignment</h2>
                <div class="mb-4"><label class="block font-bold mb-1">Select Class</label><select id="asg-c" class="w-full border p-2 rounded"><option value="">-- Select --</option>${classesData.map(c=>`<option>${c.name}</option>`)}</select></div>
                <div class="mb-4"><label class="block font-bold mb-1">Subject / Title</label><input id="asg-s" class="w-full border p-2 rounded" placeholder="e.g. Physics Chapter 3"></div>
                <div class="mb-4"><label class="block font-bold mb-1">Instructions</label><textarea id="asg-b" class="w-full border p-2 rounded h-24" placeholder="Read page 40-42..."></textarea></div>
                <div class="mb-4"><label class="block font-bold mb-1">Attach File (PDF/Doc/Image)</label><input type="file" id="asg-f" class="w-full border p-2 rounded"></div>
                <button onclick="sendAsg()" class="w-full bg-indigo-600 text-white py-3 rounded font-bold">Send via Email</button>
            </div>`;
            
        window.sendAsg = async () => {
            const clsName = val('asg-c'), subj = val('asg-s'), body = val('asg-b'), fileInput = document.getElementById('asg-f');
            if(!clsName || !subj) return alert('Fill all fields');
            
            const list = classesData.find(c=>c.name===clsName)?.students.filter(s=>s.email&&s.email.includes('@')) || [];
            if(!list.length) return alert('No students with emails in this class');
            
            let attachmentUrl = "";
            const btn = document.querySelector('button'); 
            
            // 1. UPLOAD FILE IF EXISTS
            if(fileInput.files.length > 0) {
                btn.textContent = "Uploading File..."; btn.disabled = true;
                const formData = new FormData();
                formData.append('file', fileInput.files[0]);
                try {
                    const res = await fetch(API_BASE + '/api/upload', {method:'POST', body: formData});
                    const data = await res.json();
                    if(data.url) attachmentUrl = data.url;
                    else { btn.disabled = false; btn.textContent = "Send via Email"; return alert("Upload failed"); }
                } catch(e) { btn.disabled = false; btn.textContent = "Send via Email"; return alert("Server error during upload"); }
            }

            if(!confirm(`Send to ${list.length} students?`)) {
                btn.disabled = false; btn.textContent = "Send via Email"; return;
            }
            
            // 2. SEND EMAIL
            btn.textContent = "Sending Emails...";
            const fullMessage = `${body}\n\n${attachmentUrl ? "Download Attachment: " + attachmentUrl : ""}`;
            let sent=0; 
            
            for(const s of list) {
                try { await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { to_email: s.email, to_name: s.name, subject: `Assignment: ${subj}`, message: fullMessage }, EMAILJS_PUBLIC_KEY); sent++; } catch(e){}
            }
            
            alert(`Sent ${sent} emails.`);
            btn.disabled = false; btn.textContent = "Send via Email";
            renderPage('Assignments');
        };
    }

    // --- NOTIFICATIONS ---
    function renderNotifications(c) {
        c.innerHTML = `<div class="grid md:grid-cols-3 gap-6"><div class="bg-white p-6 rounded shadow h-fit"><h3 class="font-bold mb-4">Post</h3><textarea id="not-m" class="w-full border p-2 mb-2" rows="3" placeholder="Message"></textarea><select id="not-c" class="w-full border p-2 mb-4"><option>All Classes</option>${classesData.map(cl=>`<option>${cl.name}</option>`)}</select><button onclick="postNot()" class="w-full bg-indigo-600 text-white py-2 rounded">Post</button></div><div class="md:col-span-2 space-y-4">${notificationsData.slice().reverse().map(n=>`<div class="bg-white p-4 rounded shadow"><p>${n.message}</p><div class="flex justify-between text-sm text-gray-500 mt-2"><span>${n.className}</span><span>${n.timestamp}</span></div></div>`).join('')}</div></div>`;
        window.postNot = async () => { await apiCall('/api/notifications', 'POST', { message: val('not-m'), className: val('not-c'), timestamp: new Date().toLocaleString() }); await loadAllData(); renderPage('Notifications'); };
    }

    // --- REPORTS ---
    function renderReportsPage(c) {
        c.innerHTML = `<div class="bg-white p-6 rounded shadow mb-6"><h2 class="text-xl font-bold mb-4">Analytics</h2><div class="grid md:grid-cols-2 gap-4"><select id="rep-c" onchange="loadRepStud()" class="border p-2 rounded"><option>Select Class</option>${classesData.map(c=>`<option value="${c.id}">${c.name}</option>`)}</select><select id="rep-s" onchange="loadRepData()" class="border p-2 rounded" disabled><option>Select Student</option></select></div></div><div id="rep-res"></div>`;
        window.loadRepStud = () => { const cls = classesData.find(c => c.id === val('rep-c')); const sSelect = document.getElementById('rep-s'); sSelect.innerHTML = '<option>Select Student</option>' + (cls ? cls.students.map(s=>`<option value="${s.id}">${s.name}</option>`) : ''); sSelect.disabled = !cls; };
        window.loadRepData = async () => {
            const sid = val('rep-s'); if(!sid) return;
            const res = await fetch(`${API_BASE}/api/students/${sid}/analytics`);
            const d = await res.json();
            const att = d.attendance, exams = d.exams;
            const color = att.percentage >= 75 ? 'bg-green-500' : (att.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500');
            
            document.getElementById('rep-res').innerHTML = `
                <div class="bg-white p-6 rounded shadow border-t-4 border-indigo-600 mb-6">
                    <h3 class="font-bold text-xl mb-4">Attendance: ${att.percentage}%</h3>
                    <div class="w-full bg-gray-200 h-4 rounded-full mb-4"><div class="${color} h-4 rounded-full" style="width:${att.percentage}%"></div></div>
                    <div class="grid grid-cols-2 gap-4 text-center"><div class="bg-green-50 p-4 rounded"><p class="text-2xl font-bold text-green-600">${att.present}</p><p>Present</p></div><div class="bg-gray-50 p-4 rounded"><p class="text-2xl font-bold">${att.total}</p><p>Total</p></div></div>
                </div>
                <div class="bg-white p-6 rounded shadow">
                    <h3 class="font-bold text-xl mb-4">Exam Performance</h3>
                    <table class="w-full text-left"><thead><tr class="border-b"><th class="pb-2">Exam</th><th class="pb-2">Obtained</th><th class="pb-2">Total</th></tr></thead>
                    <tbody>${exams.map(e=>`<tr><td class="py-2 border-b">${e.title}</td><td class="py-2 border-b font-bold">${e.obtained}</td><td class="py-2 border-b text-gray-500">${e.total}</td></tr>`).join('')}</tbody></table>
                </div>`;
        };
    }

    // --- UTILS ---
    function showModal(html) { document.getElementById('modal-container').innerHTML = `<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div class="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">${html}</div></div>`; }
    function closeModal() { document.getElementById('modal-container').innerHTML = ''; }
    function val(id) { return document.getElementById(id).value; }
    async function apiCall(url, method, body) { 
        try {
            const options = { method: method, headers: {} };
            if (body) { options.headers['Content-Type'] = 'application/json'; options.body = JSON.stringify(body); }
            const res = await fetch(API_BASE + url, options);
            const json = await res.json();
            if(!res.ok) { if(json.error) return { error: json.error }; return { error: 'Request failed' }; }
            return json;
        } catch (err) { console.error(err); return { error: 'Server connection failed' }; }
    }
});