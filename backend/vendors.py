from typing import List, Optional, Tuple
from models import Vendor, VendorLocation
import math

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates using Haversine formula (in km)"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return distance

async def find_nearest_vendor(customer_location: VendorLocation, vendors: List[Vendor], max_radius_km: float = 5.0) -> Optional[Tuple[Vendor, float]]:
    """Find nearest vendor within specified radius"""
    nearest_vendor = None
    nearest_distance = float('inf')
    
    for vendor in vendors:
        if not vendor.is_active:
            continue
        
        distance = calculate_distance(
            customer_location.latitude,
            customer_location.longitude,
            vendor.location.latitude,
            vendor.location.longitude
        )
        
        if distance <= max_radius_km and distance < nearest_distance:
            nearest_vendor = vendor
            nearest_distance = distance
    
    if nearest_vendor:
        return (nearest_vendor, nearest_distance)
    return None

async def auto_assign_vendor(customer_location: VendorLocation, vendors: List[Vendor]) -> dict:
    """Auto-assign vendor based on autoAcceptRadiusKm, with extended radius suggestions"""
    # Try to find vendor within their auto-accept radius
    for vendor in vendors:
        if not vendor.is_active:
            continue
        
        distance = calculate_distance(
            customer_location.latitude,
            customer_location.longitude,
            vendor.location.latitude,
            vendor.location.longitude
        )
        
        if distance <= vendor.autoAcceptRadiusKm:
            return {
                "status": "auto_assigned",
                "vendor": vendor,
                "distance_km": round(distance, 2)
            }
    
    # If no auto-assign, suggest extended radii
    result_5km = await find_nearest_vendor(customer_location, vendors, 5.0)
    result_10km = await find_nearest_vendor(customer_location, vendors, 10.0)
    
    suggestions = []
    if result_5km:
        suggestions.append({
            "radius_km": 5,
            "vendor": result_5km[0],
            "distance_km": round(result_5km[1], 2)
        })
    if result_10km and (not result_5km or result_10km[0].id != result_5km[0].id):
        suggestions.append({
            "radius_km": 10,
            "vendor": result_10km[0],
            "distance_km": round(result_10km[1], 2)
        })
    
    return {
        "status": "manual_selection_required",
        "suggestions": suggestions
    }
