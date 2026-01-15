from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO
from datetime import datetime
import models

def get_currency_symbol(currency: str):
    symbols = {"EUR": "€", "GBP": "£", "USD": "$"}
    return symbols.get(currency.upper(), "$")

def generate_invoice_pdf(invoice: models.Invoice):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    symbol = get_currency_symbol(invoice.currency)

    # Header
    elements.append(Paragraph(f"INVOICE #{invoice.id}", styles['Title']))
    elements.append(Spacer(1, 12))

    # Business Info (Seller)
    if invoice.owner.business_name:
        elements.append(Paragraph(f"From: {invoice.owner.business_name}", styles['Heading3']))
        if invoice.owner.gstin:
            elements.append(Paragraph(f"GSTIN: {invoice.owner.gstin}", styles['Normal']))
        elements.append(Paragraph(f"{invoice.owner.business_address}", styles['Normal']))
        elements.append(Spacer(1, 12))

    # Client Info (Buyer)
    elements.append(Paragraph(f"Bill To: {invoice.client.name}", styles['Heading3']))
    elements.append(Paragraph(f"{invoice.client.address}", styles['Normal']))
    elements.append(Spacer(1, 12))


    # Items Table
    data = [['Description', 'Quantity', 'Unit Price', 'Total']]
    for item in invoice.items:
        data.append([
            item.description,
            str(item.quantity),
            f"{symbol}{item.unit_price:.2f}",
            f"{symbol}{(item.quantity * item.unit_price):.2f}"
        ])
    
    # Total Row
    data.append(['', '', 'Total', f"{symbol}{invoice.total_amount:.2f}"])

    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 24))

    # LUT Declaration
    elements.append(Paragraph("<b>Declaration:</b> Supply of services intended for export under Bond or Letter of Undertaking (LUT) without payment of integrated tax.", styles['Normal']))


    doc.build(elements)
    buffer.seek(0)
    return buffer

def generate_fira_pdf(invoice: models.Invoice, transaction: models.Transaction = None):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    symbol = get_currency_symbol(invoice.currency)

    # Title
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(width / 2, height - 70, "Foreign Inward Remittance Advice (FIRA)")
    
    # Subtitle
    c.setFont("Helvetica", 10)
    c.drawCentredString(width / 2, height - 85, "(Issued in accordance with RBI guidelines for export of services)")

    # Content
    c.setFont("Helvetica", 12)
    y = height - 130
    c.drawString(70, y, f"Date of Issue: {datetime.now().strftime('%Y-%m-%d')}")
    y -= 30
    
    # Beneficiary & Remitter Info
    c.setFont("Helvetica-Bold", 12)
    c.drawString(70, y, "Beneficiary Details:")
    c.setFont("Helvetica", 12)
    y -= 20
    c.drawString(70, y, f"Name: {invoice.owner.email}") # In real app, would be user's full name
    y -= 30
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(70, y, "Remitter Details:")
    c.setFont("Helvetica", 12)
    y -= 20
    c.drawString(70, y, f"Name: {invoice.client.name}")
    c.drawString(70, y-15, f"Country: USA") # Mocked
    y -= 50

    # Transaction Details Table Header
    c.setFont("Helvetica-Bold", 12)
    c.drawString(70, y, "Transaction Breakdown:")
    y -= 25
    
    # Draw a box for details
    c.rect(70, y - 160, width - 140, 180)
    
    # Table Content
    c.setFont("Helvetica", 11)
    line_y = y
    details = [
        ("Invoice Reference", f"#{invoice.id}"),
        ("Principal Amount", f"{symbol}{invoice.total_amount:.2f} {invoice.currency}"),
    ]
    
    if transaction:
        details.extend([
            ("Sender Name", transaction.sender_name or "N/A"),
            ("FX Rate Applied", f"Rs. {transaction.fx_rate:.4f} / {transaction.currency}"),
            ("Flat Service Fee", f"{symbol}{transaction.flat_fee_usd:.2f}"),
            ("GST on Fee (18%)", f"Rs. {transaction.gst_on_fee_inr:.2f}"),
            ("Net Amount Credited", f"Rs. {transaction.net_payout_inr:,.2f}"),
        ])
    else:
        details.append(("Status", "Payment Pending"))


    for label, value in details:
        c.drawString(90, line_y, label)
        c.drawRightString(width - 90, line_y, value)
        line_y -= 20

    y = line_y - 40
    
    # Regulatory Note
    c.setFont("Helvetica-Oblique", 9)
    note = [
        "Note: This is a computer-generated document and does not require a physical signature.",
        "The above remittance has been received for 'Export of Services' under Purpose Code P0802.",
        "The funds have been converted at the locked mid-market rate at the time of detection."
    ]
    for line in note:
        c.drawString(70, y, line)
        y -= 15

    c.save()
    buffer.seek(0)
    return buffer

