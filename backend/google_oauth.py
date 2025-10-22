"""
Google OAuth Integration using Emergent Auth
"""

from fastapi import APIRouter, HTTPException, Header, Response, Request
from datetime import datetime, timezone, timedelta
from typing import Optional
import requests
import jwt
import os
import uuid

router = APIRouter(prefix="/api/auth", tags=["google_oauth"])

# Database connection
db = None

def set_database(database):
    global db
    db = database

SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
EMERGENT_SESSION_API = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

@router.post("/google/session")
async def process_google_session(
    response: Response,
    x_session_id: str = Header(..., alias="X-Session-ID")
):
    """
    Process Google OAuth session from Emergent Auth
    Called by frontend after redirect from Google login
    """
    
    try:
        # Get session data from Emergent
        headers = {"X-Session-ID": x_session_id}
        session_response = requests.get(EMERGENT_SESSION_API, headers=headers, timeout=10)
        
        if session_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session ID")
        
        session_data = session_response.json()
        
        # Extract user data
        user_email = session_data.get("email")
        user_name = session_data.get("name")
        user_picture = session_data.get("picture")
        session_token = session_data.get("session_token")
        
        if not user_email or not session_token:
            raise HTTPException(status_code=400, detail="Incomplete session data")
        
        # Check if user exists in database
        existing_user = await db.customers.find_one({"email": user_email})
        
        if not existing_user:
            # Create new customer
            customer = {
                "id": str(uuid.uuid4()),
                "email": user_email,
                "name": user_name,
                "profile_picture": user_picture,
                "auth_provider": "google",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.customers.insert_one(customer)
            user_id = customer["id"]
        else:
            user_id = existing_user["id"]
            # Don't update existing user data as per playbook
        
        # Store session in database with 7-day expiry
        session_expiry = datetime.now(timezone.utc) + timedelta(days=7)
        session_record = {
            "session_token": session_token,
            "user_id": user_id,
            "email": user_email,
            "expires_at": session_expiry.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Upsert session (replace if exists)
        await db.sessions.update_one(
            {"user_id": user_id},
            {"$set": session_record},
            upsert=True
        )
        
        # Create JWT token for backward compatibility
        jwt_token = jwt.encode(
            {
                "sub": user_id,
                "email": user_email,
                "exp": session_expiry
            },
            SECRET_KEY,
            algorithm="HS256"
        )
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,  # 7 days
            path="/"
        )
        
        return {
            "success": True,
            "user": {
                "id": user_id,
                "email": user_email,
                "name": user_name,
                "picture": user_picture
            },
            "access_token": jwt_token,
            "token_type": "bearer"
        }
        
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Auth service unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Session processing failed: {str(e)}")

@router.get("/session/verify")
async def verify_session(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Verify existing session from cookie or Authorization header
    """
    
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            # Try to decode JWT
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                user_id = payload.get("sub")
                
                # Get user from database
                user = await db.customers.find_one({"id": user_id})
                if user:
                    user.pop("_id", None)
                    return {"authenticated": True, "user": user}
            except:
                pass
        session_token = authorization.replace("Bearer ", "")
    
    if not session_token:
        raise HTTPException(status_code=401, detail="No session found")
    
    # Verify session in database
    session = await db.sessions.find_one({"session_token": session_token})
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = datetime.fromisoformat(session["expires_at"])
    if expires_at < datetime.now(timezone.utc):
        # Session expired
        await db.sessions.delete_one({"session_token": session_token})
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user data
    user = await db.customers.find_one({"id": session["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.pop("_id", None)
    
    return {
        "authenticated": True,
        "user": user
    }

@router.post("/logout")
async def logout(response: Response, request: Request):
    """
    Logout user - clear session
    """
    
    session_token = request.cookies.get("session_token")
    
    if session_token:
        # Delete session from database
        await db.sessions.delete_one({"session_token": session_token})
    
    # Clear cookie
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    
    return {"success": True, "message": "Logged out successfully"}
