import socketio
from typing import Dict, Set
import logging

logger = logging.getLogger(__name__)

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',  # Restrict in production
    logger=True,
    engineio_logger=True
)

# Track connected vendors
connected_vendors: Dict[str, str] = {}  # vendor_id -> sid
vendor_unread_counts: Dict[str, int] = {}  # vendor_id -> count

@sio.event
async def connect(sid, environ, auth):
    """Handle vendor connection"""
    logger.info(f"Client connected: {sid}")
    
    # Extract vendor_id from auth
    if auth and 'vendor_id' in auth:
        vendor_id = auth['vendor_id']
        connected_vendors[vendor_id] = sid
        logger.info(f"Vendor {vendor_id} connected with sid {sid}")
        
        # Send current unread count
        unread_count = vendor_unread_counts.get(vendor_id, 0)
        await sio.emit('notification_count', {'count': unread_count}, room=sid)

@sio.event
async def disconnect(sid):
    """Handle vendor disconnect"""
    logger.info(f"Client disconnected: {sid}")
    
    # Remove from connected vendors
    vendor_id = None
    for vid, vsid in connected_vendors.items():
        if vsid == sid:
            vendor_id = vid
            break
    
    if vendor_id:
        del connected_vendors[vendor_id]
        logger.info(f"Vendor {vendor_id} disconnected")

@sio.event
async def mark_read(sid, data):
    """Mark notifications as read"""
    vendor_id = None
    for vid, vsid in connected_vendors.items():
        if vsid == sid:
            vendor_id = vid
            break
    
    if vendor_id:
        vendor_unread_counts[vendor_id] = 0
        await sio.emit('notification_count', {'count': 0}, room=sid)

async def notify_vendor(vendor_id: str, event_type: str, payload: dict):
    """Send notification to specific vendor"""
    if vendor_id in connected_vendors:
        sid = connected_vendors[vendor_id]
        
        # Increment unread count
        vendor_unread_counts[vendor_id] = vendor_unread_counts.get(vendor_id, 0) + 1
        
        # Send notification
        notification = {
            'type': event_type,
            'data': payload,
            'timestamp': payload.get('createdAt')
        }
        
        await sio.emit('notification', notification, room=sid)
        await sio.emit('notification_count', {'count': vendor_unread_counts[vendor_id]}, room=sid)
        
        logger.info(f"Notification sent to vendor {vendor_id}: {event_type}")
        return True
    else:
        logger.info(f"Vendor {vendor_id} not connected, notification queued")
        # Queue notification for later (in production, use Redis)
        vendor_unread_counts[vendor_id] = vendor_unread_counts.get(vendor_id, 0) + 1
        return False

async def notify_all_vendors(event_type: str, payload: dict):
    """Broadcast notification to all connected vendors"""
    notification = {
        'type': event_type,
        'data': payload,
        'timestamp': payload.get('createdAt')
    }
    await sio.emit('notification', notification)
    logger.info(f"Broadcast notification: {event_type}")
