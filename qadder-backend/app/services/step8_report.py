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


# Fetch complete report data for the given case_id
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

# Insert or update report for the given case_id
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

# Update case status and last modified time
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
        return f"{float(value):,.2f} ريال"
    except Exception:
        return "0.00 ريال"


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


def build_label_value_row(label: str, value=None) -> str:
    return f"""
    <div class="info-row">
      <div class="label">{safe_text(label)}</div>
      <div class="value">{safe_text(value) if value not in (None, "") else "—"}</div>
    </div>
    """


# HTML report builder
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
                <td>{safe_text(damage.get("damage_type_ar"))}</td>
                <td>{safe_text(damage.get("severity_ar"))}</td>
                <td>{safe_text(damage.get("part_name_ar"))}</td>
                <td>{format_currency(damage.get("part_price"))}</td>
                <td>{format_currency(damage.get("labor_cost"))}</td>
                <td>{format_currency(damage.get("subtotal_before_fault"))}</td>
                <td>{format_currency(damage.get("subtotal_after_fault"))}</td>
            </tr>
            """
    else:
        damages_rows_html = """
        <tr>
            <td colspan="8" class="empty-cell">لا توجد أضرار مسجلة</td>
        </tr>
        """

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
          </div>
          <div class="rejection-box">
            <div class="rejection-title">تم رفض الطلب</div>
            <div class="rejection-message">
              نظرًا لارتفاع شدة الضرر، يرجى التوجه إلى أحد مراكز التقدير المعتمدة لاستكمال إجراءات التقييم ومعاينة المركبة بشكل دقيق.
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
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 6%;">#</th>
                  <th style="width: 18%;">نوع الضرر</th>
                  <th style="width: 16%;">الشدة</th>
                  <th style="width: 18%;">الجزء المتضرر</th>
                  <th style="width: 11%;">سعر القطعة</th>
                  <th style="width: 11%;">أجرة العمل</th>
                  <th style="width: 10%;">الإجمالي قبل نسبة الخطأ</th>
                  <th style="width: 10%;">الإجمالي بعد نسبة الخطأ</th>
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
            </div>

            <div class="summary-grid">
              <div class="summary-card">
                <div class="k">عدد الأضرار</div>
                <div class="v">{safe_text(damages_count)}</div>
              </div>

              <div class="summary-card">
                <div class="k">إجمالي تكلفة القطع</div>
                <div class="v">{format_currency(total_parts)}</div>
              </div>

              <div class="summary-card">
                <div class="k">إجمالي شغل اليد</div>
                <div class="v">{format_currency(total_labor)}</div>
              </div>

              <div class="summary-card">
                <div class="k">الإجمالي قبل نسبة الخطأ</div>
                <div class="v">{format_currency(total_estimated_cost)}</div>
              </div>

              <div class="summary-card highlight" style="grid-column: 1 / -1;">
                <div class="k">الإجمالي النهائي بعد نسبة الخطأ</div>
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
      <title>تقرير تقدير أضرار المركبة</title>
      <style>
        @page {{
          size: A4;
          margin: 14mm 10mm 14mm 10mm;
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
          background: #F7FAF7;
          color: #163020;
          line-height: 1.7;
          font-size: 12px;
        }}

        .page {{
          width: 100%;
        }}

        .report-shell {{
          background: #F7FAF7;
          padding: 0;
        }}

        .hero-top {{
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 12px;
          margin-bottom: 16px;
        }}

        .logo-box {{
          display: flex;
          justify-content: center;
          width: 100%;
        }}

        .logo-box img {{
          max-height: 70px;
          max-width: 190px;
          object-fit: contain;
          display: block;
        }}

        .report-main-title {{
          margin: 0;
          font-size: 35px;
          font-weight: 800;
          line-height: 1.3;
          color: #1F5F3B;
          text-align: center;
        }}

        .header {{
          background: linear-gradient(135deg, #1F5F3B 0%, #2E7D4F 100%);
          border-radius: 22px;
          padding: 14px 16px;
          margin: 0 auto 18px auto;
          width: fit-content;
          min-width: 100%;
          max-width: 100%;
          box-shadow: 0 8px 24px rgba(31, 95, 59, 0.15);
          color: #ffffff;
        }}

        .header-cards {{
          display: grid;
          grid-template-columns: repeat(2, minmax(220px, 1fr));
          gap: 12px;
          align-items: center;
        }}

        .meta-card {{
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.24);
          border-radius: 16px;
          padding: 12px 16px;
          min-height: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }}

        .meta-line {{
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
          text-align: center;
          line-height: 1.5;
        }}

        .meta-label {{
          font-size: 14px;
          color: #EAF4EC;
          font-weight: 700;
          margin: 0;
        }}

        .meta-value {{
          font-size: 16px;
          font-weight: 800;
          color: #ffffff;
          word-break: break-word;
          margin: 0;
        }}

        .section {{
          background: #FFFFFF;
          border: 1px solid #D9E8DD;
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 16px;
          page-break-inside: avoid;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
        }}

        .section-title {{
          margin-bottom: 14px;
          border-bottom: 2px solid #E5EFE7;
          padding-bottom: 8px;
        }}

        .section-title .ar {{
          color: #1F5F3B;
          font-size: 18px;
          font-weight: 800;
        }}

        .two-col {{
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }}

        .info-row {{
          display: grid;
          grid-template-columns: 150px 1fr;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid #EDF3EE;
        }}

        .info-row:last-child {{
          border-bottom: none;
        }}

        .label {{
          font-weight: 700;
          color: #1F5F3B;
          text-align: right;
          line-height: 1.6;
        }}

        .value {{
          background: #F9FBF9;
          border: 1px solid #DDE9E0;
          border-radius: 12px;
          padding: 8px 12px;
          min-height: 42px;
          color: #1E293B;
          text-align: right;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          line-height: 1.6;
          word-break: break-word;
        }}

        .image-box {{
          background: #FFFFFF;
          border: 1px solid #DDE9E0;
          border-radius: 16px;
          padding: 14px;
          text-align: center;
        }}

        .vehicle-image {{
          width: 100%;
          max-height: 380px;
          object-fit: contain;
          border-radius: 12px;
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
          background: #1F5F3B;
          color: #ffffff;
          padding: 10px 8px;
          font-size: 11px;
          border: 1px solid #18492E;
          text-align: center;
          font-weight: 700;
        }}

        td {{
          background: #ffffff;
          border: 1px solid #E3ECE5;
          padding: 8px;
          vertical-align: top;
          font-size: 11px;
          text-align: center;
          word-wrap: break-word;
        }}

        .summary-grid {{
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }}

        .summary-card {{
          background: #ffffff;
          border: 1px solid #DDE9E0;
          border-radius: 14px;
          padding: 14px;
        }}

        .summary-card .k {{
          color: #5C7564;
          font-size: 11px;
          margin-bottom: 6px;
        }}

        .summary-card .v {{
          color: #1F5F3B;
          font-size: 18px;
          font-weight: 800;
        }}

        .highlight {{
          border: 2px solid #1F5F3B;
          background: #F2F8F3;
        }}

        .empty-cell {{
          text-align: center;
          padding: 18px;
          font-weight: 700;
          color: #4B5563;
        }}

        .rejection-section {{
          border: 2px solid #D97706;
          background: #FFF8ED;
        }}

        .rejection-box {{
          background: #ffffff;
          border: 1px solid #F3C38B;
          border-radius: 14px;
          padding: 20px;
        }}

        .rejection-title {{
          color: #B45309;
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 10px;
        }}

        .rejection-message {{
          color: #7C2D12;
          font-size: 15px;
          font-weight: 600;
        }}

        .footer-note {{
          background: #1F5F3B;
          color: white;
          border-radius: 16px;
          padding: 14px 16px;
          margin-top: 10px;
          font-size: 11px;
          line-height: 1.8;
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

          <section class="hero-top">
            <div class="logo-box">
              {f'<img src="{logo_data_uri}" alt="شعار قدر" />' if logo_data_uri else ''}
            </div>

            <h1 class="report-main-title">تقرير تقدير أضرار المركبة</h1>
          </section>

          <section class="header">
            <div class="header-cards">
              <div class="meta-card">
                <div class="meta-line">
                  <span class="meta-label">رقم الحالة:</span>
                  <span class="meta-value">{safe_text(case.get("case_number"))}</span>
                </div>
              </div>

              <div class="meta-card">
                <div class="meta-line">
                  <span class="meta-label">تاريخ التقرير:</span>
                  <span class="meta-value">{safe_text(report_date)}</span>
                </div>
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section-title">
              <div class="ar">بيانات مالك المركبة</div>
            </div>
            <div class="two-col">
              <div>
                {build_label_value_row("الاسم الكامل", full_name)}
                {build_label_value_row("رقم الهوية", case.get("national_id"))}
                {build_label_value_row("الجنسية", case.get("nationality"))}
                {build_label_value_row("نوع الرخصة", case.get("license_type"))}
              </div>
              <div>
                {build_label_value_row("رقم الجوال", case.get("phone_number"))}
                {build_label_value_row("البريد الإلكتروني", case.get("email"))}
                {build_label_value_row("تاريخ انتهاء الرخصة", case.get("license_expiry_date"))}
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section-title">
              <div class="ar">بيانات المركبة</div>
            </div>
            <div class="two-col">
              <div>
                {build_label_value_row("العلامة التجارية", case.get("brand"))}
                {build_label_value_row("الموديل", case.get("model"))}
                {build_label_value_row("سنة الصنع", case.get("year"))}
              </div>
              <div>
                {build_label_value_row("اللون", case.get("color"))}
                {build_label_value_row("رقم اللوحة", case.get("plate_number"))}
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section-title">
              <div class="ar">معلومات الحادث وتقرير نجم</div>
            </div>
            <div class="two-col">
              <div>
                {build_label_value_row("رقم الحادث", case.get("accident_id"))}
                {build_label_value_row("تاريخ / وقت الحادث ", case.get("accident_time"))}
                {build_label_value_row("نسبة الخطأ", format_percent(case.get("fault_percentage")))}
                {build_label_value_row("منطقة الضرر", case.get("damage_area_ar") or case.get("damage_area"))}
              </div>
              <div>
                {build_label_value_row("إحداثيات الحادث", case.get("accident_coordinates"))}
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section-title">
              <div class="ar">الصورة الأصلية للمركبة</div>
            </div>
            <div class="image-box">
              {f'<img class="vehicle-image" src="{vehicle_image_data_uri}" alt="صورة المركبة" />' if vehicle_image_data_uri else '<div>لا توجد صورة متاحة</div>'}
            </div>
          </section>

          {rejection_section_html}

          {normal_sections_html}

          <div class="footer-note">
            هذا التقرير تم توليده آليًا بناءً على البيانات المخزنة في النظام ويُستخدم لأغراض التوثيق والتقدير المالي والمطالبة بالتعويض.
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


# MAIN STEP 8
# Generate and save final report while updating case status
def run_step8(db: Session, case_id: str) -> dict:
    report_data = fetch_case_report_data(db, case_id)
    current_status = report_data["case"].get("status")

    if current_status != "step3_rejected_high_severity":
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