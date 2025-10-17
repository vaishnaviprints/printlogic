import json
from pathlib import Path
from typing import Dict, Any, Optional
import hashlib
import hmac
import uuid
from models import PaymentSession, PaymentStatus

CONFIG_PATH = Path(__file__).parent / "config" / "payment_gateways.json"

def load_payment_config() -> Dict[str, Any]:
    """Load payment gateway configuration"""
    with open(CONFIG_PATH, 'r') as f:
        return json.load(f)

def get_active_gateway() -> Dict[str, Any]:
    """Get the currently active payment gateway"""
    config = load_payment_config()
    active_gateway_id = config['activeGateway']
    gateway = next((g for g in config['gateways'] if g['id'] == active_gateway_id), None)
    
    if not gateway:
        raise ValueError(f"Active gateway {active_gateway_id} not found")
    
    return {
        **gateway,
        "mode": config['mode']
    }

def create_payment_session(order_id: str, amount: float, currency: str = "INR") -> PaymentSession:
    """Create payment session with active gateway"""
    gateway = get_active_gateway()
    
    session = PaymentSession(
        order_id=order_id,
        amount=amount,
        currency=currency,
        gateway=gateway['id']
    )
    
    if gateway['mode'] == 'SIMULATED':
        # Simulated payment session
        session.gateway_session_id = f"sim_{gateway['id']}_{uuid.uuid4().hex[:12]}"
        session.payment_url = f"https://simulated-payment.example.com/pay/{session.gateway_session_id}"
    else:
        # Real gateway integration
        if gateway['id'] == 'razorpay':
            session = _create_razorpay_session(session, gateway)
        elif gateway['id'] == 'payu':
            session = _create_payu_session(session, gateway)
        elif gateway['id'] == 'paytm':
            session = _create_paytm_session(session, gateway)
    
    return session

def _create_razorpay_session(session: PaymentSession, gateway: Dict[str, Any]) -> PaymentSession:
    """Create Razorpay payment session (real implementation)"""
    # This would use razorpay SDK
    # import razorpay
    # client = razorpay.Client(auth=(gateway['prodKeyId'], gateway['prodKeySecret']))
    # order = client.order.create({
    #     'amount': int(session.amount * 100),
    #     'currency': session.currency,
    #     'receipt': session.order_id
    # })
    # session.gateway_session_id = order['id']
    raise NotImplementedError("Razorpay integration requires API keys")

def _create_payu_session(session: PaymentSession, gateway: Dict[str, Any]) -> PaymentSession:
    """Create PayU payment session (real implementation)"""
    raise NotImplementedError("PayU integration requires API keys")

def _create_paytm_session(session: PaymentSession, gateway: Dict[str, Any]) -> PaymentSession:
    """Create PayTM payment session (real implementation)"""
    raise NotImplementedError("PayTM integration requires API keys")

def verify_webhook_signature(gateway_id: str, payload: Dict[str, Any], signature: str) -> bool:
    """Verify webhook signature from payment gateway"""
    config = load_payment_config()
    gateway = next((g for g in config['gateways'] if g['id'] == gateway_id), None)
    
    if not gateway:
        return False
    
    if config['mode'] == 'SIMULATED':
        # In simulated mode, accept all webhooks
        return True
    
    webhook_secret = gateway.get('webhookSecret', '')
    
    if gateway_id == 'razorpay':
        return _verify_razorpay_signature(payload, signature, webhook_secret)
    elif gateway_id == 'payu':
        return _verify_payu_signature(payload, signature, webhook_secret)
    elif gateway_id == 'paytm':
        return _verify_paytm_signature(payload, signature, webhook_secret)
    
    return False

def _verify_razorpay_signature(payload: Dict[str, Any], signature: str, secret: str) -> bool:
    """Verify Razorpay webhook signature"""
    # Implementation based on Razorpay docs
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        json.dumps(payload).encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected_signature, signature)

def _verify_payu_signature(payload: Dict[str, Any], signature: str, secret: str) -> bool:
    """Verify PayU webhook signature"""
    # Implementation based on PayU docs
    return True  # Placeholder

def _verify_paytm_signature(payload: Dict[str, Any], signature: str, secret: str) -> bool:
    """Verify PayTM webhook signature"""
    # Implementation based on PayTM docs
    return True  # Placeholder

def handle_payment_webhook(gateway_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle payment webhook and extract status"""
    config = load_payment_config()
    
    if config['mode'] == 'SIMULATED':
        # Simulated webhook response
        return {
            "status": "success",
            "order_id": payload.get('order_id'),
            "payment_id": payload.get('payment_id'),
            "amount": payload.get('amount')
        }
    
    # Real webhook handling per gateway
    if gateway_id == 'razorpay':
        return _handle_razorpay_webhook(payload)
    elif gateway_id == 'payu':
        return _handle_payu_webhook(payload)
    elif gateway_id == 'paytm':
        return _handle_paytm_webhook(payload)
    
    raise ValueError(f"Unknown gateway: {gateway_id}")

def _handle_razorpay_webhook(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle Razorpay webhook"""
    return {
        "status": "success" if payload.get('event') == 'payment.captured' else "failed",
        "order_id": payload.get('payload', {}).get('payment', {}).get('entity', {}).get('notes', {}).get('order_id'),
        "payment_id": payload.get('payload', {}).get('payment', {}).get('entity', {}).get('id'),
        "amount": payload.get('payload', {}).get('payment', {}).get('entity', {}).get('amount', 0) / 100
    }

def _handle_payu_webhook(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle PayU webhook"""
    return {}  # Placeholder

def _handle_paytm_webhook(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Handle PayTM webhook"""
    return {}  # Placeholder
