#!/bin/bash

echo "========================================"
echo "Vaishnavi Printers - Test Suite"
echo "========================================"
echo ""

cd /app

echo "1. Running Pricing Tests..."
PYTHONPATH=/app/backend python -m pytest tests/test_pricing.py -v --tb=short
if [ $? -eq 0 ]; then
    echo "✅ Pricing tests PASSED"
else
    echo "❌ Pricing tests FAILED"
    exit 1
fi

echo ""
echo "2. Running Vendor Tests..."
PYTHONPATH=/app/backend python -m pytest tests/test_vendors.py -v --tb=short
if [ $? -eq 0 ]; then
    echo "✅ Vendor tests PASSED"
else
    echo "❌ Vendor tests FAILED"
    exit 1
fi

echo ""
echo "3. Running Delivery Tests..."
PYTHONPATH=/app/backend python -m pytest tests/test_delivery.py -v --tb=short
if [ $? -eq 0 ]; then
    echo "✅ Delivery tests PASSED"
else
    echo "❌ Delivery tests FAILED"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ ALL TESTS PASSED!"
echo "========================================"
echo ""
echo "Test Coverage Summary:"
echo "  - Pricing: 7 tests (B&W, Color, Lamination, Binding, Multiple items, Paper changes)"
echo "  - Vendors: 3 tests (Distance calc, Auto-assign, Manual selection)"
echo "  - Delivery: 3 tests (Quotes, Cheapest selection, Booking)"
echo ""
echo "Total: 13 automated tests covering core business logic"
