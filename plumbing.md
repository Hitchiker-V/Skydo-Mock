Skydo Infrastructure Blueprint: "Local-In, Local-Out" Architecture

1. System Philosophy

To provide a "Zero-FX Margin" and "Flat-Fee" experience, the system replaces the traditional SWIFT (Correspondent Banking) chain with a decoupled treasury model. The core logic is: Information moves globally, but value settles locally.

2. The Infrastructure Stack

A. Collection Layer (Virtual Accounts - VAs)

The system leverages Banking-as-a-Service (BaaS) providers to issue localized bank details to Indian exporters.

| Region | Partner Provider | Primary Bank Rail |
| USA | Currencycloud / CFSB | ACH (Domestic) |
| Europe | Banking Circle / Barclays | SEPA (Domestic) |
| UK | Banking Circle / Barclays | Faster Payments (FPS) |
| Canada | Digital Commerce Bank | EFT (Domestic) |

Dev Note: The system must listen for webhooks from these providers to detect incoming credits. The metadata must capture the Sender Name for reconciliation against the internal Invoice ID.

B. Treasury & FX Engine (The "Lock")

Skydo does not hold currency risk. The "Lock" occurs the moment funds are detected in a VA.

Detection: Webhook payment.received triggers the flow.

Market Query: System calls the Wholesale FX API (e.g., Currencycloud/Nium) for a live mid-market quote.

The Sell: System executes a Sell USD / Buy INR trade immediately to convert the foreign principal into a "Booked INR" amount.

Flat-Fee Deduction: * Net_INR = (Principal_USD - Flat_Fee_USD) * Mid_Market_Rate

Payout_Amount = Net_INR - (18% GST on Flat_Fee_INR)

C. Settlement Layer (Indian Last Mile)

Funds are settled into the Merchant’s local bank account using a licensed PA-CB (Payment Aggregator-Cross Border) framework.

Partner Banks: HDFC Bank, DBS India.

Mechanism: Funds are released via an Escrow-to-Merchant NEFT/IMPS transfer from Skydo’s pre-funded Indian accounts.

3. Transaction Sequence (Sequence Diagram Logic)

Invoice Generation: Merchant creates an invoice on Skydo with a Purpose Code (e.g., P0802 for Software Services).

Inward Credit: US Client pays $1,000 into the US VA via ACH.

System Notification: BaaS Partner $\rightarrow$ Skydo Backend (API Webhook).

Treasury Lock: Backend $\rightarrow$ FX Engine (Immediate conversion to fix the INR value).

Reconciliation: Backend matches Inward Remittance amount + Sender Name with the Open Invoice.

Disbursement: Backend $\rightarrow$ HDFC/DBS API (Domestic payout to Merchant's Bank Account).

Compliance Loop: * System generates FIRA (Foreign Inward Remittance Advice) using the AD-1 Bank's reporting data.

System maps the payment to the Shipping Bill (for Goods) to facilitate eBRC generation.

4. Key Performance Indicators for Developers

Detection Latency: Time between ACH credit and Skydo UI update (< 10 minutes).

FX Slippage: Variance between the "Locked Rate" and "Executed Rate" (Target: < 0.01%).

Reconciliation Rate: % of payments auto-matched to invoices without manual intervention (Target: > 95%).

FIRA Turnaround: Time from settlement to FIRA availability (Target: < 24 hours).

5. Regulatory Constraints (PA-CB Guardrails)

No Long-term Staging: Foreign currency must be converted and moved to the merchant's Indian bank account within 48 hours.

Purpose Code Integrity: Every payout MUST be linked to a valid RBI Purpose Code.

KYC/AML: All senders must be screened against global sanctions lists (OFAC, etc.) before the payout is triggered in India.

6. Future-Proofing (Roadmap Integration)

Expansion Corridor: Integration with local rails in Nigeria (NGN) and Brazil (BRL) using a similar VA-based mesh.

Stablecoin Fallback: Implementation of USDC/PYUSD as a settlement rail for high-inflation/low-liquidity corridors to ensure instant "off-ramping" to INR.