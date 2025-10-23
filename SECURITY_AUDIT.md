# Security Audit Report - Vaishnavi Printers Application

## Current Security Status: ⚠️ NEEDS IMPROVEMENTS

---

## ✅ What's Already Secure:

### 1. **Authentication**
- ✅ JWT tokens for API authentication
- ✅ Passwords hashed with bcrypt
- ✅ Separate auth for Admin, Vendor, Customer
- ✅ Token expiration (24 hours)

### 2. **Database**
- ✅ MongoDB (NoSQL - No SQL injection risk)
- ✅ UUID-based IDs (not sequential integers)
- ✅ Connection via environment variables

### 3. **API Design**
- ✅ RESTful endpoints
- ✅ CORS configured
- ✅ Audit logging for important actions

---

## ⚠️ Security Issues Found & Fixes Needed:

### 1. **Rate Limiting** ❌
**Issue**: No protection against brute force attacks
**Risk**: HIGH
**Impact**: Attacker can try unlimited login attempts

**Fix Required:**
```python
# Add to backend/server.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add to login endpoints
@app.post("/api/auth/login")
@limiter.limit("5/minute")  # Max 5 login attempts per minute
async def login(request: Request, email: str = Form(...), password: str = Form(...)):
    ...

@app.post("/api/orders")
@limiter.limit("10/minute")  # Max 10 orders per minute
async def create_order(request: Request, ...):
    ...
```

**Installation:**
```bash
pip install slowapi
```

---

### 2. **Input Validation** ⚠️
**Issue**: Insufficient validation on user inputs
**Risk**: MEDIUM-HIGH
**Impact**: XSS attacks, data corruption

**Current Issues:**
```python
# Example: No validation
@app.post("/api/orders")
async def create_order(data: dict):  # ❌ Accepts any dict
    await db.orders.insert_one(data)  # ❌ Directly inserts
```

**Fix Required:**
```python
from pydantic import BaseModel, validator, EmailStr, constr
from typing import List, Optional
import re

class OrderCreate(BaseModel):
    customer_name: constr(min_length=2, max_length=100)  # ✅ Length validation
    email: EmailStr  # ✅ Email validation
    phone: constr(regex=r'^\+?[1-9]\d{9,14}$')  # ✅ Phone validation
    total_amount: float
    files: List[str]
    
    @validator('total_amount')
    def validate_amount(cls, v):
        if v < 0 or v > 1000000:
            raise ValueError('Invalid amount')
        return v
    
    @validator('files')
    def validate_files(cls, v):
        if not v or len(v) > 10:
            raise ValueError('1-10 files required')
        return v

@app.post("/api/orders")
async def create_order(order: OrderCreate):  # ✅ Validated model
    ...
```

---

### 3. **XSS Protection** ⚠️
**Issue**: User content not sanitized before display
**Risk**: MEDIUM
**Impact**: Script injection in comments, names, etc.

**Fix Required:**
```bash
# Frontend: Install DOMPurify
npm install dompurify
```

```javascript
// Frontend: Sanitize user content
import DOMPurify from 'dompurify';

// Before displaying user content
const cleanContent = DOMPurify.sanitize(userContent);
return <div dangerouslySetInnerHTML={{ __html: cleanContent }} />;
```

```python
# Backend: HTML escape
from html import escape

@app.post("/api/reviews")
async def create_review(content: str):
    safe_content = escape(content)  # ✅ Escapes <script> tags
    await db.reviews.insert_one({"content": safe_content})
```

---

### 4. **File Upload Security** ❌
**Issue**: No file type validation
**Risk**: HIGH
**Impact**: Malicious file uploads (viruses, scripts)

**Fix Required:**
```python
from fastapi import UploadFile, File
import magic  # File type detection
from pathlib import Path

ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.txt', '.jpg', '.png'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    # 1. Check file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "Invalid file type")
    
    # 2. Check file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large")
    
    # 3. Verify actual file type (not just extension)
    file_type = magic.from_buffer(contents, mime=True)
    if 'pdf' not in file_type and 'image' not in file_type:
        raise HTTPException(400, "Invalid file content")
    
    # 4. Scan for viruses (Optional - use ClamAV)
    # scan_result = scan_file(contents)
    
    # 5. Generate safe filename
    safe_filename = f"{uuid.uuid4()}{file_ext}"
    
    # 6. Save to secure location (outside web root)
    file_path = f"/secure/uploads/{safe_filename}"
    with open(file_path, 'wb') as f:
        f.write(contents)
    
    return {"filename": safe_filename}
```

**Installation:**
```bash
pip install python-magic
```

---

### 5. **HTTPS/SSL** ❌
**Issue**: No SSL certificate in production
**Risk**: HIGH
**Impact**: Data transmitted in plain text (passwords, credit cards)

**Fix Required:**
```bash
# Install Certbot (Let's Encrypt - FREE SSL)
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d vaishnaviprinters.com -d www.vaishnaviprinters.com

# Auto-renewal (already configured)
sudo systemctl status certbot.timer
```

**Nginx configuration:**
```nginx
server {
    listen 443 ssl http2;
    server_name vaishnaviprinters.com;
    
    ssl_certificate /etc/letsencrypt/live/vaishnaviprinters.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vaishnaviprinters.com/privkey.pem;
    
    # Strong SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # HSTS (force HTTPS)
    add_header Strict-Transport-Security "max-age=31536000" always;
    
    ...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name vaishnaviprinters.com;
    return 301 https://$server_name$request_uri;
}
```

---

### 6. **CSRF Protection** ⚠️
**Issue**: No CSRF tokens
**Risk**: MEDIUM
**Impact**: Cross-site request forgery

**Fix Required:**
```python
from fastapi_csrf_protect import CsrfProtect
from pydantic import BaseModel

class CsrfSettings(BaseModel):
    secret_key: str = "your-csrf-secret-key"

@CsrfProtect.load_config
def get_csrf_config():
    return CsrfSettings()

@app.post("/api/orders")
async def create_order(csrf_protect: CsrfProtect = Depends()):
    await csrf_protect.validate_csrf(request)
    ...
```

---

### 7. **Secrets in Code** ❌
**Issue**: Hardcoded secrets in some places
**Risk**: HIGH
**Impact**: If code leaked, attacker gets all secrets

**Found Issues:**
```python
# ❌ BAD
SECRET_KEY = "vaishnavi_printers_secret_key_change_in_production"
```

**Fix:**
```python
# ✅ GOOD - Always use environment variables
SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY not set!")
```

**Production .env:**
```bash
# Generate strong random keys
JWT_SECRET_KEY=$(openssl rand -hex 32)
CSRF_SECRET=$(openssl rand -hex 32)
DATABASE_PASSWORD=$(openssl rand -base64 24)
```

---

### 8. **Database Security** ⚠️
**Issue**: MongoDB accessible without authentication
**Risk**: HIGH (if exposed to internet)

**Fix Required:**
```bash
# Enable MongoDB authentication
mongo
> use admin
> db.createUser({
    user: "vaishnavi_admin",
    pwd: "STRONG_PASSWORD_HERE",
    roles: ["readWriteAnyDatabase"]
  })

# Edit /etc/mongod.conf
security:
  authorization: enabled
```

**Update connection string:**
```python
MONGO_URL = "mongodb://vaishnavi_admin:password@localhost:27017/?authSource=admin"
```

---

### 9. **Error Messages** ⚠️
**Issue**: Detailed error messages leaked to users
**Risk**: LOW-MEDIUM
**Impact**: Information disclosure

**Current:**
```python
except Exception as e:
    return {"error": str(e)}  # ❌ Leaks internal details
```

**Fix:**
```python
import logging

logger = logging.getLogger(__name__)

try:
    ...
except ValueError as e:
    # User-friendly error
    raise HTTPException(400, "Invalid input")
except Exception as e:
    # Log detailed error (server-side only)
    logger.error(f"Unexpected error: {e}", exc_info=True)
    # Generic error to user
    raise HTTPException(500, "Internal server error")
```

---

### 10. **API Key Exposure** ⚠️
**Issue**: Frontend .env files in Git
**Risk**: MEDIUM

**Fix:**
```bash
# .gitignore (add if missing)
.env
.env.local
.env.production
.env.*

# Never commit .env files!
```

---

## 🛡️ Additional Security Measures:

### 1. **Security Headers**
```python
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)
```

### 2. **Input Sanitization**
```bash
pip install bleach
```

```python
import bleach

def sanitize_html(text: str) -> str:
    """Remove dangerous HTML tags"""
    allowed_tags = ['b', 'i', 'u', 'em', 'strong', 'p', 'br']
    return bleach.clean(text, tags=allowed_tags, strip=True)
```

### 3. **Password Policy**
```python
from pydantic import validator
import re

class UserRegister(BaseModel):
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain number')
        return v
```

### 4. **Logging & Monitoring**
```python
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    filename='/var/log/vaishnavi/app.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Log security events
@app.post("/api/auth/login")
async def login(request: Request, ...):
    logger.info(f"Login attempt from {request.client.host} for {email}")
    ...
```

---

## 📋 Security Checklist for Production:

### Pre-Deployment:
- [ ] Change all default passwords
- [ ] Generate strong random JWT secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure rate limiting
- [ ] Add input validation
- [ ] Sanitize user content
- [ ] Validate file uploads
- [ ] Enable MongoDB authentication
- [ ] Add security headers
- [ ] Remove debug mode
- [ ] Set up error logging
- [ ] Configure CORS properly
- [ ] Add CSRF protection
- [ ] Review all API endpoints
- [ ] Test with security scanner (OWASP ZAP)

### Post-Deployment:
- [ ] Monitor logs daily
- [ ] Set up uptime monitoring
- [ ] Configure automated backups
- [ ] Test backup restoration
- [ ] Schedule security updates
- [ ] Review access logs weekly
- [ ] Perform penetration testing
- [ ] Keep dependencies updated

---

## 🔧 Quick Security Fixes Package:

```bash
# Install all security packages
pip install slowapi python-magic bleach pydantic[email]
```

---

## ⚠️ CRITICAL: Before Going Live

**MUST DO:**
1. ✅ Enable HTTPS (SSL Certificate)
2. ✅ Change all default passwords
3. ✅ Add rate limiting
4. ✅ Validate all file uploads
5. ✅ Enable MongoDB authentication

**RECOMMENDED:**
6. Add CSRF protection
7. Implement input validation
8. Set up monitoring
9. Configure backups
10. Security scan with OWASP ZAP

---

## 🎯 Current Risk Level:

**Without Fixes**: ⚠️ MEDIUM-HIGH RISK
**With Fixes Applied**: ✅ LOW RISK

**Recommendation**: Apply critical fixes before production deployment.
