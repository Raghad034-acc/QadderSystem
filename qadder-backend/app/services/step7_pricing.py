import json
import re
from pathlib import Path
from difflib import SequenceMatcher
from uuid import uuid4

import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = PROJECT_ROOT / "data"

PARTS_DATASET_PATH = DATA_DIR / "final_speero_21parts_filled.parquet"
LABOR_DATASET_PATH = DATA_DIR / "filtered_parts_repair_costs.csv"

# ============================================================
# Text helpers
# ============================================================
_AR_DIACRITICS = re.compile(r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]")


def norm_text(s: str) -> str:
    if s is None:
        return ""

    s = str(s).strip().lower()
    s = _AR_DIACRITICS.sub("", s)
    s = re.sub(r"[_\-]+", " ", s)
    s = re.sub(r"[^\w\u0600-\u06FF ]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()

    s = s.replace("back", "rear")
    s = s.replace("boot", "trunk")
    s = s.replace("bonnet", "hood")

    return s


def fuzzy_score(a: str, b: str) -> float:
    a = norm_text(a)
    b = norm_text(b)
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def best_fuzzy_match(query: str, candidates: list[str], min_score: float = 0.70):
    best_i, best_s = None, 0.0
    for i, c in enumerate(candidates):
        s = fuzzy_score(query, c)
        if s > best_s:
            best_s = s
            best_i = i

    if best_s < min_score:
        return None, best_s
    return best_i, best_s


def _part_query_variants(part_en: str, part_ar: str) -> list[str]:
    base = norm_text(part_en) or norm_text(part_ar)
    if not base:
        return []

    variants = [base]
    tokens = base.split()

    def add_variant(v: str):
        v2 = re.sub(r"\s+", " ", v).strip()
        if v2 and v2 not in variants:
            variants.append(v2)

    side = None
    if "left" in tokens:
        side = "left"
    elif "right" in tokens:
        side = "right"

    pos = None
    if "front" in tokens:
        pos = "front"
    elif "rear" in tokens:
        pos = "rear"

    if side and pos:
        rest = [t for t in tokens if t not in ["left", "right", "front", "rear"]]
        add_variant(" ".join([side, pos] + rest))
        add_variant(" ".join([pos, side] + rest))
        add_variant(" ".join([side] + rest + [pos]))

    if tokens and tokens[0] in ["left", "right"] and pos:
        rest = [t for t in tokens if t not in ["left", "right", "front", "rear"]]
        add_variant(" ".join([pos, tokens[0]] + rest))

    out = []
    seen = set()
    for v in variants:
        if v not in seen:
            seen.add(v)
            out.append(v)

    return out


# ============================================================
# Dataset helpers
# ============================================================
def ensure_datasets_exist():
    if not PARTS_DATASET_PATH.exists():
        raise FileNotFoundError(f"Parts dataset not found: {PARTS_DATASET_PATH}")

    if not LABOR_DATASET_PATH.exists():
        raise FileNotFoundError(f"Labor dataset not found: {LABOR_DATASET_PATH}")


def load_parts_dataset(path: Path) -> pd.DataFrame:
    ext = path.suffix.lower()
    if ext in [".parquet", ".pq"]:
        return pd.read_parquet(path)
    return pd.read_csv(path)


def pick_col(df: pd.DataFrame, candidates: list[str]) -> str | None:
    cols = set(df.columns)
    for c in candidates:
        if c in cols:
            return c
    return None


def filter_parts_by_vehicle(parts_df: pd.DataFrame, vehicle: dict) -> tuple[pd.DataFrame, dict]:
    df = parts_df.copy()
    debug = {
        "start_rows": int(len(df)),
        "make_filter_used": False,
        "model_filter_used": False,
        "year_filter_used": False,
        "make_col": None,
        "model_col": None,
        "year_col": None,
        "final_rows": None,
        "fallback_reason": None,
    }

    make_col = pick_col(df, ["CarBrandArabic", "CarBrandEnglish", "req_manu", "make", "brand"])
    model_col = pick_col(df, ["CarModelArabic", "CarModelEnglish", "req_model", "model"])
    year_col = pick_col(df, ["CarYear", "year", "vehicle_year"])

    debug["make_col"] = make_col
    debug["model_col"] = model_col
    debug["year_col"] = year_col

    make_val = vehicle.get("brand", "") or ""
    model_val = vehicle.get("model", "") or ""
    year_val = vehicle.get("year", "") or ""

    try:
        year_int = int(str(year_val).strip()) if str(year_val).strip() else None
    except Exception:
        year_int = None

    if make_col and make_val:
        keep = df[make_col].astype(str).map(lambda x: fuzzy_score(make_val, x) >= 0.75)
        df2 = df[keep]
        if len(df2) >= 20:
            df = df2
            debug["make_filter_used"] = True

    if model_col and model_val and len(df) > 0:
        keep = df[model_col].astype(str).map(lambda x: fuzzy_score(model_val, x) >= 0.72)
        df2 = df[keep]
        if len(df2) >= 20:
            df = df2
            debug["model_filter_used"] = True

    if year_col and year_int is not None and len(df) > 0:
        year_series = pd.to_numeric(df[year_col], errors="coerce")
        df2 = df[year_series == year_int]
        if len(df2) >= 5:
            df = df2
            debug["year_filter_used"] = True

    if len(df) == 0:
        debug["fallback_reason"] = "filtering_resulted_in_zero_rows"
        df = parts_df.copy()

    debug["final_rows"] = int(len(df))
    return df, debug


def labor_lookup(labor_df: pd.DataFrame, part_name_en: str, part_name_ar: str, severity_en: str):
    candidates = []
    for _, row in labor_df.iterrows():
        candidates.append(f"{row.get('name_en', '')} | {row.get('name_ar', '')}")

    query = f"{part_name_en} | {part_name_ar}"
    i, score = best_fuzzy_match(query, candidates, min_score=0.68)

    if i is None:
        return None, {"matched": False, "score": float(score), "picked": None}

    row = labor_df.iloc[i]
    sev = (severity_en or "").strip().lower()

    if sev == "low":
        cost = row.get("replace_cost_low")
        used_column = "replace_cost_low"
    elif sev == "medium":
        cost = row.get("replace_cost_medium")
        used_column = "replace_cost_medium"
    else:
        cost = row.get("replace_cost_low")
        used_column = "replace_cost_low(default)"

    try:
        cost = float(cost) if cost is not None and str(cost).strip() != "" else None
    except Exception:
        cost = None

    return cost, {
        "matched": True,
        "score": float(score),
        "picked": {
            "name_en": row.get("name_en"),
            "name_ar": row.get("name_ar"),
            "used_column": used_column,
        },
    }


def part_price_lookup(parts_df: pd.DataFrame, part_name_en: str, part_name_ar: str):
    df = parts_df

    col_en = pick_col(df, ["PartNameEnglish", "part_name_en", "name_en", "PartEnglish", "part_en"])
    col_ar = pick_col(df, ["PartNameArabic", "part_name_ar", "name_ar", "PartArabic", "part_ar"])
    col_21 = pick_col(df, ["PartName_21", "partname_21", "part_21", "Part_21"])
    col_price = pick_col(df, ["price", "Price", "part_price", "PartPrice", "Original Price", "original_price"])

    if col_price is None:
        return None, {"matched": False, "score": 0.0, "picked": None, "note": "no_price_column_found"}

    query_variants = _part_query_variants(part_name_en, part_name_ar)
    q0 = query_variants[0] if query_variants else (norm_text(part_name_en) or norm_text(part_name_ar))

    q_is_door = ("door" in q0.split()) and ("glass" not in q0.split())
    q_is_glass = ("glass" in q0.split()) or ("window" in q0.split())

    if col_21 is not None and query_variants:
        s21 = df[col_21].astype(str).map(norm_text)

        for q in query_variants:
            mask = (s21 == q)
            if mask.sum() == 0:
                mask = s21.map(lambda x: fuzzy_score(q, x) >= 0.92)

            if mask.sum() > 0 and q_is_door:
                df_hits0 = df.loc[mask].copy()
                s21_hits = df_hits0[col_21].astype(str).map(norm_text)
                keep = s21_hits.map(lambda x: ("door" in x.split()) and ("glass" not in x.split()))
                df_hits = df_hits0[keep]
                if len(df_hits) == 0:
                    df_hits = df_hits0
            elif mask.sum() > 0:
                df_hits = df.loc[mask].copy()
            else:
                df_hits = None

            if df_hits is not None and len(df_hits) > 0:
                prices = pd.to_numeric(df_hits[col_price], errors="coerce").dropna()
                if len(prices) > 0:
                    min_idx = prices.idxmin()
                    ex = df_hits.loc[min_idx]
                    return float(prices.min()), {
                        "matched": True,
                        "score": 0.99,
                        "picked": {
                            "method": "PartName_21(priority+variants)",
                            "query_used": q,
                            "PartName_21": ex.get(col_21),
                            "PartNameEnglish": ex.get(col_en) if col_en else "",
                            "PartNameArabic": ex.get(col_ar) if col_ar else "",
                            "sellerName": ex.get("sellerName"),
                            "catalogueNumber": ex.get("catalogueNumber") or ex.get("PartNumber") or ex.get("part_number"),
                        },
                    }

    df_fuzzy = df
    if q_is_door and not q_is_glass:
        if col_21 is not None:
            s21_all = df[col_21].astype(str).map(norm_text)
            df_fuzzy = df[s21_all.map(lambda x: "glass" not in x.split())]
        elif col_en is not None:
            en_all = df[col_en].astype(str).map(norm_text)
            df_fuzzy = df[en_all.map(lambda x: "glass" not in x.split())]

    candidates = []
    for _, row in df_fuzzy.iterrows():
        en_v = row.get(col_en, "") if col_en else ""
        ar_v = row.get(col_ar, "") if col_ar else ""
        extra = row.get(col_21, "") if col_21 else ""
        candidates.append(f"{en_v} | {ar_v} | {extra}")

    if len(candidates) == 0:
        return None, {"matched": False, "score": 0.0, "picked": None, "note": "no_candidates_after_filters"}

    query = f"{q0} | {norm_text(part_name_ar)} | {q0}"
    i, score = best_fuzzy_match(query, candidates, min_score=0.62)

    if i is None:
        return None, {"matched": False, "score": float(score), "picked": None}

    picked_str = candidates[i]
    close_mask = [fuzzy_score(picked_str, c) >= 0.95 for c in candidates]
    df_close = df_fuzzy.loc[close_mask] if any(close_mask) else df_fuzzy.iloc[[i]]

    prices = pd.to_numeric(df_close[col_price], errors="coerce")
    if prices.notna().sum() == 0:
        return None, {"matched": True, "score": float(score), "picked": picked_str, "note": "no_numeric_price"}

    min_price = float(prices.min())
    min_idx = prices.idxmin()
    ex = df_close.loc[min_idx] if min_idx in df_close.index else df_close.iloc[int(prices.values.argmin())]

    return min_price, {
        "matched": True,
        "score": float(score),
        "picked": {
            "method": "fuzzy(en/ar)",
            "query_used": q0,
            "PartNameEnglish": ex.get(col_en) if col_en else "",
            "PartNameArabic": ex.get(col_ar) if col_ar else "",
            "sellerName": ex.get("sellerName"),
            "catalogueNumber": ex.get("catalogueNumber") or ex.get("PartNumber") or ex.get("part_number"),
        },
    }


# ============================================================
# DB helpers
# ============================================================
def fetch_case_and_fault(db: Session, case_id: str):
    case_row = db.execute(
        text("""
            SELECT
                c.id,
                c.case_number,
                c.status,
                v.brand,
                v.model,
                v.year,
                nr.fault_percentage
            FROM cases c
            LEFT JOIN vehicles v ON v.id = c.vehicle_id
            LEFT JOIN najm_reports nr ON nr.case_id = c.id
            WHERE c.id = :case_id
        """),
        {"case_id": case_id}
    ).mappings().first()

    if not case_row:
        raise ValueError("Case not found.")

    return dict(case_row)


def fetch_damages(db: Session, case_id: str):
    rows = db.execute(
        text("""
            SELECT
                id,
                case_id,
                image_id,
                damage_no,
                damage_type_en,
                damage_type_ar,
                damage_confidence,
                severity_en,
                severity_ar,
                severity_confidence,
                part_name_en,
                part_name_ar,
                bbox_x1,
                bbox_y1,
                bbox_x2,
                bbox_y2,
                crop_path,
                area_ratio,
                mask_pixels,
                vote_ratio,
                vote_label
            FROM damages
            WHERE case_id = :case_id
            ORDER BY damage_no ASC
        """),
        {"case_id": case_id}
    ).mappings().all()

    if not rows:
        raise ValueError("No damages found for this case.")

    return [dict(r) for r in rows]


def clear_previous_step7_data(db: Session, case_id: str):
    db.execute(
        text("""
            DELETE FROM cost_estimate_items
            WHERE damage_id IN (
                SELECT id FROM damages WHERE case_id = :case_id
            )
        """),
        {"case_id": case_id}
    )

    db.execute(
        text("""
            DELETE FROM total_cost_estimates
            WHERE case_id = :case_id
        """),
        {"case_id": case_id}
    )


def insert_cost_estimate_item(db: Session, damage_id: str, part_price: float, labor_cost: float,
                              subtotal_before_fault: float, subtotal_after_fault: float):
    db.execute(
        text("""
            INSERT INTO cost_estimate_items (
                id,
                damage_id,
                part_price,
                labor_cost,
                subtotal_before_fault,
                subtotal_after_fault
            )
            VALUES (
                :id,
                :damage_id,
                :part_price,
                :labor_cost,
                :subtotal_before_fault,
                :subtotal_after_fault
            )
        """),
        {
            "id": str(uuid4()),
            "damage_id": damage_id,
            "part_price": round(part_price, 2),
            "labor_cost": round(labor_cost, 2),
            "subtotal_before_fault": round(subtotal_before_fault, 2),
            "subtotal_after_fault": round(subtotal_after_fault, 2),
        }
    )


def insert_total_cost_estimate(db: Session, case_id: str, damages_count: int, total_parts: float,
                               total_labor: float, total_estimated_cost: float, adjusted_cost: float):
    db.execute(
        text("""
            INSERT INTO total_cost_estimates (
                id,
                case_id,
                damages_count,
                total_parts,
                total_labor,
                total_estimated_cost,
                adjusted_cost
            )
            VALUES (
                :id,
                :case_id,
                :damages_count,
                :total_parts,
                :total_labor,
                :total_estimated_cost,
                :adjusted_cost
            )
        """),
        {
            "id": str(uuid4()),
            "case_id": case_id,
            "damages_count": damages_count,
            "total_parts": round(total_parts, 2),
            "total_labor": round(total_labor, 2),
            "total_estimated_cost": round(total_estimated_cost, 2),
            "adjusted_cost": round(adjusted_cost, 2),
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


# ============================================================
# Business logic
# ============================================================
def build_initial_rows(damages: list[dict], parts_df_vehicle: pd.DataFrame, labor_df: pd.DataFrame):
    rows = []

    for damage in damages:
        part_en = damage.get("part_name_en") or ""
        part_ar = damage.get("part_name_ar") or ""
        severity_en = (damage.get("severity_en") or "").strip().lower()

        part_price, price_meta = part_price_lookup(parts_df_vehicle, part_en, part_ar)
        labor_cost, labor_meta = labor_lookup(labor_df, part_en, part_ar, severity_en)

        rows.append({
            "damage_id": damage["id"],
            "damage_no": damage.get("damage_no"),
            "damage_type_en": damage.get("damage_type_en"),
            "damage_type_ar": damage.get("damage_type_ar"),
            "severity_en": damage.get("severity_en"),
            "severity_ar": damage.get("severity_ar"),
            "severity_confidence": damage.get("severity_confidence"),
            "part_name_en": part_en,
            "part_name_ar": part_ar,
            "part_price_raw": float(part_price) if part_price is not None else 0.0,
            "labor_cost_raw": float(labor_cost) if labor_cost is not None else 0.0,
            "part_price": 0.0,
            "labor_cost": 0.0,
            "subtotal_before_fault": 0.0,
            "subtotal_after_fault": 0.0,
            "match_debug": {
                "parts_price_match": price_meta,
                "labor_match": labor_meta,
            }
        })

    return rows


def apply_grouping_rules(rows: list[dict]):
    """
    لأن جدول cost_estimate_items مرتبط بكل damage واحد لواحد،
    لكن Business Rule يقول لا نكرر سعر القطعة لنفس الجزء أكثر من مرة.

    لذلك:
    - لكل part نعمل group
    - نحسب part_price مرة واحدة فقط
    - نحسب labor_cost مرة واحدة فقط على damage صاحب أعلى severity
    - باقي الصفوف لنفس القطعة تنحفظ بقيم 0
    """
    sev_rank = {"low": 1, "medium": 2, "high": 3}

    groups = {}
    for row in rows:
        part_key = norm_text(row.get("part_name_en") or "") or norm_text(row.get("part_name_ar") or "")
        if not part_key:
            part_key = f"unknown_part_{row['damage_id']}"
        groups.setdefault(part_key, []).append(row)

    processed = []

    for _, group_rows in groups.items():
        keeper = None
        best_rank = -1
        best_damage_no = 10**9

        max_part_price = max((r.get("part_price_raw") or 0.0) for r in group_rows)
        max_labor_cost = 0.0

        for r in group_rows:
            rank = sev_rank.get((r.get("severity_en") or "").strip().lower(), 0)
            labor = r.get("labor_cost_raw") or 0.0
            if labor > max_labor_cost:
                max_labor_cost = labor

            damage_no = r.get("damage_no") or 10**9
            if rank > best_rank or (rank == best_rank and damage_no < best_damage_no):
                best_rank = rank
                best_damage_no = damage_no
                keeper = r

        for r in group_rows:
            r["part_price"] = 0.0
            r["labor_cost"] = 0.0

        if keeper is not None:
            keeper["part_price"] = float(max_part_price)
            keeper["labor_cost"] = float(max_labor_cost)

        processed.extend(group_rows)

    processed.sort(key=lambda x: (x.get("damage_no") is None, x.get("damage_no") or 999999))
    return processed


def apply_fault_formula(rows: list[dict], fault_percentage: float | None):
    fault_percentage = float(fault_percentage or 0.0)
    fault_multiplier = (100.0 - fault_percentage) / 100.0

    total_parts = 0.0
    total_labor = 0.0
    total_before_fault = 0.0
    total_after_fault = 0.0

    for row in rows:
        part_price = float(row.get("part_price") or 0.0)
        labor_cost = float(row.get("labor_cost") or 0.0)

        subtotal_before_fault = part_price + labor_cost
        subtotal_after_fault = subtotal_before_fault * fault_multiplier

        row["subtotal_before_fault"] = subtotal_before_fault
        row["subtotal_after_fault"] = subtotal_after_fault

        total_parts += part_price
        total_labor += labor_cost
        total_before_fault += subtotal_before_fault
        total_after_fault += subtotal_after_fault

    summary = {
        "fault_percentage": round(fault_percentage, 2),
        "fault_multiplier": round(fault_multiplier, 4),
        "damages_count": len(rows),
        "total_parts": round(total_parts, 2),
        "total_labor": round(total_labor, 2),
        "total_estimated_cost": round(total_before_fault, 2),
        "adjusted_cost": round(total_after_fault, 2),
    }

    return rows, summary


# ============================================================
# Main service
# ============================================================
def run_step7(db: Session, case_id: str):
    ensure_datasets_exist()

    case_data = fetch_case_and_fault(db, case_id)
    damages = fetch_damages(db, case_id)

    vehicle = {
        "brand": case_data.get("brand"),
        "model": case_data.get("model"),
        "year": case_data.get("year"),
    }

    parts_df_all = load_parts_dataset(PARTS_DATASET_PATH)
    labor_df = pd.read_csv(LABOR_DATASET_PATH)

    parts_df_vehicle, vehicle_filter_debug = filter_parts_by_vehicle(parts_df_all, vehicle)

    rows = build_initial_rows(damages, parts_df_vehicle, labor_df)
    rows = apply_grouping_rules(rows)
    rows, summary = apply_fault_formula(rows, case_data.get("fault_percentage"))

    clear_previous_step7_data(db, case_id)

    for row in rows:
        insert_cost_estimate_item(
            db=db,
            damage_id=row["damage_id"],
            part_price=row["part_price"],
            labor_cost=row["labor_cost"],
            subtotal_before_fault=row["subtotal_before_fault"],
            subtotal_after_fault=row["subtotal_after_fault"],
        )

    insert_total_cost_estimate(
        db=db,
        case_id=case_id,
        damages_count=summary["damages_count"],
        total_parts=summary["total_parts"],
        total_labor=summary["total_labor"],
        total_estimated_cost=summary["total_estimated_cost"],
        adjusted_cost=summary["adjusted_cost"],
    )

    update_case_status(db, case_id, "step7_completed")

    db.commit()

    return {
        "case_id": case_id,
        "case_number": case_data.get("case_number"),
        "vehicle": vehicle,
        "vehicle_filter_debug": vehicle_filter_debug,
        "summary": summary,
        "rows": [
            {
                "damage_id": r["damage_id"],
                "damage_no": r["damage_no"],
                "damage_type_en": r["damage_type_en"],
                "damage_type_ar": r["damage_type_ar"],
                "severity_en": r["severity_en"],
                "severity_ar": r["severity_ar"],
                "part_name_en": r["part_name_en"],
                "part_name_ar": r["part_name_ar"],
                "part_price": round(r["part_price"], 2),
                "labor_cost": round(r["labor_cost"], 2),
                "subtotal_before_fault": round(r["subtotal_before_fault"], 2),
                "subtotal_after_fault": round(r["subtotal_after_fault"], 2),
                "match_debug": r["match_debug"],
            }
            for r in rows
        ]
    }