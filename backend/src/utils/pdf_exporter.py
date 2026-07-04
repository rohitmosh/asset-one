from io import BytesIO
from datetime import date, datetime
from zoneinfo import ZoneInfo
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A3
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from src.models import models

def export_assets_to_pdf(instances: list[models.AssetInstance]) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A3),
        rightMargin=18,
        leftMargin=18,
        topMargin=18,
        bottomMargin=18
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=12
    )
    
    header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6,
        leading=7,
        textColor=colors.white,
        alignment=1 # Center
    )
    
    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=5.5,
        leading=6.5,
        textColor=colors.HexColor('#334155')
    )
    
    cell_style_center = ParagraphStyle(
        'TableCellCenter',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=5.5,
        leading=6.5,
        textColor=colors.HexColor('#334155'),
        alignment=1 # Center
    )

    story = []
    
    # Title
    story.append(Paragraph(f"OHPC Corporate Asset Registry - {datetime.now(ZoneInfo('Asia/Kolkata')).strftime('%Y-%m-%d %H:%M:%S IST')}", title_style))
    story.append(Spacer(1, 10))
    
    headers = [
        "Sl No", "IT/OT", "Asset Type", "Asset Group", "Asset", "Asset Identifier", 
        "Asset Description", "Manufacturer", "Model No.", "Serial No.", 
        "Owner", "Contact Details", "Custodian", "User(s)", "Location Name", 
        "Floor Location", "Security Classification", "AMC/Warranty End Date", 
        "Impact on Business Continuity", "Backup Location", "Vulnerability of Asset", 
        "Any deviation from company policy"
    ]
    
    table_data = [[Paragraph(h, header_style) for h in headers]]
    
    today = date.today()
    
    t_styles = [
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]
    
    for idx, inst in enumerate(instances, 1):
        asset_type = inst.asset.asset_type.name if inst.asset and inst.asset.asset_type else ""
        asset_group = inst.asset.asset_group.name if inst.asset and inst.asset.asset_group else ""
        asset_name = inst.asset.name if inst.asset else ""
        owner_name = inst.owner.name if inst.owner else ""
        owner_contact = inst.owner.email if inst.owner else ""
        custodian_name = inst.custodian.name if inst.custodian else ""
        assigned_user = inst.assigned_user.name if inst.assigned_user else "N/A"
        
        location_name = f"{inst.location.plant_office} - {inst.location.building}" if inst.location else ""
        floor_location = f"Floor {inst.location.floor or ''}, Room {inst.location.room or ''}" if inst.location else ""
        
        warranty_end = inst.warranty_end_date
        warranty_str = warranty_end.strftime("%Y-%m-%d") if warranty_end else "N/A"
        
        backup_loc = inst.backup_location if inst.backup_available else "No Backup"
        vulnerabilities = inst.known_vulnerabilities or "None"
        deviations = inst.policy_deviations or "None"
        
        row_idx = idx
        if warranty_end:
            days_remaining = (warranty_end - today).days
            if days_remaining < 0:
                t_styles.append(('BACKGROUND', (17, row_idx), (17, row_idx), colors.HexColor('#F8D7DA')))
            elif days_remaining <= 30:
                t_styles.append(('BACKGROUND', (17, row_idx), (17, row_idx), colors.HexColor('#FFF3CD')))
            elif days_remaining <= 60:
                t_styles.append(('BACKGROUND', (17, row_idx), (17, row_idx), colors.HexColor('#E2F0D9')))
                
        row_cells = [
            Paragraph(str(idx), cell_style_center),
            Paragraph(inst.asset.asset_group.domain.upper() if inst.asset and inst.asset.asset_group else "N/A", cell_style_center),
            Paragraph(asset_type, cell_style),
            Paragraph(asset_group, cell_style),
            Paragraph(asset_name, cell_style),
            Paragraph(inst.identifier, cell_style_center),
            Paragraph(inst.description or "", cell_style),
            Paragraph(inst.manufacturer or "", cell_style),
            Paragraph(inst.model_number or "", cell_style),
            Paragraph(inst.serial_number or "", cell_style),
            Paragraph(owner_name, cell_style),
            Paragraph(owner_contact, cell_style),
            Paragraph(custodian_name, cell_style),
            Paragraph(assigned_user, cell_style),
            Paragraph(location_name, cell_style),
            Paragraph(floor_location, cell_style),
            Paragraph(inst.security_classification, cell_style_center),
            Paragraph(warranty_str, cell_style_center),
            Paragraph(inst.business_criticality, cell_style_center),
            Paragraph(backup_loc, cell_style),
            Paragraph(vulnerabilities, cell_style),
            Paragraph(deviations, cell_style)
        ]
        table_data.append(row_cells)
        
    col_widths = [25, 30, 45, 50, 50, 75, 85, 50, 45, 50, 45, 65, 45, 45, 75, 65, 45, 45, 40, 50, 70, 70]
    
    t = Table(table_data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle(t_styles))
    
    story.append(t)
    doc.build(story)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
