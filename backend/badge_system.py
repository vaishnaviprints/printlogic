"""Badge and rewards system for vendors"""
from typing import Dict, Any
import json
from pathlib import Path

CONFIG_PATH = Path(__file__).parent / "config" / "badge_thresholds.json"

# Default badge thresholds
DEFAULT_THRESHOLDS = {
    "none": {"minSales": 0, "color": "#gray"},
    "bronze": {"minSales": 10, "color": "#CD7F32"},
    "silver": {"minSales": 50, "color": "#C0C0C0"},
    "gold": {"minSales": 200, "color": "#FFD700"},
    "diamond": {"minSales": 500, "color": "#B9F2FF"},
    "platinum": {"minSales": 1000, "color": "#E5E4E2"}
}

def load_badge_thresholds() -> Dict[str, Any]:
    """Load badge thresholds from config"""
    if not CONFIG_PATH.exists():
        save_badge_thresholds(DEFAULT_THRESHOLDS)
        return DEFAULT_THRESHOLDS
    
    with open(CONFIG_PATH, 'r') as f:
        return json.load(f)

def save_badge_thresholds(thresholds: Dict[str, Any]):
    """Save badge thresholds to config"""
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_PATH, 'w') as f:
        json.dump(thresholds, f, indent=2)

def calculate_badge(total_sales: int) -> str:
    """Calculate badge based on total sales"""
    thresholds = load_badge_thresholds()
    
    # Sort badges by minSales descending
    sorted_badges = sorted(
        thresholds.items(),
        key=lambda x: x[1]['minSales'],
        reverse=True
    )
    
    for badge_name, config in sorted_badges:
        if total_sales >= config['minSales']:
            return badge_name
    
    return "none"

def should_upgrade_badge(current_badge: str, total_sales: int) -> tuple[bool, str]:
    """Check if vendor should get a badge upgrade"""
    new_badge = calculate_badge(total_sales)
    
    badge_order = ["none", "bronze", "silver", "gold", "diamond", "platinum"]
    
    current_index = badge_order.index(current_badge) if current_badge in badge_order else 0
    new_index = badge_order.index(new_badge) if new_badge in badge_order else 0
    
    if new_index > current_index:
        return (True, new_badge)
    
    return (False, current_badge)

def generate_registration_number(year: int = None) -> str:
    """Generate vendor registration number"""
    from datetime import datetime
    import random
    
    if year is None:
        year = datetime.now().year
    
    # Generate 6-digit random number
    random_digits = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    return f"VP-VND-{year}{random_digits}"
