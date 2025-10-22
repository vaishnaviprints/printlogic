"""
Pricing Manager - Admin endpoint to update pricing rules
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
import json
from pathlib import Path
from datetime import datetime, timezone

router = APIRouter(prefix="/api/admin", tags=["pricing_manager"])

# Database connection
db = None

def set_database(database):
    global db
    db = database

PRICE_RULES_FILE = Path("/app/backend/config/price_rules.json")

@router.put("/pricing/{rule_id}")
async def update_pricing_rule(rule_id: str, rule_data: Dict[str, Any]):
    """
    Update a pricing rule and save to price_rules.json
    Also log to audit trail
    """
    try:
        # Read current rules
        with open(PRICE_RULES_FILE, 'r') as f:
            data = json.load(f)
        
        # Find and update the rule
        rule_found = False
        for i, rule in enumerate(data['rules']):
            if rule['id'] == rule_id:
                data['rules'][i] = rule_data
                rule_found = True
                break
        
        if not rule_found:
            raise HTTPException(status_code=404, detail="Pricing rule not found")
        
        # Save back to file
        with open(PRICE_RULES_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        
        # Log to audit trail
        audit_log = {
            "id": f"audit_{datetime.now(timezone.utc).timestamp()}",
            "entity_type": "pricing",
            "entity_id": rule_id,
            "action": "update",
            "changes": rule_data,
            "performed_by": "admin",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.audit_logs.insert_one(audit_log)
        
        return {
            "success": True,
            "message": "Pricing rule updated successfully",
            "rule": rule_data
        }
    
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Price rules file not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid price rules file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update pricing: {str(e)}")

@router.get("/pricing-public")
async def get_public_pricing():
    """
    Get pricing for public display (customer view)
    Returns simplified pricing structure
    """
    try:
        with open(PRICE_RULES_FILE, 'r') as f:
            data = json.load(f)
        
        # Find active rule
        active_rule = next((r for r in data['rules'] if r.get('active', False)), None)
        
        if not active_rule:
            raise HTTPException(status_code=404, detail="No active pricing rule found")
        
        # Simplify for public view
        public_pricing = {
            "paper_types": [
                {
                    "name": pt["name"],
                    "bw_price": pt["perPage_bw"],
                    "color_price": pt["perPage_color"]
                }
                for pt in active_rule.get("paperTypes", [])
            ],
            "binding": active_rule.get("binding", {}),
            "lamination": active_rule.get("lamination", {}),
            "delivery": active_rule.get("deliveryCharge", {})
        }
        
        return public_pricing
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get pricing: {str(e)}")
