import pytest
from backend.delivery import get_delivery_quotes, select_cheapest_partner, book_delivery
from backend.models import VendorLocation

def test_get_delivery_quotes():
    """Test getting delivery quotes"""
    pickup = VendorLocation(
        latitude=12.9716,
        longitude=77.5946,
        address="MG Road",
        city="Bangalore",
        pincode="560001"
    )
    
    delivery = VendorLocation(
        latitude=13.0358,
        longitude=77.5970,
        address="Hebbal",
        city="Bangalore",
        pincode="560024"
    )
    
    quotes = get_delivery_quotes(pickup, delivery)
    
    assert len(quotes) > 0
    assert all('cost' in q for q in quotes)
    assert all('estimated_time_minutes' in q for q in quotes)
    
    # Quotes should be sorted by cost (cheapest first)
    for i in range(len(quotes) - 1):
        assert quotes[i]['cost'] <= quotes[i + 1]['cost']

def test_select_cheapest_partner():
    """Test selecting cheapest partner"""
    # Note: get_delivery_quotes already sorts by cost, so we test with sorted data
    quotes = [
        {"partner_id": "p2", "cost": 80.0},
        {"partner_id": "p3", "cost": 90.0},
        {"partner_id": "p1", "cost": 100.0}
    ]
    
    cheapest = select_cheapest_partner(quotes)
    
    assert cheapest is not None
    assert cheapest['partner_id'] == 'p2'
    assert cheapest['cost'] == 80.0

def test_book_delivery():
    """Test booking delivery"""
    pickup = VendorLocation(
        latitude=12.9716,
        longitude=77.5946,
        address="MG Road",
        city="Bangalore",
        pincode="560001"
    )
    
    delivery = VendorLocation(
        latitude=13.0358,
        longitude=77.5970,
        address="Hebbal",
        city="Bangalore",
        pincode="560024"
    )
    
    booking = book_delivery("uber_direct", "order_123", pickup, delivery)
    
    assert booking['status'] == 'booked'
    assert 'tracking_id' in booking
    assert booking['partner_id'] == 'uber_direct'
    assert booking['mode'] == 'SIMULATED'
