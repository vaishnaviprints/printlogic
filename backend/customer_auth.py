from fastapi import HTTPException, status
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
import os
import random
import string

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "vaishnavi_printers_secret_key_change_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days for customers

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OTP storage (in-memory for SIMULATED mode, use Redis in production)
otp_store = {}

def generate_otp():
    """Generate 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

def send_otp_sms(mobile: str, otp: str):
    """Send OTP via SMS (simulated)"""
    # In SIMULATED mode, just log
    print(f"[SIMULATED SMS] To: {mobile} | OTP: {otp}")
    return True

def store_otp(mobile: str, otp: str):
    """Store OTP with expiry (5 minutes)"""
    otp_store[mobile] = {
        'otp': otp,
        'expires_at': datetime.now(timezone.utc) + timedelta(minutes=5)
    }

def verify_otp(mobile: str, otp: str) -> bool:
    """Verify OTP"""
    if mobile not in otp_store:
        return False
    
    stored = otp_store[mobile]
    if datetime.now(timezone.utc) > stored['expires_at']:
        del otp_store[mobile]
        return False
    
    if stored['otp'] == otp:
        del otp_store[mobile]
        return True
    
    return False

def create_customer_token(customer_id: str, email: str, mobile: str) -> str:
    """Create JWT token for customer"""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": customer_id,
        "email": email,
        "mobile": mobile,
        "type": "customer",
        "exp": expire
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
