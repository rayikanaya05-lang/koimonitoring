/**
 * KOI Smart System - Logic & MQTT Integration
 */

// --- 1. Animasi Gelembung (Bubbles) ---
const bubbleContainer = document.querySelector('.bubbles');
for (let i = 0; i < 30; i++) {
    let span = document.createElement('span');
    span.style.left = Math.random() * 100 + '%';
    span.style.animationDuration = (10 + Math.random() * 10) + 's';
    span.style.width = (10 + Math.random() * 20) + 'px';
    span.style.height = span.style.width;
    bubbleContainer.appendChild(span);
}

// --- 2. Navigasi Scroll Spy ---
const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll("nav a");

window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 120;
        if (scrollY >= sectionTop) {
            current = section.getAttribute("id");
        }
    });

    navLinks.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === "#" + current) {
            link.classList.add("active");
        }
    });
});

// --- 3. Konfigurasi Chart.js (Real-time) ---
const ctx = document.getElementById("phChart").getContext("2d");
const gradientBlue = ctx.createLinearGradient(0, 0, 0, 200);
gradientBlue.addColorStop(0, "rgba(66,165,245,0.5)");
gradientBlue.addColorStop(1, "rgba(66,165,245,0)");

const phChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: [], // Akan diisi waktu secara otomatis
        datasets: [{
            label: "pH Aktual",
            data: [],
            borderColor: "#42a5f5",
            backgroundColor: gradientBlue,
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        plugins: { legend: { labels: { color: "white" } } },
        scales: {
            x: { ticks: { color: "white" }, grid: { display: false } },
            y: { min: 0, max: 14, ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.1)" } }
        }
    }
});

// Fungsi untuk menambah data ke chart
function updateChart(value) {
    const now = new Date().toLocaleTimeString();
    phChart.data.labels.push(now);
    phChart.data.datasets[0].data.push(value);

    // Batasi hanya 10 data terakhir yang tampil
    if (phChart.data.labels.length > 10) {
        phChart.data.labels.shift();
        phChart.data.datasets[0].data.shift();
    }
    phChart.update();
}

// --- 4. Integrasi MQTT EMQX ---
const broker = 'ws://broker.emqx.io:8083/mqtt'; // Menggunakan WebSocket
const options = {
    clientId: 'web_koi_client_' + Math.random().toString(16).substring(2, 8),
};

const client = mqtt.connect(broker, options);

client.on('connect', () => {
    console.log("Terhubung ke MQTT Broker EMQX");
    client.subscribe("WMayes/suhuair");
    client.subscribe("phairD");
});

client.on('message', (topic, message) => {
    const payload = parseFloat(message.toString());

    if (topic === "phairD") {
        document.getElementById('val-ph').innerText = payload.toFixed(1);
        updateChart(payload);
        
        // Update Status pH
        const statusPh = document.getElementById('status-ph');
        if (payload >= 6.5 && payload <= 8.5) {
            statusPh.innerText = "Normal";
            statusPh.style.color = "#90caf9";
        } else {
            statusPh.innerText = "Bahaya!";
            statusPh.style.color = "#ff5252";
        }
    }

    if (topic === "WMayes/suhuair") {
        // Asumsi data suhu dalam Celcius atau Fahrenheit sesuai Arduino Anda
        document.getElementById('val-temp').innerText = payload.toFixed(1) + "°";
        
        const statusTemp = document.getElementById('status-temp');
        statusTemp.innerText = "Connected";
        statusTemp.style.color = "#90caf9";
    }
});

client.on('error', (err) => {
    console.error("MQTT Error: ", err);
});

/* =========================
   TOGGLE CONTROL
========================= */

const feedingToggle = document.getElementById("feedingToggle");
const feedingStatus = document.getElementById("feedingStatus");

const catappaToggle = document.getElementById("catappaToggle");
const catappaStatus = document.getElementById("catappaStatus");

feedingToggle.addEventListener("change", () => {

    feedingStatus.textContent =
    feedingToggle.checked ? "ON" : "OFF";

    // KIRIM MQTT KE ESP32
    if (feedingToggle.checked) {

        client.publish("WMayes/servo", "ON");

       

    }

});

catappaToggle.addEventListener("change", () => {
    catappaStatus.textContent =
    catappaToggle.checked ? "ON" : "OFF";
});