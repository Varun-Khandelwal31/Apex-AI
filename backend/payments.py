import time
import uuid
import hashlib
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

router = APIRouter()

# Mock Fintech Database for Transaction States & Idempotency Logs
PAYMENTS_DB: Dict[str, Dict[str, Any]] = {}
PROCESSED_WEBHOOKS: set = set()

# Secret Key for HMAC Checksum / Signature Generation
PAYTM_MERCHANT_KEY = "paytm_apex_ai_secret_key_2024"

class CreateOrderRequest(BaseModel):
    user_id: Optional[str] = "user_driver_01"
    product_id: Optional[str] = "ai_custom_setup"
    amount: Optional[float] = 49.00

class WebhookPayload(BaseModel):
    order_id: str
    status: str  # "SUCCESS" or "FAIL"
    signature: Optional[str] = None
    txn_id: Optional[str] = None

class SimulatePaymentRequest(BaseModel):
    order_id: str

def generate_checksum_signature(order_id: str, amount: float, status: str = "PENDING") -> str:
    raw_str = f"{order_id}|{amount:.2f}|{status}|{PAYTM_MERCHANT_KEY}"
    return hashlib.sha256(raw_str.encode()).hexdigest()

# 1. ORDER CREATION ENDPOINT
@router.post("/api/paytm/create-order")
def create_order(req: CreateOrderRequest):
    """
    Step 1: Backend generates unique order_id, calculates signature checksum,
    and initializes transaction state in PAYMENTS_DB before showing QR code.
    """
    order_id = f"ORDER_{uuid.uuid4().hex[:10].upper()}"
    amount = req.amount or 49.00
    signature = generate_checksum_signature(order_id, amount, "PENDING")
    
    upi_uri = f"upi://pay?pa=apexai.paytm@paytm&pn=ApexAI%20Pro&tr={order_id}&am={amount:.2f}&cu=INR&tn=Apex%20AI%20Pro%20Setup%20Pass"

    PAYMENTS_DB[order_id] = {
        "order_id": order_id,
        "user_id": req.user_id or "user_driver_01",
        "product_id": req.product_id or "ai_custom_setup",
        "amount": amount,
        "currency": "INR",
        "status": "PENDING",
        "created_at": time.time(),
        "signature": signature,
        "pro_unlocked": False
    }

    return {
        "order_id": order_id,
        "amount": amount,
        "currency": "INR",
        "qr_code": upi_uri,
        "signature": signature,
        "status": "PENDING"
    }

# 2. WEBHOOK HANDLING & IDEMPOTENCY ENDPOINT
@router.post("/api/paytm/webhook")
def paytm_webhook(payload: WebhookPayload):
    """
    Step 2: Backend Webhook Receiver from Paytm.
    Includes Idempotency Guard & Signature Security Verification.
    """
    order_id = payload.order_id
    status_upper = payload.status.upper()

    if order_id not in PAYMENTS_DB:
        raise HTTPException(status_code=404, detail="Order ID not found")

    order = PAYMENTS_DB[order_id]

    # Security: Signature Verification
    expected_sig = generate_checksum_signature(order_id, order["amount"], "PENDING")
    if payload.signature and payload.signature != expected_sig:
        raise HTTPException(status_code=400, detail="Invalid Paytm signature checksum")

    # Idempotency Guard: Prevents double processing if webhook triggers multiple times
    if order_id in PROCESSED_WEBHOOKS or order["status"] == "SUCCESS":
        print(f"Idempotency Notice: Webhook for {order_id} already processed successfully. Skipping.")
        return {
            "status": "OK",
            "message": "Webhook already processed (Idempotent execution)",
            "order_id": order_id,
            "order_status": order["status"]
        }

    # Update Transaction State
    order["status"] = status_upper
    order["updated_at"] = time.time()
    order["txn_id"] = payload.txn_id or f"TXN_{uuid.uuid4().hex[:8].upper()}"

    if status_upper == "SUCCESS":
        order["pro_unlocked"] = True
        PROCESSED_WEBHOOKS.add(order_id)

    return {
        "status": "OK",
        "order_id": order_id,
        "order_status": status_upper,
        "pro_unlocked": order["pro_unlocked"]
    }

# 3. STATUS VERIFICATION / POLLING ENDPOINT
@router.get("/api/paytm/check-status/{order_id}")
def check_status(order_id: str):
    """
    Step 3: Frontend polls this endpoint to securely check payment state.
    """
    if order_id not in PAYMENTS_DB:
        return {"status": "NOT_FOUND", "pro_unlocked": False}
    
    order = PAYMENTS_DB[order_id]
    return {
        "order_id": order["order_id"],
        "user_id": order["user_id"],
        "product_id": order["product_id"],
        "amount": order["amount"],
        "status": order["status"],
        "pro_unlocked": order["pro_unlocked"],
        "signature": order["signature"],
        "txn_id": order.get("txn_id")
    }

# 4. SIMULATION ENABLER FOR DEMO
@router.post("/api/paytm/simulate-payment")
def simulate_payment(req: SimulatePaymentRequest):
    """
    Simulates real Paytm webhook payment trigger for demo runs.
    """
    order_id = req.order_id
    if order_id not in PAYMENTS_DB:
        # Auto-create if direct mock trigger
        create_order(CreateOrderRequest(user_id="user_driver_01", product_id="ai_custom_setup"))

    order = PAYMENTS_DB.get(order_id)
    sig = order["signature"] if order else generate_checksum_signature(order_id, 49.00, "PENDING")

    # Trigger webhook internally
    webhook_res = paytm_webhook(WebhookPayload(
        order_id=order_id,
        status="SUCCESS",
        signature=sig,
        txn_id=f"TXN_{uuid.uuid4().hex[:8].upper()}"
    ))

    return webhook_res
