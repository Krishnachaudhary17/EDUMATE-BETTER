document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const API_BASE = ''; 
    const EMAILJS_SERVICE_ID = 'service_kwlk82f'; 
    const EMAILJS_TEMPLATE_ID = 'template_002mw6n';
    const EMAILJS_PUBLIC_KEY = '_6icnrlX1050Z356L'; 

    // --- STATE ---
    let currentUser = null; 
    let classesData = [], timetableData = [], notificationsData = [], attendanceData = [], examsData = [], assignmentsData = [];
    let currentView = 'Dashboard'; 

    const loginScreen = document.getElementById('login-screen'), appScreen = document.getElementById('app-screen');
    const loginForm = document.getElementById('login-form'), signupForm = document.getElementById('signup-form'), loginError = document.getElementById('login-error');

    // --- GLOBAL EXPORTS ---
    window.renderPage = renderPage;
    window.closeModal = closeModal;
    window.toggleSidebar = toggleSidebar;

    // --- AUTH ---
    document.getElementById('show-signup').addEventListener('click', (e) => { e.preventDefault(); loginForm.classList.add('hidden'); signupForm.classList.remove('hidden'); });
    document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); signupForm.classList.add('hidden'); loginForm.classList.remove('hidden'); });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/api/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email: val('email'), password: val('password') }) });
            if (res.ok) { currentUser = await res.json(); initializeApp(); } else { loginError.textContent = 'Invalid credentials'; loginError.classList.remove('hidden'); }
        } catch (err) { loginError.textContent = 'Server Error'; loginError.classList.remove('hidden'); }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/api/signup`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name: val('signup-name'), email: val('signup-email'), password: val('signup-password') }) });
            if (res.ok) { currentUser = await res.json(); initializeApp(); } else { loginError.textContent = 'Signup Failed'; loginError.classList.remove('hidden'); }
        } catch (err) { loginError.textContent = 'Server Error'; loginError.classList.remove('hidden'); }
    });

    async function initializeApp() {
        loginScreen.classList.add('hidden'); appScreen.classList.remove('hidden');
        try { emailjs.init(EMAILJS_PUBLIC_KEY); } catch(e) {}
        renderAppShell(); 
        await loadAllData(); 
        if(currentView === 'Dashboard') renderPage('Dashboard');
    }

    async function loadAllData() {
        try {
            const [c, t, n, a, e, asg] = await Promise.all([ 
                fetch(`${API_BASE}/api/classes`), 
                fetch(`${API_BASE}/api/timetable`), 
                fetch(`${API_BASE}/api/notifications`), 
                fetch(`${API_BASE}/api/attendance`), 
                fetch(`${API_BASE}/api/exams`),
                fetch(`${API_BASE}/api/assignments`)
            ]);
            
            if(c.ok) classesData = await c.json(); 
            if(t.ok) timetableData = await t.json(); 
            if(n.ok) notificationsData = await n.json(); 
            if(a.ok) attendanceData = await a.json(); 
            if(e.ok) examsData = await e.json();
            if(asg.ok) assignmentsData = await asg.json();

            updateHeader();
        } catch (err) { console.error("Error loading data:", err); }
    }

    function updateHeader() {
        const bellBtn = document.getElementById('header-bell');
        if (!bellBtn) return;
        const hasNotifications = notificationsData.length > 0;
        bellBtn.innerHTML = `<i data-lucide="bell" class="w-5 h-5"></i>${hasNotifications ? `<span class="absolute top-1.5 right-1.5 flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>` : ''}`;
        lucide.createIcons();
    }

    function renderAppShell() {
        appScreen.innerHTML = `
            <div class="flex h-screen bg-gray-50 overflow-hidden font-sans">
                <div id="mobile-overlay" onclick="toggleSidebar()" class="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 hidden md:hidden backdrop-blur-sm"></div>
                <aside id="sidebar" class="fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-100 transform -translate-x-full transition-transform duration-300 md:relative md:translate-x-0 flex flex-col shadow-2xl">
                    <div class="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950">
                        <div class="p-2 bg-indigo-600 rounded-lg mr-3 shadow-lg shadow-indigo-500/30"><i data-lucide="graduation-cap" class="text-white w-6 h-6"></i></div>
                        <span class="text-2xl font-bold tracking-tight text-white">EduMate</span>
                    </div>
                    <nav class="flex-1 p-4 space-y-1 overflow-y-auto" id="sidebar-nav"></nav>
                    <div class="p-4 border-t border-slate-800 bg-slate-950">
                        <div class="flex items-center mb-4 px-2 cursor-pointer p-2 rounded transition-colors">
                             <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm text-white mr-3">${currentUser.name.charAt(0)}</div>
                             <div class="overflow-hidden"><p class="text-sm font-medium text-white truncate">${currentUser.name}</p><p class="text-xs text-slate-400">Teacher Account</p></div>
                        </div>
                        <button onclick="location.reload()" class="w-full flex items-center px-4 py-2.5 bg-slate-800 hover:bg-red-600 rounded-lg transition-all duration-200 text-sm font-medium text-slate-300 hover:text-white group"><i data-lucide="log-out" class="w-4 h-4 mr-3 group-hover:scale-110 transition-transform"></i> Logout</button>
                    </div>
                </aside>
                <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <header class="bg-white border-b border-gray-200 px-6 h-20 flex items-center justify-between z-10 sticky top-0">
                        <div class="flex items-center"><button onclick="toggleSidebar()" class="md:hidden mr-4 p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"><i data-lucide="menu" class="w-6 h-6"></i></button><h1 class="text-2xl font-bold text-gray-800 tracking-tight" id="page-title">${currentView}</h1></div>
                        <div class="flex items-center gap-4"><button id="header-bell" class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors relative" title="View Notifications"><i data-lucide="bell" class="w-5 h-5"></i></button><div class="text-right hidden sm:block"><p class="text-sm text-gray-500">Today is</p><p class="text-sm font-semibold text-gray-800">${new Date().toLocaleDateString('en-US', { weekday: 'long', month:'short', day:'numeric' })}</p></div></div>
                    </header>
                    <main id="main-content" class="flex-1 overflow-x-hidden overflow-y-auto p-6 bg-gray-100 scroll-smooth"></main>
                </div>
            </div>`;
        
        const bellBtn = document.getElementById('header-bell');
        if(bellBtn) bellBtn.addEventListener('click', () => renderPage('Notifications'));
        renderSidebarLinks();
    }

    function toggleSidebar() { const sb = document.getElementById('sidebar'); const ov = document.getElementById('mobile-overlay'); if (sb.classList.contains('-translate-x-full')) { sb.classList.remove('-translate-x-full'); ov.classList.remove('hidden'); } else { sb.classList.add('-translate-x-full'); ov.classList.add('hidden'); }}

    function renderSidebarLinks() {
        const links = [{ name: 'Dashboard', icon: 'layout-dashboard' }, { name: 'Class Lists', icon: 'users' }, { name: 'Timetable', icon: 'calendar-clock' }, { name: 'Notifications', icon: 'message-square' }, { name: 'Attendance', icon: 'clipboard-check' }, { name: 'Exams', icon: 'file-spreadsheet' }, { name: 'Material Upload', icon: 'upload-cloud' }, { name: 'Reports', icon: 'bar-chart-big' }];
        document.getElementById('sidebar-nav').innerHTML = links.map(l => `<a href="#" class="sidebar-link flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 mb-1 ${currentView===l.name ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}" data-page="${l.name}"><i data-lucide="${l.icon}" class="w-5 h-5 mr-3 ${currentView===l.name?'':'opacity-70'}"></i> ${l.name}</a>`).join('');
        document.querySelectorAll('.sidebar-link').forEach(l => l.addEventListener('click', (e) => { e.preventDefault(); renderPage(e.currentTarget.dataset.page); if (window.innerWidth < 768) toggleSidebar(); }));
        lucide.createIcons();
    }

    function renderPage(p) {
        currentView = p; 
        document.getElementById('page-title').textContent = p;
        renderSidebarLinks();
        const m = document.getElementById('main-content');
        m.innerHTML = '<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>'; 
        
        if(p==='Dashboard') renderDashboard(m); 
        else if(p==='Class Lists') renderClassLists(m); 
        else if(p==='Timetable') renderTimetable(m); 
        else if(p==='Notifications') renderNotifications(m); 
        else if(p==='Attendance') renderAttendancePage(m); 
        else if(p==='Exams') renderExamsPage(m); 
        else if(p==='Reports') renderReportsPage(m); 
        else if(p==='Material Upload') renderAssignmentsPage(m);
        lucide.createIcons();
    }

    // --- DASHBOARD (MATCHING IMAGE & VARIABLE PERFORMANCE) ---
    function renderDashboard(c) {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const tc = timetableData.filter(t => t.day === today).sort((a,b) => a.time.localeCompare(b.time));
        const nextClass = tc.length > 0 ? tc[0] : null;
        const totalAssignments = assignmentsData.length;
        const totalNotifications = notificationsData.length;
        
        // Calculate Performance (Avg Attendance)
        let avgPerformance = 0;
        if (attendanceData.length > 0) {
            const presentCount = attendanceData.filter(r => r.status === 'P').length;
            avgPerformance = Math.round((presentCount / attendanceData.length) * 100);
        }

        // Recent Activity (Real data + Mock if empty)
        const recentActivity = [
            ...assignmentsData.map(a => ({ icon: 'file-check', text: `Assignment Uploaded: ${a.title}`, sub: `${a.className} • ${a.date}` })),
            ...notificationsData.map(n => ({ icon: 'bell', text: `Announcement: ${n.message.substring(0,20)}...`, sub: `${n.className} • ${n.timestamp.split(',')[0]}` }))
        ].reverse().slice(0, 3);

        c.innerHTML = `
            <div class="max-w-7xl mx-auto space-y-8">
                <!-- Header -->
                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">Welcome back, ${currentUser.name.split(' ')[0]}!</h2>
                        <p class="text-gray-500 text-sm mt-1">Here is your daily overview.</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold shadow-md border-2 border-white">
                        ${currentUser.name.charAt(0)}
                    </div>
                </div>

                <!-- Cards Row -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    <!-- Card 1: Today's Focus -->
                    <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center h-full">
                        <h3 class="text-gray-800 font-bold text-lg w-full text-left mb-4">Today's Focus</h3>
                        <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-4">
                            <i data-lucide="calendar" class="w-8 h-8"></i>
                        </div>
                        ${nextClass ? `
                            <div class="mb-4">
                                <p class="text-xl font-bold text-gray-800">${nextClass.time}</p>
                                <p class="text-gray-600 font-medium">${nextClass.subject}</p>
                                <p class="text-sm text-gray-400">${nextClass.location || 'Room N/A'}</p>
                            </div>
                        ` : `
                            <p class="text-gray-500 mb-6">No classes scheduled for today.</p>
                        `}
                        <button onclick="renderPage('Timetable')" class="text-indigo-600 font-semibold hover:underline text-sm mt-auto">View Full Timetable</button>
                    </div>

                    <!-- Card 2: Quick Actions -->
                    <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
                        <h3 class="text-gray-800 font-bold text-lg mb-6">Quick Actions</h3>
                        <div class="flex-1 flex flex-col justify-center space-y-4">
                            <button onclick="renderPage('Class Lists')" class="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors group">
                                <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mr-3 shadow-md group-hover:scale-105 transition-transform">
                                    <i data-lucide="plus" class="w-6 h-6"></i>
                                </div>
                                <span class="font-bold text-gray-700">Add New Student</span>
                            </button>
                            
                            <button onclick="renderPage('Notifications')" class="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-colors">
                                Post Announcement
                            </button>
                        </div>
                    </div>

                    <!-- Card 3: Pending Tasks -->
                    <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
                        <h3 class="text-gray-800 font-bold text-lg mb-4">Pending Tasks</h3>
                        <div class="flex items-start mb-6">
                            <div class="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 mr-4 shrink-0">
                                <i data-lucide="check-square" class="w-6 h-6"></i>
                            </div>
                            <div>
                                <p class="text-2xl font-bold text-gray-800 leading-none">${totalAssignments}</p>
                                <p class="text-sm text-gray-500 font-medium mt-1">Materials Uploaded</p>
                            </div>
                        </div>
                        <div class="mt-auto space-y-2">
                            <button onclick="renderPage('Notifications')" class="text-sm text-indigo-600 font-medium hover:underline block">${totalNotifications} Unread Notifications</button>
                            <button onclick="renderPage('Notifications')" class="text-sm text-gray-400 hover:text-gray-600 block">Go to Notifications</button>
                        </div>
                    </div>

                    <!-- Card 4: Performance Snapshot -->
                    <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center h-full relative overflow-hidden">
                        <h3 class="text-gray-800 font-bold text-lg w-full text-left mb-2">Performance</h3>
                        
                        <div class="relative w-32 h-32 flex items-center justify-center my-2">
                            <!-- Circular Progress CSS -->
                            <div class="w-full h-full rounded-full" style="background: conic-gradient(#10b981 ${avgPerformance}%, #f3f4f6 0);"></div>
                            <div class="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center">
                                <span class="text-3xl font-bold text-gray-800">${avgPerformance}%</span>
                                <span class="text-[10px] uppercase font-bold text-gray-400 tracking-wide">Avg Attendance</span>
                            </div>
                        </div>

                        <div class="w-full mt-auto bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                            <p class="text-xs text-gray-500 font-medium">Upcoming Event</p>
                            <p class="text-sm font-bold text-gray-800">Dec 5 - Mid-Term Exam</p>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 class="font-bold text-lg text-gray-800">Recent Activity</h3>
                    </div>
                    <div class="divide-y divide-gray-100">
                        ${recentActivity.length > 0 ? recentActivity.map(item => `
                            <div class="p-4 flex items-center hover:bg-gray-50 transition-colors">
                                <div class="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mr-4 shrink-0">
                                    <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <p class="text-gray-800 font-medium text-sm">${item.text}</p>
                                    <p class="text-xs text-gray-500 mt-0.5">${item.sub}</p>
                                </div>
                            </div>
                        `).join('') : '<div class="p-8 text-center text-gray-400">No recent activity to show.</div>'}
                    </div>
                </div>
            </div>
        `;
    }

    // --- CLASS LISTS ---
    function renderClassLists(c) {
        c.innerHTML = `<div class="flex flex-col md:flex-row justify-between mb-8 gap-4 items-center"><div><h2 class="text-xl font-bold text-gray-800">Your Classrooms</h2><p class="text-gray-500">Manage students and coordinators</p></div><button onclick="addClass()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center font-medium"><i data-lucide="plus" class="w-5 h-5 mr-2"></i> Add New Class</button></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${classesData.map((cls, idx) => { const colors = ['border-blue-500', 'border-emerald-500', 'border-purple-500', 'border-amber-500', 'border-pink-500']; const color = colors[idx % colors.length]; const bg = color.replace('border', 'bg').replace('500', '50'); return `<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group relative"><div class="h-1.5 w-full bg-gradient-to-r from-gray-200 to-gray-300 ${color.replace('border', 'bg')}"></div><div class="p-6"><div class="flex justify-between items-start mb-4"><div class="p-3 rounded-lg ${bg} ${color.replace('border', 'text').replace('500', '600')}"><i data-lucide="users" class="w-6 h-6"></i></div><button class="text-gray-300 hover:text-red-500 transition-colors" onclick="delClass('${cls.id}')"><i data-lucide="trash-2" class="w-5 h-5"></i></button></div><h3 class="text-xl font-bold text-gray-800 mb-1">${cls.name}</h3><p class="text-sm text-gray-500 mb-6 flex items-center"><i data-lucide="user" class="w-3 h-3 mr-1"></i> Coord: ${cls.coordinatorName}</p><div class="flex items-center justify-between border-t pt-4"><span class="text-xs font-bold text-gray-500 uppercase tracking-wide">${cls.students.length} Students</span><button onclick="viewClass('${cls.id}')" class="text-indigo-600 hover:text-indigo-800 font-semibold text-sm flex items-center group-hover:translate-x-1 transition-transform">View Details <i data-lucide="arrow-right" class="w-4 h-4 ml-1"></i></button></div></div></div>`; }).join('')}</div>`;
        window.addClass = () => showModal(`<h2 class="text-2xl font-bold mb-6">Create New Class</h2><div class="space-y-4"><input id="n-cn" placeholder="Class Name (e.g. 10-A)" class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"><input id="n-cc" placeholder="Coordinator Name" class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"><input id="n-cp" placeholder="Coordinator Phone" class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"></div><div class="flex justify-end gap-3 mt-8"><button onclick="closeModal()" class="px-5 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100">Cancel</button><button onclick="saveClass()" class="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium shadow-lg shadow-indigo-200 hover:bg-indigo-700">Create Class</button></div>`);
        window.saveClass = async () => { await apiCall('/api/classes', 'POST', { name: val('n-cn'), coordinatorName: val('n-cc'), coordinatorPhone: val('n-cp') }); closeModal(); await loadAllData(); renderPage('Class Lists'); };
        window.delClass = async (id) => { if(confirm('Delete this class and all its students?')) { await apiCall(`/api/classes/${id}`, 'DELETE'); await loadAllData(); renderPage('Class Lists'); }};
        
        window.viewClass = (cid) => {
            const cls = classesData.find(c => c.id === cid);
            if (!cls) return renderPage('Class Lists');
            document.getElementById('main-content').innerHTML = `
                <div class="mb-6"><button onclick="renderPage('Class Lists')" class="flex items-center text-gray-500 hover:text-indigo-600 transition-colors mb-4"><i data-lucide="arrow-left" class="w-4 h-4 mr-2"></i> Back to Classes</button><div class="flex flex-col md:flex-row justify-between items-center gap-4"><h2 class="text-3xl font-bold text-gray-800">${cls.name} <span class="text-lg font-normal text-gray-500 ml-2">(${cls.students.length} Students)</span></h2><button onclick="addStudent('${cid}')" class="px-5 py-2.5 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 flex items-center font-medium"><i data-lucide="user-plus" class="w-4 h-4 mr-2"></i> Add Student</button></div></div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold"><tr><th class="p-4 border-b">Roll No</th><th class="p-4 border-b">Student Name</th><th class="p-4 border-b">Status</th><th class="p-4 border-b">Contact</th><th class="p-4 border-b text-right">Actions</th></tr></thead>
                            <tbody class="divide-y divide-gray-100">
                                ${cls.students.map(s => `
                                    <tr class="hover:bg-gray-50 transition-colors">
                                        <td class="p-4 font-mono text-sm font-bold text-gray-600">${s.roll}</td>
                                        <td class="p-4"><div class="font-medium text-gray-900 cursor-pointer hover:text-indigo-600" onclick="openProfile('${s.id}')">${s.name}</div><div class="text-xs text-gray-400">${s.email}</div></td>
                                        <td class="p-4"><span class="px-2.5 py-1 rounded-full text-xs font-bold ${s.status === 'Hosteller' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}">${s.status}</span></td>
                                        <td class="p-4 text-sm text-gray-500">${s.phone || '-'}</td>
                                        <td class="p-4 text-right"><button onclick="delStud('${s.id}','${cid}')" class="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
                                    </tr>
                                `).join('')}
                                ${cls.students.length === 0 ? '<tr><td colspan="5" class="p-8 text-center text-gray-400 italic">No students added yet.</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>`;
            lucide.createIcons();
        };

        window.openProfile = (sid) => {
            const s = classesData.flatMap(c=>c.students).find(st=>st.id===sid);
            
            // --- CALL BUTTON COMPONENT ---
            const callBtn = (num) => num ? `<a href="tel:${num}" class="ml-2 inline-flex items-center justify-center p-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors" title="Call Now"><i data-lucide="phone" class="w-3 h-3"></i></a>` : '';

            showModal(`
                <div class="text-center mb-6">
                    <div class="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600"><i data-lucide="user" class="w-10 h-10"></i></div>
                    <h2 class="text-2xl font-bold text-gray-800">${s.name}</h2>
                    <p class="text-gray-500">${s.roll} | ${s.status}</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg space-y-3 mb-6 border border-gray-100">
                     <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-500">Student Phone:</span> 
                        <div class="flex items-center"><span class="font-medium font-mono text-gray-800">${s.phone || 'N/A'}</span>${callBtn(s.phone)}</div>
                     </div>
                     <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-500">Parent Phone:</span> 
                        <div class="flex items-center"><span class="font-medium font-mono text-gray-800">${s.parentPhone || 'N/A'}</span>${callBtn(s.parentPhone)}</div>
                     </div>
                </div>
                <div class="space-y-4">
                    <div><label class="block text-xs font-bold uppercase text-gray-500 mb-1">Address</label><textarea id="p-addr" class="w-full border p-3 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">${s.address}</textarea></div>
                    <div><label class="block text-xs font-bold uppercase text-gray-500 mb-1">Academic Notes / Previous Marks</label><textarea id="p-marks" class="w-full border p-3 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none h-24">${s.previousMarks}</textarea></div>
                </div>
                <div class="flex justify-end gap-3 mt-6"><button onclick="closeModal()" class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Close</button><button onclick="updateProfile('${s.id}')" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow">Save Changes</button></div>
            `);
            lucide.createIcons();
        };

        window.updateProfile = async (sid) => { await apiCall(`/api/students/${sid}`, 'PUT', { address: val('p-addr'), previousMarks: val('p-marks') }); closeModal(); await loadAllData(); };

        window.addStudent = (cid) => showModal(`<h2 class="text-2xl font-bold mb-6">Add New Student</h2><div class="grid grid-cols-2 gap-4"><input id="n-sn" placeholder="Full Name" class="col-span-2 border p-3 rounded-lg"><input id="n-sr" placeholder="Roll Number" class="border p-3 rounded-lg"><select id="n-ss" class="border p-3 rounded-lg bg-white"><option>Day Scholar</option><option>Hosteller</option></select><input id="n-se" placeholder="Email Address" class="col-span-2 border p-3 rounded-lg"><input id="n-sp" placeholder="Student Phone" class="border p-3 rounded-lg"><input id="n-pp" placeholder="Parent Phone" class="border p-3 rounded-lg"></div><div class="flex justify-end gap-3 mt-6"><button onclick="closeModal()" class="px-4 py-2 text-gray-500">Cancel</button><button onclick="saveStud('${cid}')" class="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow font-bold">Add Student</button></div>`);
        
        window.saveStud = async (cid) => { 
            const res = await apiCall(`/api/classes/${cid}/students`, 'POST', { name: val('n-sn'), roll: val('n-sr'), email: val('n-se'), status: val('n-ss'), phone: val('n-sp'), parentPhone: val('n-pp') }); 
            if(res.error) { alert(res.error); } 
            else { 
                closeModal(); 
                await loadAllData(); 
                viewClass(cid);      
            }
        };
        
        window.delStud = async (sid, cid) => { 
            if(confirm('Are you sure?')) { 
                await apiCall(`/api/students/${sid}`, 'DELETE'); 
                await loadAllData(); 
                viewClass(cid); 
            }
        };
    }

    // --- TIMETABLE ---
    function renderTimetable(c) {
        const dayColors = {
            'Monday':    { border: 'border-blue-500',    text: 'text-blue-600',    bg: 'bg-blue-50',    btn: 'bg-blue-100 text-blue-700' },
            'Tuesday':   { border: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', btn: 'bg-emerald-100 text-emerald-700' },
            'Wednesday': { border: 'border-purple-500',  text: 'text-purple-600',  bg: 'bg-purple-50',  btn: 'bg-purple-100 text-purple-700' },
            'Thursday':  { border: 'border-orange-500',  text: 'text-orange-600',  bg: 'bg-orange-50',  btn: 'bg-orange-100 text-orange-700' },
            'Friday':    { border: 'border-pink-500',    text: 'text-pink-600',    bg: 'bg-pink-50',    btn: 'bg-pink-100 text-pink-700' },
            'Saturday':  { border: 'border-cyan-500',    text: 'text-cyan-600',    bg: 'bg-cyan-50',    btn: 'bg-cyan-100 text-cyan-700' }
        };

        c.innerHTML = `
            <div class="flex justify-between items-center mb-8"><div><h2 class="text-2xl font-bold text-gray-800">Weekly Schedule</h2><p class="text-gray-500">Manage your class timings</p></div></div>
            <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                ${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => {
                    const theme = dayColors[d];
                    const list = timetableData.filter(t => t.day === d).sort((a,b) => a.time.localeCompare(b.time));
                    return `
                    <div class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border-t-4 ${theme.border}">
                        <div class="p-5">
                            <div class="flex justify-between items-center mb-4"><h3 class="font-bold text-xl ${theme.text}">${d}</h3><button onclick="addTime('${d}')" class="${theme.btn} hover:opacity-80 px-3 py-1 rounded-full text-xs font-bold transition-colors">+ Add</button></div>
                            <div class="space-y-3">
                                ${list.length > 0 ? list.map(t => `<div class="flex items-start p-3 rounded-lg border border-gray-100 group hover:${theme.bg} transition-colors bg-gray-50 relative"><div class="mt-1 mr-3 ${theme.text}"><i data-lucide="clock" class="w-4 h-4"></i></div><div class="flex-1 min-w-0"><p class="font-bold text-gray-800 text-sm truncate">${t.subject}</p><div class="flex items-center gap-2 mt-1"><span class="text-xs font-mono bg-white border px-1.5 rounded text-gray-600">${t.time}</span>${t.location ? `<span class="text-[10px] uppercase tracking-wide text-gray-400 font-semibold flex items-center"><i data-lucide="map-pin" class="w-3 h-3 mr-0.5"></i> ${t.location}</span>` : ''}</div></div><button onclick="delTime('${t.id}')" class="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>`).join('') : `<div class="text-center py-6 border-2 border-dashed border-gray-100 rounded-lg"><p class="text-gray-400 text-sm">No classes</p></div>`}
                            </div>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
        window.addTime=(d)=>showModal(`<h2 class="text-xl font-bold mb-4">Add to ${d}</h2><div class="space-y-4"><input type="hidden" id="t-d" value="${d}"><input type="time" id="t-t" class="w-full border p-3 rounded-lg"><input id="t-s" placeholder="Subject" class="w-full border p-3 rounded-lg"><input id="t-l" placeholder="Location / Room" class="w-full border p-3 rounded-lg"></div><div class="flex justify-end gap-3 mt-6"><button onclick="closeModal()" class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button><button onclick="saveTime()" class="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow">Save</button></div>`);
        window.saveTime=async()=>{ await apiCall('/api/timetable','POST',{day:val('t-d'),time:val('t-t'),subject:val('t-s'),location:val('t-l')}); closeModal(); await loadAllData(); renderPage('Timetable'); };
        window.delTime=async(id)=>{ if(confirm('Delete?')){ await apiCall(`/api/timetable/${id}`,'DELETE'); await loadAllData(); renderPage('Timetable'); }};
    }

    // --- NOTIFICATIONS ---
    function renderNotifications(c) {
        c.innerHTML = `
            <div class="grid lg:grid-cols-3 gap-8 h-[calc(100vh-140px)]">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                    <h3 class="font-bold text-lg text-gray-800 mb-4 flex items-center"><i data-lucide="send" class="w-5 h-5 mr-2 text-indigo-600"></i> New Announcement</h3>
                    <div class="space-y-4">
                        <div><label class="block text-xs font-bold uppercase text-gray-500 mb-1">Target Audience</label><select id="not-c" class="w-full border p-3 rounded-lg bg-gray-50"><option>All Classes</option>${classesData.map(cl=>`<option>${cl.name}</option>`)}</select></div>
                        <div><label class="block text-xs font-bold uppercase text-gray-500 mb-1">Message</label><textarea id="not-m" class="w-full border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none" rows="6" placeholder="Type your announcement here..."></textarea></div>
                        <button id="btn-post-not" onclick="postNot()" class="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold shadow hover:bg-indigo-700 transition-colors">Post & Email Notification</button>
                    </div>
                </div>
                <div class="lg:col-span-2 space-y-4 overflow-y-auto pr-2 pb-10">
                    <h3 class="font-bold text-lg text-gray-800 mb-2">History</h3>
                    ${notificationsData.length === 0 ? '<div class="text-center py-10 text-gray-400">No notifications posted yet.</div>' : 
                    notificationsData.slice().reverse().map(n => `<div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative pl-6"><div class="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-l-xl"></div><p class="text-gray-800 text-lg leading-relaxed mb-3">${n.message}</p><div class="flex justify-between items-center text-xs text-gray-500 border-t pt-3"><span class="bg-gray-100 px-2 py-1 rounded font-medium text-gray-600">${n.className}</span><span class="flex items-center"><i data-lucide="clock" class="w-3 h-3 mr-1"></i> ${n.timestamp}</span></div></div>`).join('')}
                </div>
            </div>`;
        
        window.postNot = async () => { 
            const msg = val('not-m'), targetClass = val('not-c'), btn = document.getElementById('btn-post-not');
            if(!msg) return alert('Message is empty'); 
            btn.innerHTML = '<i class="animate-spin" data-lucide="loader-2"></i> Sending Emails...'; btn.disabled = true; lucide.createIcons();
            let studentsToEmail = [];
            if (targetClass === 'All Classes') classesData.forEach(c => studentsToEmail.push(...c.students));
            else { const cls = classesData.find(c => c.name === targetClass); if (cls) studentsToEmail = cls.students; }
            studentsToEmail = studentsToEmail.filter(s => s.email && s.email.includes('@'));
            if (studentsToEmail.length > 0) { let sentCount = 0; for (const s of studentsToEmail) { try { await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { to_email: s.email, to_name: s.name, subject: `New Announcement`, message: msg }, EMAILJS_PUBLIC_KEY); sentCount++; } catch (e) {} } alert(`Notification sent to ${sentCount} students via email.`); }
            await apiCall('/api/notifications', 'POST', { message: msg, className: targetClass, timestamp: new Date().toLocaleString() }); 
            await loadAllData(); 
            if (currentView === 'Notifications') renderPage('Notifications'); 
        };
    }

    // --- ATTENDANCE ---
    function renderAttendancePage(c) {
        c.innerHTML = `<div class="flex justify-between items-center mb-6"><div><h2 class="text-2xl font-bold text-gray-800">Attendance Log</h2><p class="text-gray-500">Track student presence</p></div><button onclick="takeAtt()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg shadow-lg shadow-emerald-200 font-bold flex items-center transition-all"><i data-lucide="check-square" class="w-5 h-5 mr-2"></i> Mark Today's Attendance</button></div><div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><table class="w-full text-left"><thead class="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold"><tr><th class="p-4">Date</th><th class="p-4">Class</th><th class="p-4">Details</th></tr></thead><tbody class="divide-y divide-gray-100">${attendanceData.length ? attendanceData.slice().reverse().slice(0, 30).map(r => `<tr class="hover:bg-gray-50 transition-colors"><td class="p-4 text-gray-600 font-mono text-sm">${r.date}</td><td class="p-4 font-bold text-gray-800">${r.className}</td><td class="p-4"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.status === 'P' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${r.studentName}: ${r.status === 'P' ? 'Present' : 'Absent'}</span></td></tr>`).join('') : '<tr><td colspan="3" class="p-8 text-center text-gray-400">No records found.</td></tr>'}</tbody></table></div>`;
        window.takeAtt=()=>showModal(`<h2 class="text-2xl font-bold mb-4">Mark Attendance</h2><div class="grid grid-cols-2 gap-4 mb-4"><select id="att-c" onchange="loadAttList()" class="border p-3 rounded-lg"><option value="">Select Class</option>${classesData.map(c=>`<option value="${c.id}">${c.name}</option>`)}</select><input type="date" id="att-d" class="border p-3 rounded-lg" value="${new Date().toISOString().split('T')[0]}"></div><div id="att-l" class="max-h-[50vh] overflow-y-auto border rounded-lg bg-gray-50 p-2 space-y-2"></div><div class="flex justify-end gap-3 mt-6"><button onclick="closeModal()" class="px-4 py-2 text-gray-500">Cancel</button><button onclick="saveAtt()" class="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow font-bold">Submit</button></div>`);
        window.loadAttList=()=>{ const cls=classesData.find(c=>c.id===val('att-c')); document.getElementById('att-l').innerHTML=cls?cls.students.map(s=>`<div class="flex justify-between items-center p-3 bg-white rounded shadow-sm border border-gray-100" data-id="${s.id}" data-name="${s.name}"><span class="font-medium text-gray-800">${s.name}</span><div class="flex gap-1"><button onclick="setSt(this,'P')" class="w-10 h-10 rounded-lg font-bold transition-all bg-emerald-500 text-white shadow-emerald-200 shadow">P</button><button onclick="setSt(this,'A')" class="w-10 h-10 rounded-lg font-bold transition-all bg-gray-100 text-gray-400 hover:bg-gray-200">A</button></div></div>`).join(''):'<p class="text-center text-gray-400 p-4">Select a class first</p>'; };
        window.setSt=(b,s)=>{const p=b.parentElement; p.dataset.status=s; p.querySelectorAll('button').forEach(btn=>{ if(btn.textContent===s){ btn.className=`w-10 h-10 rounded-lg font-bold transition-all shadow text-white ${s==='P'?'bg-emerald-500 shadow-emerald-200':'bg-red-500 shadow-red-200'}`; } else { btn.className='w-10 h-10 rounded-lg font-bold transition-all bg-gray-100 text-gray-400 hover:bg-gray-200'; }});};
        window.saveAtt=async()=>{ const rows=document.querySelectorAll('#att-l > div'); const d=Array.from(rows).map(r=>({date:val('att-d'),studentId:r.dataset.id,studentName:r.dataset.name,className:classesData.find(c=>c.id===val('att-c')).name,status:r.querySelector('div').dataset.status||'P'})); await apiCall('/api/attendance','POST',d); closeModal(); await loadAllData(); renderPage('Attendance'); };
    }

    // --- EXAMS ---
    function renderExamsPage(c) {
        c.innerHTML = `
            <div class="flex justify-between items-center mb-8"><div><h2 class="text-2xl font-bold text-gray-800">Exam Management</h2><p class="text-gray-500">Schedule exams and record marks</p></div><button onclick="mkEx()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-indigo-200 font-bold flex items-center transition-all"><i data-lucide="plus-circle" class="w-5 h-5 mr-2"></i> Create Exam</button></div>
            <div id="ex-l" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">${examsData.map(e=>`<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative hover:shadow-md transition-shadow"><div class="absolute top-0 left-0 w-full h-1 bg-amber-500 rounded-t-xl"></div><div class="flex justify-between items-start mb-4"><div class="p-3 bg-amber-50 text-amber-600 rounded-lg"><i data-lucide="file-check" class="w-6 h-6"></i></div><button onclick="rmEx('${e.id}')" class="text-gray-300 hover:text-red-500 transition-colors"><i data-lucide="trash-2" class="w-5 h-5"></i></button></div><h3 class="font-bold text-xl text-gray-800 mb-1">${e.title}</h3><p class="text-sm text-gray-500 mb-6">Total Marks: <span class="font-mono font-bold text-gray-700">${e.totalMarks}</span></p><button onclick="entM('${e.id}','${e.classId}')" class="w-full bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-indigo-600 border border-gray-200 py-2.5 rounded-lg font-bold transition-all flex items-center justify-center"><i data-lucide="edit-3" class="w-4 h-4 mr-2"></i> Enter Marks</button></div>`).join('')}</div>`;
        window.mkEx=()=>showModal(`<h2 class="text-xl font-bold mb-4">New Exam</h2><div class="space-y-4"><select id="ne-c" class="w-full border p-3 rounded-lg"><option value="">Select Class</option>${classesData.map(c=>`<option value="${c.id}">${c.name}</option>`)}</select><input id="ne-t" placeholder="Exam Title (e.g. Mid-Term Physics)" class="w-full border p-3 rounded-lg"><input id="ne-m" placeholder="Maximum Marks" type="number" class="w-full border p-3 rounded-lg"></div><div class="flex justify-end gap-3 mt-6"><button onclick="closeModal()" class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button><button onclick="svEx()" class="px-5 py-2 bg-indigo-600 text-white rounded-lg shadow font-bold">Save Exam</button></div>`);
        window.svEx=async()=>{await apiCall('/api/exams','POST',{title:val('ne-t'),totalMarks:val('ne-m'),classId:val('ne-c')}); closeModal(); await loadAllData(); renderPage('Exams');};
        window.rmEx=async(id)=>{if(confirm('Delete this exam?')){await apiCall(`/api/exams/${id}`,'DELETE'); await loadAllData(); renderPage('Exams');}};
        window.entM=async(eid,cid)=>{ const res=await fetch(`${API_BASE}/api/scores?examId=${eid}`); const sc=await res.json(); const cls=classesData.find(c=>c.id===cid); showModal(`<h2 class="text-xl font-bold mb-4">Update Marks</h2><div class="max-h-[60vh] overflow-y-auto mb-6 space-y-2 bg-gray-50 p-2 rounded-lg border">${cls.students.map(s=>`<div class="flex justify-between items-center bg-white p-3 rounded border border-gray-100"><span class="font-medium text-gray-700 w-2/3">${s.name}</span><input class="m-ip border p-2 w-24 rounded font-mono text-center focus:ring-2 focus:ring-indigo-500 outline-none" data-sid="${s.id}" value="${sc.find(x=>x.studentId===s.id)?.marks||''}" placeholder="0"></div>`).join('')}</div><div class="flex justify-end gap-3"><button onclick="closeModal()" class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button><button onclick="svM('${eid}')" class="px-5 py-2 bg-emerald-600 text-white rounded-lg shadow font-bold">Save Marks</button></div>`);};
        window.svM=async(eid)=>{ const d=Array.from(document.querySelectorAll('.m-ip')).map(i=>({examId:eid,studentId:i.dataset.sid,marks:i.value||0})); await apiCall('/api/scores','POST',d); alert('Saved!'); closeModal(); };
    }

    // --- MATERIAL UPLOAD & HISTORY ---
    function renderAssignmentsPage(c) {
        // Filter history by type using a default value of 'Assignment' if category is undefined
        const assignmentsList = assignmentsData.filter(a => (a.category || 'Assignment') === 'Assignment').reverse();
        const notesList = assignmentsData.filter(a => a.category === 'Study Note').reverse();

        c.innerHTML = `
            <div class="grid lg:grid-cols-2 gap-8 h-full">
                <!-- Upload Form -->
                <div class="h-fit">
                    <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 sticky top-4">
                        <div class="text-center mb-8">
                            <div class="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"><i data-lucide="upload-cloud" class="w-8 h-8"></i></div>
                            <h2 class="text-2xl font-bold text-gray-800">Upload Material</h2>
                            <p class="text-gray-500 mt-2">Share resources with your class</p>
                        </div>
                        <div class="space-y-5">
                            <div><label class="block text-sm font-bold text-gray-700 mb-2">Category</label><select id="asg-type" class="w-full border border-gray-300 p-3 rounded-lg"><option value="Assignment">Assignment / Homework</option><option value="Study Note">Study Note / Resource</option></select></div>
                            <div><label class="block text-sm font-bold text-gray-700 mb-2">Select Class</label><select id="asg-c" class="w-full border border-gray-300 p-3 rounded-lg"><option value="">-- Choose --</option>${classesData.map(c=>`<option>${c.name}</option>`)}</select></div>
                            <div><label class="block text-sm font-bold text-gray-700 mb-2">Title</label><input id="asg-s" class="w-full border border-gray-300 p-3 rounded-lg" placeholder="e.g. Physics Chapter 3"></div>
                            <div><label class="block text-sm font-bold text-gray-700 mb-2">Description</label><textarea id="asg-b" class="w-full border border-gray-300 p-3 rounded-lg h-24 resize-none" placeholder="Instructions..."></textarea></div>
                            <div><label class="block text-sm font-bold text-gray-700 mb-2">Attach File</label><input type="file" id="asg-f" class="w-full border border-gray-300 p-2 rounded-lg bg-gray-50"></div>
                            <button onclick="sendAsg()" id="btn-send-asg" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center"><i data-lucide="send" class="w-5 h-5 mr-2"></i> Upload & Notify</button>
                        </div>
                    </div>
                </div>

                <!-- History Section -->
                <div class="space-y-6 overflow-y-auto pb-10">
                    <div>
                        <h3 class="font-bold text-xl text-gray-800 mb-4 flex items-center"><i data-lucide="clipboard-list" class="w-5 h-5 mr-2 text-indigo-600"></i> Assignments History</h3>
                        ${assignmentsList.length ? assignmentsList.map(a => `
                            <div class="bg-white p-4 rounded-xl border border-gray-200 mb-3 shadow-sm hover:shadow-md transition-shadow">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h4 class="font-bold text-gray-800">${a.title}</h4>
                                        <p class="text-sm text-gray-500 mt-1">${a.className}</p>
                                    </div>
                                    <span class="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">${a.date}</span>
                                </div>
                            </div>`).join('') : '<p class="text-gray-400 italic text-sm">No assignments uploaded yet.</p>'}
                    </div>

                    <div>
                        <h3 class="font-bold text-xl text-gray-800 mb-4 flex items-center"><i data-lucide="file-text" class="w-5 h-5 mr-2 text-emerald-600"></i> Study Notes History</h3>
                        ${notesList.length ? notesList.map(a => `
                            <div class="bg-white p-4 rounded-xl border border-gray-200 mb-3 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h4 class="font-bold text-gray-800">${a.title}</h4>
                                        <p class="text-sm text-gray-500 mt-1">${a.className}</p>
                                    </div>
                                    <span class="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">${a.date}</span>
                                </div>
                            </div>`).join('') : '<p class="text-gray-400 italic text-sm">No notes uploaded yet.</p>'}
                    </div>
                </div>
            </div>`;
            
        window.sendAsg = async () => {
            const clsName = val('asg-c'), subj = val('asg-s'), body = val('asg-b'), type = val('asg-type'), fileInput = document.getElementById('asg-f');
            if(!clsName || !subj) return alert('Please fill in all required fields');
            
            const list = classesData.find(c=>c.name===clsName)?.students.filter(s=>s.email&&s.email.includes('@')) || [];
            const btn = document.getElementById('btn-send-asg');
            let attachmentUrl = "";
            
            if(fileInput.files.length > 0) {
                btn.innerHTML = '<i class="animate-spin" data-lucide="loader-2"></i> Uploading...'; btn.disabled = true; lucide.createIcons();
                const formData = new FormData(); formData.append('file', fileInput.files[0]);
                try {
                    const res = await fetch(API_BASE + '/api/upload', {method:'POST', body: formData});
                    const data = await res.json();
                    if(data.url) attachmentUrl = data.url; else throw new Error("Upload failed");
                } catch(e) { btn.disabled = false; btn.innerHTML = 'Upload & Notify'; return alert("File upload failed."); }
            }

            if(list.length > 0) {
                if(!confirm(`Ready to email ${list.length} students?`)) { btn.disabled = false; btn.innerHTML = 'Upload & Notify'; return; }
                btn.innerHTML = '<i class="animate-spin" data-lucide="loader-2"></i> Sending Emails...';
                const fullMessage = `${body}\n\n${attachmentUrl ? "Download Material: " + attachmentUrl : ""}`;
                let sent=0; 
                const subjectLine = type === 'Assignment' ? `New Assignment: ${subj}` : `New Study Note: ${subj}`;
                for(const s of list) { try { await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { to_email: s.email, to_name: s.name, subject: subjectLine, message: fullMessage }, EMAILJS_PUBLIC_KEY); sent++; } catch(e){} }
                alert(`Sent emails to ${sent} students.`);
            }
            
            // Save assignment to database
            const saveRes = await apiCall('/api/assignments', 'POST', { 
                title: subj, 
                className: clsName, 
                date: new Date().toLocaleDateString(), 
                category: type 
            });

            if (saveRes.error) {
                alert("Error saving assignment: " + saveRes.error);
                btn.disabled = false; 
                btn.innerHTML = 'Upload & Notify';
                return;
            }

            btn.disabled = false; btn.innerHTML = 'Upload & Notify'; 
            await loadAllData(); 
            // Re-render Material page to show new history item
            if(currentView === 'Material Upload') renderAssignmentsPage(document.getElementById('main-content'));
        };
    }

    // --- REPORTS ---
    function renderReportsPage(c) {
        c.innerHTML = `<div class="mb-8"><h2 class="text-2xl font-bold text-gray-800">Student Analytics</h2><p class="text-gray-500">Performance & Attendance Reports</p></div><div class="grid lg:grid-cols-3 gap-8"><div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit"><h3 class="font-bold text-gray-700 mb-4">Select Student</h3><div class="space-y-4"><select id="rep-c" onchange="loadRepStud()" class="w-full border p-3 rounded-lg"><option>Select Class</option>${classesData.map(c=>`<option value="${c.id}">${c.name}</option>`)}</select><select id="rep-s" onchange="loadRepData()" class="w-full border p-3 rounded-lg bg-gray-50 disabled:bg-gray-100" disabled><option>Select Student</option></select></div></div><div id="rep-res" class="lg:col-span-2 space-y-6"><div class="flex items-center justify-center h-40 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">Select a student to view report</div></div></div>`;
        window.loadRepStud = () => { const cls = classesData.find(c => c.id === val('rep-c')); const sSelect = document.getElementById('rep-s'); sSelect.innerHTML = '<option>Select Student</option>' + (cls ? cls.students.map(s=>`<option value="${s.id}">${s.name}</option>`) : ''); sSelect.disabled = !cls; };
        window.loadRepData = async () => { const sid = val('rep-s'); if(!sid) return; document.getElementById('rep-res').innerHTML = '<div class="flex justify-center p-10"><i class="animate-spin text-indigo-600" data-lucide="loader-2"></i></div>'; lucide.createIcons(); const res = await fetch(`${API_BASE}/api/students/${sid}/analytics`); const d = await res.json(); const att = d.attendance; const color = att.percentage >= 75 ? 'bg-emerald-500' : (att.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'); document.getElementById('rep-res').innerHTML = `<div class="bg-white p-8 rounded-xl shadow-sm border border-gray-100"><h3 class="font-bold text-lg text-gray-800 mb-6 flex items-center"><i data-lucide="pie-chart" class="w-5 h-5 mr-2 text-indigo-600"></i> Attendance Overview</h3><div class="mb-2 flex justify-between items-end"><span class="text-4xl font-bold text-gray-800">${att.percentage}%</span><span class="text-sm text-gray-500 font-medium">Attendance Score</span></div><div class="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-6"><div class="${color} h-full rounded-full transition-all duration-1000" style="width:${att.percentage}%"></div></div><div class="grid grid-cols-2 gap-4"><div class="bg-emerald-50 p-4 rounded-lg text-center border border-emerald-100"><p class="text-2xl font-bold text-emerald-600">${att.present}</p><p class="text-xs font-bold uppercase text-emerald-400 mt-1">Days Present</p></div><div class="bg-gray-50 p-4 rounded-lg text-center border border-gray-200"><p class="text-2xl font-bold text-gray-600">${att.total}</p><p class="text-xs font-bold uppercase text-gray-400 mt-1">Total Days</p></div></div></div><div class="bg-white p-8 rounded-xl shadow-sm border border-gray-100"><h3 class="font-bold text-lg text-gray-800 mb-6 flex items-center"><i data-lucide="trending-up" class="w-5 h-5 mr-2 text-indigo-600"></i> Academic Performance</h3><table class="w-full text-left"><thead><tr class="border-b border-gray-100"><th class="pb-3 text-sm text-gray-500 uppercase">Exam Title</th><th class="pb-3 text-sm text-gray-500 uppercase">Obtained</th><th class="pb-3 text-sm text-gray-500 uppercase">Total</th><th class="pb-3 text-right text-sm text-gray-500 uppercase">Percentage</th></tr></thead><tbody class="divide-y divide-gray-50">${d.exams.length ? d.exams.map(e => { const pct = (e.obtained/e.total)*100; return `<tr><td class="py-3 font-medium text-gray-800">${e.title}</td><td class="py-3 font-mono font-bold text-indigo-600">${e.obtained}</td><td class="py-3 text-gray-500 font-mono">${e.total}</td><td class="py-3 text-right"><span class="px-2 py-1 rounded text-xs font-bold ${pct>=40?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}">${pct.toFixed(1)}%</span></td></tr>`; }).join('') : '<tr><td colspan="4" class="py-6 text-center text-gray-400 italic">No exam records found.</td></tr>'}</tbody></table></div>`; lucide.createIcons(); };
    }

    // --- UTILS ---
    function showModal(html) { document.getElementById('modal-container').innerHTML = `<div class="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"><div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto transform scale-100 transition-all">${html}</div></div>`; lucide.createIcons(); }
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
