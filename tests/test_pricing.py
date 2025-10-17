import pytest
from backend.pricing import calculate_estimate, get_active_price_rule
from backend.models import EstimateRequest, OrderItem, FulfillmentType, VendorLocation

def test_get_active_price_rule():
    """Test getting active price rule"""
    rule = get_active_price_rule()
    assert rule is not None
    assert rule.active == True
    assert len(rule.paperTypes) > 0

def test_basic_pricing():
    """Test basic pricing calculation"""
    items = [
        OrderItem(
            file_url="test.pdf",
            file_name="test.pdf",
            num_pages=10,
            num_copies=2,
            paper_type_id="a4_70gsm",
            is_color=False,
            lamination_sheets=0,
            binding_type="none",
            perPagePriceApplied=0.0,
            itemSubtotal=0.0
        )
    ]
    
    request = EstimateRequest(
        items=items,
        fulfillment_type=FulfillmentType.PICKUP,
        customer_location=None
    )
    
    estimate = calculate_estimate(request)
    
    # 10 pages * 2 copies * 0.50 per page = 10.0
    assert estimate.items_total == 10.0
    assert estimate.delivery_charge == 0.0
    assert estimate.total == 10.0

def test_color_pricing():
    """Test color printing pricing"""
    items = [
        OrderItem(
            file_url="color.pdf",
            file_name="color.pdf",
            num_pages=5,
            num_copies=1,
            paper_type_id="a4_70gsm",
            is_color=True,
            lamination_sheets=0,
            binding_type="none",
            perPagePriceApplied=0.0,
            itemSubtotal=0.0
        )
    ]
    
    request = EstimateRequest(
        items=items,
        fulfillment_type=FulfillmentType.PICKUP,
        customer_location=None
    )
    
    estimate = calculate_estimate(request)
    
    # 5 pages * 1 copy * 3.00 per page = 15.0
    assert estimate.items_total == 15.0

def test_lamination_pricing():
    """Test lamination pricing"""
    items = [
        OrderItem(
            file_url="test.pdf",
            file_name="test.pdf",
            num_pages=10,
            num_copies=1,
            paper_type_id="a4_70gsm",
            is_color=False,
            lamination_sheets=5,
            binding_type="none",
            perPagePriceApplied=0.0,
            itemSubtotal=0.0
        )
    ]
    
    request = EstimateRequest(
        items=items,
        fulfillment_type=FulfillmentType.PICKUP,
        customer_location=None
    )
    
    estimate = calculate_estimate(request)
    
    # (10 pages * 0.50) + (5 sheets * 10.00) = 5.0 + 50.0 = 55.0
    assert estimate.items_total == 55.0

def test_binding_pricing():
    """Test binding pricing"""
    items = [
        OrderItem(
            file_url="test.pdf",
            file_name="test.pdf",
            num_pages=100,
            num_copies=1,
            paper_type_id="a4_80gsm",
            is_color=False,
            lamination_sheets=0,
            binding_type="spiral",
            perPagePriceApplied=0.0,
            itemSubtotal=0.0
        )
    ]
    
    request = EstimateRequest(
        items=items,
        fulfillment_type=FulfillmentType.PICKUP,
        customer_location=None
    )
    
    estimate = calculate_estimate(request)
    
    # (100 pages * 0.75) + 25.00 binding = 75.0 + 25.0 = 100.0
    assert estimate.items_total == 100.0

def test_multiple_items():
    """Test multiple items in order"""
    items = [
        OrderItem(
            file_url="doc1.pdf",
            file_name="doc1.pdf",
            num_pages=10,
            num_copies=1,
            paper_type_id="a4_70gsm",
            is_color=False,
            lamination_sheets=0,
            binding_type="none",
            perPagePriceApplied=0.0,
            itemSubtotal=0.0
        ),
        OrderItem(
            file_url="doc2.pdf",
            file_name="doc2.pdf",
            num_pages=5,
            num_copies=2,
            paper_type_id="a4_70gsm",
            is_color=True,
            lamination_sheets=0,
            binding_type="none",
            perPagePriceApplied=0.0,
            itemSubtotal=0.0
        )
    ]
    
    request = EstimateRequest(
        items=items,
        fulfillment_type=FulfillmentType.PICKUP,
        customer_location=None
    )
    
    estimate = calculate_estimate(request)
    
    # Item 1: 10 * 1 * 0.50 = 5.0
    # Item 2: 5 * 2 * 3.00 = 30.0
    # Total: 35.0
    assert estimate.items_total == 35.0

def test_paper_type_change():
    """Test that changing paper type changes price"""
    items_70gsm = [
        OrderItem(
            file_url="test.pdf",
            file_name="test.pdf",
            num_pages=10,
            num_copies=1,
            paper_type_id="a4_70gsm",
            is_color=False,
            lamination_sheets=0,
            binding_type="none",
            perPagePriceApplied=0.0,
            itemSubtotal=0.0
        )
    ]
    
    items_80gsm = [
        OrderItem(
            file_url="test.pdf",
            file_name="test.pdf",
            num_pages=10,
            num_copies=1,
            paper_type_id="a4_80gsm",
            is_color=False,
            lamination_sheets=0,
            binding_type="none",
            perPagePriceApplied=0.0,
            itemSubtotal=0.0
        )
    ]
    
    estimate_70 = calculate_estimate(EstimateRequest(
        items=items_70gsm,
        fulfillment_type=FulfillmentType.PICKUP,
        customer_location=None
    ))
    
    estimate_80 = calculate_estimate(EstimateRequest(
        items=items_80gsm,
        fulfillment_type=FulfillmentType.PICKUP,
        customer_location=None
    ))
    
    # 70gsm: 10 * 0.50 = 5.0
    # 80gsm: 10 * 0.75 = 7.5
    assert estimate_70.items_total == 5.0
    assert estimate_80.items_total == 7.5
    assert estimate_80.items_total > estimate_70.items_total
