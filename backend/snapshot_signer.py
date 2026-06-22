"""
snapshot_signer.py
==================
Handles all cryptographic and PDF generation logic for the Registry Snapshot
(non-repudiation) feature.

Key design decisions
--------------------
* Deterministic serialisation: assets are sorted by `identifier` before
  JSON-encoding so that the same registry state always produces the same
  data_hash regardless of DB return order.
* HMAC key: uses the `SNAPSHOT_SECRET` env-var (falls back to JWT_SECRET).
  Keeping snapshot signing separate from JWT allows independent key rotation.
* PDF layout mirrors the existing pdf_exporter.py style so the document feels
  consistent with regular registry exports, but adds a prominent signed-
  manifest header block.
"""

import hashlib
import hmac
import json
import os
from datetime import datetime
from zoneinfo import ZoneInfo
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A3
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle,
    Paragraph, Spacer, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm

import models

# ── Secret used for HMAC signing ────────────────────────────────────────────
SNAPSHOT_SECRET: str = os.getenv(
    "SNAPSHOT_SECRET",
    os.getenv("JWT_SECRET", "ohpc-eams-super-secret-key-2026-xyz-emerald")
)


# ── Hashing helpers ──────────────────────────────────────────────────────────

def _serialize_asset(inst: models.AssetInstance) -> dict:
    """
    Converts an AssetInstance ORM object into a deterministic, JSON-safe dict.
    Only stable scalar fields are included — relationships are represented by
    their IDs to avoid ORM lazy-load surprises.
    """
    def _d(val):
        return val.isoformat() if val else None

    return {
        "id":                    inst.id,
        "identifier":            inst.identifier,
        "description":           inst.description,
        "manufacturer":          inst.manufacturer,
        "model_number":          inst.model_number,
        "serial_number":         inst.serial_number,
        "asset_id":              inst.asset_id,
        "owner_id":              inst.owner_id,
        "custodian_id":          inst.custodian_id,
        "assigned_user_id":      inst.assigned_user_id,
        "location_id":           inst.location_id,
        "security_classification": inst.security_classification,
        "business_criticality":  inst.business_criticality,
        "purchase_date":         _d(inst.purchase_date),
        "installation_date":     _d(inst.installation_date),
        "warranty_start_date":   _d(inst.warranty_start_date),
        "warranty_end_date":     _d(inst.warranty_end_date),
        "end_of_life_date":      _d(inst.end_of_life_date),
        "end_of_support_date":   _d(inst.end_of_support_date),
        "policy_deviations":     inst.policy_deviations,
        "known_vulnerabilities": inst.known_vulnerabilities,
        "remarks":               inst.remarks,
        "backup_available":      inst.backup_available,
        "backup_location":       inst.backup_location,
        "backup_owner_id":       inst.backup_owner_id,
        "status":                inst.status,
    }


def build_asset_data_hash(assets: list[models.AssetInstance]) -> str:
    """
    Returns a hex SHA-256 of the full, sorted asset registry state.
    Assets are sorted by `identifier` for determinism.
    """
    records = sorted(
        [_serialize_asset(a) for a in assets],
        key=lambda r: r["identifier"]
    )
    canonical = json.dumps(records, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def build_hmac_signature(manifest: dict) -> str:
    """
    Returns a hex HMAC-SHA256 of the canonical manifest JSON.
    The manifest must NOT contain the `hmac_signature` key itself.
    """
    canonical = json.dumps(manifest, sort_keys=True, separators=(",", ":"))
    return hmac.new(
        SNAPSHOT_SECRET.encode("utf-8"),
        canonical.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


def verify_hmac_signature(manifest: dict, stored_sig: str) -> bool:
    """Constant-time comparison to prevent timing attacks."""
    expected = build_hmac_signature(manifest)
    return hmac.compare_digest(expected, stored_sig)


# ── PDF generation ───────────────────────────────────────────────────────────

def generate_snapshot_pdf(
    snapshot: models.RegistrySnapshot,
    assets: list[models.AssetInstance],
) -> bytes:
    """
    Generates a tamper-evident PDF snapshot document.  The document contains:
      1. A header (title, organisation, signed-by banner)
      2. A boxed Signed Manifest block (all cryptographic fields)
      3. The full asset registry table
      4. A tamper-evident footer notice
    """
    from datetime import date

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A3),
        rightMargin=18,
        leftMargin=18,
        topMargin=18,
        bottomMargin=25,
    )

    styles = getSampleStyleSheet()

    # ── Custom paragraph styles ──────────────────────────────────────────────
    title_style = ParagraphStyle(
        "SnapshotTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "SnapshotSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=colors.HexColor("#475569"),
        spaceAfter=6,
    )
    manifest_label_style = ParagraphStyle(
        "ManifestLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        textColor=colors.HexColor("#1E293B"),
    )
    manifest_value_style = ParagraphStyle(
        "ManifestValue",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        textColor=colors.HexColor("#334155"),
        wordWrap="LTR",
    )
    manifest_hash_style = ParagraphStyle(
        "ManifestHash",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=6.5,
        textColor=colors.HexColor("#0F172A"),
        wordWrap="LTR",
    )
    header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=6,
        leading=7,
        textColor=colors.white,
        alignment=1,
    )
    cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=5.5,
        leading=6.5,
        textColor=colors.HexColor("#334155"),
    )
    cell_center_style = ParagraphStyle(
        "TableCellCenter",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=5.5,
        leading=6.5,
        textColor=colors.HexColor("#334155"),
        alignment=1,
    )
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=6.5,
        textColor=colors.HexColor("#64748B"),
        alignment=1,
        spaceBefore=8,
    )

    story = []

    # ── 1. Title block ───────────────────────────────────────────────────────
    story.append(Paragraph("OHPC Enterprise Asset Management System", subtitle_style))
    story.append(Paragraph("FINALIZED ASSET REGISTRY SNAPSHOT", title_style))
    story.append(Paragraph(
        f"Signed by L2 Admin &bull; Generated {snapshot.timestamp_ist.astimezone(ZoneInfo('Asia/Kolkata')).strftime('%Y-%m-%d %H:%M:%S IST')} &bull; "
        f"This document constitutes a non-repudiable record.",
        subtitle_style,
    ))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1E3A5F"), spaceAfter=8))

    # ── 2. Signed Manifest block ─────────────────────────────────────────────
    manifest_data = [
        [
            Paragraph("Snapshot ID", manifest_label_style),
            Paragraph(snapshot.snapshot_id, manifest_hash_style),
            Paragraph("Signed By", manifest_label_style),
            Paragraph(
                f"{snapshot.signer_name}  |  {snapshot.signer_role}  |  Emp: {snapshot.signer_employee_id}  |  {snapshot.signer_department}",
                manifest_value_style,
            ),
        ],
        [
            Paragraph("Timestamp (IST)", manifest_label_style),
            Paragraph(snapshot.timestamp_ist.astimezone(ZoneInfo("Asia/Kolkata")).strftime("%Y-%m-%d %H:%M:%S IST"), manifest_value_style),
            Paragraph("Assets Signed", manifest_label_style),
            Paragraph(str(snapshot.asset_count), manifest_value_style),
        ],
        [
            Paragraph("Data Hash (SHA-256)", manifest_label_style),
            Paragraph(f"sha256:{snapshot.data_hash}", manifest_hash_style),
            Paragraph("Audit Chain Anchor", manifest_label_style),
            Paragraph(f"sha256:{snapshot.chain_anchor}", manifest_hash_style),
        ],
        [
            Paragraph("HMAC-SHA256 Signature", manifest_label_style),
            Paragraph(f"hmac-sha256:{snapshot.hmac_signature}", manifest_hash_style),
            Paragraph("Remarks", manifest_label_style),
            Paragraph(snapshot.remarks or "—", manifest_value_style),
        ],
    ]

    manifest_table = Table(
        manifest_data,
        colWidths=[95, 345, 85, 325],
        style=TableStyle([
            ("BACKGROUND",   (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
            ("BACKGROUND",   (0, 0), (0, -1), colors.HexColor("#1E3A5F")),
            ("BACKGROUND",   (2, 0), (2, -1), colors.HexColor("#1E3A5F")),
            ("TEXTCOLOR",    (0, 0), (0, -1), colors.white),
            ("TEXTCOLOR",    (2, 0), (2, -1), colors.white),
            ("ALIGN",        (0, 0), (-1, -1), "LEFT"),
            ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
            ("GRID",         (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("TOPPADDING",   (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
            ("LEFTPADDING",  (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("ROUNDEDCORNERS", [4]),
        ]),
    )
    story.append(manifest_table)
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1"), spaceAfter=10))

    # ── 3. Asset registry table ──────────────────────────────────────────────
    headers = [
        "Sl No", "Asset Type", "Asset Group", "Asset", "Asset Identifier",
        "Asset Description", "Manufacturer", "Model No.", "Serial No.",
        "Owner", "Contact", "Custodian", "User(s)", "Location",
        "Floor / Room", "Classification", "Warranty End", "Criticality",
        "Backup Location", "Vulnerabilities", "Policy Deviations",
    ]
    table_data = [[Paragraph(h, header_style) for h in headers]]

    today = date.today()
    t_styles = [
        ("BACKGROUND",   (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ("ALIGN",        (0, 0), (-1, -1), "LEFT"),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
        ("GRID",         (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("TOPPADDING",   (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
        ("LEFTPADDING",  (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
    ]

    sorted_assets = sorted(assets, key=lambda a: a.identifier)
    for idx, inst in enumerate(sorted_assets, 1):
        asset_type  = inst.asset.asset_group.asset_type.name if inst.asset and inst.asset.asset_group and inst.asset.asset_group.asset_type else ""
        asset_group = inst.asset.asset_group.name if inst.asset and inst.asset.asset_group else ""
        asset_name  = inst.asset.name if inst.asset else ""
        owner_name  = inst.owner.name if inst.owner else ""
        owner_email = inst.owner.email if inst.owner else ""
        custodian   = inst.custodian.name if inst.custodian else ""
        assigned    = inst.assigned_user.name if inst.assigned_user else "N/A"
        loc_name    = f"{inst.location.plant_office} – {inst.location.building}" if inst.location else ""
        floor_room  = f"Floor {inst.location.floor or ''}, Room {inst.location.room or ''}" if inst.location else ""
        warranty_end = inst.warranty_end_date
        warranty_str = warranty_end.strftime("%Y-%m-%d") if warranty_end else "N/A"
        backup_str   = inst.backup_location if inst.backup_available else "No Backup"

        # Warranty row colour-coding (same as pdf_exporter.py)
        if warranty_end:
            days = (warranty_end - today).days
            if days < 0:
                t_styles.append(("BACKGROUND", (16, idx), (16, idx), colors.HexColor("#F8D7DA")))
            elif days <= 30:
                t_styles.append(("BACKGROUND", (16, idx), (16, idx), colors.HexColor("#FFF3CD")))
            elif days <= 60:
                t_styles.append(("BACKGROUND", (16, idx), (16, idx), colors.HexColor("#E2F0D9")))

        table_data.append([
            Paragraph(str(idx),                      cell_center_style),
            Paragraph(asset_type,                    cell_style),
            Paragraph(asset_group,                   cell_style),
            Paragraph(asset_name,                    cell_style),
            Paragraph(inst.identifier,               cell_center_style),
            Paragraph(inst.description or "",        cell_style),
            Paragraph(inst.manufacturer or "",       cell_style),
            Paragraph(inst.model_number or "",       cell_style),
            Paragraph(inst.serial_number or "",      cell_style),
            Paragraph(owner_name,                    cell_style),
            Paragraph(owner_email,                   cell_style),
            Paragraph(custodian,                     cell_style),
            Paragraph(assigned,                      cell_style),
            Paragraph(loc_name,                      cell_style),
            Paragraph(floor_room,                    cell_style),
            Paragraph(inst.security_classification,  cell_center_style),
            Paragraph(warranty_str,                  cell_center_style),
            Paragraph(inst.business_criticality,     cell_center_style),
            Paragraph(backup_str,                    cell_style),
            Paragraph(inst.known_vulnerabilities or "None", cell_style),
            Paragraph(inst.policy_deviations or "None",     cell_style),
        ])

    col_widths = [25, 45, 55, 55, 75, 85, 50, 45, 50, 45, 65, 45, 45, 75, 65, 45, 45, 40, 50, 70, 70]
    registry_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    registry_table.setStyle(TableStyle(t_styles))
    story.append(registry_table)

    # ── 4. Footer ────────────────────────────────────────────────────────────
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1")))
    story.append(Paragraph(
        "⚠ TAMPER-EVIDENT DOCUMENT — Any modification to asset data, signer fields, or cryptographic hashes after signing will be detectable "
        "by re-running the HMAC verification endpoint (GET /api/snapshots/{snapshot_id}/verify).  "
        f"Snapshot ID: {snapshot.snapshot_id}  |  OHPC EAMS  |  Confidential – Internal Use Only",
        footer_style,
    ))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
