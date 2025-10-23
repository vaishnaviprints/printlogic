# Production Deployment Guide - Vaishnavi Printers
## Deploy to Your Own Cloud (No Emergent Dependency)

---

## Stack Overview:

Your application uses:
- **Frontend**: React.js (Static files)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB

**✅ 100% Platform Independent - Deploy Anywhere!**

---

## Option 1: Cloud Hosting (Recommended) ☁️

### A. AWS (Amazon Web Services)

#### Frontend Deployment:
```bash
# Build React app
cd frontend
npm run build

# Upload to S3 + CloudFront
aws s3 sync build/ s3://vaishnavi-printers-frontend
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

**Cost**: ~$5-10/month (for small traffic)

#### Backend Deployment (EC2):
```bash
# Create EC2 instance (Ubuntu)
# SSH into server
ssh ubuntu@your-ec2-ip

# Install dependencies
sudo apt update
sudo apt install python3-pip nginx mongodb

# Clone your code
git clone https://github.com/your-repo/vaishnavi-printers.git
cd vaishnavi-printers/backend

# Install Python packages
pip3 install -r requirements.txt

# Setup systemd service (auto-restart)
sudo nano /etc/systemd/system/vaishnavi-backend.service
```

**Service file content:**
```ini
[Unit]
Description=Vaishnavi Printers Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/vaishnavi-printers/backend
Environment="PATH=/usr/bin:/usr/local/bin"
ExecStart=/usr/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl start vaishnavi-backend
sudo systemctl enable vaishnavi-backend
```

#### Nginx Configuration:
```nginx
server {
    listen 80;
    server_name vaishnaviprinters.com;

    # Frontend
    location / {
        root /var/www/vaishnavi-frontend;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Cost**: ~$20-50/month (t2.micro or t2.small)

#### Database (MongoDB Atlas):
```
1. Go to mongodb.com/atlas
2. Create free cluster (512MB free forever!)
3. Get connection string
4. Update .env file:
   MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/vaishnavi"
```

**Cost**: FREE (512MB) or $9/month (2GB)

---

### B. DigitalOcean (Simpler)

#### One-Click Setup:
```bash
# 1. Create Droplet (Ubuntu 22.04)
# 2. SSH into droplet
ssh root@your-droplet-ip

# 3. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 4. Create docker-compose.yml
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  frontend:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./frontend/build:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongo:27017
      - JWT_SECRET_KEY=your-secret-key-here
    depends_on:
      - mongo

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

```bash
# 5. Deploy
docker-compose up -d

# Done! Your app is running at: http://your-droplet-ip
```

**Cost**: $6-12/month (basic droplet)

---

### C. Azure (Microsoft)

#### App Service Deployment:
```bash
# 1. Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# 2. Login
az login

# 3. Create resource group
az group create --name VaishnaviPrinters --location eastus

# 4. Deploy backend
az webapp up --name vaishnavi-api --runtime "PYTHON:3.11"

# 5. Deploy frontend to Static Web App
az staticwebapp create --name vaishnavi-frontend --resource-group VaishnaviPrinters
```

**Cost**: ~$10-30/month

---

## Option 2: VPS Hosting (Budget-Friendly) 💰

### Recommended Providers:
1. **Hostinger** - $4/month (https://hostinger.com)
2. **Vultr** - $5/month (https://vultr.com)
3. **Linode** - $5/month (https://linode.com)
4. **Hetzner** - €4/month (https://hetzner.com)

### Setup Steps:

```bash
# 1. Order VPS with Ubuntu 22.04
# 2. SSH into server
ssh root@your-server-ip

# 3. Install requirements
apt update && apt upgrade -y
apt install python3-pip python3-venv nginx mongodb-server git -y

# 4. Clone your project
cd /var/www
git clone YOUR_REPO_URL vaishnavi-printers
cd vaishnavi-printers

# 5. Setup backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 6. Build frontend
cd ../frontend
npm install
npm run build

# 7. Configure Nginx (see AWS section above)

# 8. Setup SSL (Free)
apt install certbot python3-certbot-nginx -y
certbot --nginx -d vaishnaviprinters.com
```

**Cost**: $4-10/month

---

## Option 3: Traditional Shared Hosting (WordPress-like) 🌐

### If you have cPanel/Shared hosting:

**Problem**: Shared hosting doesn't support Python/FastAPI

**Solutions:**

#### A. Use PHP Backend (Rewrite)
- Convert FastAPI to PHP (Laravel/CodeIgniter)
- Uses: PHP + MySQL instead of Python + MongoDB
- **Not recommended** - needs complete rewrite

#### B. Hybrid Approach
- **Backend**: Deploy to Railway.app (FREE Python hosting)
- **Frontend + Database**: Your shared hosting
- **Cost**: FREE or $5/month

**Railway.app setup:**
```bash
# 1. Go to railway.app
# 2. Connect GitHub repo
# 3. Select /backend folder
# 4. Auto-deploys!
# 5. Get URL: https://your-app.railway.app
# 6. Update frontend .env:
#    REACT_APP_BACKEND_URL=https://your-app.railway.app
```

#### C. Serverless (Best for Shared Hosting Users)
- **Frontend**: Your cPanel hosting
- **Backend**: Vercel Serverless Functions (FREE)
- **Database**: MongoDB Atlas (FREE 512MB)

**Convert to Serverless:**
```python
# api/orders.py (Vercel function)
from fastapi import Request
from pymongo import MongoClient

client = MongoClient(os.environ['MONGO_URL'])
db = client['vaishnavi']

async def handler(request: Request):
    if request.method == 'POST':
        # Create order
        order = await request.json()
        db.orders.insert_one(order)
        return {"success": True}
```

---

## Complete Deployment Package (Docker) 🐳

### Dockerfile (Backend):
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Dockerfile (Frontend):
```dockerfile
FROM node:18 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Environment Variables (Production):

### Backend (.env):
```bash
# Database
MONGO_URL=mongodb://localhost:27017  # or MongoDB Atlas URL
DB_NAME=vaishnavi_printers_production

# Security
JWT_SECRET_KEY=CHANGE_THIS_TO_RANDOM_64_CHAR_STRING
CORS_ORIGINS=https://vaishnaviprinters.com

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-password

# SMS (Optional)
TWILIO_SID=your-twilio-sid
TWILIO_TOKEN=your-twilio-token
```

### Frontend (.env):
```bash
REACT_APP_BACKEND_URL=https://api.vaishnaviprinters.com
```

---

## DNS Configuration:

### Point your domain to server:

**A Records:**
```
@              A    YOUR_SERVER_IP
www            A    YOUR_SERVER_IP
api            A    YOUR_SERVER_IP
```

**Example:**
```
vaishnaviprinters.com        →  123.45.67.89
www.vaishnaviprinters.com    →  123.45.67.89
api.vaishnaviprinters.com    →  123.45.67.89
```

---

## Monitoring & Backups:

### 1. Uptime Monitoring (FREE):
- UptimeRobot: https://uptimerobot.com
- StatusCake: https://statuscake.com

### 2. Database Backups:
```bash
# Daily MongoDB backup
0 2 * * * mongodump --out /backups/$(date +\%Y-\%m-\%d)
```

### 3. Application Logs:
```bash
# View logs
sudo journalctl -u vaishnavi-backend -f
```

---

## Cost Summary:

### Budget Option ($10/month):
- VPS: $5/month (Vultr/Hetzner)
- MongoDB Atlas: FREE (512MB)
- Domain: $10/year
- SSL: FREE (Let's Encrypt)
- **Total: ~$10/month**

### Recommended Option ($25/month):
- DigitalOcean Droplet: $12/month
- MongoDB Atlas: $9/month (2GB)
- Domain: $10/year
- CloudFlare CDN: FREE
- **Total: ~$25/month**

### Premium Option ($50/month):
- AWS EC2 t2.small: $20/month
- AWS S3 + CloudFront: $5/month
- MongoDB Atlas: $15/month (5GB)
- Domain + SSL: $10/year
- Backup storage: $5/month
- **Total: ~$50/month**

---

## ✅ Conclusion:

**Your application is 100% independent!**
- No Emergent dependency
- Deploy to ANY cloud provider
- Full control over infrastructure
- No third-party redirects
- All data in YOUR database

**Recommended stack:**
- **Small business**: DigitalOcean + MongoDB Atlas ($15-20/month)
- **Growing business**: AWS + MongoDB Atlas ($30-50/month)
- **Enterprise**: Multi-region AWS with load balancing ($100+/month)
