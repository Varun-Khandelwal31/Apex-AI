# 🏎️ APEX AI — The Autonomous Race Engineer

> **A Full-Stack, Hackathon-Winning Motorsports Intelligence & AI Strategy Platform** combining 3D Web Interfaces, FastF1 Telemetry, Machine Learning Corner Loss Detection, Multi-Agent War Room Reasoning, and Paytm Payment Gateway Integration.

---

## 🌟 Overview

**Apex AI** brings Formula 1 race engineering to the next level. Built for drivers, race strategists, and motorsports enthusiasts, Apex AI ingests real-time 100Hz F1 telemetry data, compares it against a theoretical **"Ghost Car"** (synthesized from the session's fastest mini-sectors), detects micro-driving mistakes via custom **XGBoost ML models**, streams multi-agent reasoning over **WebSockets**, and handles instant payment unlocking via **Paytm UPI**.

---

## ✨ Key Features

### 1. 3D Cinematic Landing Page (`/`)
- **React Three Fiber & Drei**: 3D dark-mode background rendering a floating neon Monaco F1 circuit with a glowing 3D car orb traversing the track spline.
- **Framer Motion Overlay**: Dynamic hero title, live telemetry metrics bar, and glowing red **"Enter Cockpit"** transition.

### 2. The Split-Screen Cockpit Dashboard (`/dashboard`)
- **Dynamic SVG "Ghost Race" Engine**: Animate both **Driver Car (Red)** and **Ghost Car (Neon Green)** moving along the track in real-time. Specific corners pulse **Red** (avoidable time loss) or **Green** (optimal delta).
- **Telemetry Gauges**: Animated circular progress bars for **Throttle %**, **Brake Pressure %**, **Gear Indicator**, and **DRS State**.
- **Speed Profile Area Chart**: Interactive Recharts graph comparing **Driver Speed vs Ghost Car Target Speed** across lap distance (0m - 3337m).

### 3. Multi-Agent War Room & Real-Time Thought Streaming
- **3 Specialized Sequential Agents**:
  1. **Telemetry Analyst**: Compares `driver_lap` against `ghost_lap` mini-sectors and extracts corner time loss JSON.
  2. **Vehicle Dynamics Engineer**: Formulates chassis & aerodynamic setup changes (*"Increase front wing angle by +1.0°"*, *"Stiffen front anti-roll bar by 2 clicks"*).
  3. **Race Strategist**: Calculates optimal pit window (L24-L27), tyre degradation curves, and undercut deltas.
- **WebSocket Streaming (`/ws/agents`)**: Streams the agent's thought process line-by-line in real-time to the **Agent Terminal Console**.

### 4. Paytm Payment Gateway Integration
- **Glassmorphism Payment Modal**: Backdrop-blur modal rendering an official Paytm UPI QR code.
- **Paytm Setup & Strategy Unlock**: Un-blurs Vehicle Dynamics Engineer setup recommendations upon instant payment verification.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, Framer Motion, React Three Fiber, Three.js, Drei, Recharts, Lucide Icons, QRCode.
- **Backend**: Python 3.9+, FastAPI, Uvicorn, WebSockets.
- **Data Pipeline**: FastF1 (Official F1 Timing & Telemetry Data), Pandas, NumPy.
- **Machine Learning**: XGBoost, Scikit-learn, Joblib.
- **AI Agentic Layer**: LangChain, Multi-Agent Architecture, FAISS Vector DB (RAG).
- **Payments**: Paytm Payment Gateway API (UPI QR & Webhooks).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+ and npm
- Python 3.9+ and pip

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Varun-Khandelwal31/Apex-AI.git
   cd Apex-AI
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   pip install -r backend/requirements.txt
   ```

---

## 💻 Running the Application

### Option A: Run in Two Separate Terminals (Recommended)

**Terminal 1: Start FastAPI Backend Server**
```bash
PYTHONPATH=backend python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2: Start Next.js Frontend Development Server**
```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

### Option B: Run Simultaneously via `concurrently`

```bash
npx concurrently "PYTHONPATH=backend python3 -m uvicorn backend.main:app --port 8000" "npm run dev"
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API status and service engine info |
| `GET` | `/api/telemetry/{driver}/{lap}` | Returns `driver_lap`, `ghost_lap`, and ML corner mistake annotations |
| `POST` | `/api/chat` | Standard HTTP POST endpoint for AI Race Engineer queries |
| `WS` | `/ws/agents` | WebSocket endpoint streaming multi-agent thoughts line-by-line |
| `POST` | `/api/paytm/create_order` | Generates a Paytm UPI order ID and QR code string |
| `POST` | `/api/paytm/webhook` | Handles Paytm payment success webhook callback |
| `GET` | `/api/paytm/status/{order_id}` | Polls payment status for an order ID |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.