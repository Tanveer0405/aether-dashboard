// --- SIDEBAR ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// --- STARS ANIMATION ---
const canvas = document.getElementById('star-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let stars = [];
const numStars = 200; 

class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2;
        this.speed = Math.random() * 0.05 + 0.01;
        this.opacity = Math.random();
    }
    update() {
        this.y -= this.speed;
        if (this.y < 0) this.y = canvas.height;
    }
    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}
function initStars() {
    stars = [];
    for (let i = 0; i < numStars; i++) { stars.push(new Star()); }
}
function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(star => { star.update(); star.draw(); });
    requestAnimationFrame(animateStars);
}

// --- REAL-TIME CLOCKS ---
function updateClocks() {
    const now = new Date();
    
    // UTC Clock
    const utc = now.toISOString().split('T')[1].split('.')[0];
    document.getElementById('utc-clock').innerText = utc;

    // Local Clock
    const local = now.toLocaleTimeString();
    document.getElementById('local-clock').innerText = local;
}
setInterval(updateClocks, 1000);
updateClocks();

// --- LAUNCH COUNTDOWN ---
async function loadNextLaunch() {
    const providerElem = document.getElementById('launch-provider');
    const missionElem = document.getElementById('launch-mission');
    const padElem = document.getElementById('launch-pad');
    
    try {
        // Fetch upcoming launches
        const response = await fetch('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=5');
        const data = await response.json();
        
        // Filter to find future launch
        const now = new Date();
        const nextLaunch = data.results.find(launch => new Date(launch.net) > now);

        if (nextLaunch) {
            providerElem.innerText = nextLaunch.launch_service_provider.name.toUpperCase();
            missionElem.innerText = nextLaunch.name.split('|')[0] || nextLaunch.name; 
            padElem.innerText = nextLaunch.pad.location.name;
            startCountdown(new Date(nextLaunch.net));
        } else {
            throw new Error("No future launches found");
        }
    } catch (error) {
        // Fallback Simulation
        console.log("API unavailable, starting simulation.");
        providerElem.innerText = "SIMULATION MODE";
        missionElem.innerText = "ORBITAL INTERCEPT TEST";
        padElem.innerText = "Vandenberg SFB, CA";
        
        const fakeDate = new Date();
        fakeDate.setDate(fakeDate.getDate() + 2);
        startCountdown(fakeDate);
    }
}

function startCountdown(launchDate) {
    function update() {
        const now = new Date();
        const diff = launchDate - now;

        if (diff <= 0) {
            loadNextLaunch(); 
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        document.getElementById('d-days').innerText = days < 10 ? '0'+days : days;
        document.getElementById('d-hours').innerText = hours < 10 ? '0'+hours : hours;
        document.getElementById('d-mins').innerText = minutes < 10 ? '0'+minutes : minutes;
        document.getElementById('d-secs').innerText = seconds < 10 ? '0'+seconds : seconds;
    }

    setInterval(update, 1000);
    update();
}

// --- NEWS FEED ---
const API_URL = 'https://api.spaceflightnewsapi.net/v4/articles/?limit=3';

async function loadSpaceNews() {
    const container = document.getElementById('news-container');
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        container.innerHTML = '';

        data.results.forEach(article => {
            const img = article.image_url || 'https://via.placeholder.com/400';
            const html = `
                <div class="news-card">
                    <div class="news-image-container">
                        <img src="${img}" class="news-image" alt="News">
                    </div>
                    <div class="news-content">
                        <span class="news-source">${article.news_site}</span>
                        <h3 class="news-title">${article.title}</h3>
                        <a href="${article.url}" target="_blank" class="read-btn">Read Report &rarr;</a>
                    </div>
                </div>`;
            container.innerHTML += html;
        });
    } catch (error) {
        container.innerHTML = '<p style="color:red; text-align:center;">⚠ Data Uplink Offline.</p>';
    }
}

// --- CHATBOT INTELLIGENCE (LIVE MODE) ---
function toggleChat() {
    const body = document.getElementById('chat-body');
    if (body.style.display === 'flex') {
        body.style.display = 'none';
    } else {
        body.style.display = 'flex';
    }
}

function handleInput(event) {
    if (event.key === 'Enter') sendMessage();
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const output = document.getElementById('chat-output');
    const text = input.value.trim();

    if (!text) return;

    // 1. Show User Message
    output.innerHTML += `<div class="user-msg">${text}</div>`;
    input.value = "";
    output.scrollTop = output.scrollHeight;

    // 2. Show "Thinking..."
    const loadingId = "loading-" + Date.now();
    output.innerHTML += `<div class="bot-msg" id="${loadingId}">...Computing...</div>`;
    output.scrollTop = output.scrollHeight;

    // 3. TRY CONNECTING TO BACKEND
    try {
        // --- UPDATED LIVE URL ---
        const backendURL = 'https://aether-api-7kpl.onrender.com/chat'; 
        
        // We set a slightly longer timeout for the free tier (it might sleep)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10s for wake-up

        const response = await fetch(backendURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();
        document.getElementById(loadingId).innerText = data.reply;

    } catch (error) {
        // 4. FALLBACK: SIMULATION MODE (If connection fails or times out)
        console.log("Backend connection failed:", error);
        
        let reply = "⚠ Uplink Unstable. Switching to Local Simulation.";
        const lower = text.toLowerCase();
        
        if (lower.includes('hello') || lower.includes('hi')) reply = "Greetings, Commander. (Simulation Mode)";
        else if (lower.includes('status')) reply = "All systems operational. (Simulation Mode)";
        else if (lower.includes('launch')) reply = "Next launch data is visible in the Flight Schedule terminal.";
        else if (lower.includes('crew')) reply = "Active crew: Tanveer S. Saini & Sarthak Mehta.";
        else if (lower.includes('who are you')) reply = "I am AETHER, the onboard mission control interface.";
        
        document.getElementById(loadingId).innerText = reply;
    }
}

// INITIALIZATION
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
});

initStars();
animateStars();
loadNextLaunch();
loadSpaceNews();