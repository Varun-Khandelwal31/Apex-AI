# 🏎️ APEX AI — The Autonomous Race Engineer

> **A Full-Stack, Hackathon-Winning Motorsports Intelligence & AI Strategy Platform** combining 3D Web Interfaces, FastF1 Telemetry, Machine Learning Corner Loss Detection, Multi-Agent War Room Reasoning, Pydantic Data Validation, LangChain Tool Calling, and Paytm Payment Gateway Integration.

---

## 🌟 Overview

**Apex AI** brings Formula 1 race engineering to the next level. Built for drivers, race strategists, and motorsports enthusiasts, Apex AI ingests real-time 100Hz F1 telemetry data, compares it against a theoretical **"Ghost Car"** (synthesized from the session's fastest mini-sectors), detects micro-driving mistakes via custom **XGBoost ML models**, enforces enterprise **Pydantic data schemas** with `@tool` decorators, streams multi-agent reasoning over **WebSockets**, and handles instant payment unlocking via **Paytm UPI**.

---

## ✨ Key Features

### 1. 3D Cinematic Landing Page (`/`)
- **React Three Fiber & Drei**: 3D dark-mode background rendering a floating neon Monaco F1 circuit with a glowing 3D car orb traversing the track spline.
- **Framer Motion Overlay**: Dynamic hero title, live telemetry metrics bar, and glowing red **"Enter Cockpit"** transition.

### 2. The Split-Screen Cockpit Dashboard (`/dashboard`)
- **Dynamic SVG "Ghost Race" Engine**: Animate both **Driver Car (Red)** and **Ghost Car (Neon Green)** moving along the track in real-time. Specific corners pulse **Red** (avoidable time loss) or **Green** (optimal delta).
- **Telemetry Gauges**: Animated circular progress bars for **Throttle %**, **Brake Pressure %**, **Gear Indicator**, and **DRS State**.
- **Speed Profile Area Chart**: Interactive Recharts graph comparing **Driver Speed vs Ghost Car Target Speed** across lap distance (0m - 3337m).

### 3. Multi-Agent Enterprise Flow (Pydantic + LangChain `@tool`)
- **Pydantic Data Schemas (`CornerAnalysisSchema`, `CarSetupRecommendationSchema`, `PitStrategySchema`)**: Enforces strict structural typing for all agent outputs.
- **LangChain Tool Calling (`@tool(args_schema=...)`)**:
  - `@tool` `log_telemetry_issue`: Logs corner mistake annotations with exact turn numbers, reasons, and time deltas.
  - `@tool` `recommend_car_setup`: Logs actionable aerodynamic and suspension adjustments.
  - `@tool` `calculate_undercut_strategy`: Computes pit windows and tyre wear rates.
- **WebSocket Streaming (`/ws/agents`)**: Streams agent thought processes line-by-line in real-time to the **Agent Terminal Console**.

### 4. Paytm Payment Gateway Integration & Fintech Lifecycle
- **Paytm Order Creation & Signatures**: Backend generates unique `order_id` and SHA256 HMAC checksum signature before rendering QR code.
- **Webhook & Idempotency Guard**: Webhook endpoint `/api/paytm/webhook` verifies checksums and enforces idempotency against duplicate re-fires.
- **Paytm Setup & Strategy Unlock**: Un-blurs Vehicle Dynamics Engineer setup recommendations upon instant payment verification.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, Framer Motion, React Three Fiber, Three.js, Drei, Recharts, Lucide Icons, QRCode.
- **Backend**: Python 3.9+, FastAPI, Uvicorn, WebSockets.
- **Data Pipeline**: FastF1 (Official F1 Timing & Telemetry Data), Pandas, NumPy.
- **Machine Learning**: XGBoost, Scikit-learn, Joblib.
- **AI Agentic Layer**: LangChain, Pydantic v1/v2 Schemas, `@tool` Tool Calling, Multi-Agent Architecture, FAISS Vector DB (RAG).
- **Payments**: Paytm Payment Gateway API (Order Creation, SHA256 Signatures, Idempotency, Webhooks).

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
| `GET` | `/` | API status and multi-agent service engine info |
| `GET` | `/api/telemetry/{driver}/{lap}` | Returns `driver_lap`, `ghost_lap`, and ML corner mistake annotations |
| `POST` | `/api/chat` | Standard HTTP POST endpoint for AI Race Engineer queries |
| `WS` | `/ws/agents` | WebSocket endpoint streaming multi-agent thoughts line-by-line |
| `POST` | `/api/paytm/create-order` | Generates a Paytm UPI order ID, SHA256 checksum, and QR code string |
| `POST` | `/api/paytm/webhook` | Handles Paytm payment success webhook callback with idempotency guard |
| `GET` | `/api/paytm/check-status/{order_id}` | Polls payment status for an order ID |
| `POST` | `/api/paytm/simulate-payment` | Demo endpoint simulating Paytm webhook trigger |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.