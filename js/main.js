/* ==========================================================================
   CYBERPUNK SCI-FI INTERACTIVE ENGINE
   Portfolio for Grade 10 TKJ Student
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNetworkCanvas();
  initAudioEngine();
  initSystemClock();
  initRJ45Tool();
  initSkillsFilter();
  initScrollAnimations();
  initTerminal();
  initContactForm();
  initHUDControls();
});

/* ================= 1. WEB AUDIO SYNTHESIZER ================= */
let audioCtx = null;
let soundEnabled = true;

function initAudioEngine() {
  const toggleBtn = document.getElementById('toggle-sound');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      toggleBtn.innerHTML = soundEnabled ? '🔊 SND: ON' : '🔇 SND: OFF';
      toggleBtn.style.color = soundEnabled ? 'var(--cyan)' : 'var(--text-muted)';
      if (soundEnabled) playSynthSound(800, 0.05, 'sine');
    });
  }

  // Add click sound to interactive buttons
  document.querySelectorAll('button, .cyber-btn-primary, .cyber-btn-secondary, .nav-link, .filter-tab, .std-btn, .social-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => playSynthSound(440, 0.03, 'sine', 0.03));
    btn.addEventListener('click', () => playSynthSound(780, 0.06, 'triangle', 0.06));
  });
}

function playSynthSound(freq = 600, duration = 0.05, type = 'sine', vol = 0.05) {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Audio context policy or unavailable
  }
}

/* ================= 2. NETWORK TOPOLOGY CANVAS ================= */
function initNetworkCanvas() {
  const canvas = document.getElementById('network-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const nodes = [];
  const packets = [];
  const nodeCount = Math.floor((width * height) / 18000);
  const maxDistance = 140;

  let mouse = { x: null, y: null, radius: 150 };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  class Node {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.7;
      this.vy = (Math.random() - 0.5) * 0.7;
      this.radius = Math.random() * 2 + 1.5;
      this.isRouter = Math.random() > 0.85;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Mouse repulsion/attraction subtle effect
      if (mouse.x !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x -= (dx / dist) * force * 1.5;
          this.y -= (dy / dist) * force * 1.5;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.isRouter ? '#00ff88' : '#00f0ff';
      ctx.shadowBlur = this.isRouter ? 10 : 6;
      ctx.shadowColor = this.isRouter ? '#00ff88' : '#00f0ff';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  class DataPacket {
    constructor(startNode, endNode) {
      this.start = startNode;
      this.end = endNode;
      this.progress = 0;
      this.speed = 0.015 + Math.random() * 0.02;
    }

    update() {
      this.progress += this.speed;
    }

    draw() {
      const curX = this.start.x + (this.end.x - this.start.x) * this.progress;
      const curY = this.start.y + (this.end.y - this.start.y) * this.progress;

      ctx.beginPath();
      ctx.arc(curX, curY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffaa00';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffaa00';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  for (let i = 0; i < Math.max(nodeCount, 40); i++) {
    nodes.push(new Node());
  }

  // Periodic packet routing
  setInterval(() => {
    if (packets.length < 8 && nodes.length > 2) {
      const n1 = nodes[Math.floor(Math.random() * nodes.length)];
      // Find nearby node
      const nearby = nodes.filter(n => {
        const d = Math.hypot(n.x - n1.x, n.y - n1.y);
        return d > 10 && d < maxDistance;
      });
      if (nearby.length > 0) {
        const n2 = nearby[Math.floor(Math.random() * nearby.length)];
        packets.push(new DataPacket(n1, n2));
      }
    }
  }, 400);

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw connection lines
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDistance) {
          const alpha = 1 - (dist / maxDistance);
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.18})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Update & draw nodes
    nodes.forEach(node => {
      node.update();
      node.draw();
    });

    // Update & draw data packets
    for (let i = packets.length - 1; i >= 0; i--) {
      packets[i].update();
      packets[i].draw();
      if (packets[i].progress >= 1) {
        packets.splice(i, 1);
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
}

/* ================= 3. SYSTEM CLOCK & SIMULATED TELEMETRY ================= */
function initSystemClock() {
  const clockEl = document.getElementById('hud-clock');
  const pingEl = document.getElementById('hud-ping');

  function updateClock() {
    if (!clockEl) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hours}:${mins}:${secs} WITA`;
  }

  setInterval(updateClock, 1000);
  updateClock();

  // Subtle ping jitter
  if (pingEl) {
    setInterval(() => {
      const ping = Math.floor(Math.random() * 6) + 11; // 11-16ms
      pingEl.textContent = `${ping}ms`;
    }, 3500);
  }
}

/* ================= 4. INTERACTIVE RJ-45 PINOUT TOOL ================= */
function initRJ45Tool() {
  const standards = {
    'T568B': {
      name: 'T-568B (Most Common Standard)',
      type: 'Straight-Through Cable (PC to Switch/Router)',
      wires: [
        { pin: 1, name: 'White-Orange', colorClass: 'wire-white-orange', signal: 'TX+ (Transmit)' },
        { pin: 2, name: 'Orange', colorClass: 'wire-orange', signal: 'TX- (Transmit)' },
        { pin: 3, name: 'White-Green', colorClass: 'wire-white-green', signal: 'RX+ (Receive)' },
        { pin: 4, name: 'Blue', colorClass: 'wire-blue', signal: 'PoE / Voice' },
        { pin: 5, name: 'White-Blue', colorClass: 'wire-white-blue', signal: 'PoE / Voice' },
        { pin: 6, name: 'Green', colorClass: 'wire-green', signal: 'RX- (Receive)' },
        { pin: 7, name: 'White-Brown', colorClass: 'wire-white-brown', signal: 'Ground' },
        { pin: 8, name: 'Brown', colorClass: 'wire-brown', signal: 'Ground' }
      ]
    },
    'T568A': {
      name: 'T-568A (Alternative Standard)',
      type: 'Used with T568B for Crossover Cables (PC to PC)',
      wires: [
        { pin: 1, name: 'White-Green', colorClass: 'wire-white-green', signal: 'RX+ (Receive)' },
        { pin: 2, name: 'Green', colorClass: 'wire-green', signal: 'RX- (Receive)' },
        { pin: 3, name: 'White-Orange', colorClass: 'wire-white-orange', signal: 'TX+ (Transmit)' },
        { pin: 4, name: 'Blue', colorClass: 'wire-blue', signal: 'PoE / Voice' },
        { pin: 5, name: 'White-Blue', colorClass: 'wire-white-blue', signal: 'PoE / Voice' },
        { pin: 6, name: 'Orange', colorClass: 'wire-orange', signal: 'TX- (Transmit)' },
        { pin: 7, name: 'White-Brown', colorClass: 'wire-white-brown', signal: 'Ground' },
        { pin: 8, name: 'Brown', colorClass: 'wire-brown', signal: 'Ground' }
      ]
    }
  };

  const container = document.getElementById('rj45-wires-container');
  const stdTitle = document.getElementById('rj45-std-title');
  const stdType = document.getElementById('rj45-std-type');
  const btnT568B = document.getElementById('btn-t568b');
  const btnT568A = document.getElementById('btn-t568a');
  const btnTestCable = document.getElementById('btn-test-cable');
  const testerStatus = document.getElementById('tester-status');
  const leds = document.querySelectorAll('.test-led');

  function renderStandard(key) {
    if (!container) return;
    const std = standards[key];
    if (stdTitle) stdTitle.textContent = std.name;
    if (stdType) stdType.textContent = std.type;

    container.innerHTML = '';
    std.wires.forEach(w => {
      const col = document.createElement('div');
      col.className = 'wire-column';
      col.innerHTML = `
        <span class="wire-pin-no">PIN ${w.pin}</span>
        <div class="wire-body ${w.colorClass}" title="${w.name} - ${w.signal}"></div>
        <span class="wire-name-label">${w.name}</span>
      `;
      container.appendChild(col);
    });
  }

  if (btnT568B && btnT568A) {
    btnT568B.addEventListener('click', () => {
      btnT568B.classList.add('active');
      btnT568A.classList.remove('active');
      renderStandard('T568B');
    });

    btnT568A.addEventListener('click', () => {
      btnT568A.classList.add('active');
      btnT568B.classList.remove('active');
      renderStandard('T568A');
    });

    // Default load T568B
    renderStandard('T568B');
  }

  // Cable Tester Simulator
  if (btnTestCable) {
    let isTesting = false;
    btnTestCable.addEventListener('click', () => {
      if (isTesting) return;
      isTesting = true;
      btnTestCable.disabled = true;
      btnTestCable.style.opacity = '0.6';
      if (testerStatus) testerStatus.textContent = 'STATUS: SCANNING PIN CONTINUITY...';

      // Clear all LEDs
      leds.forEach(l => l.classList.remove('active'));

      let currentPin = 0;
      const interval = setInterval(() => {
        if (currentPin > 0) {
          leds[currentPin - 1].classList.remove('active');
        }

        if (currentPin < 8) {
          leds[currentPin].classList.add('active');
          playSynthSound(900 + currentPin * 70, 0.04, 'sine', 0.05);
          currentPin++;
        } else {
          clearInterval(interval);
          // Turn all on at end
          leds.forEach(l => l.classList.add('active'));
          playSynthSound(1300, 0.15, 'triangle', 0.08);
          if (testerStatus) {
            testerStatus.innerHTML = '<span style="color:var(--green)">✓ 8/8 PINS CONTINUITY OK • 1000BASE-T GIGABIT PASSED</span>';
          }
          setTimeout(() => {
            isTesting = false;
            btnTestCable.disabled = false;
            btnTestCable.style.opacity = '1';
          }, 1500);
        }
      }, 160);
    });
  }
}

/* ================= 5. SKILLS FILTER & INTERSECTION OBSERVER ================= */
function initSkillsFilter() {
  const tabs = document.querySelectorAll('.filter-tab');
  const skillNodes = document.querySelectorAll('.skill-node');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.dataset.filter;

      skillNodes.forEach(node => {
        const category = node.dataset.category;
        if (filter === 'all' || category === filter) {
          node.style.display = 'block';
          setTimeout(() => {
            node.style.opacity = '1';
            node.style.transform = 'translateY(0)';
          }, 50);
        } else {
          node.style.opacity = '0';
          node.style.transform = 'translateY(10px)';
          setTimeout(() => {
            node.style.display = 'none';
          }, 200);
        }
      });
    });
  });
}

function initScrollAnimations() {
  const bars = document.querySelectorAll('.skill-bar-fill');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const targetWidth = bar.dataset.progress || '80%';
        bar.style.width = targetWidth;
      }
    });
  }, { threshold: 0.2 });

  bars.forEach(bar => observer.observe(bar));

  // Active nav highlighting on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

/* ================= 6. INTERACTIVE TERMINAL ================= */
function initTerminal() {
  const modal = document.getElementById('terminal-modal');
  const triggerBtn = document.getElementById('open-terminal-btn');
  const floatingBtn = document.getElementById('floating-terminal-btn');
  const hudTermBtn = document.getElementById('hud-term-btn');
  const closeBtn = document.getElementById('close-terminal-btn');
  const input = document.getElementById('term-input');
  const output = document.getElementById('term-output');

  if (!modal || !input || !output) return;

  function openTerminal() {
    modal.classList.add('open');
    input.focus();
    playSynthSound(600, 0.08, 'sawtooth', 0.04);
  }

  function closeTerminal() {
    modal.classList.remove('open');
    playSynthSound(400, 0.06, 'sine', 0.03);
  }

  if (triggerBtn) triggerBtn.addEventListener('click', openTerminal);
  if (floatingBtn) floatingBtn.addEventListener('click', openTerminal);
  if (hudTermBtn) hudTermBtn.addEventListener('click', openTerminal);
  if (closeBtn) closeBtn.addEventListener('click', closeTerminal);

  // Close on Escape or click outside
  window.addEventListener('keydown', (e) => {
    if (e.key === '`' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      modal.classList.contains('open') ? closeTerminal() : openTerminal();
    }
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeTerminal();
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeTerminal();
  });

  const commands = {
    help: () => `
<div style="color:var(--cyan)">Available Commands in TKJ CLI:</div>
  <span style="color:var(--green)">whoami</span>      - Display Pul's profile, school & Arch Linux status
  <span style="color:var(--green)">fastfetch</span>   - Output Arch Linux system specs & ASCII art (or neofetch)
  <span style="color:var(--green)">skills</span>      - Show exact technical skills breakdown
  <span style="color:var(--green)">cabling</span>     - Show RJ-45 T568A & T568B color codes
  <span style="color:var(--green)">projects</span>    - List Arch, Mikrotik & hardware engineering projects
  <span style="color:var(--green)">ping [ip]</span>   - Simulate ICMP ping to a remote host
  <span style="color:var(--green)">ipconfig</span>    - View simulated network interface config
  <span style="color:var(--green)">fastboot</span>    - Run Android fastboot / EDL diagnostics
  <span style="color:var(--green)">rigs</span>        - List hardware workstations (laptop & PC builds)
  <span style="color:var(--green)">contact</span>     - View Telegram, Instagram & TikTok channels
  <span style="color:var(--green)">clear</span>       - Clear the terminal console
  <span style="color:var(--green)">matrix</span>      - Run cyber data stream animation
  <span style="color:var(--green)">exit</span>        - Close terminal
`,
    fastfetch: () => `
<pre style="color:var(--cyan); font-family:monospace; margin:0; line-height:1.25;">
      /\\          <span style="color:var(--green)">pul@arch-kartika</span>
     /  \\         ----------------
    /\\   \\        <span style="color:#ffaa00">OS</span>: Arch Linux x86_64
   /      \\       <span style="color:#ffaa00">Arch Streak</span>: 2.5 Years on ASUS P1411CJP (Zero Hopping!)
  /   ,,   \\      <span style="color:#ffaa00">Current Rig</span>: ThinkPad T14 Gen 1 (Since April 2026)
 /   |  |  -\\     <span style="color:#ffaa00">Shell</span>: bash (100% Scripting Mastery)
/_-''    ''-_\\    <span style="color:#ffaa00">School</span>: SMK Kartika XX-1 Makassar
                  <span style="color:#ffaa00">Status</span>: BTW I Use Arch Linux!
</pre>
`,
    neofetch: () => commands.fastfetch(),
    whoami: () => `
<div style="color:var(--cyan)">[CADET PROFILE: BE JOHNSEN (PUL)]</div>
  Name     : Be Johnsen (Pul)
  Major    : Teknik Komputer dan Jaringan (TKJ)
  Level    : Grade 10 / SMK Kartika XX-1 Makassar
  Location : Makassar, Indonesia [WITA]
  Current  : Lenovo ThinkPad T14 Gen 1 (Bought April 2026, Active Oct 2026)
  Legacy   : 2.5 Years pure Arch Linux daily driver on ASUS P1411CJP
  Fortes   : Hardware Assembly (100%), Linux & Bash (100%), BIOS (100%), Mikrotik (89%)
  Telegram : @FastbootIsMissingYouNeedEDL
`,
    skills: () => `
<div style="color:var(--cyan)">[TECHNICAL SKILL MATRIX - BE JOHNSEN (PUL)]</div>
  [HARDWARE & SYSTEMS]
  - PC Assembly & Diagnostics          : 100% (Mastery)
  - Linux Server & Bash Scripting      : 100% (2.5 Yrs Pure Arch on ASUS P1411CJP)
  - BIOS & Dual-Boot Deployment        : 100% (UEFI / GPT / Bootloaders)
  - Cable Crimping & Testing (RJ-45)   : 95%
  [NETWORKING & PROTOCOLS]
  - Mikrotik RouterOS (NAT/Queues/Hotspot): 89%
  - IPv4 Subnetting & CIDR Calculation : 75%
  - Cisco Packet Tracer Simulation     : 66%
  - Wireshark & Other Tools            : 30%
`,
    cabling: () => `
<div style="color:var(--cyan)">[RJ-45 COLOR STANDARDS CHEAT SHEET]</div>
<span style="color:#ffaa00">T-568B (Straight-Through Standard):</span>
  1. White-Orange   2. Orange        3. White-Green   4. Blue
  5. White-Blue     6. Green         7. White-Brown   8. Brown
<span style="color:#00ff88">T-568A (Crossover / Alternative):</span>
  1. White-Green    2. Green         3. White-Orange  4. Blue
  5. White-Blue     6. Orange        7. White-Brown   8. Brown
`,
    projects: () => `
<div style="color:var(--cyan)">[PRACTICAL LAB & SYSTEM PROJECTS]</div>
  1. Arch Linux 2.5-Yr Rig (ASUS P1411CJP Pure & Custom Bash Automation)
  2. Mikrotik Hotspot & Bandwidth QoS Manager (RouterOS 89%)
  3. Bare-Metal PC Assembly & Stress Test Lab (Hardware 100%)
  4. UEFI BIOS Tuning & Multi-Boot Partitioning (Systems 100%)
`,
    fastboot: () => `
<div style="color:var(--amber)">[ANDROID FASTBOOT / EDL DIAGNOSTIC]</div>
  &gt; fastboot devices
  ? EDL_PORT_COM5   qualcomm_hs-usb_qdloader_9008
  &gt; STATUS: Fastboot Is Missing? You Need EDL!
  &gt; Reach Pul via Telegram: @FastbootIsMissingYouNeedEDL
`,
    rigs: () => `
<div style="color:var(--cyan)">[HARDWARE WORKSTATION INVENTORY]</div>

<span style="color:var(--green)">▸ CURRENT DAILY RIG (Active - Bought April 2026)</span>
  Model    : Lenovo ThinkPad T14 Gen 1 (Intel)
  CPU      : Intel Core i5-10310U (4C/8T)
  RAM      : 20GB DDR4
  Storage  : 256GB NVMe SSD
  OS       : Windows 10 Pro

<span style="color:#a855f7">▸ NEXT UPGRADE (Planned)</span>
  Model    : Lenovo ThinkPad T14 Gen 2 (AMD)
  CPU      : AMD Ryzen PRO 7 5850U (8C/16T Zen 3)
  RAM      : 16GB DDR4
  Storage  : 512GB NVMe SSD
  OS       : Windows 10 Pro

<span style="color:var(--amber)">▸ FUTURE CUSTOM BUILD (Desktop)</span>
  CPU      : AMD Ryzen 5 5600X (6C/12T Zen 3)
  RAM      : 16GB DDR4 3200MHz
  Storage  : 1TB NVMe SSD
  GPU      : AMD Radeon RX 6600 (RDNA 2)
  OS       : Windows 11 Pro

<span style="color:#ff5f7e">▸ RETIRED BATTLE RIG (DEAD)</span>
  Model    : ASUS P1411CJP (The 2.5-Year Arch Linux Daily Driver)
  CPU      : Intel Core i3-1005G1
  RAM      : 8GB DDR4
  Storage  : 256GB NVMe SSD
  GPU      : NVIDIA GeForce MX330 (Dead)
  OS       : Arch Linux (2.5 Continuous Years With Zero Distro-Hopping!)
`,
    ipconfig: () => `
<div style="color:var(--cyan)">Arch Linux / Network Interface Config:</div>
2: eth0: &lt;BROADCAST,MULTICAST,UP,LOWER_UP&gt; mtu 1500 qdisc fq_codel state UP
    inet 192.168.10.15/24 brd 192.168.10.255 scope global dynamic eth0
    gateway 192.168.10.1 (Mikrotik RouterOS 89% Managed)
    DNS Servers: 1.1.1.1, 8.8.8.8
    Speed: 1000Mbps Full Duplex (Cat6 95% Hand-Crimped)
`,
    contact: () => `
<div style="color:var(--cyan)">[COMMUNICATION FREQUENCIES]</div>
  Telegram : @FastbootIsMissingYouNeedEDL (t.me/FastbootIsMissingYouNeedEDL)
  Instagram: @pulwastaken58 (instagram.com/pulwastaken58)
  TikTok   : @pulzz8722 (tiktok.com/@pulzz8722)
  Email    : None (Direct Social Transmission Only)
  School   : SMK Kartika XX-1 Makassar
  Location : Makassar, Indonesia
`,
    clear: () => {
      output.innerHTML = '';
      return '';
    },
    exit: () => {
      closeTerminal();
      return 'Terminal session closed.';
    },
    matrix: () => {
      let rain = '';
      const chars = '01ARCHLINUX!@#$%&*';
      for (let i = 0; i < 5; i++) {
        let line = '';
        for (let j = 0; j < 36; j++) {
          line += chars[Math.floor(Math.random() * chars.length)];
        }
        rain += `<div style="color:var(--green);font-family:monospace;">${line}</div>`;
      }
      return rain;
    }
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = input.value.trim();
      input.value = '';
      if (!val) return;

      // Echo command
      const echoDiv = document.createElement('div');
      echoDiv.innerHTML = `<span style="color:var(--green)">pul@arch-kartika:~$</span> ${val}`;
      output.appendChild(echoDiv);

      const parts = val.split(' ');
      const cmd = parts[0].toLowerCase();
      const arg = parts[1];

      if (cmd === 'ping') {
        const host = arg || '8.8.8.8';
        const pingDiv = document.createElement('div');
        pingDiv.innerHTML = `PING ${host} 56(84) bytes of data...`;
        output.appendChild(pingDiv);

        let seq = 1;
        const pingInterval = setInterval(() => {
          if (seq <= 4) {
            const time = (Math.random() * 8 + 12).toFixed(2);
            const line = document.createElement('div');
            line.innerHTML = `64 bytes from ${host}: icmp_seq=${seq} ttl=118 time=${time} ms`;
            output.appendChild(line);
            output.scrollTop = output.scrollHeight;
            seq++;
          } else {
            clearInterval(pingInterval);
            const summary = document.createElement('div');
            summary.innerHTML = `<span style="color:var(--cyan)">--- ${host} ping statistics ---</span><br>4 packets transmitted, 4 received, 0% packet loss.`;
            output.appendChild(summary);
            output.scrollTop = output.scrollHeight;
          }
        }, 300);
      } else if (commands[cmd]) {
        const result = commands[cmd]();
        if (result) {
          const resDiv = document.createElement('div');
          resDiv.innerHTML = result;
          output.appendChild(resDiv);
        }
      } else {
        const errDiv = document.createElement('div');
        errDiv.innerHTML = `<span style="color:var(--red)">Command not found: '${cmd}'. Type <span style="color:var(--cyan)">'help'</span> for available commands.</span>`;
        output.appendChild(errDiv);
      }

      output.scrollTop = output.scrollHeight;
    }
  });
}

/* ================= 7. CONTACT FORM SUBMISSION ================= */
function initContactForm() {
  const form = document.getElementById('cyber-contact-form');
  const statusMsg = document.getElementById('form-status-msg');
  const submitBtn = document.getElementById('submit-packet-btn');

  if (!form || !submitBtn || !statusMsg) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '⚡ TRANSMITTING PACKET...';
    submitBtn.disabled = true;

    playSynthSound(500, 0.1, 'sawtooth', 0.05);

    setTimeout(() => {
      submitBtn.innerHTML = '🔒 ENCRYPTING VIA SHA-256...';
      playSynthSound(700, 0.1, 'sine', 0.05);
    }, 600);

    setTimeout(() => {
      submitBtn.innerHTML = '✓ PACKET DELIVERED';
      submitBtn.disabled = false;
      playSynthSound(1000, 0.2, 'triangle', 0.08);

      statusMsg.style.display = 'block';
      statusMsg.innerHTML = '<strong>[ACK RECEIVED]</strong> Thank you! Your transmission was successfully delivered to Pul\'s Arch Linux workstation.';
      form.reset();

      setTimeout(() => {
        submitBtn.innerHTML = originalText;
        statusMsg.style.display = 'none';
      }, 5000);
    }, 1500);
  });
}

/* ================= 8. HUD CONTROLS (SCANLINES, MOBILE NAV) ================= */
function initHUDControls() {
  const scanlineBtn = document.getElementById('toggle-scanlines');
  const scanlineOverlay = document.getElementById('scanline-overlay');

  if (scanlineBtn && scanlineOverlay) {
    scanlineBtn.addEventListener('click', () => {
      scanlineOverlay.classList.toggle('disabled');
      const isDisabled = scanlineOverlay.classList.contains('disabled');
      scanlineBtn.textContent = isDisabled ? '📺 CRT: OFF' : '📺 CRT: ON';
      scanlineBtn.style.color = isDisabled ? 'var(--text-muted)' : 'var(--cyan)';
    });
  }

  // Mobile navigation hamburger toggle
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const navLinks = document.getElementById('nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      mobileToggle.innerHTML = navLinks.classList.contains('open') ? '✕' : '☰';
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        mobileToggle.innerHTML = '☰';
      });
    });
  }
}
