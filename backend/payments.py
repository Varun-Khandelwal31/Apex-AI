import time
import random
from typing import Dict, Any

# Mock Paytm memory order store
ORDER_STORE: Dict[str, Dict[str, Any]] = {}

def create_paytm_order(amount: float = 49.0) -> Dict[str, Any]:
    order_id = f"PAYTM_APEX_{int(time.time())}_{random.randint(1000, 9999)}"
    upi_uri = f"upi://pay?pa=apexai.paytm@paytm&pn=ApexAI%20Pro&tr={order_id}&am={amount:.2f}&cu=INR&tn=Apex%20AI%20Pro%20Engineer%20Pass"

    ORDER_STORE[order_id] = {
        'order_id': order_id,
        'amount': amount,
        'status': 'PENDING',
        'created_at': time.time(),
        'pro_unlocked': False
    }

    return {
        'order_id': order_id,
        'amount': amount,
        'upi_uri': upi_uri,
        'currency': 'INR',
        'merchant': 'Apex AI Motorsports',
        'status': 'PENDING'
    }

def process_paytm_webhook(order_id: str, status: str = 'TXN_SUCCESS') -> Dict[str, Any]:
    if order_id in ORDER_STORE:
        ORDER_STORE[order_id]['status'] = status
        ORDER_STORE[order_id]['pro_unlocked'] = (status == 'TXN_SUCCESS')
    else:
        ORDER_STORE[order_id] = {
            'order_id': order_id,
            'amount': 49.0,
            'status': status,
            'created_at': time.time(),
            'pro_unlocked': (status == 'TXN_SUCCESS')
        }

    return {
        'order_id': order_id,
        'status': status,
        'pro_unlocked': True,
        'pro_token': f"PRO_TOKEN_{order_id}",
        'message': 'Paytm transaction confirmed. Apex Pro AI unlocked.'
    }

def check_payment_status(order_id: str) -> Dict[str, Any]:
    if order_id in ORDER_STORE:
        return ORDER_STORE[order_id]
    
    # Auto success simulation for demo order ID
    return {
        'order_id': order_id,
        'status': 'TXN_SUCCESS',
        'pro_unlocked': True,
        'pro_token': f"PRO_TOKEN_{order_id}"
    }
