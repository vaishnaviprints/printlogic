"""
Content Management System (CMS)
Allows admin to edit page content from admin panel
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import os
from jose import jwt, JWTError

router = APIRouter(prefix="/api/admin", tags=["content_management"])

# Database connection
db = None

def set_database(database):
    global db
    db = database

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "vaishnavi_printers_secret_key_change_in_production")

def verify_admin(authorization: str = Header(None, alias="Authorization")):
    """Verify admin token from Authorization header"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header missing")
            
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header format")
        
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        admin_id = payload.get("sub")
        return {"id": admin_id}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


class PageContent(BaseModel):
    """Page content structure"""
    page_id: str  # home, about, contact, terms, privacy, etc.
    page_name: str  # Display name
    sections: Dict[str, Any]  # Key-value pairs of section_id: content
    meta: Optional[Dict[str, str]] = {}  # Meta info like page title, description


class PageContentUpdate(BaseModel):
    """Update page content"""
    page_id: str
    page_name: str
    sections: Dict[str, Any]
    meta: Optional[Dict[str, str]] = {}


# ============= GET ALL PAGES =============

@router.get("/content/pages", response_model=List[dict])
async def get_all_pages(token: dict = Depends(verify_admin)):
    """Get list of all pages"""
    pages = await db.page_content.find({}).to_list(length=None)
    
    result = []
    for page in pages:
        page.pop("_id", None)
        result.append({
            "page_id": page.get("page_id"),
            "page_name": page.get("page_name"),
            "last_updated": page.get("updated_at"),
            "sections_count": len(page.get("sections", {}))
        })
    
    return result


# ============= GET SPECIFIC PAGE CONTENT =============

@router.get("/content/pages/{page_id}", response_model=dict)
async def get_page_content(page_id: str, token: dict = Depends(verify_admin)):
    """Get content for a specific page"""
    page = await db.page_content.find_one({"page_id": page_id})
    
    if not page:
        raise HTTPException(status_code=404, detail=f"Page '{page_id}' not found")
    
    page.pop("_id", None)
    return page


# ============= UPDATE PAGE CONTENT =============

@router.put("/content/pages/{page_id}")
async def update_page_content(
    page_id: str,
    content: PageContentUpdate,
    token: dict = Depends(verify_admin)
):
    """Update page content"""
    
    if page_id != content.page_id:
        raise HTTPException(status_code=400, detail="Page ID mismatch")
    
    # Check if page exists
    existing_page = await db.page_content.find_one({"page_id": page_id})
    
    page_data = {
        "page_id": content.page_id,
        "page_name": content.page_name,
        "sections": content.sections,
        "meta": content.meta or {},
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": token["id"]
    }
    
    if existing_page:
        # Update existing page
        await db.page_content.update_one(
            {"page_id": page_id},
            {"$set": page_data}
        )
        
        # Log audit trail
        audit_log = {
            "id": f"audit_{datetime.now(timezone.utc).timestamp()}",
            "entity_type": "page_content",
            "entity_id": page_id,
            "action": "update",
            "performed_by": token["id"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "changes": {
                "page_name": content.page_name,
                "sections_updated": list(content.sections.keys())
            }
        }
        await db.audit_logs.insert_one(audit_log)
        
        return {"success": True, "message": f"Page '{content.page_name}' updated successfully"}
    else:
        # Create new page
        page_data["created_at"] = datetime.now(timezone.utc).isoformat()
        page_data["created_by"] = token["id"]
        
        await db.page_content.insert_one(page_data)
        
        return {"success": True, "message": f"Page '{content.page_name}' created successfully"}


# ============= DELETE PAGE =============

@router.delete("/content/pages/{page_id}")
async def delete_page(page_id: str, token: dict = Depends(verify_admin)):
    """Delete a page (only custom pages, not system pages)"""
    
    # Protect system pages
    system_pages = ["home", "about", "contact", "pricing", "terms", "privacy"]
    if page_id in system_pages:
        raise HTTPException(status_code=403, detail=f"Cannot delete system page '{page_id}'")
    
    result = await db.page_content.delete_one({"page_id": page_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Log audit trail
    audit_log = {
        "id": f"audit_{datetime.now(timezone.utc).timestamp()}",
        "entity_type": "page_content",
        "entity_id": page_id,
        "action": "delete",
        "performed_by": token["id"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_logs.insert_one(audit_log)
    
    return {"success": True, "message": "Page deleted successfully"}


# ============= PUBLIC API (NO AUTH) =============

@router.get("/public/content/pages/{page_id}", response_model=dict)
async def get_public_page_content(page_id: str):
    """Get page content for public frontend (no authentication required)"""
    page = await db.page_content.find_one({"page_id": page_id})
    
    if not page:
        # Return empty structure if page not found
        return {
            "page_id": page_id,
            "page_name": page_id.title(),
            "sections": {},
            "meta": {}
        }
    
    page.pop("_id", None)
    # Remove sensitive fields
    page.pop("created_by", None)
    page.pop("updated_by", None)
    
    return page


# ============= INITIALIZE DEFAULT PAGES =============

@router.post("/content/initialize")
async def initialize_default_pages(token: dict = Depends(verify_admin)):
    """Initialize default page content (run once)"""
    
    default_pages = [
        {
            "page_id": "home",
            "page_name": "Home Page",
            "sections": {
                "hero_title": "Professional Printing Services in Hyderabad",
                "hero_subtitle": "Fast, Reliable, and Affordable Printing for All Your Needs",
                "hero_cta": "Upload & Print Now",
                "features_title": "Why Choose Vaishnavi Printers?",
                "feature_1_title": "Fast Delivery",
                "feature_1_text": "Get your prints delivered within 24 hours",
                "feature_2_title": "Quality Printing",
                "feature_2_text": "High-quality prints with vibrant colors",
                "feature_3_title": "Affordable Prices",
                "feature_3_text": "Competitive pricing with no hidden charges",
                "feature_4_title": "Easy Ordering",
                "feature_4_text": "Upload files and order in just a few clicks"
            },
            "meta": {
                "title": "Vaishnavi Printers - Professional Printing Services",
                "description": "Fast and reliable printing services in Hyderabad"
            }
        },
        {
            "page_id": "about",
            "page_name": "About Us",
            "sections": {
                "hero_title": "About Vaishnavi Printers",
                "hero_subtitle": "Your Trusted Printing Partner Since 2010",
                "story_title": "Our Story",
                "story_text": "Vaishnavi Printers was founded in 2010 with a mission to provide high-quality, affordable printing services to students, businesses, and individuals. Over the years, we have grown to become one of the most trusted printing services in Hyderabad.",
                "mission_title": "Our Mission",
                "mission_text": "To deliver exceptional printing services with a focus on quality, speed, and customer satisfaction.",
                "stats_orders": "10,000+",
                "stats_orders_label": "Orders Completed",
                "stats_customers": "5,000+",
                "stats_customers_label": "Happy Customers",
                "stats_experience": "15",
                "stats_experience_label": "Years of Experience",
                "stats_locations": "3",
                "stats_locations_label": "Store Locations"
            },
            "meta": {
                "title": "About Us - Vaishnavi Printers",
                "description": "Learn more about Vaishnavi Printers and our commitment to quality"
            }
        },
        {
            "page_id": "contact",
            "page_name": "Contact Us",
            "sections": {
                "hero_title": "Contact Us",
                "hero_subtitle": "We're here to help! Reach out to us anytime.",
                "address_title": "Our Address",
                "address_line1": "Vaishnavi Printers",
                "address_line2": "MG Road, Hyderabad",
                "address_line3": "Telangana - 500001",
                "phone_title": "Phone",
                "phone": "+91 98765 43210",
                "email_title": "Email",
                "email": "info@vaishnaviprinters.com",
                "hours_title": "Business Hours",
                "hours": "Mon - Sat: 9:00 AM - 9:00 PM"
            },
            "meta": {
                "title": "Contact Us - Vaishnavi Printers",
                "description": "Get in touch with Vaishnavi Printers"
            }
        },
        {
            "page_id": "terms",
            "page_name": "Terms & Conditions",
            "sections": {
                "title": "Terms & Conditions",
                "intro": "Please read these terms and conditions carefully before using our service.",
                "section_1_title": "1. Acceptance of Terms",
                "section_1_text": "By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.",
                "section_2_title": "2. Use License",
                "section_2_text": "Permission is granted to temporarily download one copy of the materials on Vaishnavi Printers' website for personal, non-commercial transitory viewing only.",
                "section_3_title": "3. Pricing & Payment",
                "section_3_text": "All prices are subject to change without notice. Payment must be made at the time of order placement.",
                "section_4_title": "4. Delivery",
                "section_4_text": "We strive to deliver your orders on time. However, delivery times are estimates and not guaranteed.",
                "section_5_title": "5. Cancellation & Refund",
                "section_5_text": "Orders can be cancelled within 1 hour of placement. Refunds will be processed within 7 business days."
            },
            "meta": {
                "title": "Terms & Conditions - Vaishnavi Printers",
                "description": "Terms and conditions for using Vaishnavi Printers services"
            }
        }
    ]
    
    created_count = 0
    for page in default_pages:
        # Check if page already exists
        existing = await db.page_content.find_one({"page_id": page["page_id"]})
        if not existing:
            page["created_at"] = datetime.now(timezone.utc).isoformat()
            page["updated_at"] = datetime.now(timezone.utc).isoformat()
            page["created_by"] = token["id"]
            page["updated_by"] = token["id"]
            
            await db.page_content.insert_one(page)
            created_count += 1
    
    return {
        "success": True,
        "message": f"Initialized {created_count} default pages"
    }
