from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO
from datetime import datetime
import models

def generate_invoice_pdf(invoice: models.Invoice):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()

    # Header
    elements.append(Paragraph(f"INVOICE #{invoice.id}", styles['Title']))
    elements.append(Spacer(1, 12))

    # Client Info
    elements.append(Paragraph(f"Bill To: {invoice.client.name}", styles['Heading2']))
    elements.append(Paragraph(f"{invoice.client.address}", styles['Normal']))
    elements.append(Spacer(1, 12))

    # Items Table
    data = [['Description', 'Quantity', 'Unit Price', 'Total']]
    for item in invoice.items:
        data.append([
            item.description,
            str(item.quantity),
            f"${item.unit_price:.2f}",
            f"${(item.quantity * item.unit_price):.2f}"
        ])
    
    # Total Row
    data.append(['', '', 'Total', f"${invoice.total_amount:.2f}"])

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

    doc.build(elements)
    buffer.seek(0)
    return buffer

def generate_fira_pdf(invoice: models.Invoice):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Title
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(width / 2, height - 100, "Foreign Inward Remittance Advice")

    # Content
    c.setFont("Helvetica", 12)
    y = height - 150
    c.drawString(100, y, f"Date: {datetime.now().strftime('%Y-%m-%d')}")
    y -= 30
    c.drawString(100, y, f"Beneficiary: {invoice.owner.email}")
    y -= 30
    c.drawString(100, y, f"Remitter: {invoice.client.name}")
    y -= 30
    c.drawString(100, y, f"Invoice Reference: #{invoice.id}")
    y -= 30
    c.drawString(100, y, f"Amount Credited: ${invoice.total_amount:.2f}")
    y -= 30
    c.drawString(100, y, "Currency: USD")
    y -= 50
    
    c.drawString(100, y, "This document certifies that the above amount has been credited")
    y -= 20
    c.drawString(100, y, "to your account in accordance with FEMA regulations.")

    c.save()
    buffer.seek(0)
    return buffer
