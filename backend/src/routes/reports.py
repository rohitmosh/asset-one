from fastapi import APIRouter, Depends, HTTPException, Query, Response
from typing import Optional
from datetime import datetime
from zoneinfo import ZoneInfo
from src.services.report_service import ReportService
from src.services.asset_service import AssetService
from src.routes.dependencies import get_report_service, get_asset_service, get_any_user
from src.models import models

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/summary")
def get_reports_summary(
    report_service: ReportService = Depends(get_report_service),
    current_user: models.User = Depends(get_any_user)
):
    return report_service.get_dashboard_summary(current_user)

@router.get("/export")
def export_assets_excel(
    type_id: Optional[int] = None,
    group_id: Optional[int] = None,
    criticality: Optional[str] = None,
    classification: Optional[str] = None,
    custodian_id: Optional[int] = None,
    domain: Optional[str] = None,
    ids: Optional[str] = Query(None),
    report_service: ReportService = Depends(get_report_service),
    asset_service: AssetService = Depends(get_asset_service),
    current_user: models.User = Depends(get_any_user)
):
    instances = asset_service.list_assets(
        current_user=current_user,
        type_id=type_id,
        group_id=group_id,
        criticality=criticality,
        classification=classification,
        custodian_id=custodian_id,
        domain=domain
    )
    if ids:
        try:
            id_list = [int(x.strip()) for x in ids.split(",") if x.strip()]
            instances = [inst for inst in instances if inst.id in id_list]
        except ValueError:
            pass

    excel_bytes = report_service.generate_excel_report(instances)
    filename = f"OHPC_Asset_Register_{datetime.now(ZoneInfo('Asia/Kolkata')).strftime('%Y%m%d_%H%M%S')}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.get("/pdf")
def export_assets_pdf(
    type_id: Optional[int] = None,
    group_id: Optional[int] = None,
    criticality: Optional[str] = None,
    classification: Optional[str] = None,
    custodian_id: Optional[int] = None,
    domain: Optional[str] = None,
    ids: Optional[str] = Query(None),
    report_service: ReportService = Depends(get_report_service),
    asset_service: AssetService = Depends(get_asset_service),
    current_user: models.User = Depends(get_any_user)
):
    instances = asset_service.list_assets(
        current_user=current_user,
        type_id=type_id,
        group_id=group_id,
        criticality=criticality,
        classification=classification,
        custodian_id=custodian_id,
        domain=domain
    )
    if ids:
        try:
            id_list = [int(x.strip()) for x in ids.split(",") if x.strip()]
            instances = [inst for inst in instances if inst.id in id_list]
        except ValueError:
            pass

    pdf_bytes = report_service.generate_pdf_report(instances)
    filename = f"OHPC_Asset_Register_{datetime.now(ZoneInfo('Asia/Kolkata')).strftime('%Y%m%d_%H%M%S')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
