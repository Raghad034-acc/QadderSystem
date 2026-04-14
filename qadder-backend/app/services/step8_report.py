from __future__ import annotations

import asyncio
import base64
import html
import mimetypes
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from playwright.async_api import async_playwright
from sqlalchemy import text
from sqlalchemy.orm import Session


PROJECT_ROOT = Path(__file__).resolve().parents[2]
REPORTS_DIR = PROJECT_ROOT / "uploads" / "QadderReport"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

LOGO_PATH = PROJECT_ROOT / "assets" / "qadder_logo.png"
FONT_PATH = PROJECT_ROOT / "fonts" / "Cairo-Regular.ttf"


# ============================================================
# DB helpers
# ============================================================
def fetch_case_report_data(db: Session, case_id: str) -> dict:
    case_row = db.execute(
        text(
            """
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
            """
        ),
        {"case_id": case_id},
    ).mappings().first()

    if not case_row:
        raise ValueError("Case not found.")

    damages_rows = db.execute(
        text(
            """
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
            """
        ),
        {"case_id": case_id},
    ).mappings().all()

    total_row = db.execute(
        text(
            """
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
            """
        ),
        {"case_id": case_id},
    ).mappings().first()

    return {
        "case": dict(case_row),
        "damages": [dict(row) for row in damages_rows],
        "total": dict(total_row) if total_row else None,
    }


def upsert_qadder_report(db: Session, case_id: str, report_path: str) -> None:
    existing = db.execute(
        text(
            """
            SELECT id
            FROM qadder_reports
            WHERE case_id = :case_id
            LIMIT 1
            """
        ),
        {"case_id": case_id},
    ).mappings().first()

    if existing:
        db.execute(
            text(
                """
                UPDATE qadder_reports
                SET report_path = :report_path,
                    created_at = CURRENT_TIMESTAMP
                WHERE case_id = :case_id
                """
            ),
            {
                "case_id": case_id,
                "report_path": report_path,
            },
        )
    else:
        db.execute(
            text(
                """
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
                """
            ),
            {
                "id": str(uuid4()),
                "case_id": case_id,
                "report_path": report_path,
            },
        )


def update_case_status(db: Session, case_id: str, status_value: str) -> None:
    db.execute(
        text(
            """
            UPDATE cases
            SET status = :status_value,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :case_id
            """
        ),
        {
            "case_id": case_id,
            "status_value": status_value,
        },
    )


# ============================================================
# HTML helpers
# ============================================================
def safe_text(value) -> str:
    if value is None:
        return "—"
    text_value = str(value).strip()
    return html.escape(text_value) if text_value else "—"


def format_currency(value) -> str:
    try:
        return f"{float(value):,.2f} SAR"
    except Exception:
        return "0.00 SAR"


def format_percent(value) -> str:
    try:
        return f"{float(value):.0f}%"
    except Exception:
        return "0%"


def join_full_name(*parts) -> str:
    cleaned = [str(p).strip() for p in parts if p and str(p).strip()]
    return " ".join(cleaned) if cleaned else "—"


def file_to_data_uri(file_path: Path | str | None) -> str:
    if not file_path:
        return ""

    try:
        path = Path(file_path)
        if not path.is_absolute():
            path = PROJECT_ROOT / str(file_path)

        if not path.exists():
            return ""

        mime_type, _ = mimetypes.guess_type(str(path))
        mime_type = mime_type or "application/octet-stream"

        encoded = base64.b64encode(path.read_bytes()).decode("utf-8")
        return f"data:{mime_type};base64,{encoded}"
    except Exception:
        return ""


def font_to_base64(font_path: Path) -> str:
    if not font_path.exists():
        return ""
    return base64.b64encode(font_path.read_bytes()).decode("utf-8")


def build_label_value_row(label_ar: str, label_en: str, value) -> str:
    return f"""
    <div class="info-row">
        <div class="label">
            <div>{safe_text(label_ar)}</div>
            <div class="label-en">{safe_text(label_en)}</div>
        </div>
        <div class="value">{safe_text(value)}</div>
    </div>
    """


# ============================================================
# HTML report builder
# ============================================================
def build_html_report(report_data: dict) -> str:
    case = report_data["case"]
    damages = report_data["damages"]
    total = report_data["total"] or {}

    case_status = case.get("status")
    is_high_severity_rejected = case_status == "step3_rejected_high_severity"

    full_name = join_full_name(
        case.get("first_name"),
        case.get("second_name"),
        case.get("third_name"),
        case.get("last_name"),
    )

    created_at = case.get("created_at")
    if created_at:
        try:
            report_date = str(created_at)
        except Exception:
            report_date = "—"
    else:
        report_date = datetime.now().strftime("%Y-%m-%d %H:%M")

    logo_data_uri = file_to_data_uri(LOGO_PATH)
    vehicle_image_data_uri = file_to_data_uri(case.get("original_image_path"))
    cairo_base64 = font_to_base64(FONT_PATH)

    damages_count = total.get("damages_count") or len(damages)
    total_parts = total.get("total_parts") or 0
    total_labor = total.get("total_labor") or 0
    total_estimated_cost = total.get("total_estimated_cost") or 0
    adjusted_cost = total.get("adjusted_cost") or 0

    damages_rows_html = ""
    if damages:
        for damage in damages:
            damages_rows_html += f"""
            <tr>
                <td>{safe_text(damage.get("damage_no"))}</td>
                <td>
                    <div>{safe_text(damage.get("damage_type_ar"))}</div>
                    <div class="muted">{safe_text(damage.get("damage_type_en"))}</div>
                </td>
                <td>
                    <div>{safe_text(damage.get("severity_ar"))}</div>
                    <div class="muted">{safe_text(damage.get("severity_en"))}</div>
                </td>
                <td>
                    <div>{safe_text(damage.get("part_name_ar"))}</div>
                    <div class="muted">{safe_text(damage.get("part_name_en"))}</div>
                </td>
                <td>{format_currency(damage.get("part_price"))}</td>
                <td>{format_currency(damage.get("labor_cost"))}</td>
                <td>{format_currency(damage.get("subtotal_before_fault"))}</td>
                <td>{format_currency(damage.get("subtotal_after_fault"))}</td>
            </tr>
            """
    else:
        damages_rows_html = """
        <tr>
            <td colspan="8" class="empty-cell">لا توجد أضرار مسجلة / No damages found</td>
        </tr>
        """

    other_vehicle_value = " / ".join(
        [
            str(case.get("vehicle_brand") or "—"),
            str(case.get("vehicle_model") or "—"),
            str(case.get("vehicle_year") or "—"),
        ]
    )

    font_face_css = ""
    if cairo_base64:
        font_face_css = f"""
        @font-face {{
          font-family: 'CairoCustom';
          src: url(data:font/ttf;base64,{cairo_base64}) format('truetype');
          font-weight: normal;
          font-style: normal;
        }}
        """

    font_family_css = "'CairoCustom', Arial, sans-serif" if cairo_base64 else "Arial, sans-serif"

    rejection_section_html = ""
    if is_high_severity_rejected:
        rejection_section_html = """
        <section class="section rejection-section">
          <div class="section-title">
            <div class="ar">حالة الطلب</div>
            <div class="en">Request Status</div>
          </div>

          <div class="rejection-box">
            <div class="rejection-title">تم رفض الطلب</div>
            <div class="rejection-message">
              تم رفض الطلب: شدة الضرر مرتفعة. يرجى التوجه إلى أقرب مركز تقدير لإكمال التقييم.
            </div>
            <div class="rejection-message-en">
              Request rejected: The damage severity is high. Please visit the nearest Taqdeer center to complete the assessment.
            </div>
          </div>
        </section>
        """

    normal_sections_html = ""
    if not is_high_severity_rejected:
        normal_sections_html = f"""
          <section class="section">
            <div class="section-title">
              <div class="ar">تفاصيل الأضرار والتكاليف</div>
              <div class="en">Damage Details & Cost Breakdown</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 6%;">#</th>
                  <th style="width: 18%;">نوع الضرر<br><span class="small">Damage Type</span></th>
                  <th style="width: 16%;">الشدة<br><span class="small">Severity</span></th>
                  <th style="width: 18%;">الجزء المتضرر<br><span class="small">Damaged Part</span></th>
                  <th style="width: 11%;">سعر القطعة<br><span class="small">Part Price</span></th>
                  <th style="width: 11%;">أجرة العمل<br><span class="small">Labor</span></th>
                  <th style="width: 10%;">قبل الخطأ<br><span class="small">Before Fault</span></th>
                  <th style="width: 10%;">بعد الخطأ<br><span class="small">After Fault</span></th>
                </tr>
              </thead>
              <tbody>
                {damages_rows_html}
              </tbody>
            </table>
          </section>

          <section class="section">
            <div class="section-title">
              <div class="ar">الملخص المالي النهائي</div>
              <div class="en">Final Pricing Summary</div>
            </div>

            <div class="summary-grid">
              <div class="summary-card">
                <div class="k">عدد الأضرار | Damages Count</div>
                <div class="v">{safe_text(damages_count)}</div>
              </div>

              <div class="summary-card">
                <div class="k">إجمالي القطع | Total Parts</div>
                <div class="v">{format_currency(total_parts)}</div>
              </div>

              <div class="summary-card">
                <div class="k">إجمالي العمالة | Total Labor</div>
                <div class="v">{format_currency(total_labor)}</div>
              </div>

              <div class="summary-card">
                <div class="k">الإجمالي قبل نسبة الخطأ | Total Before Fault</div>
                <div class="v">{format_currency(total_estimated_cost)}</div>
              </div>

              <div class="summary-card highlight" style="grid-column: 1 / -1;">
                <div class="k">الإجمالي النهائي بعد نسبة الخطأ | Final Adjusted Cost</div>
                <div class="v">{format_currency(adjusted_cost)}</div>
              </div>
            </div>
          </section>
        """

    return f"""
    <!doctype html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8" />
      <title>Qadder Final Report</title>
      <style>
        @page {{
          size: A4;
          margin: 16mm 12mm 16mm 12mm;
        }}

        {font_face_css}

        * {{
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }}

        body {{
          margin: 0;
          font-family: {font_family_css};
          background: #FCFFE4;
          color: #000000;
          line-height: 1.6;
          font-size: 12px;
        }}

        .page {{ width: 100%; }}
        .report-shell {{ background: #FCFFE4; padding: 0; }}

        .header {{
          background: linear-gradient(135deg, #102F15 0%, #274B2C 100%);
          color: white;
          border-radius: 18px;
          padding: 20px 24px;
          margin-bottom: 18px;
        }}

        .header-top {{
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
        }}

        .logo-box img {{
          max-height: 70px;
          max-width: 180px;
          object-fit: contain;
          display: block;
          background: white;
          padding: 8px 10px;
          border-radius: 12px;
        }}

        .header-title {{
          flex: 1;
          text-align: left;
        }}

        .header-title h1 {{
          margin: 0 0 4px;
          font-size: 28px;
          line-height: 1.2;
        }}

        .header-title h2 {{
          margin: 0;
          font-size: 16px;
          font-weight: 500;
          opacity: 0.95;
        }}

        .meta-grid {{
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 18px;
        }}

        .meta-card {{
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 12px;
          padding: 10px 12px;
        }}

        .meta-card .meta-label {{
          font-size: 11px;
          opacity: 0.85;
          margin-bottom: 4px;
        }}

        .meta-card .meta-value {{
          font-size: 14px;
          font-weight: 700;
        }}

        .section {{
          background: #fcffc4;
          border: 1px solid #ADC893;
          border-radius: 16px;
          padding: 18px;
          margin-bottom: 16px;
          page-break-inside: avoid;
        }}

        .section-title {{
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          border-bottom: 2px solid #ADC893;
          padding-bottom: 8px;
        }}

        .section-title .ar {{
          color: #102F15;
          font-size: 18px;
          font-weight: 700;
        }}

        .section-title .en {{
          color: #274B2C;
          font-size: 13px;
          font-weight: 600;
          direction: ltr;
        }}

        .two-col {{
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }}

        .info-row {{
            display: flex;
        justify-content: space-between;
        align-items: center;
        background: transparent;
        padding: 8px 0;
        border-bottom: 1px solid #cfd8a3;
        }}

        .info-row:last-child {{
          border-bottom: none;
        }}

        .label {{
          font-weight: 700;
          color: #102F15;
        }}

        .label-en {{
          font-size: 11px;
          color: #274B2C;
          direction: ltr;
        }}

        .value {{
          background: #ffffff;
          border: 1px solid #ADC893;
          border-radius: 10px;
          padding: 8px 10px;
          min-height: 38px;
          word-break: break-word;
        }}

        .image-box {{
          background: #ffffff;
          border: 1px solid #ADC893;
          border-radius: 14px;
          padding: 12px;
          text-align: center;
        }}

        .vehicle-image {{
          width: 100%;
          max-height: 380px;
          object-fit: contain;
          border-radius: 10px;
        }}

        table {{
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }}

        thead {{
          display: table-header-group;
        }}

        tr {{
          page-break-inside: avoid;
        }}

        th {{
          background: #274B2C;
          color: #ffffff;
          padding: 10px 8px;
          font-size: 11px;
          border: 1px solid #1f3a22;
          text-align: center;
        }}

        td {{
          background: #ffffff;
          border: 1px solid #ADC893;
          padding: 8px;
          vertical-align: top;
          font-size: 11px;
          word-wrap: break-word;
        }}

        .muted {{
          color: #5f5f5f;
          font-size: 10px;
          direction: ltr;
        }}

        .summary-grid {{
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }}

        .summary-card {{
          background: #ffffff;
          border: 1px solid #ADC893;
          border-radius: 12px;
          padding: 12px;
        }}

        .summary-card .k {{
          color: #274B2C;
          font-size: 11px;
          margin-bottom: 6px;
        }}

        .summary-card .v {{
          color: #102F15;
          font-size: 18px;
          font-weight: 700;
        }}

        .highlight {{
          border: 2px solid #274B2C;
          background: #f7ffe2;
        }}

        .empty-cell {{
          text-align: center;
          padding: 18px;
          font-weight: 700;
        }}

        .rejection-section {{
          border: 2px solid #c96b2c;
          background: #fff6ee;
        }}

        .rejection-box {{
          background: #ffffff;
          border: 1px solid #f0b58a;
          border-radius: 14px;
          padding: 20px;
        }}

        .rejection-title {{
          color: #a94400;
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 10px;
        }}

        .rejection-message {{
          color: #5c2b00;
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 8px;
        }}

        .rejection-message-en {{
          color: #7a4b25;
          font-size: 12px;
          direction: ltr;
        }}

        .footer-note {{
          background: #102F15;
          color: white;
          border-radius: 14px;
          padding: 14px 16px;
          margin-top: 10px;
          font-size: 11px;
        }}

        .footer-note .en {{
          direction: ltr;
          margin-top: 4px;
          opacity: 0.95;
        }}

        .small {{
          font-size: 10px;
        }}

        @media print {{
          .section, .header, .footer-note {{
            break-inside: avoid;
          }}
        }}
      </style>
    </head>
    <body>
      <div class="page">
        <div class="report-shell">

          <section class="header">
            <div class="header-top">
              <div class="header-title">
                <h1>تقرير تقدير أضرار المركبة</h1>
                <h2>Vehicle Damage Assessment Report</h2>
              </div>
              <div class="logo-box">
                {f'<img src="{logo_data_uri}" alt="Qadder Logo" />' if logo_data_uri else ''}
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-card">
                <div class="meta-label">رقم الحالة | Case Number</div>
                <div class="meta-value">{safe_text(case.get("case_number"))}</div>
              </div>
              <div class="meta-card">
                <div class="meta-label">معرّف الحالة | Case ID</div>
                <div class="meta-value small">{safe_text(case.get("id"))}</div>
              </div>
              <div class="meta-card">
                <div class="meta-label">تاريخ التقرير | Report Date</div>
                <div class="meta-value">{safe_text(report_date)}</div>
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section-title">
              <div class="ar">بيانات مالك المركبة</div>
              <div class="en">Owner Information</div>
            </div>
            <div class="two-col">
              <div>
                {build_label_value_row("الاسم الكامل", "Full Name", full_name)}
                {build_label_value_row("رقم الهوية", "National ID", case.get("national_id"))}
                {build_label_value_row("الجنسية", "Nationality", case.get("nationality"))}
              </div>
              <div>
                {build_label_value_row("رقم الجوال", "Phone Number", case.get("phone_number"))}
                {build_label_value_row("البريد الإلكتروني", "Email", case.get("email"))}
                {build_label_value_row("حالة الطلب", "Case Status", case.get("status"))}
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section-title">
              <div class="ar">بيانات المركبة</div>
              <div class="en">Vehicle Information</div>
            </div>
            <div class="two-col">
              <div>
                {build_label_value_row("العلامة التجارية", "Brand", case.get("brand"))}
                {build_label_value_row("الموديل", "Model", case.get("model"))}
                {build_label_value_row("سنة الصنع", "Year", case.get("year"))}
              </div>
              <div>
                {build_label_value_row("اللون", "Color", case.get("color"))}
                {build_label_value_row("رقم اللوحة", "Plate Number", case.get("plate_number"))}
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section-title">
              <div class="ar">معلومات الحادث وتقرير نجم</div>
              <div class="en">Accident & Najm Information</div>
            </div>
            <div class="two-col">
              <div>
                {build_label_value_row("رقم الحادث", "Accident ID", case.get("accident_id"))}
                {build_label_value_row("تاريخ الحادث", "Accident Date", case.get("accident_date"))}
                {build_label_value_row("وقت الحادث", "Accident Time", case.get("accident_time"))}
                {build_label_value_row("نسبة الخطأ", "Fault Percentage", format_percent(case.get("fault_percentage")))}
                {build_label_value_row("منطقة الضرر", "Damage Area", case.get("damage_area_ar") or case.get("damage_area"))}
              </div>
              <div>
                {build_label_value_row("اسم الطرف الآخر", "Other Party Name", case.get("party_full_name"))}
                {build_label_value_row("نوع الرخصة", "License Type", case.get("license_type"))}
                {build_label_value_row("جوال الطرف الآخر", "Other Party Mobile", case.get("party_mobile"))}
                {build_label_value_row("رقم لوحة الطرف الآخر", "Other Vehicle Plate", case.get("vehicle_plate_number"))}
                {build_label_value_row("مركبة الطرف الآخر", "Other Vehicle", other_vehicle_value)}
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section-title">
              <div class="ar">الصورة الأصلية للمركبة</div>
              <div class="en">Original Vehicle Image</div>
            </div>
            <div class="image-box">
              {f'<img class="vehicle-image" src="{vehicle_image_data_uri}" alt="Vehicle Image" />' if vehicle_image_data_uri else '<div>لا توجد صورة متاحة / No image available</div>'}
            </div>
          </section>

          {rejection_section_html}

          {normal_sections_html}

          <div class="footer-note">
            <div>
              هذا التقرير تم توليده آليًا بناءً على البيانات المخزنة في النظام ويُستخدم لأغراض التوثيق والتقدير المالي والمطالبة بالتعويض.
            </div>
            <div class="en">
              This report is automatically generated from the system data and is intended for documentation, financial assessment, and compensation claim purposes.
            </div>
          </div>

        </div>
      </div>
    </body>
    </html>
    """


# ============================================================
# PDF generation from HTML
# ============================================================
async def _generate_pdf_from_html(html_content: str, output_path: Path) -> None:
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.set_content(html_content, wait_until="networkidle")
        await page.emulate_media(media="screen")
        await page.pdf(
            path=str(output_path),
            format="A4",
            print_background=True,
            margin={
                "top": "12mm",
                "right": "10mm",
                "bottom": "12mm",
                "left": "10mm",
            },
        )

        await browser.close()


def generate_pdf_from_html(html_content: str, output_path: Path) -> None:
    asyncio.run(_generate_pdf_from_html(html_content, output_path))


def build_pdf(report_data: dict, output_path: Path) -> None:
    html_content = build_html_report(report_data)
    generate_pdf_from_html(html_content, output_path)


# ============================================================
# MAIN STEP 8
# ============================================================
def run_step8(db: Session, case_id: str) -> dict:
    update_case_status(db, case_id, "completed")
    db.flush()

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

    db.commit()

    return {
        "case_id": case_id,
        "case_number": report_data["case"].get("case_number"),
        "report_path": relative_report_path,
        "damages_count": len(report_data["damages"]),
        "message": "Final PDF report generated successfully",
    }