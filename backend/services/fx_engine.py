# backend/services/fx_engine.py
"""
Treasury & FX Engine Service

This service handles real-time exchange rate locking and payout calculations.
It implements the core Skydo formula:
  Net_INR = (Principal_USD - Flat_Fee_USD) * Mid_Market_Rate
  Payout = Net_INR - GST_on_Fee
"""

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
    
    Args:
        currency_pair: e.g., "USD_INR", "EUR_INR"
    
    Returns:
        Decimal: The mid-market exchange rate
    """
    base_rate = MOCK_BASE_RATES.get(currency_pair, Decimal("1.0"))
    # Simulate minor fluctuation (+/- 0.05)
    fluctuation = Decimal(str(random.uniform(-0.05, 0.05))).quantize(Decimal("0.01"))
    return base_rate + fluctuation


def calculate_payout(principal_amount: Decimal, currency: str = "USD") -> dict:
    """
    Calculates the final INR payout amount after fees and FX conversion.
    
    Formula:
        1. Net_Foreign = Principal - Flat_Fee
        2. Gross_INR = Net_Foreign * FX_Rate
        3. Flat_Fee_INR = Flat_Fee * FX_Rate
        4. GST_INR = Flat_Fee_INR * 18%
        5. Net_Payout_INR = Gross_INR - GST_INR
    
    Args:
        principal_amount: The amount received in foreign currency
        currency: The currency code (default: "USD")
    
    Returns:
        dict: Complete breakdown of the FX deal
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
