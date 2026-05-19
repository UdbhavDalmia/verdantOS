import './style.css';

/* ==========================================================================
   SECTION 1: SYSTEM INITIALIZATION, VIRTUAL FILESYSTEM & STATE ENGINE
   ========================================================================== */

/**
 * Default Virtual Filesystem structure.
 * Emulates a basic UNIX directory layout with preloaded system and document nodes.
 * @type {Object}
 */
const DEFAULT_FILESYSTEM = {
  '/': { type: 'dir', children: ['desktop', 'documents', 'downloads', 'music', 'system'] },
  '/desktop': { type: 'dir', children: [] },
  '/documents': { type: 'dir', children: ['about_os.txt', 'ideas.txt'] },
  '/documents/about_os.txt': { type: 'file', content: 'Welcome to VerdantOS!\n\nA highly-scalable, premium client-side WebOS, designed with beautiful glassmorphism.\n\nKey Highlights:\n- Powered 100% locally via browser storage.\n- Features a reactive Window Management System (WMS).\n- Real-time weather-responsive pixel-art canvas wallpaper.\n- Drag-and-drop support (coming soon!).\n\nEnjoy editing and testing VerdantOS!' },
  '/documents/ideas.txt': { type: 'file', content: 'VerdantOS Project Roadmap:\n1. Expand custom settings dashboard.\n2. Add dynamic widget overlays on the desktop grid.\n3. Port premium sound effects (boot, click, error).\n4. Implement standard canvas audio visualizer.' },
  '/downloads': { type: 'dir', children: [] },
  '/music': { type: 'dir', children: [] },
  '/system': { type: 'dir', children: ['kernel.sys', 'version.txt'] },
  '/system/kernel.sys': { type: 'file', content: 'VERDANT_KERNEL_LOADED_OK [Build 2026.05.18]\nSystem state verified. Drivers loaded: screen, filesystem, clock, weather, canvas_sway.' },
  '/system/version.txt': { type: 'file', content: 'VerdantOS v1.0.4\nRelease: Stable Client-Side Shell\nCodename: Frostglass' },
};

/**
 * Global reactive system state registry.
 * Manages configuration values, active hardware toggles, and environmental parameters.
 * @type {Object}
 */
let sysState = {
  username: 'Verdant Guest',
  isLocked: true,
  wifi: false,
  bluetooth: false,
  volume: 80,
  blur: 0,
  filesystem: JSON.parse(JSON.stringify(DEFAULT_FILESYSTEM)),
  currentDir: '/documents',
  brandName: 'VerdantOS',
  wallpaperMode: 'auto',
  windStrength: 'breeze',
  weatherCode: 0,
  currentTemp: '--',
  currentCity: 'Local Region',
  currentWeatherDesc: 'Searching Sky...',
  pinnedApps: ['explorer', 'terminal', 'browser', 'settings']
};

/**
 * Restores system state and directories from persistent browser storage (LocalStorage).
 * Falls back to default initial values if no data is cached.
 */
function loadSystemSettings() {
  const savedUser = localStorage.getItem('verdant_username');
  if (savedUser) sysState.username = savedUser;

  const savedWifi = localStorage.getItem('verdant_wifi');
  if (savedWifi) sysState.wifi = savedWifi === 'true';

  const savedBluetooth = localStorage.getItem('verdant_bluetooth');
  if (savedBluetooth) sysState.bluetooth = savedBluetooth === 'true';

  const savedVolume = localStorage.getItem('verdant_volume');
  if (savedVolume) sysState.volume = parseInt(savedVolume, 10);

  const savedBlur = localStorage.getItem('verdant_blur');
  if (savedBlur) sysState.blur = parseInt(savedBlur, 10);
  
  const savedMode = localStorage.getItem('verdant_wallpaperMode');
  if (savedMode) sysState.wallpaperMode = savedMode;
  
  const savedWind = localStorage.getItem('verdant_windStrength');
  if (savedWind) sysState.windStrength = savedWind;

  const savedPinned = localStorage.getItem('verdant_pinnedApps');
  if (savedPinned) {
    try {
      sysState.pinnedApps = JSON.parse(savedPinned);
    } catch(e) {
      sysState.pinnedApps = ['explorer', 'terminal', 'browser', 'settings'];
    }
  }

  const savedFS = localStorage.getItem('verdant_fs');
  if (savedFS) {
    try {
      sysState.filesystem = JSON.parse(savedFS);
    } catch (e) {
      sysState.filesystem = JSON.parse(JSON.stringify(DEFAULT_FILESYSTEM));
    }
  }
}

/**
 * Saves a single key-value state property directly into persistent storage.
 * @param {string} key - State registry property identifier.
 * @param {any} val - Value to assign and stringify.
 */
function saveState(key, val) {
  sysState[key] = val;
  localStorage.setItem(`verdant_${key}`, val.toString());
}

/**
 * Persists the virtual filesystem tree to persistent LocalStorage.
 */
function saveFilesystem() {
  localStorage.setItem('verdant_fs', JSON.stringify(sysState.filesystem));
}

/* ==========================================================================
   SECTION 2: SYSTEM SOUND UTILITIES (WEB AUDIO API SYNTHESIZER)
   ========================================================================== */

let audioCtx = null;

/**
 * Triggers electronic chimes and sweeps procedurally via Web Audio API oscillators.
 * Bypasses standard browser audio autoplay policies using runtime user-interaction resume handlers.
 * @param {string} type - Audio sequence to play ('volume_adjust', 'boot', 'lock', 'shutdown').
 * @param {number} volumePercent - Sound intensity multiplier (0-100).
 */
function playSystemSound(type, volumePercent) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const gainNode = audioCtx.createGain();
    const volumeFraction = volumePercent / 100;
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    
    if (type === 'volume_adjust') {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      
      gainNode.gain.linearRampToValueAtTime(volumeFraction * 0.15, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } else if (type === 'boot') {
      const now = audioCtx.currentTime;
      const frequencies = [261.63, 329.63, 392.00, 523.25];
      
      gainNode.gain.linearRampToValueAtTime(volumeFraction * 0.22, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
      gainNode.connect(audioCtx.destination);
      
      frequencies.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.value = 5;
        lfoGain.gain.value = 2;
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        osc.connect(gainNode);
        
        lfo.start(now);
        osc.start(now + idx * 0.08);
        
        lfo.stop(now + 2.5);
        osc.stop(now + 2.5);
      });
    } else if (type === 'lock') {
      const now = audioCtx.currentTime;
      const frequencies = [523.25, 392.00, 329.63, 261.63];
      
      gainNode.gain.linearRampToValueAtTime(volumeFraction * 0.2, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
      gainNode.connect(audioCtx.destination);
      
      frequencies.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.value = 5;
        lfoGain.gain.value = 1.5;
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        osc.connect(gainNode);
        
        lfo.start(now);
        osc.start(now + idx * 0.08);
        
        lfo.stop(now + 1.5);
        osc.stop(now + 1.5);
      });
    } else if (type === 'shutdown') {
      const now = audioCtx.currentTime;
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      
      osc1.frequency.setValueAtTime(329.63, now);
      osc2.frequency.setValueAtTime(164.81, now);
      
      osc1.frequency.exponentialRampToValueAtTime(40.0, now + 1.5);
      osc2.frequency.exponentialRampToValueAtTime(20.0, now + 1.5);
      
      gainNode.gain.linearRampToValueAtTime(volumeFraction * 0.25, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc1.start(now);
      osc2.start(now);
      
      osc1.stop(now + 1.8);
      osc2.stop(now + 1.8);
    }
  } catch (err) {
    console.warn("AudioContext block/error:", err);
  }
}

/* ==========================================================================
   SECTION 3: SYSTEM UI ELEMENT REGISTRY & DOM HOOKS
   ========================================================================== */

/**
 * Global UI DOM References Registry.
 * Holds immutable bindings to layout views, quick menus, system gauges, and workspace boundaries.
 */
const UI = {
  wallpaperBlur: document.getElementById('wallpaper-blur'),
  lockScreen: document.getElementById('lock-screen'),
  lockTime: document.getElementById('lock-time'),
  lockDate: document.getElementById('lock-date'),
  lockPowerBtn: document.getElementById('lock-power-btn'),
  
  loginScreen: document.getElementById('login-screen'),
  loginCard: document.getElementById('login-card'),
  usernameInput: document.getElementById('username-input'),
  passwordInput: document.getElementById('password-input'),
  signinBtn: document.getElementById('signin-btn'),
  loginPowerBtn: document.getElementById('login-power-btn'),
  
  loadingScreen: document.getElementById('loading-screen'),
  loadingStatus: document.getElementById('loading-status'),
  loadingProgress: document.getElementById('loading-progress'),
  
  welcomeScreen: document.getElementById('welcome-screen'),
  welcomeName: document.getElementById('welcome-name'),
  
  desktop: document.getElementById('desktop'),
  desktopClock: document.getElementById('desktop-clock'),
  menuUsernameDisplay: document.getElementById('menu-username-display'),
  quickSettingsToggle: document.getElementById('quick-settings-toggle'),
  quickSettingsPanel: document.getElementById('quick-settings-panel'),
  quickSettingsClose: document.getElementById('quick-settings-close'),
  
  toggleWifi: document.getElementById('toggle-wifi'),
  wifiStatus: document.getElementById('wifi-status'),
  toggleBluetooth: document.getElementById('toggle-bluetooth'),
  bluetoothStatus: document.getElementById('bluetooth-status'),
  volumeSlider: document.getElementById('volume-slider'),
  volumeVal: document.getElementById('volume-val'),
  blurSlider: document.getElementById('blur-slider'),
  blurVal: document.getElementById('blur-val'),
  lockOsBtn: document.getElementById('lock-os-btn'),
  resetOsBtn: document.getElementById('reset-os-btn'),
  shutdownScreen: document.getElementById('shutdown-screen'),
  contextMenu: document.getElementById('sys-context-menu'),
  contextMenuItems: document.getElementById('context-menu-items'),
  
  ramUsage: document.getElementById('ram-usage'),
  ramBar: document.getElementById('ram-bar'),
  cpuUsage: document.getElementById('cpu-usage'),
  cpuBar: document.getElementById('cpu-bar'),
  trayWifi: document.getElementById('tray-wifi'),
  trayBluetooth: document.getElementById('tray-bluetooth'),
  
  workspace: document.getElementById('workspace'),
  desktopIcons: document.querySelectorAll('.desktop-icon'),
  
  dockExplorer: document.getElementById('dock-explorer'),
  dockTerminal: document.getElementById('dock-terminal'),
  dockBrowser: document.getElementById('dock-browser'),
  dockSettings: document.getElementById('dock-settings'),
  
  indExplorer: document.getElementById('indicator-explorer'),
  indTerminal: document.getElementById('indicator-terminal'),
  indBrowser: document.getElementById('indicator-browser'),
  indSettings: document.getElementById('indicator-settings'),

  weatherDetailsPanel: document.getElementById('weather-details-panel'),
  weatherTrayBtn: document.getElementById('desktop-tray-weather'),
  weatherPanelClose: document.getElementById('weather-panel-close'),
  weatherPanelCity: document.getElementById('weather-panel-city'),
  weatherPanelDesc: document.getElementById('weather-panel-desc'),
  weatherPanelIcon: document.getElementById('weather-panel-icon'),
  weatherPanelTemp: document.getElementById('weather-panel-temp'),
  weatherPanelWind: document.getElementById('weather-panel-wind'),
  weatherPanelHumidity: document.getElementById('weather-panel-humidity'),
};

/* ==========================================================================
   SECTION 4: SYSTEM CHRONOLOGY & CLOCK SERVICE
   ========================================================================== */

/**
 * Periodically synchronized timeline ticking task.
 * Translates active client Date parameters into clean, localized typography layouts.
 */
function tickClock() {
  const now = new Date();
  
  const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  const dateStr = now.toLocaleDateString('en-US', dateOptions);
  UI.lockDate.textContent = dateStr;
  
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeStr = `${hours}:${minutes}`;
  
  UI.lockTime.textContent = timeStr;
  UI.desktopClock.textContent = `${timeStr} ${ampm}`;
}

/* ==========================================================================
   SECTION 5: SYSTEM STATE MACHINE (BOOT, SECURITY & SHUTDOWN KINETICS)
   ========================================================================== */

/**
 * Slides the active Lock Screen outwards and triggers the glassmorphic login interface.
 */
function unlockLockScreen() {
  sysState.isLocked = false;
  
  UI.lockScreen.classList.add('-translate-y-full', 'pointer-events-none', 'opacity-0', 'invisible');
  UI.loginScreen.classList.remove('opacity-0', 'pointer-events-none', 'invisible');
  UI.loginScreen.classList.add('opacity-100');
  
  UI.wallpaperBlur.style.backdropFilter = 'blur(16px) saturate(140%)';
  UI.wallpaperBlur.style.webkitBackdropFilter = 'blur(16px) saturate(140%)';
  UI.wallpaperBlur.classList.replace('bg-black/20', 'bg-black/40');
  
  UI.loginCard.classList.remove('opacity-0', 'scale-95');
  UI.loginCard.classList.add('opacity-100', 'scale-100');
  
  setTimeout(() => UI.usernameInput.focus(), 600);
}

/**
 * Slides the Lock Screen back into place and plays the descending security chime.
 */
function lockLoginScreen() {
  playSystemSound('lock', sysState.volume);
  sysState.isLocked = true;
  
  UI.lockScreen.classList.remove('-translate-y-full', 'pointer-events-none', 'opacity-0', 'invisible');
  
  UI.loginScreen.classList.add('opacity-0', 'pointer-events-none', 'invisible');
  UI.loginScreen.classList.remove('opacity-100');
  UI.loginCard.classList.add('opacity-0', 'scale-95');
  UI.loginCard.classList.remove('opacity-100', 'scale-100');
  
  UI.wallpaperBlur.style.backdropFilter = 'blur(0px) saturate(100%)';
  UI.wallpaperBlur.style.webkitBackdropFilter = 'blur(0px) saturate(100%)';
  UI.wallpaperBlur.classList.replace('bg-black/40', 'bg-black/20');
}

/**
 * Simulated module loader steps for kernel initialization.
 * @type {Array<Object>}
 */
const bootMessages = [
  { p: 10, m: 'Loading Verdant Kernel v1.0.4...' },
  { p: 25, m: 'Mounting virtual system drives...' },
  { p: 40, m: 'Establishing RAM environment...' },
  { p: 55, m: 'Connecting LocalStorage filesystem...' },
  { p: 70, m: 'Initializing Window Manager (WMS)...' },
  { p: 85, m: 'Configuring custom user desktop shell...' },
  { p: 98, m: 'Launching system tray controls...' },
  { p: 100, m: 'Kernel Boot Successful.' }
];

/**
 * Starts the snappy simulated loader sequencing during authorization.
 */
function performBootLoading() {
  const typedUser = UI.usernameInput.value.trim() || 'Verdant Guest';
  saveState('username', typedUser);
  UI.menuUsernameDisplay.textContent = typedUser;
  
  UI.loginScreen.classList.add('opacity-0', 'pointer-events-none', 'invisible');
  UI.loginScreen.classList.remove('opacity-100');
  UI.loginCard.classList.add('opacity-0');
  UI.loginCard.classList.remove('opacity-100');
  
  UI.loadingScreen.classList.remove('opacity-0', 'pointer-events-none', 'invisible');
  UI.loadingScreen.classList.add('opacity-100');
  
  let index = 0;
  function updateProgress() {
    if (index < bootMessages.length) {
      const stage = bootMessages[index];
      UI.loadingStatus.textContent = stage.m;
      UI.loadingProgress.style.width = `${stage.p}%`;
      
      const delay = index === 0 ? 120 : Math.random() * 80 + 40;
      index++;
      setTimeout(updateProgress, delay);
    } else {
      setTimeout(revealWelcomeScreen, 400);
    }
  }
  
  setTimeout(updateProgress, 300);
}

/**
 * Triggers the welcome screen spelling reveal animation and registers the hardware audio boot chime.
 */
function revealWelcomeScreen() {
  playSystemSound('boot', sysState.volume);

  UI.loadingScreen.classList.add('opacity-0', 'pointer-events-none', 'invisible');
  UI.loadingScreen.classList.remove('opacity-100');
  
  UI.welcomeScreen.classList.remove('opacity-0', 'pointer-events-none', 'invisible');
  UI.welcomeScreen.classList.add('opacity-100');
  
  setTimeout(() => {
    UI.welcomeScreen.classList.add('opacity-0', 'pointer-events-none', 'invisible');
    UI.welcomeScreen.classList.remove('opacity-100');
    revealDesktop();
  }, 1200);
}

/**
 * Unveils the operational workspace and activates dynamic wind parallax layers.
 */
function revealDesktop() {
  UI.desktop.classList.remove('opacity-0', 'pointer-events-none', 'invisible');
  UI.desktop.classList.add('opacity-100');
  
  applyBlurLevel(sysState.blur);
  
  const desktopIconsContainer = document.getElementById('desktop-icons');
  desktopIconsContainer.classList.add('animate-fade-in');
}

/**
 * Unmounts all active windows and triggers a CRT-like screen power-down.
 */
function shutdownOS() {
  playSystemSound('shutdown', sysState.volume);

  UI.desktop.classList.add('shutdown-fade-out');
  UI.desktop.classList.remove('opacity-100');
  UI.desktop.classList.add('pointer-events-none');
  
  const openWindows = document.querySelectorAll('.os-window');
  openWindows.forEach(win => win.remove());
  
  if (UI.indExplorer) UI.indExplorer.classList.add('opacity-0');
  if (UI.indTerminal) UI.indTerminal.classList.add('opacity-0');
  if (UI.indBrowser) UI.indBrowser.classList.add('opacity-0');
  if (UI.indSettings) UI.indSettings.classList.add('opacity-0');
  
  UI.wallpaperBlur.style.backdropFilter = 'blur(40px)';
  UI.wallpaperBlur.style.webkitBackdropFilter = 'blur(40px)';
  
  setTimeout(() => {
    UI.shutdownScreen.classList.remove('opacity-0', 'pointer-events-none', 'invisible');
    UI.shutdownScreen.classList.add('opacity-100');
    window.close();
  }, 1200);
}

/* ==========================================================================
   SECTION 6: HARDWARE DRIVERS & HARDWARE TELEMETRY GAUGES
   ========================================================================== */

/**
 * Updates the CSS background filter matrix based on display settings.
 * @param {number} val - Target blur radius value (px).
 */
function applyBlurLevel(val) {
  sysState.blur = val;
  UI.wallpaperBlur.style.backdropFilter = `blur(${val}px) saturate(100%)`;
  UI.wallpaperBlur.style.webkitBackdropFilter = `blur(${val}px) saturate(100%)`;
  UI.blurVal.textContent = `${val}px`;
  UI.blurSlider.value = val;
}

/**
 * Synchronizes hardware toggles to their respective taskbar indicators.
 */
function syncFeatureToggles() {
  const wifiIcon = UI.toggleWifi.querySelector('i');
  if (sysState.wifi) {
    UI.toggleWifi.classList.remove('bg-transparent', 'border-white/10', 'text-slate-400', 'hover:bg-white/5');
    UI.toggleWifi.classList.add('bg-emerald-500/5', 'border-emerald-500', 'text-emerald-400', 'hover:bg-emerald-500/10');
    if (wifiIcon) wifiIcon.className = 'ph-bold ph-wifi-high text-xl mb-1.5 text-emerald-400';
    UI.wifiStatus.textContent = 'Connected';
    UI.wifiStatus.className = 'text-[8px] text-emerald-300 mt-0.5';
    if (UI.trayWifi) {
      UI.trayWifi.className = 'ph-bold ph-wifi-high text-base text-emerald-400 transition-all duration-300';
      UI.trayWifi.classList.remove('hidden');
    }
  } else {
    UI.toggleWifi.classList.remove('bg-emerald-500/5', 'border-emerald-500', 'text-emerald-400', 'hover:bg-emerald-500/10');
    UI.toggleWifi.classList.add('bg-transparent', 'border-white/10', 'text-slate-400', 'hover:bg-white/5');
    if (wifiIcon) wifiIcon.className = 'ph-bold ph-wifi-slash text-xl mb-1.5 text-slate-500';
    UI.wifiStatus.textContent = 'Disconnected';
    UI.wifiStatus.className = 'text-[8px] text-slate-500 mt-0.5';
    if (UI.trayWifi) {
      UI.trayWifi.className = 'ph-bold ph-wifi-slash text-base text-slate-500 transition-all duration-300';
    }
  }

  const btIcon = UI.toggleBluetooth.querySelector('i');
  if (sysState.bluetooth) {
    UI.toggleBluetooth.classList.remove('bg-transparent', 'border-white/10', 'text-slate-400', 'hover:bg-white/5');
    UI.toggleBluetooth.classList.add('bg-emerald-500/5', 'border-emerald-500', 'text-emerald-400', 'hover:bg-emerald-500/10');
    if (btIcon) btIcon.className = 'ph-bold ph-bluetooth text-xl mb-1.5 text-emerald-400';
    UI.bluetoothStatus.textContent = 'Enabled';
    UI.bluetoothStatus.className = 'text-[8px] text-emerald-300 mt-0.5';
    if (UI.trayBluetooth) {
      UI.trayBluetooth.className = 'ph-bold ph-bluetooth text-base text-emerald-400 transition-all duration-300';
    }
  } else {
    UI.toggleBluetooth.classList.remove('bg-emerald-500/5', 'border-emerald-500', 'text-emerald-400', 'hover:bg-emerald-500/10');
    UI.toggleBluetooth.classList.add('bg-transparent', 'border-white/10', 'text-slate-400', 'hover:bg-white/5');
    if (btIcon) btIcon.className = 'ph-bold ph-bluetooth-slash text-xl mb-1.5 text-slate-500';
    UI.bluetoothStatus.textContent = 'Disabled';
    UI.bluetoothStatus.className = 'text-[8px] text-slate-500 mt-0.5';
    if (UI.trayBluetooth) {
      UI.trayBluetooth.className = 'ph-bold ph-bluetooth-slash text-base text-slate-500 transition-all duration-300';
    }
  }
}

let lastGaugeTime = performance.now();

/**
 * Calculates CPU Event-loop scheduling latency and reads memory heap allocations.
 */
function updateSystemGauges() {
  if (sysState.isLocked) return;
  
  const now = performance.now();
  const elapsed = now - lastGaugeTime;
  lastGaugeTime = now;
  
  const delay = Math.max(0, elapsed - 1000);
  
  let cpu = 1;
  if (delay < 8) {
    cpu = Math.floor(delay * 0.5) + Math.floor(Math.random() * 2) + 1;
  } else if (delay < 35) {
    cpu = Math.floor((delay - 8) * 0.8) + 6;
  } else if (delay < 120) {
    cpu = Math.floor((delay - 35) * 0.4) + 28;
  } else {
    cpu = Math.min(99, Math.floor((delay - 120) * 0.15) + 63);
  }
  
  UI.cpuUsage.textContent = `${cpu}%`;
  UI.cpuBar.style.width = `${cpu}%`;
  
  if (window.performance && window.performance.memory) {
    const memory = window.performance.memory;
    const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
    const limitGB = (memory.jsHeapSizeLimit / 1024 / 1024 / 1024).toFixed(1);
    UI.ramUsage.textContent = `${usedMB} MB / ${limitGB} GB`;
    const pct = Math.min(100, Math.max(2, (memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100)));
    if (UI.ramBar) UI.ramBar.style.width = `${pct}%`;
  } else {
    const elementCount = document.getElementsByTagName('*').length;
    const estimatedBase = 24.5 + (elementCount * 0.015);
    const drift = (Math.sin(now / 5000) * 1.2).toFixed(1);
    const finalMB = (parseFloat(estimatedBase) + parseFloat(drift)).toFixed(1);
    UI.ramUsage.textContent = `${finalMB} MB / 4.0 GB`;
    const pct = Math.min(100, Math.max(2, (parseFloat(finalMB) / 4096 * 100)));
    if (UI.ramBar) UI.ramBar.style.width = `${pct}%`;
  }
}

/* ==========================================================================
   SECTION 7: TRAY PANELS & INTERACTIVE CONTROL LISTENERS
   ========================================================================== */

UI.quickSettingsToggle.addEventListener('click', () => {
  if (UI.weatherDetailsPanel) {
    UI.weatherDetailsPanel.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
  }
  UI.quickSettingsPanel.classList.toggle('opacity-0');
  UI.quickSettingsPanel.classList.toggle('pointer-events-none');
  UI.quickSettingsPanel.classList.toggle('scale-95');
});

UI.quickSettingsClose.addEventListener('click', () => {
  UI.quickSettingsPanel.classList.add('opacity-0', 'pointer-events-none');
  UI.quickSettingsPanel.classList.add('scale-95');
});

if (UI.weatherTrayBtn) {
  UI.weatherTrayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    UI.quickSettingsPanel.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
    
    if (UI.weatherDetailsPanel) {
      UI.weatherDetailsPanel.classList.toggle('opacity-0');
      UI.weatherDetailsPanel.classList.toggle('pointer-events-none');
      UI.weatherDetailsPanel.classList.toggle('scale-95');
    }
  });
}

if (UI.weatherPanelClose) {
  UI.weatherPanelClose.addEventListener('click', (e) => {
    e.stopPropagation();
    if (UI.weatherDetailsPanel) {
      UI.weatherDetailsPanel.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
    }
  });
}

window.addEventListener('click', (e) => {
  if (UI.quickSettingsPanel && !UI.quickSettingsPanel.contains(e.target) && e.target !== UI.quickSettingsToggle && !UI.quickSettingsToggle.contains(e.target)) {
    UI.quickSettingsPanel.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
  }
  if (UI.weatherDetailsPanel && !UI.weatherDetailsPanel.contains(e.target) && e.target !== UI.weatherTrayBtn && !UI.weatherTrayBtn.contains(e.target)) {
    UI.weatherDetailsPanel.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
  }
});

let volumeChimeTimeout = null;
UI.volumeSlider.addEventListener('input', (e) => {
  const v = parseInt(e.target.value, 10);
  UI.volumeVal.textContent = `${v}%`;
  saveState('volume', v);
  
  if (!volumeChimeTimeout) {
    playSystemSound('volume_adjust', v);
    volumeChimeTimeout = setTimeout(() => {
      volumeChimeTimeout = null;
    }, 150);
  }
});

UI.blurSlider.addEventListener('input', (e) => {
  const b = e.target.value;
  applyBlurLevel(b);
  saveState('blur', b);
});

UI.toggleWifi.addEventListener('click', () => {
  sysState.wifi = !sysState.wifi;
  saveState('wifi', sysState.wifi);
  syncFeatureToggles();
});

UI.toggleBluetooth.addEventListener('click', () => {
  sysState.bluetooth = !sysState.bluetooth;
  saveState('bluetooth', sysState.bluetooth);
  syncFeatureToggles();
});

UI.lockScreen.addEventListener('click', unlockLockScreen);
UI.lockPowerBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  shutdownOS();
});

if (UI.loginPowerBtn) {
  UI.loginPowerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    shutdownOS();
  });
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (sysState.isLocked) {
      unlockLockScreen();
    } else if (document.activeElement === UI.usernameInput || document.activeElement === UI.passwordInput) {
      performBootLoading();
    }
  } else if (e.key === 'Escape') {
    if (!sysState.isLocked && UI.desktop.classList.contains('opacity-0')) {
      lockLoginScreen();
    } else if (!UI.quickSettingsPanel.classList.contains('opacity-0')) {
      UI.quickSettingsPanel.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
    }
  }
});

UI.signinBtn.addEventListener('click', performBootLoading);

UI.lockOsBtn.addEventListener('click', () => {
  UI.quickSettingsPanel.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
  
  UI.desktop.classList.add('logout-fade-out');
  UI.desktop.classList.remove('opacity-100');
  UI.desktop.classList.add('pointer-events-none');
  
  lockLoginScreen();
  
  setTimeout(() => {
    UI.desktop.classList.remove('logout-fade-out');
    UI.desktop.classList.add('opacity-0', 'invisible');
  }, 800);
});

UI.resetOsBtn.addEventListener('click', () => {
  UI.quickSettingsPanel.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
  shutdownOS();
});

/* ==========================================================================
   SECTION 8: WINDOW MANAGEMENT SYSTEM (WMS CORE CLASS)
   ========================================================================== */

let activeWindows = [];
let windowZIndex = 100;

/**
 * Standard Operational Window Instance.
 * Manages unique structural rendering, drag-handling bounds, and focus overlays.
 */
class OSWindow {
  /**
   * Initializes a new workspace app window node.
   * @param {string} id - Unique app signature.
   * @param {string} title - Plain text displaying on the header.
   * @param {string} icon - Phosphor iconography stylesheet target.
   * @param {Function} contentGenerator - Callback returning standard inner layout markup.
   */
  constructor(id, title, icon, contentGenerator) {
    this.id = id;
    this.title = title;
    this.icon = icon;
    this.contentGenerator = contentGenerator;
    
    this.width = Math.min(window.innerWidth - 60, 600);
    this.height = Math.min(window.innerHeight - 150, 420);
    this.left = Math.max(30, (window.innerWidth - this.width) / 2 + (activeWindows.length * 20));
    this.top = Math.max(80, (window.innerHeight - this.height) / 2 - 40 + (activeWindows.length * 15));
    
    this.isMaximized = false;
    this.isMinimized = false;
    this.dom = null;
    
    this.createDOM();
    this.setupEvents();
    this.focus();
    
    activeWindows.push(this);
    this.updateDockIndicator();
  }
  
  /**
   * Generates initial window DOM frame nodes.
   */
  createDOM() {
    const winDiv = document.createElement('div');
    winDiv.id = `window-${this.id}`;
    winDiv.className = 'os-window glass-card active-window';
    winDiv.style.width = `${this.width}px`;
    winDiv.style.height = `${this.height}px`;
    winDiv.style.left = `${this.left}px`;
    winDiv.style.top = `${this.top}px`;
    winDiv.style.zIndex = ++windowZIndex;
    
    winDiv.innerHTML = `
      <div class="window-titlebar flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-900/60 select-none">
        <div class="flex items-center space-x-2">
          <button class="win-btn-close w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center text-[6px] text-red-950 font-bold group">
            <span class="opacity-0 group-hover:opacity-100">×</span>
          </button>
          <button class="win-btn-min w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center text-[6px] text-amber-950 font-bold group">
            <span class="opacity-0 group-hover:opacity-100">−</span>
          </button>
          <button class="win-btn-max w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center text-[5px] text-green-950 font-bold group">
            <span class="opacity-0 group-hover:opacity-100">⤢</span>
          </button>
        </div>
        <span class="text-xs font-bold text-slate-300 uppercase tracking-widest pointer-events-none flex items-center space-x-2 font-display">
          <i class="${this.icon} text-indigo-400 text-sm"></i>
          <span>${this.title}</span>
        </span>
        <div class="w-14"></div>
      </div>
      
      <div class="window-body flex-1 overflow-hidden bg-slate-950/20 relative">
        <div class="window-inner-content w-full h-full overflow-auto p-5 text-sm leading-relaxed">
          ${this.contentGenerator(this)}
        </div>
      </div>
      
      <div class="window-resizer absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 select-none z-30">
        <i class="ph-bold ph-dots-nine text-[8px] text-slate-500 pointer-events-none"></i>
      </div>
    `;
    
    UI.workspace.appendChild(winDiv);
    this.dom = winDiv;
  }
  
  /**
   * Binds click, drag, and resize listener events to window frames.
   */
  setupEvents() {
    const titleBar = this.dom.querySelector('.window-titlebar');
    const resizer = this.dom.querySelector('.window-resizer');
    
    this.dom.addEventListener('mousedown', () => this.focus());
    
    titleBar.addEventListener('mousedown', (e) => {
      if (this.isMaximized || e.target.closest('button')) return;
      
      this.focus();
      const initialX = e.clientX - this.left;
      const initialY = e.clientY - this.top;
      
      const onMouseMove = (moveEvent) => {
        this.left = moveEvent.clientX - initialX;
        this.top = moveEvent.clientY - initialY;
        this.dom.style.left = `${this.left}px`;
        this.dom.style.top = `${this.top}px`;
      };
      
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
    
    resizer.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.focus();
      
      const startWidth = this.width;
      const startHeight = this.height;
      const startX = e.clientX;
      const startY = e.clientY;
      
      const onMouseMove = (moveEvent) => {
        this.width = Math.max(320, startWidth + (moveEvent.clientX - startX));
        this.height = Math.max(220, startHeight + (moveEvent.clientY - startY));
        this.dom.style.width = `${this.width}px`;
        this.dom.style.height = `${this.height}px`;
        
        const resizeEvent = new CustomEvent('windowResize', { detail: { w: this.width, h: this.height } });
        this.dom.dispatchEvent(resizeEvent);
      };
      
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
    
    const closeBtn = this.dom.querySelector('.win-btn-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });
    
    const minBtn = this.dom.querySelector('.win-btn-min');
    minBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.minimize();
    });
    
    const maxBtn = this.dom.querySelector('.win-btn-max');
    maxBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMaximize();
    });
    
    titleBar.addEventListener('dblclick', (e) => {
      if (e.target.closest('button')) return;
      this.toggleMaximize();
    });
  }
  
  /**
   * Promotes the active window to the highest operational CSS Z-Index level.
   */
  focus() {
    activeWindows.forEach(win => {
      if (win.dom) win.dom.classList.remove('active-window');
    });
    
    if (this.dom) {
      this.dom.classList.add('active-window');
      this.dom.style.zIndex = ++windowZIndex;
    }
  }
  
  /**
   * Closes the window gracefully using custom kinetic scale-down sweeps.
   */
  close() {
    this.dom.style.opacity = '0';
    this.dom.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
      if (this.dom) this.dom.remove();
      activeWindows = activeWindows.filter(win => win.id !== this.id);
      this.updateDockIndicator();
    }, 200);
  }
  
  /**
   * Restructures coordinates and shrinks window frames down into the dock.
   */
  minimize() {
    this.isMinimized = true;
    
    const dockItem = document.getElementById(`dock-${this.id}`);
    if (dockItem) {
      const rect = dockItem.getBoundingClientRect();
      this.dom.style.setProperty('--min-x', `${rect.left - this.left}px`);
      this.dom.style.setProperty('--min-y', `${rect.top - this.top}px`);
    }
    
    this.dom.classList.add('minimized');
    this.focusNext();
  }
  
  /**
   * Restores minimized window layers back into primary desktop coordinates.
   */
  restore() {
    this.isMinimized = false;
    this.dom.classList.remove('minimized');
    this.focus();
  }
  
  /**
   * Toggles full workspace expansion layouts.
   */
  toggleMaximize() {
    this.isMaximized = !this.isMaximized;
    if (this.isMaximized) {
      this.dom.style.width = '100%';
      this.dom.style.height = 'calc(100% - 44px)';
      this.dom.style.left = '0';
      this.dom.style.top = '44px';
      this.dom.classList.remove('rounded-2xl');
      this.dom.style.borderRadius = '0px';
    } else {
      this.dom.style.width = `${this.width}px`;
      this.dom.style.height = `${this.height}px`;
      this.dom.style.left = `${this.left}px`;
      this.dom.style.top = `${this.top}px`;
      this.dom.classList.add('rounded-2xl');
      this.dom.style.borderRadius = '20px';
    }
  }
  
  /**
   * Transmits operational focus parameters to the next layout layer block.
   */
  focusNext() {
    const visibleWins = activeWindows.filter(w => w.id !== this.id && !w.isMinimized);
    if (visibleWins.length > 0) {
      visibleWins[visibleWins.length - 1].focus();
    }
  }
  
  /**
   * Synchronizes taskbar dock active visual flags based on process existence.
   */
  updateDockIndicator() {
    const ind = document.getElementById(`indicator-${this.id}`);
    if (!ind) return;
    
    const count = activeWindows.filter(w => w.id === this.id).length;
    if (count > 0) {
      ind.classList.remove('opacity-0', 'scale-50');
      ind.classList.add('opacity-100', 'scale-100');
    } else {
      ind.classList.remove('opacity-100', 'scale-100');
      ind.classList.add('opacity-0', 'scale-50');
    }
  }
}

/**
 * REST API style app activation. Instantiates or restores minimized frames.
 * @param {string} id - Target application ID key.
 * @param {string} title - App name.
 * @param {string} icon - Phosphor iconography reference sheet target.
 * @param {Function} contentGenerator - Core rendering builder callback.
 */
function launchOrRestoreApp(id, title, icon, contentGenerator) {
  const existingWin = activeWindows.find(w => w.id === id);
  
  if (existingWin) {
    if (existingWin.isMinimized) {
      existingWin.restore();
    } else {
      existingWin.focus();
    }
  } else {
    new OSWindow(id, title, icon, contentGenerator);
  }
}

/* ==========================================================================
   SECTION 9: SYSTEM APPLICATION TEMPLATES & CONSOLE BUILDERS
   ========================================================================== */

/**
 * File Explorer application template builder.
 * @param {OSWindow} winInstance - Target containing window layer.
 * @returns {string} Compiled HTML layout string.
 */
function explorerAppContent(winInstance) {
  let currentPath = '/documents';
  
  function renderFilesList() {
    const container = winInstance.dom.querySelector('.files-grid');
    const folderText = winInstance.dom.querySelector('.folder-title');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (currentPath !== '/') {
      const parentDir = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
      const backDiv = document.createElement('div');
      backDiv.className = 'flex flex-col items-center p-3 rounded-2xl hover:bg-white/5 cursor-pointer text-slate-400 select-none group';
      backDiv.innerHTML = `
        <div class="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/5 rounded-xl group-hover:bg-white/10 group-hover:text-white transition-all mb-1">
          <i class="ph-bold ph-arrow-left text-lg"></i>
        </div>
        <span class="text-[10px] font-bold uppercase tracking-wider">Back</span>
      `;
      backDiv.addEventListener('click', () => {
        currentPath = parentDir;
        renderFilesList();
      });
      container.appendChild(backDiv);
    }
    
    folderText.textContent = currentPath;
    
    const pathObj = sysState.filesystem[currentPath];
    if (pathObj && pathObj.type === 'dir') {
      pathObj.children.forEach(name => {
        const fullItemPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
        const itemObj = sysState.filesystem[fullItemPath];
        const isFolder = itemObj.type === 'dir';
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'flex flex-col items-center p-3 rounded-2xl hover:bg-white/5 cursor-pointer text-center group transition-all select-none border border-transparent hover:border-white/5';
        
        if (isFolder) {
          itemDiv.innerHTML = `
            <div class="w-12 h-12 flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl group-hover:bg-amber-500/20 transition-all mb-1.5 shadow-md">
              <i class="ph-fill ph-folder text-2xl"></i>
            </div>
            <span class="text-[11px] font-medium text-slate-200 group-hover:text-white truncate w-20">${name}</span>
          `;
          itemDiv.addEventListener('dblclick', () => {
            currentPath = fullItemPath;
            renderFilesList();
          });
        } else {
          itemDiv.innerHTML = `
            <div class="w-12 h-12 flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl group-hover:bg-indigo-500/20 transition-all mb-1.5 shadow-md">
              <i class="ph-bold ph-file-text text-2xl"></i>
            </div>
            <span class="text-[11px] font-medium text-slate-200 group-hover:text-white truncate w-20">${name}</span>
          `;
          itemDiv.addEventListener('dblclick', () => {
            openTextEditorApp(fullItemPath);
          });
        }
        container.appendChild(itemDiv);
      });
    }
  }
  
  setTimeout(() => {
    renderFilesList();
    
    const createFolderBtn = winInstance.dom.querySelector('.explorer-new-folder');
    createFolderBtn.addEventListener('click', () => {
      const name = prompt('Enter folder name:');
      if (!name) return;
      const cleanName = name.trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
      if (!cleanName) return;
      
      const newPath = currentPath === '/' ? `/${cleanName}` : `${currentPath}/${cleanName}`;
      if (sysState.filesystem[newPath]) {
        alert('File or folder already exists!');
        return;
      }
      
      sysState.filesystem[currentPath].children.push(cleanName);
      sysState.filesystem[newPath] = { type: 'dir', children: [] };
      saveFilesystem();
      renderFilesList();
    });

    const createFileBtn = winInstance.dom.querySelector('.explorer-new-file');
    createFileBtn.addEventListener('click', () => {
      const name = prompt('Enter text file name (e.g. notes.txt):');
      if (!name) return;
      let cleanName = name.trim().replace(/[^a-zA-Z0-9_\-\.]/g, '_');
      if (!cleanName.endsWith('.txt')) cleanName += '.txt';
      
      const newPath = currentPath === '/' ? `/${cleanName}` : `${currentPath}/${cleanName}`;
      if (sysState.filesystem[newPath]) {
        alert('File or folder already exists!');
        return;
      }
      
      sysState.filesystem[currentPath].children.push(cleanName);
      sysState.filesystem[newPath] = { type: 'file', content: 'New document created. Start writing...' };
      saveFilesystem();
      renderFilesList();
    });
  }, 100);
  
  return `
    <div class="flex flex-col h-full select-none text-slate-300">
      <div class="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
        <div class="flex items-center space-x-2 text-xs font-bold text-slate-400">
          <i class="ph-bold ph-compass text-base text-slate-500"></i>
          <span class="folder-title font-mono uppercase">/documents</span>
        </div>
        <div class="flex items-center space-x-2">
          <button class="explorer-new-folder px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-all active:scale-95 shadow-sm">
            <i class="ph-bold ph-folder-plus text-amber-400"></i>
            <span>New Folder</span>
          </button>
          <button class="explorer-new-file px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-all active:scale-95 shadow-sm">
            <i class="ph-bold ph-file-plus text-indigo-400"></i>
            <span>New Text</span>
          </button>
        </div>
      </div>
      
      <div class="files-grid flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 overflow-y-auto content-start pr-1">
        <!-- Dyn. populated explorer grid -->
      </div>
    </div>
  `;
}

/**
 * Kernel Terminal shell template builder.
 * @param {OSWindow} winInstance - Target window container.
 * @returns {string} Compiled HTML layout string.
 */
function terminalAppContent(winInstance) {
  let terminalBuffer = [
    'VerdantOS Kernel Console [Version 1.0.4]',
    '(c) 2026 Aether Corporation. All rights reserved.',
    'Type "help" to view available UNIX shell commands.',
    ''
  ];
  
  let currentCmd = '';
  
  function executeCommand(inputLine) {
    const clean = inputLine.trim();
    terminalBuffer.push(`guest@aether:${sysState.currentDir}$ ${inputLine}`);
    
    if (clean === '') {
      terminalBuffer.push('');
      return;
    }
    
    const parts = clean.split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');
    
    switch (cmd) {
      case 'help':
        terminalBuffer.push(
          'Available UNIX shell commands:',
          '  help      - Print list of console tools',
          '  ls        - List items in current directory',
          '  cd <path> - Navigate directories',
          '  cat <file>- Read a text file content',
          '  mkdir <d> - Create a new folder directory',
          '  clear     - Clean shell output logs',
          '  neofetch  - Fetch system specifications',
          '  uptime    - Fetch duration of OS runtime',
          '  date      - Display real date and clock time',
          '  shutdown  - Safely close active system kernel'
        );
        break;
        
      case 'clear':
        terminalBuffer = [];
        break;
        
      case 'ls': {
        const pathObj = sysState.filesystem[sysState.currentDir];
        if (pathObj && pathObj.type === 'dir') {
          if (pathObj.children.length === 0) {
            terminalBuffer.push('(Directory is empty)');
          } else {
            const formatted = pathObj.children.map(name => {
              const fullItem = sysState.currentDir === '/' ? `/${name}` : `${sysState.currentDir}/${name}`;
              return sysState.filesystem[fullItem].type === 'dir' ? `\x1b[33m${name}/\x1b[0m` : name;
            });
            terminalBuffer.push(formatted.join('   '));
          }
        } else {
          terminalBuffer.push('ls: Error reading active directory paths');
        }
        break;
      }
      
      case 'cd': {
        if (!arg || arg === '~') {
          sysState.currentDir = '/documents';
          break;
        }
        
        let target = arg;
        if (!arg.startsWith('/')) {
          target = sysState.currentDir === '/' ? `/${arg}` : `${sysState.currentDir}/${arg}`;
        }
        
        target = target.replace(/\/+/g, '/').replace(/\/$/, '');
        if (target === '') target = '/';
        
        const pathObj = sysState.filesystem[target];
        if (pathObj && pathObj.type === 'dir') {
          sysState.currentDir = target;
        } else {
          terminalBuffer.push(`cd: no such directory: ${arg}`);
        }
        break;
      }
      
      case 'cat': {
        if (!arg) {
          terminalBuffer.push('cat: missing target filename argument');
          break;
        }
        
        let target = arg;
        if (!arg.startsWith('/')) {
          target = sysState.currentDir === '/' ? `/${arg}` : `${sysState.currentDir}/${arg}`;
        }
        
        const pathObj = sysState.filesystem[target];
        if (pathObj && pathObj.type === 'file') {
          terminalBuffer.push(...pathObj.content.split('\n'));
        } else {
          terminalBuffer.push(`cat: ${arg}: no such file found`);
        }
        break;
      }
      
      case 'mkdir': {
        if (!arg) {
          terminalBuffer.push('mkdir: missing folder name argument');
          break;
        }
        
        const cleanName = arg.trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
        const target = sysState.currentDir === '/' ? `/${cleanName}` : `${sysState.currentDir}/${cleanName}`;
        
        if (sysState.filesystem[target]) {
          terminalBuffer.push(`mkdir: folder already exists: ${arg}`);
          break;
        }
        
        sysState.filesystem[sysState.currentDir].children.push(cleanName);
        sysState.filesystem[target] = { type: 'dir', children: [] };
        saveFilesystem();
        terminalBuffer.push(`Directory created: ${cleanName}`);
        break;
      }
      
      case 'neofetch':
        terminalBuffer.push(
          '   \x1b[32m/\\\\\x1b[0m          \x1b[36mguest@verdant\x1b[0m',
          '  \x1b[32m/  \\\\\x1b[0m         ------------',
          ' \x1b[32m/____\\\\\x1b[0m        OS: VerdantOS v1.0.4',
          '\x1b[32m/\\\\    \\\\\x1b[0m       Kernel: Client Frostglass 1.0.0',
          '\x1b[32m\\/\\\\____\\\\\x1b[0m      Uptime: Simulated 10m',
          ' \x1b[32m\\/______/\x1b[0m      Shell: Modern ES6 Vanilla Console',
          '                DE: Custom Frosted Glassmorphism',
          '                Memory: ' + UI.ramUsage.textContent.split('/')[0] + '/ 8.00 GB'
        );
        break;
        
      case 'uptime': {
        const seconds = Math.floor(performance.now() / 1000);
        const mins = Math.floor(seconds / 60);
        terminalBuffer.push(`VerdantOS active uptime: ${mins}m ${seconds % 60}s`);
        break;
      }
        
      case 'date':
        terminalBuffer.push(new Date().toString());
        break;
        
      case 'shutdown':
        terminalBuffer.push('Initiating kernel shutdown protocol...');
        setTimeout(shutdownOS, 600);
        break;
        
      default:
        terminalBuffer.push(`aether: command not found: ${cmd}. Type "help" for a list of tools.`);
    }
    
    terminalBuffer.push('');
  }
  
  function renderTerminal() {
    const logContainer = winInstance.dom.querySelector('.terminal-logs');
    const inputDisplay = winInstance.dom.querySelector('.terminal-input-display');
    if (!logContainer) return;
    
    const htmlLines = terminalBuffer.map(line => {
      let formatted = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\x1b\[33m(.*?)\x1b\[0m/g, '<span class="text-amber-400 font-bold">$1</span>')
        .replace(/\x1b\[35m(.*?)\x1b\[0m/g, '<span class="text-purple-400 font-bold">$1</span>')
        .replace(/\x1b\[36m(.*?)\x1b\[0m/g, '<span class="text-cyan-400 font-bold">$1</span>');
      return `<div>${formatted || '&nbsp;'}</div>`;
    });
    
    logContainer.innerHTML = htmlLines.join('');
    inputDisplay.textContent = currentCmd;
    
    const body = winInstance.dom.querySelector('.window-inner-content');
    if (body) body.scrollTop = body.scrollHeight;
  }
  
  setTimeout(() => {
    renderTerminal();
    
    const clickArea = winInstance.dom.querySelector('.terminal-area');
    const hiddenInput = winInstance.dom.querySelector('.terminal-hidden-input');
    
    clickArea.addEventListener('click', () => hiddenInput.focus());
    hiddenInput.focus();
    
    hiddenInput.addEventListener('input', (e) => {
      currentCmd = e.target.value;
      renderTerminal();
    });
    
    hiddenInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        executeCommand(currentCmd);
        currentCmd = '';
        e.target.value = '';
        renderTerminal();
      }
    });
    
    winInstance.dom.addEventListener('windowResize', () => {
      renderTerminal();
    });
  }, 100);
  
  return `
    <div class="terminal-area terminal-font h-full w-full bg-[#020617]/95 rounded-xl p-4 text-emerald-400 text-xs font-mono flex flex-col relative select-text border border-white/5 shadow-inner">
      <input type="text" class="terminal-hidden-input absolute opacity-0 pointer-events-none w-0 h-0">
      
      <div class="terminal-logs flex-1 overflow-y-auto mb-2 space-y-1">
        <!-- Dyn. populated command lines -->
      </div>
      
      <div class="flex items-center select-none shrink-0 border-t border-white/5 pt-2">
        <span class="text-emerald-400 mr-2 font-bold uppercase tracking-wider text-[10px]">VerdantOS ></span>
        <span class="text-slate-300 font-bold font-mono terminal-input-display"></span>
        <span class="terminal-cursor"></span>
      </div>
    </div>
  `;
}

/**
 * Sandboxed Web Browser application builder.
 * @param {OSWindow} winInstance - Target window container.
 * @returns {string} Compiled HTML layout string.
 */
function browserAppContent(winInstance) {
  let homeUrl = 'https://wikipedia.org';
  
  setTimeout(() => {
    const iframe = winInstance.dom.querySelector('.browser-iframe');
    const input = winInstance.dom.querySelector('.browser-url-input');
    const navHome = winInstance.dom.querySelector('.browser-btn-home');
    const navGo = winInstance.dom.querySelector('.browser-btn-go');
    
    function navigateTo(url) {
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      
      iframe.src = cleanUrl;
      input.value = cleanUrl;
    }
    
    navHome.addEventListener('click', () => navigateTo(homeUrl));
    navGo.addEventListener('click', () => navigateTo(input.value));
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        navigateTo(input.value);
      }
    });
  }, 100);
  
  return `
    <div class="flex flex-col h-full w-full select-none text-slate-300">
      <div class="flex items-center space-x-2 pb-3 border-b border-white/5 mb-3 bg-slate-900/10 p-2 rounded-xl">
        <button class="browser-btn-home w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-slate-400 hover:text-white flex items-center justify-center cursor-pointer shadow-sm">
          <i class="ph-bold ph-house-line"></i>
        </button>
        <input type="text" value="https://wikipedia.org" class="browser-url-input flex-1 bg-slate-950/40 border border-white/10 rounded-lg py-1 px-3 text-xs focus:outline-none focus:border-indigo-500/50 text-slate-200">
        <button class="browser-btn-go w-8 h-8 rounded-lg bg-indigo-600 border border-indigo-400/20 hover:bg-indigo-500 active:scale-95 transition-all text-white flex items-center justify-center cursor-pointer shadow-md">
          <i class="ph-bold ph-arrow-right"></i>
        </button>
      </div>
      
      <div class="bg-indigo-950/20 border border-indigo-500/15 text-indigo-300/80 rounded-xl px-3 py-2 text-[10px] leading-normal flex items-start space-x-2 mb-2 select-text">
        <i class="ph-bold ph-info text-base shrink-0 mt-0.5"></i>
        <span><strong>Note:</strong> External URL sandbox limits (X-Frame-Options) prevent websites like Google/YouTube from loading in iframes. Try iframe-compatible hubs, like devdocs.io or duckduckgo.com!</span>
      </div>
      
      <div class="flex-1 w-full bg-white rounded-xl overflow-hidden shadow-inner relative border border-white/5">
        <iframe src="https://wikipedia.org" class="browser-iframe w-full h-full border-none"></iframe>
      </div>
    </div>
  `;
}

/**
 * Control Panel Settings application template builder.
 * @param {OSWindow} winInstance - Target window container.
 * @returns {string} Compiled HTML layout string.
 */
function settingsAppContent(winInstance) {
  setTimeout(() => {
    const blurIn = winInstance.dom.querySelector('.settings-blur-slider');
    const userIn = winInstance.dom.querySelector('.settings-username-input');
    const saveBtn = winInstance.dom.querySelector('.settings-save-btn');
    const restoreBtn = winInstance.dom.querySelector('.settings-restore-btn');
    const weatherSel = winInstance.dom.querySelector('.settings-weather-select');
    const windSel = winInstance.dom.querySelector('.settings-wind-select');
    
    blurIn.value = sysState.blur;
    userIn.value = sysState.username;
    weatherSel.value = sysState.wallpaperMode;
    windSel.value = sysState.windStrength;
    
    blurIn.addEventListener('input', (e) => {
      const b = e.target.value;
      applyBlurLevel(b);
      saveState('blur', b);
    });
    
    weatherSel.addEventListener('change', (e) => {
      const m = e.target.value;
      saveState('wallpaperMode', m);
      if (m === 'auto') {
        updateWeatherFromAPI();
      } else {
        updateWallpaperGIF();
      }
    });
    
    windSel.addEventListener('change', (e) => {
      const w = e.target.value;
      saveState('windStrength', w);
    });
    
    saveBtn.addEventListener('click', () => {
      const u = userIn.value.trim() || 'Verdant Guest';
      saveState('username', u);
      UI.menuUsernameDisplay.textContent = u;
      
      alert('System Settings synchronized successfully!');
    });
    
    restoreBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to hard reset the filesystem and system cache back to factory defaults?')) {
        localStorage.clear();
        alert('Storage cleared successfully. Rebooting kernel...');
        shutdownOS();
      }
    });
  }, 100);
  
  return `
    <div class="flex flex-col select-none text-slate-300 max-w-md mx-auto space-y-6">
      
      <div class="glass-card-light rounded-2xl p-5 border border-white/5 space-y-4">
        <div class="flex items-center space-x-3 border-b border-white/5 pb-3">
          <i class="ph-bold ph-user-circle-gear text-indigo-400 text-xl"></i>
          <h3 class="text-xs font-bold uppercase tracking-widest text-slate-200">Account Personalization</h3>
        </div>
        <div class="space-y-1">
          <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Username Display</label>
          <input type="text" class="settings-username-input w-full bg-slate-950/40 border border-white/10 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-indigo-500/50 text-xs">
        </div>
        <button class="settings-save-btn w-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer shadow-md border border-indigo-400/20">
          Save Adjustments
        </button>
      </div>
      
      <div class="glass-card-light rounded-2xl p-5 border border-white/5 space-y-4">
        <div class="flex items-center space-x-3 border-b border-white/5 pb-3">
          <i class="ph-bold ph-paint-brush text-indigo-400 text-xl"></i>
          <h3 class="text-xs font-bold uppercase tracking-widest text-slate-200">Wallpaper Graphics</h3>
        </div>
        <div class="space-y-3">
          <div class="space-y-1.5">
            <div class="flex justify-between items-center text-xs px-0.5">
              <span class="text-slate-400 font-semibold">Workspace Blur</span>
              <span class="text-indigo-400 font-mono font-bold blur-status-text">${sysState.blur}px</span>
            </div>
            <input type="range" min="0" max="30" class="settings-blur-slider w-full accent-indigo-500 h-1 bg-white/10 rounded-lg cursor-pointer appearance-none">
          </div>
          
          <div class="space-y-1 pt-1">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Live Weather Theme</label>
            <select class="settings-weather-select w-full bg-slate-950/40 border border-white/10 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-indigo-500/50 text-xs">
              <option value="auto">🌿 Dynamic Weather Sync (API)</option>
              <option value="sunny">☀️ Sunny & Radiant</option>
              <option value="rainy">⛈️ Overcast & Rainy</option>
              <option value="sunset">🌇 Golden Sunset</option>
              <option value="night">🌙 Starry Night</option>
            </select>
          </div>
          
          <div class="space-y-1">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Wind Sway Force</label>
            <select class="settings-wind-select w-full bg-slate-950/40 border border-white/10 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-indigo-500/50 text-xs">
              <option value="calm">💨 Calm Breeze</option>
              <option value="breeze">🍃 Gentle Sway</option>
              <option value="windy">🌲 Windy Sway</option>
              <option value="storm">🌪️ Gale / Storm Sway</option>
            </select>
          </div>
        </div>
      </div>
      
      <div class="glass-card-light rounded-2xl p-5 border border-white/5 flex flex-col space-y-3">
        <div class="flex items-center space-x-3 border-b border-white/5 pb-3">
          <i class="ph-bold ph-shield-warning text-red-400 text-xl"></i>
          <h3 class="text-xs font-bold uppercase tracking-widest text-red-400">Advanced Storage</h3>
        </div>
        <p class="text-[10px] text-slate-400 leading-normal">Resets all simulated system settings, custom themes, wallpapers, and virtual filesystem files stored inside the LocalStorage database to standard factory states.</p>
        <button class="settings-restore-btn w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 active:scale-95 text-red-400 text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer shadow-sm">
          Reset local OS Cache
        </button>
      </div>
    </div>
  `;
}

/**
 * Instantiates the virtual Text Editor interface for writing to text documents.
 * @param {string} filePath - Absolute virtual file target path.
 */
function openTextEditorApp(filePath) {
  const fileObj = sysState.filesystem[filePath];
  if (!fileObj || fileObj.type !== 'file') return;
  
  const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
  const appID = `editor-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`;
  
  function textEditorAppContent(winInstance) {
    setTimeout(() => {
      const textarea = winInstance.dom.querySelector('.editor-textarea');
      const saveBtn = winInstance.dom.querySelector('.editor-save-btn');
      
      saveBtn.addEventListener('click', () => {
        const text = textarea.value;
        sysState.filesystem[filePath].content = text;
        saveFilesystem();
        
        alert(`File ${fileName} saved successfully!`);
      });
    }, 100);
    
    return `
      <div class="flex flex-col h-full select-none text-slate-300">
        <div class="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
          <div class="flex items-center space-x-2 text-xs font-bold text-indigo-400">
            <i class="ph-bold ph-pencil-simple-line text-base text-slate-500"></i>
            <span class="font-mono">${filePath}</span>
          </div>
          <button class="editor-save-btn px-3 py-1.5 bg-indigo-600 border border-indigo-400/20 hover:bg-indigo-500 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all shadow-md">
            <i class="ph-bold ph-floppy-disk"></i>
            <span>Save File</span>
          </button>
        </div>
        
        <textarea class="editor-textarea flex-1 w-full bg-slate-950/40 border border-white/10 rounded-xl p-4 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500/40 leading-relaxed resize-none shadow-inner">${fileObj.content}</textarea>
      </div>
    `;
  }
  
  launchOrRestoreApp(appID, `Editor: ${fileName}`, 'ph-bold ph-pencil-simple-line', textEditorAppContent);
}

/* ==========================================================================
   SECTION 10: SHORTCUT & EVENT BINDINGS (INTERACTION STAGE)
   ========================================================================== */

UI.desktopIcons.forEach(iconDiv => {
  iconDiv.addEventListener('click', (e) => {
    e.stopPropagation();
    UI.desktopIcons.forEach(i => i.classList.remove('selected'));
    iconDiv.classList.add('selected');
  });
});

window.addEventListener('click', () => {
  UI.desktopIcons.forEach(i => i.classList.remove('selected'));
});

document.getElementById('icon-explorer').addEventListener('dblclick', () => {
  launchOrRestoreApp('explorer', 'File Explorer', 'ph-fill ph-folder-open', explorerAppContent);
});

document.getElementById('icon-terminal').addEventListener('dblclick', () => {
  launchOrRestoreApp('terminal', 'Kernel Terminal', 'ph-bold ph-terminal-window', terminalAppContent);
});

document.getElementById('icon-browser').addEventListener('dblclick', () => {
  launchOrRestoreApp('browser', 'Verdant Web Browser', 'ph-bold ph-globe-simple', browserAppContent);
});

document.getElementById('icon-settings').addEventListener('dblclick', () => {
  launchOrRestoreApp('settings', 'System Settings', 'ph-fill ph-gear', settingsAppContent);
});

/**
 * High-level layout configuration parameters for operational system apps.
 * @type {Object}
 */
const APP_CONFIG = {
  explorer: {
    id: 'dock-explorer',
    name: 'Files',
    icon: 'ph-fill ph-folder-open',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20',
    indicator: 'indicator-explorer',
    action: () => launchOrRestoreApp('explorer', 'File Explorer', 'ph-fill ph-folder-open', explorerAppContent)
  },
  terminal: {
    id: 'dock-terminal',
    name: 'Terminal',
    icon: 'ph-bold ph-terminal-window',
    color: 'text-indigo-400',
    bg: 'bg-slate-900/60 border border-white/10',
    indicator: 'indicator-terminal',
    action: () => launchOrRestoreApp('terminal', 'Kernel Terminal', 'ph-bold ph-terminal-window', terminalAppContent)
  },
  browser: {
    id: 'dock-browser',
    name: 'Browser',
    icon: 'ph-bold ph-globe-simple',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20',
    indicator: 'indicator-browser',
    action: () => launchOrRestoreApp('browser', 'Verdant Web Browser', 'ph-bold ph-globe-simple', browserAppContent)
  },
  settings: {
    id: 'dock-settings',
    name: 'Settings',
    icon: 'ph-fill ph-gear',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20',
    indicator: 'indicator-settings',
    action: () => launchOrRestoreApp('settings', 'System Settings', 'ph-fill ph-gear', settingsAppContent)
  }
};

/**
 * Saves current array of pinned apps to persistent LocalStorage.
 */
function savePinnedApps() {
  localStorage.setItem('verdant_pinnedApps', JSON.stringify(sysState.pinnedApps));
}

/**
 * Renders floating launchers in the bottom taskbar dock.
 */
function renderTaskbarApps() {
  const container = document.getElementById('taskbar-apps');
  if (!container) return;
  
  container.innerHTML = '';
  
  sysState.pinnedApps.forEach(appKey => {
    const config = APP_CONFIG[appKey];
    if (!config) return;
    
    const btn = document.createElement('button');
    btn.id = config.id;
    btn.className = `dock-item relative group w-11 h-11 rounded-2xl ${config.bg} flex items-center justify-center ${config.color} transition-all duration-300 hover:-translate-y-1 active:scale-90 cursor-pointer shadow-inner`;
    btn.innerHTML = `
      <i class="${config.icon} text-xl pointer-events-none"></i>
      <span class="absolute bottom-18 bg-slate-900/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 shadow-md border border-white/10 select-none whitespace-nowrap">${config.name}</span>
      <div id="${config.indicator}" class="absolute -bottom-1.5 w-1 h-1 bg-${config.color.split('-')[1]}-400 rounded-full opacity-0 scale-50 transition-all duration-300"></div>
    `;
    
    btn.addEventListener('click', config.action);
    
    if (appKey === 'explorer') UI.indExplorer = btn.querySelector(`#${config.indicator}`);
    if (appKey === 'terminal') UI.indTerminal = btn.querySelector(`#${config.indicator}`);
    if (appKey === 'browser') UI.indBrowser = btn.querySelector(`#${config.indicator}`);
    if (appKey === 'settings') UI.indSettings = btn.querySelector(`#${config.indicator}`);
    
    container.appendChild(btn);
  });
  
  activeWindows.forEach(win => {
    const ind = document.getElementById(`indicator-${win.id}`);
    if (ind) {
      ind.classList.remove('opacity-0', 'scale-50');
      ind.classList.add('opacity-100', 'scale-100');
    }
  });
}

/* ==========================================================================
   SECTION 11: CONTEXT MENU STYLING & BINDING AGENTS
   ========================================================================== */

/**
 * Hides context menu flyouts.
 */
function closeContextMenu() {
  UI.contextMenu.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
  UI.contextMenu.classList.remove('scale-100', 'opacity-100');
}

/**
 * Builds and opens the system context menu dynamically at client cursor vectors.
 * @param {MouseEvent} e - Intercepted mouse context event.
 * @param {string} type - Context layout zone ('desktop-icon', 'taskbar-item', 'desktop-backdrop').
 * @param {string|null} appKey - Targeting application ID key.
 */
function showContextMenu(e, type, appKey) {
  e.preventDefault();
  e.stopPropagation();
  
  UI.contextMenuItems.innerHTML = '';
  
  const menuWidth = 192;
  const menuHeight = 160;
  let left = e.clientX;
  let top = e.clientY;
  
  if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth - 10;
  if (top + menuHeight > window.innerHeight) top = window.innerHeight - menuHeight - 10;
  
  UI.contextMenu.style.left = `${left}px`;
  UI.contextMenu.style.top = `${top}px`;
  
  if (type === 'desktop-icon') {
    const config = APP_CONFIG[appKey];
    const isPinned = sysState.pinnedApps.includes(appKey);
    
    UI.contextMenuItems.innerHTML = `
      <div class="context-menu-item" onclick="window.launchAppFromContext('${appKey}')">
        <i class="ph-bold ph-arrow-square-out text-sm text-indigo-400"></i>
        <span>Open ${config.name}</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" onclick="window.togglePinFromContext('${appKey}')">
        <i class="${isPinned ? 'ph-bold ph-minus-circle text-red-400' : 'ph-bold ph-push-pin text-indigo-400'} text-sm"></i>
        <span>${isPinned ? 'Unpin from Taskbar' : 'Pin to Taskbar'}</span>
      </div>
    `;
  } else if (type === 'taskbar-item') {
    const config = APP_CONFIG[appKey];
    UI.contextMenuItems.innerHTML = `
      <div class="context-menu-item" onclick="window.launchAppFromContext('${appKey}')">
        <i class="ph-bold ph-arrow-square-out text-sm text-indigo-400"></i>
        <span>Open ${config.name}</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" onclick="window.togglePinFromContext('${appKey}')">
        <i class="ph-bold ph-minus-circle text-red-400 text-sm"></i>
        <span>Unpin from Taskbar</span>
      </div>
    `;
  } else {
    UI.contextMenuItems.innerHTML = `
      <div class="context-menu-item" onclick="window.refreshDesktopFromContext()">
        <i class="ph-bold ph-arrow-clockwise text-sm text-indigo-400"></i>
        <span>Refresh Workspace</span>
      </div>
      <div class="context-menu-item" onclick="window.nextWeatherFromContext()">
        <i class="ph-bold ph-cloud-sun text-sm text-indigo-400"></i>
        <span>Cycle Weather State</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" onclick="window.launchAppFromContext('settings')">
        <i class="ph-bold ph-sliders-horizontal text-sm text-indigo-400"></i>
        <span>Control Panel</span>
      </div>
    `;
  }
  
  UI.contextMenu.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
  UI.contextMenu.classList.add('opacity-100', 'scale-100');
}

window.launchAppFromContext = (appKey) => {
  const config = APP_CONFIG[appKey];
  if (config) config.action();
  closeContextMenu();
};

window.togglePinFromContext = (appKey) => {
  const index = sysState.pinnedApps.indexOf(appKey);
  if (index > -1) {
    sysState.pinnedApps.splice(index, 1);
  } else {
    sysState.pinnedApps.push(appKey);
  }
  savePinnedApps();
  renderTaskbarApps();
  closeContextMenu();
};

window.refreshDesktopFromContext = () => {
  const grid = document.getElementById('desktop-icons');
  if (grid) {
    grid.style.opacity = '0';
    setTimeout(() => {
      grid.style.opacity = '1';
    }, 200);
  }
  closeContextMenu();
};

window.nextWeatherFromContext = () => {
  const modes = ['auto', 'sunny', 'rainy', 'sunset', 'night'];
  const currentIdx = modes.indexOf(sysState.wallpaperMode);
  const nextIdx = (currentIdx + 1) % modes.length;
  const nextMode = modes[nextIdx];
  
  sysState.wallpaperMode = nextMode;
  saveState('wallpaperMode', nextMode);
  updateWallpaperGIF();
  
  const weatherSelect = document.getElementById('setting-wallpaper-mode');
  if (weatherSelect) weatherSelect.value = nextMode;
  
  closeContextMenu();
};

window.addEventListener('contextmenu', (e) => {
  const desktopIcon = e.target.closest('.desktop-icon');
  if (desktopIcon) {
    const key = desktopIcon.id.replace('icon-', '');
    showContextMenu(e, 'desktop-icon', key);
    return;
  }
  
  const taskbarItem = e.target.closest('.dock-item');
  if (taskbarItem) {
    const key = taskbarItem.id.replace('dock-', '');
    showContextMenu(e, 'taskbar-item', key);
    return;
  }
  
  const isInsideWindow = e.target.closest('.os-window');
  const isLockScreen = e.target.closest('#lock-screen');
  const isLoginScreen = e.target.closest('#login-screen');
  
  if (!isInsideWindow && !isLockScreen && !isLoginScreen && !sysState.isLocked) {
    showContextMenu(e, 'desktop-backdrop', null);
  } else {
    e.preventDefault();
  }
});

window.addEventListener('click', closeContextMenu);
window.addEventListener('resize', closeContextMenu);

document.getElementById('menu-logo-btn').addEventListener('click', () => {
  launchOrRestoreApp('settings', 'System Settings', 'ph-fill ph-gear', settingsAppContent);
});

/* ==========================================================================
   SECTION 12: SYSTEM INITIALIZATION RUNTIME START
   ========================================================================== */

loadSystemSettings();
renderTaskbarApps();
applyBlurLevel(sysState.blur);

UI.volumeVal.textContent = `${sysState.volume}%`;
UI.volumeSlider.value = sysState.volume;
UI.usernameInput.value = sysState.username;

syncFeatureToggles();
tickClock();
setInterval(tickClock, 1000);
setInterval(updateSystemGauges, 1000);

/* ==========================================================================
   SECTION 13: DYNAMIC ATMOSPHERIC WALLPAPER & WEATHER SYNCHRONIZER
   ========================================================================== */

/**
 * Initializes the weather telemetry sync loops.
 */
function initWallpaperEngine() {
  updateWeatherFromAPI();
  setInterval(updateWeatherFromAPI, 300000);
  updateWallpaperGIF();
}

/**
 * Maps active timing or weather values to exact background style nodes.
 * @returns {string} Theme identifier ('sunny', 'rainy', 'sunset', 'night').
 */
function getActiveTheme() {
  if (sysState.wallpaperMode !== 'auto') {
    return sysState.wallpaperMode;
  }
  
  if (sysState.weatherCode && sysState.weatherCode >= 51) {
    return 'rainy';
  }
  
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 18) {
    return 'sunny';
  } else if (hour >= 18 && hour < 20) {
    return 'sunset';
  } else {
    return 'night';
  }
}

/**
 * Connects securely to the Open-Meteo REST service to sync environmental sways.
 */
async function updateWeatherFromAPI() {
  if (sysState.wallpaperMode !== 'auto') {
    updateTopBarWeatherDisplay();
    updateWallpaperGIF();
    return;
  }
  
  try {
    let lat = 40.7128;
    let lon = -74.0060;
    let city = 'Local Region';
    
    try {
      const geoRes = await fetch('https://ipapi.co/json/');
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.latitude && geoData.longitude) {
          lat = geoData.latitude;
          lon = geoData.longitude;
          city = geoData.city || 'Local Region';
        }
      }
    } catch (err) {
      console.warn("GeoIP lookup failed, using fallbacks.", err);
    }
    
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,wind_speed_10m,temperature_2m&timezone=auto`;
    const res = await fetch(weatherUrl);
    if (res.ok) {
      const data = await res.json();
      const current = data.current;
      
      sysState.weatherCode = current.weather_code;
      sysState.currentTemp = Math.round(current.temperature_2m);
      sysState.currentCity = city;
      
      const windKmh = current.wind_speed_10m;
      if (windKmh < 6) {
        sysState.windStrength = 'calm';
      } else if (windKmh < 16) {
        sysState.windStrength = 'breeze';
      } else if (windKmh < 31) {
        sysState.windStrength = 'windy';
      } else {
        sysState.windStrength = 'storm';
      }
      
      sysState.currentWeatherDesc = mapWeatherCodeToText(current.weather_code);
      updateTopBarWeatherDisplay();
      updateWallpaperGIF();
    }
  } catch (err) {
    console.error("Open-Meteo weather sync error:", err);
    updateWallpaperGIF();
  }
}

/**
 * Maps Open-Meteo WMO weather codes to user-friendly descriptions.
 * @param {number} code - WMO weather code.
 * @returns {string} Weather text description.
 */
function mapWeatherCodeToText(code) {
  if (code === 0) return 'Sunny Sky';
  if (code <= 3) return 'Partly Cloudy';
  if (code === 45 || code === 48) return 'Misty Fog';
  if (code <= 55) return 'Light Drizzle';
  if (code <= 65) return 'Pouring Rain';
  if (code <= 75) return 'Snowing Sky';
  if (code <= 82) return 'Rain Showers';
  return 'Stormy Skies';
}

/**
 * Compiles specific styling attributes for active weather templates.
 * @param {number} code - Weather code.
 * @returns {Object} Meteorological metadata descriptor.
 */
function getDetailedWeatherData(code) {
  if (code === 0) {
    return {
      icon: 'ph-sun',
      desc: 'Sunny Sky',
      color: 'text-amber-400',
      styleColor: '#fbbf24',
      humidity: '45%'
    };
  }
  if (code <= 3) {
    return {
      icon: 'ph-cloud-sun',
      desc: 'Partly Cloudy',
      color: 'text-sky-300',
      styleColor: '#7dd3fc',
      humidity: '60%'
    };
  }
  if (code === 45 || code === 48) {
    return {
      icon: 'ph-cloud-fog',
      desc: 'Misty Fog',
      color: 'text-zinc-400',
      styleColor: '#a1a1aa',
      humidity: '95%'
    };
  }
  if (code <= 55) {
    return {
      icon: 'ph-cloud-drizzle',
      desc: 'Light Drizzle',
      color: 'text-cyan-300',
      styleColor: '#67e8f9',
      humidity: '80%'
    };
  }
  if (code <= 65) {
    return {
      icon: 'ph-cloud-rain',
      desc: 'Pouring Rain',
      color: 'text-blue-400',
      styleColor: '#60a5fa',
      humidity: '90%'
    };
  }
  if (code <= 75) {
    return {
      icon: 'ph-cloud-snow',
      desc: 'Snowy Sky',
      color: 'text-slate-100',
      styleColor: '#f1f5f9',
      humidity: '85%'
    };
  }
  if (code <= 82) {
    return {
      icon: 'ph-cloud-rain',
      desc: 'Rain Showers',
      color: 'text-cyan-400',
      styleColor: '#22d3ee',
      humidity: '88%'
    };
  }
  return {
    icon: 'ph-cloud-lightning',
    desc: 'Stormy Skies',
    color: 'text-yellow-400',
    styleColor: '#facc15',
    humidity: '92%'
  };
}

/**
 * Resolves environmental visual details based on current tracking state.
 * @returns {Object} Active layout settings.
 */
function getActiveWeatherState() {
  const activeTheme = getActiveTheme();
  const code = sysState.wallpaperMode === 'auto' ? sysState.weatherCode : null;
  
  if (code !== null) {
    return getDetailedWeatherData(code);
  }
  
  if (activeTheme === 'sunny') {
    return {
      icon: 'ph-sun',
      desc: 'Sunny Sky',
      color: 'text-amber-400',
      styleColor: '#fbbf24',
      humidity: '40%'
    };
  } else if (activeTheme === 'rainy') {
    return {
      icon: 'ph-cloud-rain',
      desc: 'Pouring Rain',
      color: 'text-blue-400',
      styleColor: '#60a5fa',
      humidity: '90%'
    };
  } else if (activeTheme === 'sunset') {
    return {
      icon: 'ph-cloud-sun',
      desc: 'Partly Cloudy',
      color: 'text-sky-300',
      styleColor: '#7dd3fc',
      humidity: '65%'
    };
  } else {
    return {
      icon: 'ph-moon-stars',
      desc: 'Clear Night',
      color: 'text-indigo-300',
      styleColor: '#a5b4fc',
      humidity: '50%'
    };
  }
}

/**
 * Synchronizes taskbar atmospheric badges with local meteorological updates.
 */
function updateTopBarWeatherDisplay() {
  const tempEl = document.getElementById('top-bar-temp');
  const iconEl = document.getElementById('top-bar-weather-icon');
  if (!tempEl || !iconEl) return;
  
  const weatherState = getActiveWeatherState();
  
  if (sysState.wallpaperMode !== 'auto') {
    tempEl.textContent = 'Manual';
  } else {
    tempEl.textContent = sysState.currentTemp !== '--' ? `${sysState.currentTemp}°C` : '--°C';
  }
  
  iconEl.className = `ph-bold text-base mr-0.5 transition-all duration-300 ${weatherState.icon} ${weatherState.color}`;
  
  if (UI.weatherPanelCity) UI.weatherPanelCity.textContent = sysState.currentCity || 'Local Region';
  if (UI.weatherPanelDesc) UI.weatherPanelDesc.textContent = weatherState.desc;
  if (UI.weatherPanelTemp) {
    if (sysState.wallpaperMode !== 'auto') {
      UI.weatherPanelTemp.textContent = 'Manual';
    } else {
      UI.weatherPanelTemp.textContent = sysState.currentTemp !== '--' ? `${sysState.currentTemp}°C` : '--°C';
    }
  }
  if (UI.weatherPanelIcon) {
    UI.weatherPanelIcon.className = `ph-bold text-4xl transition-all duration-300 ${weatherState.icon} ${weatherState.color}`;
    UI.weatherPanelIcon.style.color = weatherState.styleColor;
  }
  if (UI.weatherPanelWind) {
    const ws = sysState.windStrength ? sysState.windStrength.toUpperCase() : 'CALM';
    UI.weatherPanelWind.textContent = ws;
  }
  if (UI.weatherPanelHumidity) {
    UI.weatherPanelHumidity.textContent = weatherState.humidity;
  }
}

let currentWallpaperLayer = 1;
let lastLoadedTheme = '';

/**
 * Cross-fades high-definition background stage images dynamically.
 */
function updateWallpaperGIF() {
  const activeTheme = getActiveTheme();
  if (activeTheme === lastLoadedTheme) return;
  lastLoadedTheme = activeTheme;
  
  const layer1 = document.getElementById('wallpaper-bg-1');
  const layer2 = document.getElementById('wallpaper-bg-2');
  if (!layer1 || !layer2) return;
  
  const imgPath = `/wallpapers/${activeTheme}.png`;
  
  if (currentWallpaperLayer === 1) {
    layer2.style.backgroundImage = `url('${imgPath}')`;
    layer2.style.opacity = '1';
    layer1.style.opacity = '0';
    currentWallpaperLayer = 2;
  } else {
    layer1.style.backgroundImage = `url('${imgPath}')`;
    layer1.style.opacity = '1';
    layer2.style.opacity = '0';
    currentWallpaperLayer = 1;
  }
}

initWallpaperEngine();
