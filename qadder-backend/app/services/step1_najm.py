"""
Step 1 — Najm PDF Extraction Service

Purpose
-------
Extract structured accident data from Najm PDF report and convert it
into a database-ready format for the `najm_reports` table.

Flow
----
1. Read PDF using PyMuPDF
2. Extract text blocks
3. Convert blocks into structured rows
4. Extract party (driver) information
5. Extract vehicle information
6. Extract accident details
7. Convert extracted fields into NajmReport schema
8. Validate required fields before DB insert

Output
------
{
    "najm_record": dict,
    "missing_fields": list,
    "debug": dict,
    "raw_record": dict,
}
"""

# Standard library
import re
from datetime import datetime, date
from decimal import Decimal
from typing import Any

# Third-party
import fitz


# ---------------------------------------------------
# Settings
# ---------------------------------------------------
# party2 refers to the second driver/party in Najm report
PARTY2_IS_SECOND = True
Y_TOL = 3.0


# ---------------------------------------------------
# Text normalization helpers
# ---------------------------------------------------
def norm(s: str) -> str:
    """Normalize raw extracted text."""
    if s is None:
        return ""
    s = s.replace("\u200f", "").replace("\u200e", "")
    s = s.replace("٪", "%")
    s = re.sub(r"[ \t]+", " ", s)
    return s.strip()


def cleanup_value(v: str) -> str:
    """Clean extracted value from leaked labels, headers, and extra sections."""
    v = norm(v)

    v = re.sub(r"\s*معلومات\s*(?:ا?ل?\s*)?مركبة.*$", "", v, flags=re.IGNORECASE).strip()

    v = re.sub(r"\b(Veh\.?\s*Info\.?|معلومات\s*المركبة|Vehicle\s*Info\.?)\b", "", v, flags=re.IGNORECASE)
    v = re.sub(r"\b(معلومات\s*السائق|Driver\s*Info\.?)\b", "", v, flags=re.IGNORECASE)
    
    v = re.sub(
        r"\b(Nationality|Make/Model|Owner\s*Name|Upload\s*Date|Expiry\s*Date|License\s*Type|Mobile\s*No\.?|ID\s*Number|Damage\s*Area|LD%|Case\s*Number|Version\s*Date|Accident\s*Time)\b",
        "",
        v,
        flags=re.IGNORECASE,
    )
    v = re.sub(r"\s+", " ", v).strip()
    return v


def pick_party(p1: str, p2: str) -> str:
    """Pick the correct party value based on report layout."""
    return p2 if PARTY2_IS_SECOND else p1


def to_ddmmyyyy_from_parts(y: str, mo: str, d: str) -> str:
    """Convert Y/M/D parts into DD/MM/YYYY format."""
    try:
        return f"{int(d):02d}/{int(mo):02d}/{int(y)}"
    except Exception:
        return ""


def normalize_slash_date_to_ddmmyyyy(s: str) -> str:
    """Normalize slash-formatted date like 1450 / 7 / 24 -> 24/07/1450."""
    s = norm(s)
    match = re.search(r"(\d{4})\s*/\s*(\d{1,2})\s*/\s*(\d{1,2})", s)
    if not match:
        return s
    return to_ddmmyyyy_from_parts(match.group(1), match.group(2), match.group(3))


# ---------------------------------------------------
# PDF blocks to structured lines
# ---------------------------------------------------
def get_lines_from_blocks(page: fitz.Page, y_tol: float = 3.0) -> list[list[dict[str, Any]]]:
    """
    Convert PDF text blocks into grouped lines by clustering text segments
    based on similar Y positions.
    """
    blocks = page.get_text("blocks")
    segs: list[dict[str, Any]] = []

    for block in blocks:
        x0, y0, _, _, txt = block[0], block[1], block[2], block[3], block[4]
        txt = norm(txt)
        if not txt:
            continue

        for part in txt.split("\n"):
            part = norm(part)
            if part:
                segs.append({"x0": float(x0), "y0": float(y0), "text": part})

    segs.sort(key=lambda s: (s["y0"], s["x0"]))

    lines = []
    cur = []
    cur_y = None

    for seg in segs:
        if cur_y is None:
            cur_y = seg["y0"]
            cur = [seg]
        elif abs(seg["y0"] - cur_y) <= y_tol:
            cur.append(seg)
        else:
            cur.sort(key=lambda t: t["x0"])
            lines.append(cur)
            cur = [seg]
            cur_y = seg["y0"]

    if cur:
        cur.sort(key=lambda t: t["x0"])
        lines.append(cur)

    return lines


def line_text(line: list[dict[str, Any]]) -> str:
    """Join a clustered line into a readable string."""
    return norm(" ".join([s["text"] for s in line]))


def build_rows(lines: list[list[dict[str, Any]]]) -> list[tuple[str, str]]:
    """
    Build (label, value) rows from extracted lines.
    Heuristic:
    - label ends where the first segment containing "/" appears
    """
    rows = []

    for line in lines:
        idx = None
        for i, seg in enumerate(line):
            if "/" in seg["text"]:
                idx = i
                break

        if idx is None:
            continue

        label = norm(" ".join([s["text"] for s in line[: idx + 1]]))
        raw = cleanup_value(" ".join([s["text"] for s in line[idx + 1 :]]))
        rows.append((label, raw))

    return rows


def get_row_value(rows: list[tuple[str, str]], label_keywords: list[str]) -> str:
    """Return the first matching row value whose label contains one of the keywords."""
    for label, raw in rows:
        label_lower = label.lower()
        if any(keyword.lower() in label_lower for keyword in label_keywords):
            return raw
    return ""


# ---------------------------------------------------
# Split helpers for rows containing both parties
# ---------------------------------------------------
def split_name_two(rest: str) -> tuple[str, str]:
    words = rest.split()
    if len(words) >= 8:
        return " ".join(words[:4]), " ".join(words[4:8])

    mid = len(words) // 2
    return " ".join(words[:mid]), " ".join(words[mid:])


def split_two_numbers(rest: str) -> tuple[str, str]:
    nums = re.findall(r"\d{7,}", rest)
    if len(nums) >= 2:
        return nums[0], nums[1]
    if len(nums) == 1:
        return nums[0], ""
    return "", ""


def split_two_dates(rest: str) -> tuple[str, str]:
    dates = re.findall(r"\d{4}\s*/\s*\d{1,2}\s*/\s*\d{1,2}", rest)

    d1 = normalize_slash_date_to_ddmmyyyy(dates[0]) if len(dates) >= 1 else ""
    d2 = normalize_slash_date_to_ddmmyyyy(dates[1]) if len(dates) >= 2 else ""

    return d1, d2


def split_two_perc(rest: str) -> tuple[str, str]:
    percentages = re.findall(r"(\d{1,3})\s*%", rest)
    if len(percentages) >= 2:
        return percentages[0], percentages[1]
    if len(percentages) == 1:
        return percentages[0], ""
    return "", ""


def split_two_damage(rest: str) -> tuple[str, str]:
    matches = re.findall(
        r"([ء-ي]+)\s*[,،]?\s*(Rear|Front|Left|Right)",
        rest,
        flags=re.IGNORECASE,
    )

    if len(matches) >= 2:
        return f"{matches[0][0]} , {matches[0][1]}", f"{matches[1][0]} , {matches[1][1]}"
    if len(matches) == 1:
        return f"{matches[0][0]} , {matches[0][1]}", ""
    return "", ""


def split_two_plate(rest: str) -> tuple[str, str]:
    pattern = r"(?:[^\n]+?/\s*(?:خصوصي|عمومي|نقل|دبلوماسي|مؤقت))"
    chunks = re.findall(pattern, rest)

    if len(chunks) >= 2:
        return chunks[0].strip(), chunks[1].strip()

    digits = re.findall(r"\d{4}", rest)
    if len(digits) >= 2:
        idx = rest.find(digits[1])
        if idx != -1:
            return rest[:idx].strip(), rest[idx:].strip()

    return rest.strip(), ""


def split_make_model(rest: str) -> tuple[str, str]:
    parts = [p.strip() for p in rest.split("/") if p.strip()]

    if len(parts) == 3:
        make1, mid, make2 = parts[0], parts[1], parts[2]
        mid_words = mid.split()
        if len(mid_words) >= 2:
            model1 = " ".join(mid_words[:-1])
            model2 = mid_words[-1]
            return f"{model1} / {make1}", f"{model2} / {make2}"

    if len(parts) >= 4:
        return f"{parts[1]} / {parts[0]}", f"{parts[3]} / {parts[2]}"

    half = len(parts) // 2
    return " / ".join(parts[:half]).strip(), " / ".join(parts[half:]).strip()


def split_year_color(rest: str) -> tuple[str, str]:
    s = norm(rest)

    arabic_range = r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+"

    pattern = re.compile(
        rf"(?:(?P<c1>{arabic_range})\s*/\s*(?P<y1>19\d{{2}}|20\d{{2}})"
        rf"|(?P<y2>19\d{{2}}|20\d{{2}})\s*/\s*(?P<c2>{arabic_range})"
        rf"|(?P<c3>{arabic_range})\s*(?P<y3>19\d{{2}}|20\d{{2}}))"
    )

    values = []

    for match in pattern.finditer(s):
        if match.group("y1") and match.group("c1"):
            year, color = match.group("y1"), match.group("c1")
        elif match.group("y2") and match.group("c2"):
            year, color = match.group("y2"), match.group("c2")
        else:
            year, color = match.group("y3"), match.group("c3")

        values.append(f"{year} / {color}")

    seen = set()
    uniq = []
    for value in values:
        if value not in seen:
            seen.add(value)
            uniq.append(value)

    if len(uniq) >= 2:
        return uniq[0], uniq[1]
    if len(uniq) == 1:
        return uniq[0], ""
    return s.strip(), ""


def split_owner_two_words(raw: str) -> tuple[str, str]:
    raw = cleanup_value(raw)
    raw = re.sub(r"\s*معلومات.*$", "", raw).strip()
    tokens = raw.split()

    if len(tokens) >= 4:
        return " ".join(tokens[:2]), " ".join(tokens[2:4])

    return raw, ""


# ---------------------------------------------------
# Value mapping helpers
# ---------------------------------------------------
def damage_area_map(mixed_text: str) -> tuple[str, str]:
    """Map Arabic/English damage area text into normalized enum + Arabic label."""
    text = cleanup_value(mixed_text)
    low = text.lower()

    if "rear" in low:
        return "rear", "خلف"
    if "front" in low:
        return "front", "أمام"
    if "left" in low:
        return "left", "يسار"
    if "right" in low:
        return "right", "يمين"

    if any(word in text for word in ["مؤخرة", "خلف"]):
        return "rear", "خلف"
    if any(word in text for word in ["أمام", "مقدمة", "قدام"]):
        return "front", "أمام"
    if "يسار" in text:
        return "left", "يسار"
    if "يمين" in text:
        return "right", "يمين"

    return "", ""


def normalize_plate_to_old_style(plate_chunk: str) -> str:
    """Convert plate chunk into a normalized old-style plate format if possible."""
    plate_chunk = cleanup_value(plate_chunk.replace("،", " "))
    if not plate_chunk:
        return ""

    plate_type_match = re.search(r"(خصوصي|عمومي|نقل|دبلوماسي|مؤقت)", plate_chunk)
    plate_type = plate_type_match.group(1) if plate_type_match else ""

    digits_match = re.search(r"(\d{4})", plate_chunk)
    digits = digits_match.group(1) if digits_match else ""

    letters = re.findall(r"[ء-ي]", plate_chunk)
    letters3 = " ".join(letters[:3]) if letters else ""

    if plate_type and digits and letters3:
        return f"{plate_type} {digits} {letters3}".strip()

    return plate_chunk.strip()


# ---------------------------------------------------
# General field extraction
# ---------------------------------------------------
def extract_general_from_lines(lines: list[list[dict[str, Any]]]) -> tuple[dict[str, str], list[str]]:
    """Extract general report metadata from the page text."""
    full = "\n".join(line_text(line) for line in lines)
    full = norm(full)
    errors: list[str] = []

    version_date = ""
    version_match = re.search(
        r"(?:Date\s*Version|Version\s*Date|تاريخ\s*ا?ل?إصدار)\s*.*?(\d{4})\s*/\s*(\d{1,2})\s*/\s*(\d{1,2})",
        full,
        flags=re.IGNORECASE,
    )
    if version_match:
        version_date = to_ddmmyyyy_from_parts(
            version_match.group(1),
            version_match.group(2),
            version_match.group(3),
        )
    if not version_date:
        errors.append("version_date not found")

    case_number = ""
    case_match = re.search(r"\b(RD\d{6,})\b", full)
    if case_match:
        case_number = case_match.group(1)
    if not case_number:
        errors.append("case_number not found")

    accident_time = ""
    time_match = re.search(
        r"(?:Time\s*Accident|Accident\s*Time|وقت\s*الحادث).*?(\d{1,2}:\d{2}:\d{2}).*?(\d{4})\s*/\s*(\d{1,2})\s*(?:/|\s)\s*(\d{1,2})",
        full,
        flags=re.IGNORECASE,
    )
    if time_match:
        time_value = time_match.group(1)
        year = time_match.group(2)
        month = time_match.group(3)
        day = time_match.group(4)
        accident_time = f"{to_ddmmyyyy_from_parts(year, month, day)} {time_value}"
    if not accident_time:
        errors.append("accident_time not found")

    coordinates = ""
    coordinates_match = re.search(
        r"(?:Coordinate|إحداثيات).*?(\d{1,3}\.\d+)\s*,\s*(\d{1,3}\.\d+)",
        full,
        flags=re.IGNORECASE,
    )
    if coordinates_match:
        # PyMuPDF extraction for this Najm template returns the coordinates
        # in reversed order, so we swap them to preserve the report order.
        coordinates = f"{coordinates_match.group(2)}, {coordinates_match.group(1)}"
    if not coordinates:
        errors.append("coordinates not found")

    accident_id = ""
    accident_id_match = re.search(
        r"(?:رقم\s*الحادث|Accident\s*No\.?|Accident\s*Number)\s*[:\-]?\s*([A-Z0-9\-\/]+)",
        full,
        flags=re.IGNORECASE,
    )
    if accident_id_match:
        accident_id = accident_id_match.group(1).strip()
    if not accident_id:
        errors.append("accident_id not found")

    return {
        "version_date": version_date,
        "case_number": case_number,
        "accident_time": accident_time,
        "coordinates": coordinates,
        "accident_id": accident_id,
    }, errors


# ---------------------------------------------------
# Party2 / vehicle / accident row extraction
# ---------------------------------------------------
def get_party2_value(rows: list[tuple[str, str]], label_keywords: list[str]) -> Any:
    """
    Extract the value related to the second party in Najm report.
    Also used for vehicle and accident fields that share the same row format.
    """
    raw = cleanup_value(get_row_value(rows, label_keywords))
    keyset = [k.lower() for k in label_keywords]

    if "الاسم" in keyset or "name" in keyset:
        p1, p2 = split_name_two(raw)
        return pick_party(p1, p2)

    if "الجنسية" in keyset or "nationality" in keyset:
        tokens = [t for t in raw.split() if t.lower() != "nationality"]
        if len(tokens) >= 2:
            return pick_party(tokens[0], tokens[1])
        return tokens[0] if tokens else ""

    if "العمر" in keyset or "age" in keyset:
        ages = re.findall(r"\|\s*(\d{1,3})", raw)
        if len(ages) >= 2:
            picked = pick_party(ages[0], ages[1])
            return int(picked) if picked.isdigit() else ""
        if len(ages) == 1:
            return int(ages[0])
        return ""

    if any(k in keyset for k in ["رقم الاتصال", "mobile", "الاتصال"]):
        p1, p2 = split_two_numbers(raw)
        return pick_party(p1, p2)

    if any(k in keyset for k in ["رقم الهوية", "id"]):
        p1, p2 = split_two_numbers(raw)
        return pick_party(p1, p2)

    if any(k in keyset for k in ["نوع الرخصة", "license"]):
        matches = re.findall(r"(رخصة\s+\S+)", raw)
        if len(matches) >= 2:
            return pick_party(matches[0], matches[1])
        return matches[0] if matches else raw

    if any(k in keyset for k in ["انتهاء الرخصة", "expiry"]):
        p1, p2 = split_two_dates(raw)
        return pick_party(p1, p2)

    if any(k in keyset for k in ["إضافة الرخصة", "upload"]):
        p1, p2 = split_two_dates(raw)
        return pick_party(p1, p2)

    if any(k in keyset for k in ["اسم المالك", "owner"]):
        p1, p2 = split_owner_two_words(raw)
        picked = pick_party(p1, p2)
        return picked if picked else p1

    if any(k in keyset for k in ["طراز المركبة", "make/model", "model/make", "model"]):
        p1, p2 = split_make_model(raw)
        return pick_party(p1, p2)

    if any(k in keyset for k in ["سنة ولون", "year", "color"]):
        p1, p2 = split_year_color(raw)
        picked = pick_party(p1, p2)
        return picked if picked else p1

    if any(k in keyset for k in ["رقم اللوحة", "plate"]):
        p1, p2 = split_two_plate(raw)
        return normalize_plate_to_old_style(pick_party(p1, p2))

    if any(k in keyset for k in ["نسبة المسؤولية", "ld%"]):
        p1, p2 = split_two_perc(raw)
        picked = pick_party(p1, p2)
        return int(picked) if picked.isdigit() else ""

    if any(k in keyset for k in ["جهة الصدمة", "damage area"]):
        p1, p2 = split_two_damage(raw)
        picked = pick_party(p1, p2)
        return damage_area_map(picked)

    return raw


# ---------------------------------------------------
# Core extraction function
# Reads Najm PDF and returns raw structured output
# ---------------------------------------------------
def extract_step1_najm_report_blocks(pdf_path: str, page_index: int = 0) -> tuple[dict[str, Any], dict[str, Any]]:
    doc = fitz.open(pdf_path)
    page = doc[page_index]
    lines = get_lines_from_blocks(page, y_tol=Y_TOL)
    doc.close()

    general, general_errors = extract_general_from_lines(lines)
    rows = build_rows(lines)

    party2_name = get_party2_value(rows, ["الاسم", "name"])
    party2_nationality = get_party2_value(rows, ["الجنسية", "nationality"])
    party2_age = get_party2_value(rows, ["العمر", "age"])
    party2_mobile = get_party2_value(rows, ["رقم الاتصال", "mobile", "الاتصال"])
    party2_id_number = get_party2_value(rows, ["رقم الهوية", "id"])
    party2_license_type = get_party2_value(rows, ["نوع الرخصة", "license"])
    party2_license_expiry = get_party2_value(rows, ["انتهاء الرخصة", "expiry"])
    party2_upload_date = get_party2_value(rows, ["إضافة الرخصة", "upload"])

    vehicle_owner_name = get_party2_value(rows, ["اسم المالك", "owner"])
    vehicle_make_model = get_party2_value(rows, ["طراز المركبة", "make/model", "model/make", "model"])
    vehicle_year_color = get_party2_value(rows, ["سنة ولون", "year", "color"])
    vehicle_plate_no = get_party2_value(rows, ["رقم اللوحة", "plate"])

    accident_fault_percentage = get_party2_value(rows, ["نسبة المسؤولية", "ld%"])
    accident_damage_area, accident_damage_area_arabic = get_party2_value(rows, ["جهة الصدمة", "damage area"])

    record = {
        "version_date": general["version_date"],
        "case_number": general["case_number"],
        "accident_id": general["accident_id"],
        "accident_time": general["accident_time"],
        "coordinates": general["coordinates"],
        "party2_name": party2_name,
        "party2_nationality": party2_nationality,
        "party2_age": party2_age,
        "party2_mobile": party2_mobile,
        "party2_id_number": party2_id_number,
        "party2_license_type": party2_license_type,
        "party2_license_expiry": party2_license_expiry,
        "party2_upload_date": party2_upload_date,
        "vehicle_owner_name": vehicle_owner_name,
        "vehicle_make_model": vehicle_make_model,
        "vehicle_year_color": vehicle_year_color,
        "vehicle_plate_no": vehicle_plate_no,
        "accident_fault_percentage": accident_fault_percentage,
        "accident_damage_area": accident_damage_area,
        "accident_damage_area_arabic": accident_damage_area_arabic,
        "id": general["case_number"],
    }

    output = {"table": "reports", "record": record}
    debug = {"general_errors": general_errors, "rows_sample": rows[:20]}
    return output, debug


# ---------------------------------------------------
# Post-processing helpers
# ---------------------------------------------------
def parse_datetime_value(value: str) -> tuple[datetime | None, date | None]:
    """Parse Najm accident datetime string into datetime and date objects."""
    if not value:
        return None, None

    value = norm(value)

    for fmt in ("%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M"):
        try:
            dt = datetime.strptime(value, fmt)
            return dt, dt.date()
        except ValueError:
            continue

    return None, None


def split_brand_model(value: str) -> tuple[str, str]:
    """Split combined make/model value into brand and model."""
    value = cleanup_value(value)
    if not value:
        return "", ""

    parts = [p.strip() for p in value.split("/") if p.strip()]
    if len(parts) >= 2:
        return parts[-1], " / ".join(parts[:-1])

    return value, ""


def split_year_color_value(value: str) -> tuple[int | None, str]:
    """Split combined year/color value into separate fields."""
    value = cleanup_value(value)
    if not value:
        return None, ""

    year_match = re.search(r"(19\d{2}|20\d{2})", value)
    year = int(year_match.group(1)) if year_match else None

    color = re.sub(r"(19\d{2}|20\d{2})", "", value)
    color = color.replace("/", " ")
    color = re.sub(r"\s+", " ", color).strip()

    return year, color


def parse_fault_percentage(value: Any) -> Decimal | None:
    """Convert extracted fault percentage into Decimal."""
    if value in (None, ""):
        return None

    try:
        return Decimal(str(value))
    except Exception:
        return None


def to_najm_report_record(extracted_record: dict[str, Any], report_file_path: str) -> dict[str, Any]:
    """Convert raw extracted Najm data into database-ready record."""
    accident_datetime, accident_date = parse_datetime_value(extracted_record.get("accident_time", ""))

    vehicle_brand, vehicle_model = split_brand_model(extracted_record.get("vehicle_make_model", ""))
    vehicle_year, vehicle_color = split_year_color_value(extracted_record.get("vehicle_year_color", ""))

    return {
        "report_file_path": report_file_path,
        "accident_id": extracted_record.get("case_number", ""),
        "accident_date": accident_date,
        "accident_time": accident_datetime,
        "accident_coordinates": extracted_record.get("coordinates", ""),
        "fault_percentage": parse_fault_percentage(extracted_record.get("accident_fault_percentage")),
        "damage_area": extracted_record.get("accident_damage_area", ""),
        "damage_area_ar": extracted_record.get("accident_damage_area_arabic", ""),
        "party_full_name": extracted_record.get("party2_name", ""),
        "license_type": extracted_record.get("party2_license_type", ""),
        "license_expiry_date": datetime.strptime(
            extracted_record["party2_license_expiry"], "%d/%m/%Y"
        ).date()
        if extracted_record.get("party2_license_expiry")
        else None,
        "party_national_id": extracted_record.get("party2_id_number", ""),
        "party_mobile": extracted_record.get("party2_mobile", ""),
        "party_nationality": extracted_record.get("party2_nationality", ""),
        "vehicle_plate_number": extracted_record.get("vehicle_plate_no", ""),
        "vehicle_brand": vehicle_brand,
        "vehicle_model": vehicle_model,
        "vehicle_year": vehicle_year,
        "vehicle_color": vehicle_color,
    }


def validate_required_najm_fields(record: dict[str, Any]) -> list[str]:
    """Validate required Najm fields before DB insert."""
    required_fields = [
        "report_file_path",
        "accident_id",
        "accident_coordinates",
        "damage_area",
        "damage_area_ar",
        "party_full_name",
        "license_type",
        "party_national_id",
        "party_mobile",
        "party_nationality",
        "vehicle_plate_number",
        "vehicle_brand",
        "vehicle_model",
        "vehicle_color",
    ]

    missing = []
    for field in required_fields:
        value = record.get(field)
        if value is None:
            missing.append(field)
        elif isinstance(value, str) and not value.strip():
            missing.append(field)

    return missing


# ---------------------------------------------------
# Public function used by API route
# Returns structured Najm report ready for DB insert
# ---------------------------------------------------
def extract_najm_report(pdf_path: str, report_file_path: str, page_index: int = 0) -> dict[str, Any]:
    output, debug = extract_step1_najm_report_blocks(pdf_path=pdf_path, page_index=page_index)
    extracted_record = output["record"]

    najm_record = to_najm_report_record(
        extracted_record=extracted_record,
        report_file_path=report_file_path,
    )

    missing_fields = validate_required_najm_fields(najm_record)

    return {
        "najm_record": najm_record,
        "debug": debug,
        "missing_fields": missing_fields,
        "raw_record": extracted_record,
    }