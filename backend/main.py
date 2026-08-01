import os
import sys
import json
import asyncio

# Ensure backend directory is in sys.path for direct module resolution
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from data_pipeline import get_driver_telemetry, generate_ghost_lap
from inference import analyze_mistakes
from ai_agent import run_multi_agent_war_room_stream, run_apex_race_engineer_agent
from payments import create_paytm_order, process_paytm_webhook, check_payment_status

app = FastAPI(
    title="Apex AI - The Autonomous Race Engineer API",
    description="Multi-Agent F1 War Room backend (Telemetry Analyst, Vehicle Dynamics, Race Strategist) with WebSocket real-time thought streaming & Paytm gateway.",
    version="2.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    prompt: str
    driver: Optional[str] = "Verstappen"
    pro_unlocked: Optional[bool] = False

class WebhookRequest(BaseModel):
    order_id: str
    amount: Optional[float] = 49.0
    status: Optional[str] = "TXN_SUCCESS"

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Apex AI Multi-Agent War Room API",
        "agents": ["Telemetry Analyst", "Vehicle Dynamics Engineer", "Race Strategist"],
        "websocket": "/ws/agents"
    }

@app.get("/api/telemetry/{driver}/{lap}")
def get_telemetry_endpoint(driver: str, lap: str = "fastest"):
    """
    Returns driver_lap, ghost_lap, combined telemetry array, and ML corner mistakes.
    """
    try:
        df_driver = get_driver_telemetry(driver, lap)
        df_ghost = generate_ghost_lap()
        mistakes = analyze_mistakes(df_driver)

        driver_lap_records = []
        for _, row in df_driver.iterrows():
            driver_lap_records.append({
                "distance": int(row["Distance"]),
                "speed": float(row["Speed"]),
                "throttle": float(row["Throttle"]),
                "brake": float(row["Brake"]),
                "gear": int(row["Gear"]),
            })

        ghost_lap_records = []
        for _, row in df_ghost.iterrows():
            ghost_lap_records.append({
                "distance": int(row["Distance"]),
                "speed": float(row["Speed"]),
                "throttle": float(row["Throttle"]),
                "brake": float(row["Brake"]),
                "gear": int(row["Gear"]),
            })

        telemetry_combined = []
        for i in range(min(len(driver_lap_records), len(ghost_lap_records))):
            telemetry_combined.append({
                "distance": driver_lap_records[i]["distance"],
                "driverSpeed": driver_lap_records[i]["speed"],
                "aiOptimalSpeed": ghost_lap_records[i]["speed"],
                "throttle": driver_lap_records[i]["throttle"],
                "brake": driver_lap_records[i]["brake"],
                "gear": driver_lap_records[i]["gear"],
            })

        return {
            "driver": driver,
            "lap": lap,
            "driver_lap": driver_lap_records,
            "ghost_lap": ghost_lap_records,
            "telemetry": telemetry_combined,
            "mistakes": mistakes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/agents")
async def websocket_multi_agent_endpoint(websocket: WebSocket):
    """
    WebSocket Endpoint (/ws/agents):
    Streams the 'thought process' of Telemetry Analyst, Vehicle Dynamics Engineer,
    and Race Strategist in real-time to the frontend.
    """
    await websocket.accept()
    try:
        while True:
            raw_msg = await websocket.receive_text()
            try:
                data = json.loads(raw_msg)
            except Exception:
                data = {"prompt": raw_msg}

            prompt = data.get("prompt", "Analyze my lap")
            driver = data.get("driver", "Verstappen")
            pro_unlocked = data.get("pro_unlocked", False)

            # Stream each agent step in real-time
            async for frame in run_multi_agent_war_room_stream(prompt, driver, pro_unlocked):
                await websocket.send_json(frame)

    except WebSocketDisconnect:
        print("WebSocket client disconnected from /ws/agents.")
    except Exception as e:
        print(f"WebSocket error: {e}")

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    """
    Standard HTTP POST chat endpoint routing through Multi-Agent War Room.
    """
    try:
        ai_response = run_apex_race_engineer_agent(
            prompt=req.prompt,
            driver=req.driver or "Verstappen",
            pro_unlocked=req.pro_unlocked or False
        )
        return {
            "prompt": req.prompt,
            "response": ai_response,
            "pro_unlocked": req.pro_unlocked
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/paytm/create_order")
def create_paytm_order_endpoint():
    order = create_paytm_order(amount=49.0)
    return order

@app.post("/api/paytm/webhook")
def paytm_webhook_endpoint(req: WebhookRequest):
    res = process_paytm_webhook(req.order_id, req.status or "TXN_SUCCESS")
    return res

@app.get("/api/paytm/status/{order_id}")
def paytm_status_endpoint(order_id: str):
    status = check_payment_status(order_id)
    return status

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
