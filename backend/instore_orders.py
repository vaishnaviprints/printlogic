"""
In-Store Order Processing for Vaishnavi Printers
Includes: File upload with configurations, PDF watermarking, Print job routing
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
import os
import json
from datetime import datetime, timezone
import uuid
from enhanced_models import InStoreOrder, FileConfiguration
import boto3
from pathlib import Path

router = APIRouter(prefix="/api/orders", tags=["instore"])

# Database connection
db = None

def set_database(database):
    global db
    db = database

# File storage (S3 or local)
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/create-instore", response_model=dict)
async def create_instore_order(
    files: List[UploadFile] = File(...),
    file_configs: List[str] = Form(...),  # JSON strings
    order_data: str = Form(...)  # JSON string
):
    """
    Create in-store order with multiple files and individual configurations
    """
    
    try:
        # Parse order data
        order_dict = json.loads(order_data)
        
        # Parse file configs
        configs = [json.loads(config) for config in file_configs]
        
        # Generate order ID
        order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        
        # Save uploaded files
        file_urls = []
        for idx, file in enumerate(files):
            # Create unique filename
            file_ext = Path(file.filename).suffix
            unique_filename = f"{order_id}_{idx}{file_ext}"
            file_path = UPLOAD_DIR / unique_filename
            
            # Save file
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            file_urls.append(str(file_path))
        
        # Create file configurations
        file_configurations = []
        for config in configs:
            file_config = FileConfiguration(**config)
            file_configurations.append(file_config)
        
        # Create order
        order = InStoreOrder(
            id=order_id,
            customer_email=order_dict.get("customer_email"),
            customer_name=order_dict.get("customer_name", "Walk-in Customer"),
            customer_phone=order_dict.get("customer_phone"),
            file_configs=file_configurations,
            file_urls=file_urls,
            delivery_type=order_dict.get("deliveryType", "pickup"),
            delivery_address=order_dict.get("deliveryAddress"),
            payment_method=order_dict.get("paymentMethod", "cash"),
            payment_status=order_dict.get("paymentStatus", "pending"),
            estimate=order_dict.get("estimate", {}),
            total_amount=order_dict["estimate"]["total"],
            status="pending" if order_dict.get("paymentMethod") == "cash" else "paid"
        )
        
        # Insert into database
        await db.instore_orders.insert_one(order.model_dump())
        
        # If payment is completed, add to print queue
        if order.payment_status == "paid":
            await add_to_print_queue(order)
        
        return {
            "success": True,
            "order_id": order_id,
            "status": order.status,
            "payment_status": order.payment_status,
            "message": "Order created successfully"
        }
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON data: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")

async def add_to_print_queue(order: InStoreOrder):
    """
    Add order to print queue for processing
    This will be picked up by the print client
    """
    
    print_job = {
        "id": str(uuid.uuid4()),
        "order_id": order.id,
        "files": order.file_urls,
        "configs": [config.model_dump() for config in order.file_configs],
        "total_amount": order.total_amount,
        "needs_watermark": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "queued"
    }
    
    await db.print_queue.insert_one(print_job)
    
    return print_job["id"]

@router.get("/instore/pending", response_model=List[dict])
async def get_pending_instore_orders():
    """
    Get all pending in-store orders (for admin approval)
    Used by system tray/popup
    """
    
    orders = await db.instore_orders.find({
        "payment_status": "pending"
    }).sort("created_at", -1).to_list(length=None)
    
    for order in orders:
        order["_id"] = str(order["_id"])
    
    return orders

@router.get("/instore/active", response_model=List[dict])
async def get_active_instore_orders():
    """
    Get all active in-store orders (paid, printing, or ready)
    Used by system tray/popup
    """
    
    orders = await db.instore_orders.find({
        "status": {"$in": ["paid", "printing", "ready"]}
    }).sort("created_at", -1).to_list(length=None)
    
    for order in orders:
        order["_id"] = str(order["_id"])
    
    return orders

@router.post("/instore/{order_id}/approve", response_model=dict)
async def approve_cash_payment(order_id: str):
    """
    Admin approves cash payment and sends order to print queue
    """
    
    order = await db.instore_orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["payment_status"] != "pending":
        raise HTTPException(status_code=400, detail="Order payment already processed")
    
    # Update order
    await db.instore_orders.update_one(
        {"id": order_id},
        {"$set": {
            "payment_status": "paid",
            "status": "paid",
            "payment_approved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Add to print queue
    order_obj = InStoreOrder(**order)
    await add_to_print_queue(order_obj)
    
    return {
        "success": True,
        "message": "Payment approved, order sent to printing"
    }

@router.get("/print-queue", response_model=List[dict])
async def get_print_queue():
    """
    Get current print queue
    Used by print client to fetch jobs
    """
    
    jobs = await db.print_queue.find({
        "status": {"$in": ["queued", "processing"]}
    }).sort("created_at", 1).to_list(length=None)
    
    for job in jobs:
        job["_id"] = str(job["_id"])
    
    return jobs

@router.post("/print-queue/{job_id}/complete", response_model=dict)
async def complete_print_job(job_id: str):
    """
    Mark print job as completed
    Called by print client after successful printing
    """
    
    result = await db.print_queue.update_one(
        {"id": job_id},
        {"$set": {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Print job not found")
    
    # Also update the order status
    job = await db.print_queue.find_one({"id": job_id})
    if job:
        await db.instore_orders.update_one(
            {"id": job["order_id"]},
            {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    return {"success": True, "message": "Print job completed"}
