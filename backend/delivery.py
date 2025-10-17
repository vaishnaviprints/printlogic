import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from models import VendorLocation
import math
import uuid

CONFIG_PATH = Path(__file__).parent / "config" / "delivery_partners.json"

def load_delivery_partners() -> List[Dict[str, Any]]:
    """Load delivery partners from config"""
    with open(CONFIG_PATH, 'r') as f:
        data = json.load(f)
    return data['partners']

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates (in km)"""
    R = 6371
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def get_delivery_quotes(pickup_location: VendorLocation, delivery_location: VendorLocation) -> List[Dict[str, Any]]:
    """Get delivery quotes from all enabled partners (simulated)"""
    partners = load_delivery_partners()
    distance_km = calculate_distance(
        pickup_location.latitude,
        pickup_location.longitude,
        delivery_location.latitude,
        delivery_location.longitude
    )
    
    quotes = []
    for partner in partners:
        if not partner['enabled']:
            continue
        
        if distance_km > partner['maxDistanceKm']:
            continue
        
        # Calculate quote
        cost = max(
            partner['baseRate'] + (distance_km * partner['perKmRate']),
            partner['minCharge']
        )
        
        quotes.append({
            "partner_id": partner['id'],
            "partner_name": partner['name'],
            "cost": round(cost, 2),
            "estimated_time_minutes": partner['estimatedTimeMinutes'],
            "distance_km": round(distance_km, 2),
            "mode": partner['mode']
        })
    
    # Sort by cost (cheapest first)
    quotes.sort(key=lambda x: x['cost'])
    return quotes

def select_cheapest_partner(quotes: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Select the cheapest available partner"""
    if not quotes:
        return None
    return quotes[0]

def book_delivery(partner_id: str, order_id: str, pickup_location: VendorLocation, delivery_location: VendorLocation) -> Dict[str, Any]:
    """Book delivery with selected partner (simulated)"""
    partners = load_delivery_partners()
    partner = next((p for p in partners if p['id'] == partner_id), None)
    
    if not partner:
        raise ValueError(f"Partner {partner_id} not found")
    
    if partner['mode'] == 'SIMULATED':
        # Simulated booking
        tracking_id = f"{partner_id}_{uuid.uuid4().hex[:8]}"
        return {
            "status": "booked",
            "tracking_id": tracking_id,
            "partner_id": partner_id,
            "partner_name": partner['name'],
            "estimated_delivery_time_minutes": partner['estimatedTimeMinutes'],
            "mode": "SIMULATED"
        }
    else:
        # Real integration would go here
        raise NotImplementedError(f"LIVE mode not implemented for {partner_id}")

def simulate_delivery_status_update(tracking_id: str) -> str:
    """Simulate delivery status update (for webhook simulation)"""
    # In real implementation, this would be called by partner webhooks
    statuses = ["Assigned", "PickedUp", "InTransit", "NearDelivery", "Delivered"]
    import random
    return random.choice(statuses)
