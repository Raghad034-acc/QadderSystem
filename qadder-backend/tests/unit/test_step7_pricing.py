import pytest
from app.services.step7_pricing import apply_fault_formula


# Test 1: Apply 0% fault
def test_apply_fault_formula_zero_fault():
    rows = [
        {"part_price": 1000, "labor_cost": 200},
        {"part_price": 500, "labor_cost": 100},
    ]

    updated_rows, summary = apply_fault_formula(rows, 0)

    assert summary["total_parts"] == 1500
    assert summary["total_labor"] == 300
    assert summary["total_estimated_cost"] == 1800
    assert summary["adjusted_cost"] == 1800


# Test 2: Apply 50% fault
def test_apply_fault_formula_half_fault():
    rows = [
        {"part_price": 1000, "labor_cost": 200},
        {"part_price": 500, "labor_cost": 100},
    ]

    updated_rows, summary = apply_fault_formula(rows, 50)

    assert summary["total_estimated_cost"] == 1800
    assert summary["adjusted_cost"] == 900
    assert summary["fault_multiplier"] == 0.5


# Test 3: Apply 75% fault
def test_apply_fault_formula_75_fault():
    rows = [
        {"part_price": 1000, "labor_cost": 200},
    ]

    updated_rows, summary = apply_fault_formula(rows, 75)

    assert summary["total_estimated_cost"] == 1200
    assert summary["adjusted_cost"] == 300
    assert updated_rows[0]["subtotal_after_fault"] == 300


# Test 4: Apply 25% fault
def test_apply_fault_formula_25_fault():
    rows = [
        {"part_price": 1000, "labor_cost": 200},
        {"part_price": 500, "labor_cost": 100},
    ]

    updated_rows, summary = apply_fault_formula(rows, 25)

    assert summary["total_parts"] == 1500
    assert summary["total_labor"] == 300
    assert summary["total_estimated_cost"] == 1800
    assert summary["adjusted_cost"] == 1350


# Test 5: Fault percentage is None
def test_apply_fault_formula_none_fault():
    rows = [
        {"part_price": 300, "labor_cost": 100},
    ]

    updated_rows, summary = apply_fault_formula(rows, None)

    assert summary["fault_percentage"] == 0
    assert summary["adjusted_cost"] == 400
