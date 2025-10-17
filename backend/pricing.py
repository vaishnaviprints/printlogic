import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from models import PriceRule, OrderItem, EstimateRequest, EstimateResponse
import math

CONFIG_PATH = Path(__file__).parent / "config" / "price_rules.json"

def load_price_rules() -> List[PriceRule]:
    """Load price rules from config file"""
    with open(CONFIG_PATH, 'r') as f:
        data = json.load(f)
    return [PriceRule(**rule) for rule in data['rules']]

def get_active_price_rule() -> Optional[PriceRule]:
    """Get the currently active price rule"""
    rules = load_price_rules()
    now = datetime.now(timezone.utc)
    
    for rule in rules:
        if not rule.active:
            continue
        
        effective_from = rule.effectiveFrom if isinstance(rule.effectiveFrom, datetime) else datetime.fromisoformat(rule.effectiveFrom)
        if effective_from > now:
            continue
            
        if rule.effectiveTo:
            effective_to = rule.effectiveTo if isinstance(rule.effectiveTo, datetime) else datetime.fromisoformat(rule.effectiveTo)
            if effective_to < now:
                continue
        
        return rule
    
    return None

def calculate_item_price(item: OrderItem, price_rule: PriceRule) -> float:
    """Calculate price for a single item with applied pricing"""
    # Find paper type
    paper_type = next((pt for pt in price_rule.paperTypes if pt.id == item.paper_type_id), None)
    if not paper_type:
        raise ValueError(f"Paper type {item.paper_type_id} not found")
    
    # Calculate per-page price
    per_page_price = paper_type.perPage_color if item.is_color else paper_type.perPage_bw
    item.perPagePriceApplied = per_page_price
    
    # Calculate pages cost
    pages_cost = item.num_pages * item.num_copies * per_page_price
    
    # Add lamination cost
    lamination_cost = item.lamination_sheets * price_rule.lamination['perSheet']
    
    # Add binding cost
    binding_cost = price_rule.binding.get(item.binding_type, 0.0)
    
    # Calculate item subtotal
    item.itemSubtotal = pages_cost + lamination_cost + binding_cost
    
    return item.itemSubtotal

def calculate_delivery_charge(distance_km: float, items_total: float, price_rule: PriceRule) -> float:
    """Calculate delivery charge based on distance and order total"""
    delivery_config = price_rule.deliveryCharge
    
    # Free delivery above threshold
    if items_total >= delivery_config.get('freeAbove', float('inf')):
        return 0.0
    
    # Calculate distance-based charge
    base_rate = delivery_config.get('baseRate', 0.0)
    per_km_rate = delivery_config.get('perKmRate', 0.0)
    
    return base_rate + (distance_km * per_km_rate)

def calculate_estimate(request: EstimateRequest) -> EstimateResponse:
    """Calculate complete estimate with breakdown"""
    price_rule = get_active_price_rule()
    if not price_rule:
        raise ValueError("No active price rule found")
    
    # Calculate each item
    items_total = 0.0
    breakdown = []
    
    for item in request.items:
        item_total = calculate_item_price(item, price_rule)
        items_total += item_total
        
        # Find paper type name
        paper_type = next((pt for pt in price_rule.paperTypes if pt.id == item.paper_type_id), None)
        
        breakdown.append({
            "file_name": item.file_name,
            "paper_type": paper_type.name if paper_type else item.paper_type_id,
            "pages": item.num_pages,
            "copies": item.num_copies,
            "color": "Color" if item.is_color else "B&W",
            "per_page_price": item.perPagePriceApplied,
            "lamination_sheets": item.lamination_sheets,
            "binding": item.binding_type,
            "subtotal": item.itemSubtotal
        })
    
    # Calculate delivery charge
    delivery_charge = 0.0
    if request.fulfillment_type.value == "Delivery" and request.customer_location:
        # For now, assume 5km distance (will be calculated with actual vendor)
        delivery_charge = calculate_delivery_charge(5.0, items_total, price_rule)
    
    total = items_total + delivery_charge
    
    return EstimateResponse(
        items_total=round(items_total, 2),
        delivery_charge=round(delivery_charge, 2),
        total=round(total, 2),
        breakdown=breakdown,
        applied_rule_id=price_rule.id
    )

def save_price_rules(rules: List[PriceRule]):
    """Save price rules back to config file"""
    data = {"rules": [rule.model_dump() for rule in rules]}
    with open(CONFIG_PATH, 'w') as f:
        json.dump(data, f, indent=2, default=str)
