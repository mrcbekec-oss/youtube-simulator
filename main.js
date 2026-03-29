// Game State
let state = {
    subs: 0,
    views: 0,
    money: 0,
    totalVideos: 0,
    category: 'vlog',
    
    // Recording state: 0 (Idle), 1 (Recording), 2 (Editing), 3 (Uploading)
    gameStage: 0,
    progress: 0,
    rawFootage: 0,
    editedFootage: 0,
    
    // Upgrades
    upgrades: {
        camera: 1, // Level 1: Basic Webcam
        pc: 1,     // Level 1: Old Laptop
        mic: 1,    // Level 1: Built-in Mic
        net: 1     // Level 1: 8Mbps ADSL
    },
    
    lastUpdate: Date.now()
};

// Upgrade Definitions
const UPGRADES = {
    camera: [
        { name: "Eski Web Kamerası", cost: 0, quality: 1, desc: "Görüntü kalitesi çok düşük." },
        { name: "HD USB Kamera", cost: 150, quality: 2, desc: "Daha net, 720p görüntü." },
        { name: "Mirrorless Kamera", cost: 800, quality: 5, desc: "Profesyonel derinlik ve renkler." },
        { name: "4K Sinema Kamerası", cost: 5000, quality: 15, desc: "Hollywood standartlarında kalite!" },
        { name: "VR 360 Kamera", cost: 25000, quality: 50, desc: "Geleceğin teknolojisi, inanılmaz izlenme!" }
    ],
    pc: [
        { name: "Eski Laptop", cost: 0, speed: 1, desc: "Render alırken fan sesi uçak gibi." },
        { name: "Ev Bilgisayarı", cost: 300, speed: 2, desc: "Biraz daha hızlı montaj." },
        { name: "Oyun Bilgisayarı", cost: 1500, speed: 6, desc: "RTX desteğiyle anında render!" },
        { name: "Workstation", cost: 8000, speed: 20, desc: "Saniyeler içinde 4K video hazır." },
        { name: "Render Farm", cost: 50000, speed: 100, desc: "Süper bilgisayar gücü parmaklarında." }
    ],
    mic: [
        { name: "Laptop Mikronu", cost: 0, retention: 1, desc: "Herkes cızırtıdan şikayetçi." },
        { name: "Yaka Mikrofonu", cost: 100, retention: 1.5, desc: "Sesin artık daha anlaşılır." },
        { name: "USB Mikrofon", cost: 500, retention: 3, desc: "Podcast kalitesinde ses." },
        { name: "Stüdyo Mikrofonu", cost: 2000, retention: 10, desc: "ASMR videoları bile çekebilirsin." }
    ],
    net: [
        { name: "8Mbps ADSL", cost: 0, upload: 1, desc: "Video yüklemek saatler sürüyor." },
        { name: "Fiber Optik", cost: 250, upload: 4, desc: "Hızlı yükleme, daha çok zaman!" },
        { name: "GigaFiber", cost: 1200, upload: 15, desc: "Tıkla ve yüklensin." },
        { name: "Uydu İnterneti", cost: 5000, upload: 50, desc: "Mars'tan bile video yükleyebilirsin." }
    ]
};

// DOM Elements
const elements = {
    subs: document.querySelector('#stat-subs .value'),
    views: document.querySelector('#stat-views .value'),
    money: document.querySelector('#stat-money .value'),
    totalVideos: document.querySelector('#total-videos'),
    dailyIncome: document.querySelector('#daily-income'),
    
    progressBar: document.querySelector('#main-progress'),
    statusText: document.querySelector('#status-text'),
    videoTitle: document.querySelector('#video-title'),
    
    btnRecord: document.querySelector('#btn-record'),
    btnEdit: document.querySelector('#btn-edit'),
    btnUpload: document.querySelector('#btn-upload'),
    
    tabs: document.querySelectorAll('.tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    gearList: document.querySelector('#gear-list'),
    
    navItems: document.querySelectorAll('.nav-item'),
    actionPanel: document.querySelector('.action-panel'),
    upgradePanel: document.querySelector('.upgrade-panel')
};

// --- Initialization ---

function init() {
    loadGame();
    renderUpgrades();
    updateUI();
    
    // Auto-save every 10 seconds
    setInterval(saveGame, 10000);
    
    // Passive Income Loop
    setInterval(gameTick, 1000);
    
    setupEventListeners();
}

function setupEventListeners() {
    // Stage buttons
    elements.btnRecord.addEventListener('mousedown', startRecording);
    elements.btnEdit.addEventListener('click', startEditing);
    elements.btnUpload.addEventListener('click', startUploading);
    
    // Tabs
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.tabs.forEach(t => t.classList.remove('active'));
            elements.tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });

    // Mobile Nav
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            elements.navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            const target = item.dataset.target;
            if (target === 'upgrade-panel') {
                elements.upgradePanel.classList.add('mobile-active');
            } else {
                elements.upgradePanel.classList.remove('mobile-active');
            }
        });
    });
}

// --- Game Logic ---

function startRecording(e) {
    if (state.gameStage !== 0) return;
    
    state.progress += 5 * (UPGRADES.camera[state.upgrades.camera - 1].quality);
    if (state.progress >= 100) {
        state.progress = 0;
        state.gameStage = 1;
        state.rawFootage = 100;
        showNotification("Kayıt Tamamlandı! Şimdi montaj zamanı.", "success");
    }
    
    createFloatingText(e.clientX, e.clientY, "+RAW");
    updateUI();
}

function startEditing() {
    if (state.gameStage !== 1) return;
    
    state.gameStage = 2; // Transitioning to Editing
    state.progress = 0;
    
    const editTime = 5000 / UPGRADES.pc[state.upgrades.pc - 1].speed;
    const interval = 50;
    const step = 100 / (editTime / interval);
    
    const timer = setInterval(() => {
        state.progress += step;
        if (state.progress >= 100) {
            state.progress = 0;
            state.gameStage = 3; // Ready to upload
            clearInterval(timer);
            updateUI();
        }
        updateUI();
    }, interval);
}

function startUploading() {
    if (state.gameStage !== 3) return;
    
    state.gameStage = 4; // Uploading
    state.progress = 0;
    
    const uploadTime = 3000 / UPGRADES.net[state.upgrades.net - 1].upload;
    const interval = 50;
    const step = 100 / (uploadTime / interval);
    
    const timer = setInterval(() => {
        state.progress += step;
        if (state.progress >= 100) {
            finishVideo();
            clearInterval(timer);
        }
        updateUI();
    }, interval);
}

function finishVideo() {
    state.gameStage = 0;
    state.progress = 0;
    state.totalVideos++;
    
    // Calculate gains
    const camQuality = UPGRADES.camera[state.upgrades.camera - 1].quality;
    const micRetention = UPGRADES.mic[state.upgrades.mic - 1].retention;
    
    // Logic: Quality affects views, Subs give a base boost
    const baseViews = (50 + Math.random() * 100) * camQuality;
    const subBoost = 1 + (state.subs / 1000); // 100% boost at 1000 subs
    const newViews = Math.floor(baseViews * subBoost);
    
    const newSubs = Math.floor(newViews * 0.05 * micRetention);
    const instantMoney = newViews * 0.01; // ₺10 per 1000 views (instant ad revenue)
    
    state.views += newViews;
    state.subs += newSubs;
    state.money += instantMoney;
    
    showNotification(`Video Yayında! +${formatNumber(newViews)} İzlenme, +${formatNumber(newSubs)} Abone, +₺${instantMoney.toFixed(2)}`, "success");
    updateUI();
}

function buyUpgrade(category, level) {
    const upgrade = UPGRADES[category][level];
    if (state.money >= upgrade.cost && state.upgrades[category] === level) {
        state.money -= upgrade.cost;
        state.upgrades[category]++;
        renderUpgrades();
        updateUI();
        showNotification(`${upgrade.name} satın alındı!`, "success");
    }
}

function gameTick() {
    // Passive View generation (Small growth)
    const passiveSubs = Math.floor(state.subs * 0.001); // 0.1% growth per second
    if (passiveSubs > 0) state.subs += passiveSubs;

    // Passive Money (Ads on total views)
    const passiveMoney = (state.views * 0.0001); // ₺0.1 per 1000 views per tick
    state.money += passiveMoney;
    
    updateUI();
}

// --- UI / Helper Functions ---

function updateUI() {
    elements.subs.innerText = formatNumber(state.subs);
    elements.views.innerText = formatNumber(state.views);
    elements.money.innerText = "₺" + formatNumber(Math.floor(state.money));
    elements.totalVideos.innerText = state.totalVideos;
    elements.dailyIncome.innerText = "₺" + formatNumber((state.views * 0.001).toFixed(2));
    
    elements.progressBar.style.width = `${state.progress}%`;
    
    // Stage handling
    elements.btnRecord.classList.add('hidden');
    elements.btnEdit.classList.add('hidden');
    elements.btnUpload.classList.add('hidden');
    
    if (state.gameStage === 0) {
        elements.btnRecord.classList.remove('hidden');
        elements.statusText.innerText = "Yeni bir video çekmeye başla!";
    } else if (state.gameStage === 1) {
        elements.btnEdit.classList.remove('hidden');
        elements.statusText.innerText = "Görüntüler hazır! Montaja başla.";
    } else if (state.gameStage === 2) {
        elements.statusText.innerText = "Montaj yapılıyor... Bekleyin.";
    } else if (state.gameStage === 3) {
        elements.btnUpload.classList.remove('hidden');
        elements.statusText.innerText = "Video hazır! Dünyayla paylaş.";
    } else if (state.gameStage === 4) {
        elements.statusText.innerText = "Yükleniyor... Lütfen bekleyin.";
    }
    
    // Shop buttons update (disabled state if can't afford)
    const upgradeButtons = document.querySelectorAll('.upgrade-item');
    upgradeButtons.forEach(btn => {
        const cost = parseInt(btn.dataset.cost);
        if (state.money < cost) {
            btn.classList.add('locked');
        } else {
            btn.classList.remove('locked');
        }
    });
}

function renderUpgrades() {
    elements.gearList.innerHTML = '';
    
    for (const category in UPGRADES) {
        const currentLevel = state.upgrades[category];
        const nextUpgrade = UPGRADES[category][currentLevel];
        
        if (nextUpgrade) {
            const item = document.createElement('div');
            item.className = 'upgrade-item';
            item.dataset.category = category;
            item.dataset.level = currentLevel;
            item.dataset.cost = nextUpgrade.cost;
            
            const iconName = getIconForCategory(category);
            
            item.innerHTML = `
                <div class="upgrade-icon"><i data-lucide="${iconName}"></i></div>
                <div class="upgrade-info">
                    <span class="name">${nextUpgrade.name} <span class="level-badge">Seviye ${currentLevel}</span></span>
                    <span class="desc">${nextUpgrade.desc}</span>
                </div>
                <div class="upgrade-cost">
                    <span class="cost-value">₺${formatNumber(nextUpgrade.cost)}</span>
                </div>
            `;
            
            item.addEventListener('click', () => buyUpgrade(category, currentLevel));
            elements.gearList.appendChild(item);
        } else {
            // Max level reached
            const item = document.createElement('div');
            item.className = 'upgrade-item locked';
            item.innerHTML = `
                <div class="upgrade-icon"><i data-lucide="check-circle"></i></div>
                <div class="upgrade-info">
                    <span class="name">${category.toUpperCase()} MAX SEVİYE</span>
                    <span class="desc">Tebrikler, en iyi ekipmana sahipsin!</span>
                </div>
            `;
            elements.gearList.appendChild(item);
        }
    }
    lucide.createIcons();
}

function getIconForCategory(cat) {
    switch(cat) {
        case 'camera': return 'camera';
        case 'pc': return 'monitor';
        case 'mic': return 'mic';
        case 'net': return 'wifi';
        default: return 'package';
    }
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function createFloatingText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'float-text';
    el.innerText = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function showNotification(msg, type = "info") {
    const note = document.createElement('div');
    note.className = `notification ${type}`;
    note.innerText = msg;
    document.body.appendChild(note);
    setTimeout(() => note.remove(), 3000);
}

// --- Persistence ---

function saveGame() {
    localStorage.setItem('yt_sim_save', JSON.stringify(state));
}

function loadGame() {
    const saved = localStorage.getItem('yt_sim_save');
    if (saved) {
        state = { ...state, ...JSON.parse(saved) };
    }
}

// Start Game
window.onload = init;
