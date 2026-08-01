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
from payments import router as payments_router

app = FastAPI(
    title="Apex AI - The Autonomous Race Engineer API",
    description="Multi-Agent F1 War Room API with Paytm Fintech Transaction Lifecycle (Order Creation, Webhooks, Idempotency, SHA256 Checksums, Real-time Status Polling).",
    version="2.1.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Paytm Payments APIRouter
app.include_router(payments_router)

class ChatRequest(BaseModel):
    prompt: str
    driver: Optional[str] = "Verstappen"
    pro_unlocked: Optional[bool] = False

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Apex AI Multi-Agent War Room API",
        "agents": ["Telemetry Analyst", "Vehicle Dynamics Engineer", "Race Strategist"],
        "paytm_fintech_flow": {
            "create_order": "/api/paytm/create-order",
            "webhook": "/api/paytm/webhook",
            "check_status": "/api/paytm/check-status/{order_id}",
            "simulate": "/api/paytm/simulate-payment"
        },
        "websocket": "/ws/agents"
    }

@app.get("/api/telemetry/{driver}/{lap}")
def get_telemetry_endpoint(driver: str, lap: str = "fastest"):
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

            async for frame in run_multi_agent_war_room_stream(prompt, driver, pro_unlocked):
                await websocket.send_json(frame)

    except WebSocketDisconnect:
        print("WebSocket client disconnected from /ws/agents.")
    except Exception as e:
        print(f"WebSocket error: {e}")

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
