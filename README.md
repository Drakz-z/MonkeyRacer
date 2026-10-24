# 🐵 MonkeyRacer

A fast, responsive Monkeytype-inspired typing test and real-time multiplayer racing application. Compete with friends or race against dynamic bots with live leaderboards, keyboard sounds, customizable color themes, and mobile QR code entry.

🌐 **Live Demo:** [https://drakz-z.github.io/MonkeyRacer/](https://drakz-z.github.io/MonkeyRacer/)

---

## ✨ Features

- **Solo Typing Practice**: Configurable test durations (15s, 30s, 60s, 120s) and word counts (10, 25, 50, 100 words) with real-time WPM, Raw WPM, Accuracy, and interactive result analytics.
- **Timed Multiplayer Race Rooms**: The host picks how long the room lasts (1–10 min) and the test length (15s–2m). Racers take as many full tests as they can; only completed tests count, and your best WPM ranks you.
- **Live & Final Leaderboards**: Live standings during the race, then a top-3 podium, category awards and leaderboards for best WPM, average WPM, accuracy and tests done (click a racer to see each test).
- **Restart Without Leaving**: The host can race again, return to the lobby, or restart mid-race and everyone stays in the room.
- **Join by Code, Link or QR**: Rooms are peer-to-peer (WebRTC via PeerJS), so joining works on the static GitHub Pages site with no backend. Up to 200 racers.
- **Saved Settings**: Theme, keyboard sound, volume, nickname and solo mode are remembered in a cookie.
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

```bash
npm run dev
```

Open `http://localhost:5173/MonkeyRacer/`. To test on a phone, open the "Network" address Vite prints (a `localhost` link can't be opened from other devices).

To serve the production build:

```bash
npm run build
npm start
```

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Lucide Icons, Chart.js, Canvas Confetti
- **Real-Time**: PeerJS (WebRTC data channels) — the host's browser runs the room, no game server needed
- **Deployment**: GitHub Pages (Static frontend) + GitHub Actions CI/CD
