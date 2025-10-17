import pytest
from backend.vendors import calculate_distance, find_nearest_vendor, auto_assign_vendor
from backend.models import Vendor, VendorLocation

def test_distance_calculation():
    """Test distance calculation between coordinates"""
    # Distance between Bangalore MG Road and Hebbal (approx 7.2 km)
    distance = calculate_distance(12.9716, 77.5946, 13.0358, 77.5970)
    assert 7.0 < distance < 7.5

@pytest.mark.asyncio
async def test_find_nearest_vendor():
    """Test finding nearest vendor"""
    customer_location = VendorLocation(
        latitude=12.9716,
        longitude=77.5946,
        address="Test Location",
        city="Bangalore",
        pincode="560001"
    )
    
    vendors = [
        Vendor(
            id="v1",
            name="Vendor 1",
            location=VendorLocation(
                latitude=12.9716,
                longitude=77.5946,
                address="Same location",
                city="Bangalore",
                pincode="560001"
            ),
            contact_phone="1234567890",
            contact_email="v1@test.com",
            autoAcceptRadiusKm=5.0,
            is_active=True
        ),
        Vendor(
            id="v2",
            name="Vendor 2",
            location=VendorLocation(
                latitude=13.0358,
                longitude=77.5970,
                address="Far location",
                city="Bangalore",
                pincode="560024"
            ),
            contact_phone="1234567891",
            contact_email="v2@test.com",
            autoAcceptRadiusKm=5.0,
            is_active=True
        )
    ]
    
    result = await find_nearest_vendor(customer_location, vendors, max_radius_km=10.0)
    
    assert result is not None
    assert result[0].id == "v1"  # Nearest vendor
    assert result[1] < 0.01  # Distance should be very small

@pytest.mark.asyncio
async def test_auto_assign_within_radius():
    """Test auto-assignment when vendor is within radius"""
    customer_location = VendorLocation(
        latitude=12.9716,
        longitude=77.5946,
        address="Test Location",
        city="Bangalore",
        pincode="560001"
    )
    
    vendors = [
        Vendor(
            id="v1",
            name="Vendor 1",
            location=VendorLocation(
                latitude=12.9750,  # Very close
                longitude=77.5950,
                address="Nearby location",
                city="Bangalore",
                pincode="560001"
            ),
            contact_phone="1234567890",
            contact_email="v1@test.com",
            autoAcceptRadiusKm=5.0,
            is_active=True
        )
    ]
    
    result = await auto_assign_vendor(customer_location, vendors)
    
    assert result['status'] == 'auto_assigned'
    assert result['vendor'].id == 'v1'
    assert result['distance_km'] < 5.0

@pytest.mark.asyncio
async def test_auto_assign_manual_selection():
    """Test manual selection required when no vendor in auto-accept radius"""
    customer_location = VendorLocation(
        latitude=12.9716,
        longitude=77.5946,
        address="Test Location",
        city="Bangalore",
        pincode="560001"
    )
    
    vendors = [
        Vendor(
            id="v1",
            name="Vendor 1",
            location=VendorLocation(
                latitude=13.0358,  # ~7km away
                longitude=77.5970,
                address="Far location",
                city="Bangalore",
                pincode="560024"
            ),
            contact_phone="1234567890",
            contact_email="v1@test.com",
            autoAcceptRadiusKm=5.0,  # Less than actual distance
            is_active=True
        )
    ]
    
    result = await auto_assign_vendor(customer_location, vendors)
    
    assert result['status'] == 'manual_selection_required'
    assert 'suggestions' in result
    assert len(result['suggestions']) > 0
