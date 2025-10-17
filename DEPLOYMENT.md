# Deployment Guide: SIMULATED → LIVE

This guide walks through transitioning from SIMULATED mode to LIVE production deployment.

---

## Prerequisites

- [ ] AWS account with S3 bucket created
- [ ] Payment gateway account (Razorpay/PayU/PayTM)
- [ ] WhatsApp Business API access (optional)
- [ ] Production MongoDB instance
- [ ] Production domain with SSL

---

## Step 1: Payment Gateway Setup

### Option A: Razorpay

1. **Create Account**: https://razorpay.com
2. **Get API Keys**:
   - Login to Dashboard
   - Go to Settings → API Keys
   - Generate Test Keys (for staging)
   - Generate Live Keys (for production)

3. **Update Config**:
   ```bash
   cd /app/backend/config
   nano payment_gateways.json
   ```

   ```json
   {
     "gateways": [
       {
         "id": "razorpay",
         "enabled": true,
         "sandboxKeyId": "rzp_test_ABC123",
         "sandboxKeySecret": "secret_test_XYZ789",
         "prodKeyId": "rzp_live_ABC123",
         "prodKeySecret": "secret_live_XYZ789",
         "webhookSecret": "webhook_secret_123"
       }
     ],
     "activeGateway": "razorpay",
     "mode": "LIVE"
   }
   ```

4. **Configure Webhook**:
   - Add webhook URL: `https://your-domain.com/api/webhooks/payment/razorpay`
   - Select events: `payment.captured`, `payment.failed`

### Option B: PayU

1. **Create Account**: https://payu.in
2. **Get Credentials**: Merchant Key, Merchant Salt
3. Update `payment_gateways.json` with PayU credentials

---

## Step 2: AWS S3 Setup

### 2.1 Create S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://vaishnavi-printers-prod --region ap-south-1

# Enable CORS
aws s3api put-bucket-cors --bucket vaishnavi-printers-prod --cors-configuration file://cors.json
```

**cors.json**:
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["PUT", "GET", "HEAD"],
      "AllowedOrigins": ["https://your-domain.com"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 2.2 Create IAM User

```bash
# Create user
aws iam create-user --user-name vaishnavi-s3-user

# Attach policy
aws iam attach-user-policy --user-name vaishnavi-s3-user --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create access keys
aws iam create-access-key --user-name vaishnavi-s3-user
```

### 2.3 Update Environment Variables

```bash
cd /app/backend
nano .env
```

Add:
```bash
USE_S3=true
S3_BUCKET=vaishnavi-printers-prod
S3_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

---

## Step 3: WhatsApp Notifications (Optional)

### 3.1 Meta WhatsApp Business API

1. **Setup**: https://developers.facebook.com/docs/whatsapp
2. **Get Credentials**:
   - Phone Number ID
   - Access Token
   - Verify Token (for webhook)

3. **Update notifications.py**:

   ```python
   # In backend/notifications.py
   WHATSAPP_PHONE_ID = os.environ.get('WHATSAPP_PHONE_ID')
   WHATSAPP_TOKEN = os.environ.get('WHATSAPP_TOKEN')
   ```

4. **Add to .env**:
   ```bash
   WHATSAPP_PHONE_ID=123456789
   WHATSAPP_TOKEN=EAAabc...
   NOTIFICATION_MODE=LIVE
   ```

---

## Step 4: Production Database

### 4.1 MongoDB Atlas Setup

1. **Create Cluster**: https://cloud.mongodb.com
2. **Get Connection String**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/vaishnavi_prod
   ```

3. **Update .env**:
   ```bash
   MONGO_URL=mongodb+srv://...
   DB_NAME=vaishnavi_prod
   ```

### 4.2 Seed Production Data

```bash
cd /app/backend
python seed_data.py
```

---

## Step 5: Security Hardening

### 5.1 Update JWT Secret

```bash
# Generate strong secret
openssl rand -hex 32

# Add to .env
JWT_SECRET_KEY=<generated_secret>
```

### 5.2 CORS Configuration

```bash
# In backend/.env
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### 5.3 Rate Limiting (Optional)

Add to `server.py`:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/orders")
@limiter.limit("10/minute")
async def create_order(request: Request, ...):
    ...
```

---

## Step 6: Deployment

### 6.1 Update Frontend .env

```bash
cd /app/frontend
nano .env
```

```bash
REACT_APP_BACKEND_URL=https://api.your-domain.com
```

### 6.2 Build Frontend

```bash
cd /app/frontend
yarn build
```

### 6.3 Deploy Backend

**Using Docker**:
```dockerfile
# Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/ .
RUN pip install -r requirements.txt
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

```bash
docker build -t vaishnavi-backend .
docker run -d -p 8001:8001 --env-file .env vaishnavi-backend
```

### 6.4 Deploy Frontend

**Using Nginx**:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /app/frontend/build;
        try_files $uri /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Step 7: Testing in Production

### 7.1 Health Check

```bash
curl https://api.your-domain.com/api/health
# Expected: {"status":"healthy"}
```

### 7.2 Test Payment Flow

1. Create test order
2. Verify payment session created with LIVE keys
3. Use test card: 4111 1111 1111 1111 (Razorpay)
4. Confirm webhook received and order updated

### 7.3 Test S3 Upload

1. Upload file via frontend
2. Verify file appears in S3 bucket
3. Confirm signed URLs work

---

## Step 8: Monitoring Setup

### 8.1 Application Logs

**Using systemd**:
```bash
# View logs
journalctl -u vaishnavi-backend -f
```

### 8.2 Error Tracking (Optional)

**Sentry Integration**:
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="https://...",
    integrations=[FastApiIntegration()],
)
```

### 8.3 Uptime Monitoring

- UptimeRobot: https://uptimerobot.com
- Monitor: `https://api.your-domain.com/api/health`

---

## Step 9: Backup Strategy

### 9.1 MongoDB Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
mongodump --uri="$MONGO_URL" --out=/backups/$DATE
aws s3 cp /backups/$DATE s3://vaishnavi-backups/$DATE --recursive
```

### 9.2 S3 Versioning

```bash
aws s3api put-bucket-versioning \
    --bucket vaishnavi-printers-prod \
    --versioning-configuration Status=Enabled
```

---

## Troubleshooting

### Issue: Payment webhook not received

**Solution**:
1. Check webhook URL is publicly accessible
2. Verify webhook secret matches
3. Check payment gateway dashboard for webhook logs

### Issue: S3 upload fails

**Solution**:
1. Verify IAM user has S3 permissions
2. Check CORS configuration
3. Ensure signed URL not expired

### Issue: Orders stuck in "Payment Pending"

**Solution**:
1. Check payment gateway mode is LIVE
2. Verify webhook endpoint receiving calls
3. Check signature verification passing

---

## Rollback Plan

### Emergency Rollback to SIMULATED Mode

```bash
cd /app/backend/config

# Update payment_gateways.json
{
  "mode": "SIMULATED"
}

# Restart backend
sudo supervisorctl restart backend
```

---

## Production Checklist

- [ ] Payment gateway configured and tested
- [ ] S3 bucket created and CORS configured
- [ ] Production MongoDB cluster running
- [ ] SSL certificate installed
- [ ] Environment variables updated
- [ ] Frontend built and deployed
- [ ] Backend deployed
- [ ] Webhooks configured and verified
- [ ] Health checks passing
- [ ] Test order completed successfully
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Error tracking configured
- [ ] Rollback plan documented

---

## Post-Deployment

### Week 1:
- Monitor error rates
- Check payment success rates
- Verify webhook delivery
- Review application logs

### Month 1:
- Performance optimization
- Scaling if needed
- User feedback incorporation
- Security audit

---

**Need Help?** Email: tech@vaishnavi.com
