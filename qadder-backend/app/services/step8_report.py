from pathlib import Path
from uuid import uuid4

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.platypus import Image
from reportlab.platypus import PageBreak
from sqlalchemy import text
from sqlalchemy.orm import Session


from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


PROJECT_ROOT = Path(__file__).resolve().parents[2]
REPORTS_DIR = PROJECT_ROOT / "uploads" / "QadderReport"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

LOGO_PATH = PROJECT_ROOT / "assets" / "qadder_logo.png"

FONT_PATH = PROJECT_ROOT / "fonts" / "Cairo-Regular.ttf"

pdfmetrics.registerFont(
    TTFont("Arabic", str(FONT_PATH))
)



def fetch_case_report_data(db: Session, case_id: str):
    case_row = db.execute(
        text("""
            SELECT
                c.id,
                c.case_number,
                c.status,
                c.created_at,

                up.first_name,
                up.second_name,
                up.third_name,
                up.last_name,
                up.national_id,
                up.nationality,

                aa.phone_number,
                aa.email,

                v.brand,
                v.model,
                v.year,
                v.color,
                v.plate_number,

                nr.report_file_path,
                nr.accident_id,
                nr.accident_date,
                nr.accident_time,
                nr.accident_coordinates,
                nr.fault_percentage,
                nr.damage_area,
                nr.damage_area_ar,
                nr.party_full_name,
                nr.license_type,
                nr.license_expiry_date,
                nr.party_national_id,
                nr.party_mobile,
                nr.party_nationality,
                nr.vehicle_plate_number,
                nr.vehicle_brand,
                nr.vehicle_model,
                nr.vehicle_year,
                nr.vehicle_color,

                i.original_image_path,
                i.annotated_image_path,
                i.parts_mask_path,
                i.parts_overlay_path,
                i.damage_parts_annotated_path,
                i.accepted_side,
                i.najm_damage_area,
                i.api_damage_area,
                i.api_confidence,
                i.is_accepted

            FROM cases c
            LEFT JOIN user_profiles up
                ON up.id = c.user_profile_id
            LEFT JOIN auth_accounts aa
                ON aa.id = up.auth_account_id
            LEFT JOIN vehicles v
                ON v.id = c.vehicle_id
            LEFT JOIN najm_reports nr
                ON nr.case_id = c.id
            LEFT JOIN images i
                ON i.case_id = c.id
            WHERE c.id = :case_id
        """),
        {"case_id": case_id}
    ).mappings().first()

    if not case_row:
        raise ValueError("Case not found.")

    damages_rows = db.execute(
        text("""
            SELECT
                d.id,
                d.damage_no,
                d.damage_type_en,
                d.damage_type_ar,
                d.damage_confidence,
                d.severity_en,
                d.severity_ar,
                d.severity_confidence,
                d.part_name_en,
                d.part_name_ar,
                d.crop_path,
                d.area_ratio,
                d.mask_pixels,
                d.vote_ratio,
                d.vote_label,

                cei.part_price,
                cei.labor_cost,
                cei.subtotal_before_fault,
                cei.subtotal_after_fault

            FROM damages d
            LEFT JOIN cost_estimate_items cei
                ON cei.damage_id = d.id
            WHERE d.case_id = :case_id
            ORDER BY d.damage_no ASC
        """),
        {"case_id": case_id}
    ).mappings().all()

    total_row = db.execute(
        text("""
            SELECT
                tce.damages_count,
                tce.total_parts,
                tce.total_labor,
                tce.total_estimated_cost,
                tce.adjusted_cost
            FROM total_cost_estimates tce
            WHERE tce.case_id = :case_id
            ORDER BY tce.created_at DESC
            LIMIT 1
        """),
        {"case_id": case_id}
    ).mappings().first()

    return {
        "case": dict(case_row),
        "damages": [dict(r) for r in damages_rows],
        "total": dict(total_row) if total_row else None,
    }


def build_pdf(report_data: dict, output_path: Path):
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "TitleCustom",
        parent=styles["Title"],
        fontSize=20,
        leading=24,
        textColor=colors.black,
        spaceAfter=10,
    )

    section_style = ParagraphStyle(
        "SectionCustom",
        parent=styles["Heading2"],
        fontSize=13,
        leading=16,
        textColor=colors.black,
        spaceBefore=10,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        "BodyCustom",
        parent=styles["BodyText"],
        fontSize=10,
        leading=13,
        textColor=colors.black,
    )

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )

    elements = []
    case = report_data["case"]
    damages = report_data["damages"]
    total = report_data["total"]

    full_name = " ".join([
        case.get("first_name") or "",
        case.get("second_name") or "",
        case.get("third_name") or "",
        case.get("last_name") or "",
    ]).strip()

    elements.append(Paragraph("Qadder Final Vehicle Damage Report", title_style))
    # Logo
    try:
        logo = Image(str(LOGO_PATH), width=8*cm, height=2*cm)
        logo.hAlign = "CENTER"
        elements.append(logo)
        elements.append(Spacer(1, 10))
    except:
        pass

    elements.append(Spacer(1, 10))
    elements.append(Paragraph(f"Case Number: {case.get('case_number') or '—'}", body_style))
    elements.append(Paragraph(f"Case ID: {case.get('id') or '—'}", body_style))
    elements.append(Spacer(1, 10))

    elements.append(Paragraph("Owner Information", section_style))
    owner_table = Table([
        ["Full Name", full_name or "—"],
        ["National ID", case.get("national_id") or "—"],
        ["Nationality", case.get("nationality") or "—"],
        ["Phone Number", case.get("phone_number") or "—"],
        ["Email", case.get("email") or "—"],
    ], colWidths=[5 * cm, 11 * cm])
    owner_table.setStyle(_table_style())
    elements.append(owner_table)
    elements.append(Spacer(1, 10))

    elements.append(Paragraph("Vehicle Information", section_style))
    vehicle_table = Table([
        ["Brand", case.get("brand") or "—"],
        ["Model", case.get("model") or "—"],
        ["Year", str(case.get("year") or "—")],
        ["Color", case.get("color") or "—"],
        ["Plate Number", case.get("plate_number") or "—"],
    ], colWidths=[5 * cm, 11 * cm])
    vehicle_table.setStyle(_table_style())
    elements.append(vehicle_table)
    elements.append(Spacer(1, 10))

    elements.append(Paragraph("Najm Report Information", section_style))
    najm_table = Table([
        ["Accident ID", case.get("accident_id") or "—"],
        ["Accident Date", str(case.get("accident_date") or "—")],
        ["Accident Time", str(case.get("accident_time") or "—")],
        ["Fault Percentage", f"{case.get('fault_percentage')}%" if case.get("fault_percentage") is not None else "—"],        ["Damage Area", case.get("damage_area_ar") or case.get("damage_area") or "—"],
        ["Party Full Name", case.get("party_full_name") or "—"],
        ["License Type", case.get("license_type") or "—"],
        ["Party Mobile", case.get("party_mobile") or "—"],
    ], colWidths=[5 * cm, 11 * cm])
    najm_table.setStyle(_table_style())
    elements.append(najm_table)
    elements.append(Spacer(1, 10))
    
    elements.append(PageBreak())

    elements.append(Paragraph("Vehicle Image", section_style))
    elements.append(Spacer(1, 6))

    original_image = case.get("original_image_path")

    if original_image:
        try:
            img = Image(original_image, width=14*cm, height=8*cm)
            elements.append(img)
            elements.append(Spacer(1, 8))
        except:
            pass
        
        elements.append(Paragraph("Damage Details", section_style))

    if damages:
        damage_rows = [[
            "No",
            "Type",
            "Severity",
            "Part",
            "Part Price",
            "Labor",
            "After Fault",
        ]]

        for d in damages:
            part_price = float(d.get("part_price") or 0)
            labor_cost = float(d.get("labor_cost") or 0)
            after_fault = float(d.get("subtotal_after_fault") or 0)

            damage_rows.append([
                str(d.get("damage_no") or "—"),
                d.get("damage_type_ar") or d.get("damage_type_en") or "—",
                d.get("severity_ar") or d.get("severity_en") or "—",
                d.get("part_name_ar") or d.get("part_name_en") or "—",
                f"{part_price:,.2f} SAR",
                f"{labor_cost:,.2f} SAR",
                f"{after_fault:,.2f} SAR",
            ])

        damages_table = Table(
            damage_rows,
            colWidths=[1.2 * cm, 3.2 * cm, 2.5 * cm, 3.2 * cm, 2.2 * cm, 2.0 * cm, 2.5 * cm]
        )
        damages_table.setStyle(_table_style(header=True))
        elements.append(damages_table)
    else:
        elements.append(Paragraph("No damages found.", body_style))

    elements.append(Spacer(1, 12))

    elements.append(Paragraph("Pricing Summary", section_style))

    damages_count = (total or {}).get("damages_count")
    total_parts = float((total or {}).get("total_parts") or 0)
    total_labor = float((total or {}).get("total_labor") or 0)
    total_estimated_cost = float((total or {}).get("total_estimated_cost") or 0)
    adjusted_cost = float((total or {}).get("adjusted_cost") or 0)

    summary_table = Table([
        ["Damages Count", str(damages_count or "—")],
        ["Total Parts", f"{total_parts:,.2f} SAR"],
        ["Total Labor", f"{total_labor:,.2f} SAR"],
        ["Total Estimated Cost", f"{total_estimated_cost:,.2f} SAR"],
        ["Adjusted Cost", f"{adjusted_cost:,.2f} SAR"],
    ], colWidths=[5 * cm, 11 * cm])

    summary_table.setStyle(_table_style())
    elements.append(summary_table)
    doc.build(elements)


def _table_style(header: bool = False):
    style = [
        ("BOX", (0, 0), (-1, -1), 0.8, colors.black),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("FONTNAME", (0, 0), (-1, -1), "Arabic"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("LEADING", (0, 0), (-1, -1), 11),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("BACKGROUND", (0, 0), (-1, -1), colors.whitesmoke),
    ]

    if header:
        style.extend([
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("FONTNAME", (0, 0), (-1, 0), "Arabic"),
        ])

    return TableStyle(style)


def upsert_qadder_report(db: Session, case_id: str, report_path: str):
    existing = db.execute(
        text("""
            SELECT id
            FROM qadder_reports
            WHERE case_id = :case_id
            LIMIT 1
        """),
        {"case_id": case_id}
    ).mappings().first()

    if existing:
        db.execute(
            text("""
                UPDATE qadder_reports
                SET report_path = :report_path,
                    created_at = CURRENT_TIMESTAMP
                WHERE case_id = :case_id
            """),
            {
                "case_id": case_id,
                "report_path": report_path,
            }
        )
    else:
        db.execute(
            text("""
                INSERT INTO qadder_reports (
                    id,
                    case_id,
                    report_path
                )
                VALUES (
                    :id,
                    :case_id,
                    :report_path
                )
            """),
            {
                "id": str(uuid4()),
                "case_id": case_id,
                "report_path": report_path,
            }
        )


def update_case_status(db: Session, case_id: str, status_value: str):
    db.execute(
        text("""
            UPDATE cases
            SET status = :status_value,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :case_id
        """),
        {
            "case_id": case_id,
            "status_value": status_value,
        }
    )


def run_step8(db: Session, case_id: str):
    report_data = fetch_case_report_data(db, case_id)

    case_number = report_data["case"].get("case_number") or case_id
    output_filename = f"Case_{case_number}_Qadder_Report.pdf"
    output_path = REPORTS_DIR / output_filename

    build_pdf(report_data, output_path)

    relative_report_path = f"uploads/QadderReport/{output_filename}"

    upsert_qadder_report(
        db=db,
        case_id=case_id,
        report_path=relative_report_path,
    )

    update_case_status(db, case_id, "completed")
    db.commit()

    return {
        "case_id": case_id,
        "case_number": report_data["case"].get("case_number"),
        "report_path": relative_report_path,
        "damages_count": len(report_data["damages"]),
        "message": "Final PDF report generated successfully."
    }