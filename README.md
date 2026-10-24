# 🐵 MonkeyRacer

A fast, responsive Monkeytype-inspired typing test and real-time multiplayer racing application. Compete with friends or race against dynamic bots with live leaderboards, keyboard sounds, customizable color themes, and mobile QR code entry.

🌐 **Live Demo:** [https://drakz-z.github.io/MonkeyRacer/](https://drakz-z.github.io/MonkeyRacer/)

---

## ✨ Features

- **Solo Typing Practice**: Configurable test durations (15s, 30s, 60s, 120s) and word counts (10, 25, 50, 100 words) with real-time WPM, Raw WPM, Accuracy, and interactive result analytics.
- **Multiplayer Race Rooms**: Create private or public race rooms supporting up to 200 concurrent racers.
- **QR Code Mobile Access**: Instant mobile phone joining via on-screen QR codes.
- **AI Practice Bots**: Add and race against configurable AI bot racers.
- **Authentic Mechanical Keyboard Sounds**: Choose between Cherry MX Blue, Box Navy, Gateron Red, Topre, and typewriter sound simulations powered by Web Audio API.
- **Dynamic Themes**: Monkeytype-inspired themes including Monkeytype Dark, Cyberpunk, 80s Laser, Nord, Dracula, and Matrix.
- **Detailed Analytics**: Post-race performance breakdown with Chart.js velocity graphs and key accuracy metrics.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
git clone https://github.com/Drakz-z/MonkeyRacer.git
cd MonkeyRacer
npm install
```

### Running Locally

To run both the backend WebSocket server and Vite client concurrently:

```bash
npm run dev
```

- **Frontend Client**: `http://localhost:5173/MonkeyRacer/`
- **Backend WebSocket Server**: `http://localhost:3001`

To run the production build:

```bash
npm run build
npm start
```

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Lucide Icons, Chart.js, Canvas Confetti
- **Backend / Real-Time**: Node.js, Express, Socket.io
- **Deployment**: GitHub Pages (Static frontend) + GitHub Actions CI/CD
