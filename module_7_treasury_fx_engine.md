# Module Plan: Treasury & FX Engine

This document outlines the plan for implementing the Treasury & FX Engine, which is the core of the V1 "Local-In, Local-Out" architecture. This engine handles real-time exchange rate locking and payout calculations.

## 1. Development Plan

### 1.1. Backend Development (FastAPI)

- **New Service (`services/fx_engine.py`):**

  This is the heart of the V1 upgrade. It provides functions for FX rate retrieval and payout calculation.

  ```python
  # backend/services/fx_engine.py

  from decimal import Decimal, ROUND_HALF_UP
  import random

  # --- Configuration ---
  FLAT_FEE_USD = Decimal("29.00")
  GST_RATE = Decimal("0.18")  # 18%

  # Mock mid-market rates (in production, this would be an API call to Currencycloud/Nium)
  MOCK_BASE_RATES = {
      "USD_INR": Decimal("83.50"),
      "EUR_INR": Decimal("90.25"),
      "GBP_INR": Decimal("105.80"),
      "CAD_INR": Decimal("61.50"),
  }

  def get_mid_market_rate(currency_pair: str) -> Decimal:
      """
      Fetches the live mid-market rate for a currency pair.
      Mocked for V1 with minor fluctuation to simulate real-time changes.
      """
      base_rate = MOCK_BASE_RATES.get(currency_pair, Decimal("1.0"))
      # Simulate minor fluctuation (+/- 0.05)
      fluctuation = Decimal(random.uniform(-0.05, 0.05)).quantize(Decimal("0.01"))
      return base_rate + fluctuation

  def calculate_payout(principal_amount: Decimal, currency: str = "USD") -> dict:
      """
      Calculates the final INR payout amount after fees and FX conversion.
      
      Formula:
        1. Net_USD = Principal_USD - Flat_Fee_USD
        2. Gross_INR = Net_USD * FX_Rate
        3. Flat_Fee_INR = Flat_Fee_USD * FX_Rate
        4. GST_INR = Flat_Fee_INR * 18%
        5. Net_Payout_INR = Gross_INR - GST_INR
      """
      currency_pair = f"{currency}_INR"
      fx_rate = get_mid_market_rate(currency_pair)

      net_foreign = principal_amount - FLAT_FEE_USD
      gross_inr = (net_foreign * fx_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

      # GST is calculated on the flat fee (converted to INR)
      flat_fee_inr = (FLAT_FEE_USD * fx_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
      gst_on_fee_inr = (flat_fee_inr * GST_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

      net_payout_inr = (gross_inr - gst_on_fee_inr).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

      return {
          "principal_amount": principal_amount,
          "currency": currency,
          "flat_fee_usd": FLAT_FEE_USD,
          "fx_rate": fx_rate,
          "gross_inr": gross_inr,
          "flat_fee_inr": flat_fee_inr,
          "gst_on_fee_inr": gst_on_fee_inr,
          "net_payout_inr": net_payout_inr,
      }
  ```

- **Configuration Constants:**

  | Constant | Value | Description |
  |----------|-------|-------------|
  | `FLAT_FEE_USD` | $29.00 | Standard flat fee per transaction |
  | `GST_RATE` | 18% | Indian GST rate on service fee |

- **API Endpoint for Rate Preview (Optional):**

  - `GET /fx/rate?from=USD&to=INR`: Returns the current mid-market rate.
  - Useful for displaying real-time rates on the invoice creation page.

### 1.2. Unit Tests (`tests/test_fx_engine.py`)

  ```python
  # tests/test_fx_engine.py
  from decimal import Decimal
  from services.fx_engine import calculate_payout, FLAT_FEE_USD

  def test_calculate_payout_basic():
      """Test basic payout calculation with $1000 USD."""
      result = calculate_payout(Decimal("1000.00"), "USD")
      
      assert result["principal_amount"] == Decimal("1000.00")
      assert result["flat_fee_usd"] == FLAT_FEE_USD
      assert result["fx_rate"] > Decimal("0")
      assert result["net_payout_inr"] > Decimal("0")
      
      # Verify the formula: net_payout = (principal - fee) * rate - gst
      expected_gross = (Decimal("1000.00") - FLAT_FEE_USD) * result["fx_rate"]
      expected_gst = (FLAT_FEE_USD * result["fx_rate"]) * Decimal("0.18")
      expected_net = expected_gross - expected_gst
      
      # Allow for rounding differences
      assert abs(result["net_payout_inr"] - expected_net.quantize(Decimal("0.01"))) < Decimal("0.02")

  def test_calculate_payout_fx_slippage():
      """Test that FX slippage is within acceptable bounds (< 0.01%)."""
      base_rate = Decimal("83.50")
      results = [calculate_payout(Decimal("1000.00"), "USD")["fx_rate"] for _ in range(100)]
      
      for rate in results:
          slippage = abs(rate - base_rate) / base_rate
          assert slippage < Decimal("0.001")  # < 0.1% (more lenient for mock)
  ```

## 2. QA & Test Cases

### Test Environment
- Backend running on `http://localhost:5001`.
- Python environment with `pytest` available.

### Backend API Test Cases

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| **TC-FX-API-01** | Get Mid-Market Rate | Call `get_mid_market_rate("USD_INR")` directly or via API. | Returns a Decimal value close to 83.50 (+/- 0.05). |
| **TC-FX-API-02** | Calculate Payout - Basic | Call `calculate_payout(Decimal("1000.00"), "USD")`. | Returns dict with all fields populated. `net_payout_inr` is approximately ₹80,xxx. |
| **TC-FX-API-03** | Calculate Payout - Different Currencies | Call `calculate_payout(Decimal("1000.00"), "EUR")`. | Uses EUR_INR rate (~90.25). `net_payout_inr` is higher than USD calculation. |
| **TC-FX-API-04** | Verify Fee Deduction | Inspect `flat_fee_usd` in the result. | Always equals $29.00 regardless of principal. |
| **TC-FX-API-05** | Verify GST Calculation | Calculate: `flat_fee_inr * 0.18` manually. | Matches `gst_on_fee_inr` in the result. |
| **TC-FX-API-06** | Zero Edge Case | Call `calculate_payout(Decimal("29.00"), "USD")`. | `net_payout_inr` is approximately 0 (or negative, indicating fee exceeds principal). |

### Unit Test Cases (pytest)

| Test ID | Description | Command | Expected Result |
|---------|-------------|---------|-----------------|
| **TC-FX-UNIT-01** | Run All FX Engine Tests | `pytest tests/test_fx_engine.py -v` | All tests pass. |
| **TC-FX-UNIT-02** | Test Slippage Bounds | Check `test_calculate_payout_fx_slippage`. | 100 rate calls all within slippage tolerance. |
