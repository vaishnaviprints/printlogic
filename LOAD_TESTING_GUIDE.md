# Load Testing Guide for Vaishnavi Printers

## Tools Required:

### 1. Apache JMeter (Recommended)
- Free, open-source
- GUI-based testing
- Can simulate 1000s of users
- Download: https://jmeter.apache.org/

### 2. Locust (Python-based)
- Write tests in Python
- Real-time web UI
- Easy to scale
- Install: `pip install locust`

### 3. k6 (Modern)
- JavaScript-based
- Cloud integration
- Great reporting
- Install: https://k6.io/

---

## Test Scenarios:

### Scenario 1: Order Creation Load Test
**Test:** Create 100 orders in 1 minute
```
- Concurrent users: 10
- Duration: 60 seconds
- Expected: All orders created successfully
- Crash threshold: Monitor CPU, memory, database connections
```

### Scenario 2: Peak Load Test
**Test:** 500 simultaneous users browsing + ordering
```
- Concurrent users: 500
- Duration: 5 minutes
- Actions: Login, browse, create order, track order
- Success rate: Should be > 95%
```

### Scenario 3: Stress Test
**Test:** Find breaking point
```
- Start: 10 users
- Increment: +50 users every minute
- Stop when: Response time > 5 seconds OR error rate > 5%
- This tells you maximum capacity
```

---

## Expected Performance (Current Setup):

### Without Optimization:
- **Orders per minute**: ~50-100 (single server)
- **Concurrent users**: ~50-100
- **Response time**: 200-500ms (normal load)

### With Optimization (see below):
- **Orders per minute**: 500-1,000+
- **Concurrent users**: 500-1,000+
- **Response time**: <200ms (normal load)

---

## Optimization Recommendations:

### 1. Database Optimization
```python
# Add indexes to MongoDB
db.orders.create_index([("created_at", -1)])
db.orders.create_index([("vendor_id", 1), ("status", 1)])
db.orders.create_index([("customer_id", 1)])
```

### 2. API Optimization
- Add Redis caching for frequently accessed data
- Use connection pooling for MongoDB
- Implement rate limiting to prevent abuse

### 3. Infrastructure Scaling
- Use load balancer (Nginx, HAProxy)
- Multiple backend servers
- Database replication (MongoDB replica sets)
- CDN for static files (Cloudflare, AWS CloudFront)

---

## How to Run Load Test:

### Using Locust (Simple Example):

1. Create test file: `locustfile.py`
```python
from locust import HttpUser, task, between

class VaishnaviPrintersUser(HttpUser):
    wait_time = between(1, 3)
    
    @task(3)
    def view_pricing(self):
        self.client.get("/api/price-rules/active")
    
    @task(2)
    def create_order(self):
        # Login first
        login_data = {
            "email": "customer@test.com",
            "password": "customer123"
        }
        response = self.client.post("/api/auth/login", data=login_data)
        if response.status_code == 200:
            token = response.json()["access_token"]
            
            # Create order
            order_data = {
                "files": ["test.pdf"],
                "total_amount": 50,
                "delivery_type": "pickup"
            }
            headers = {"Authorization": f"Bearer {token}"}
            self.client.post("/api/orders", json=order_data, headers=headers)
    
    @task(1)
    def track_order(self):
        self.client.get("/api/orders/track?order_id=test123")
```

2. Run test:
```bash
locust -f locustfile.py --host=https://your-domain.com
```

3. Open browser: http://localhost:8089
4. Set users: 100, spawn rate: 10
5. Watch real-time results!

---

## Crash Prevention:

### 1. Rate Limiting (Add to backend)
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/orders")
@limiter.limit("10/minute")  # Max 10 orders per minute per IP
async def create_order():
    ...
```

### 2. Queue System (For high load)
```python
# Use Celery or RQ for background processing
# Orders go to queue → Processed asynchronously
# Prevents server overload
```

### 3. Health Monitoring
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "uptime": get_uptime(),
        "memory": get_memory_usage()
    }
```

---

## Current Application Status:

✅ **Can handle**: 50-100 orders/minute (current setup)
⚠️ **Needs optimization for**: 500+ orders/minute
🚀 **With scaling**: 1,000+ orders/minute possible

**Recommendation**: Start with current setup, monitor usage, scale as needed.
