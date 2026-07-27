"""Build aggregate demo metrics for Dashboard v3 from an anonymized XLSX export.

The script never emits row-level values, applicant identifiers, phone numbers,
emails, names, or free text. Its output is safe aggregate JSON intended for the
frontend prototype.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from itertools import combinations
from pathlib import Path

import pandas as pd


DIRECTION = "Направление\\специальность"

USE_COLUMNS = [
    "anon_applicant_id",
    "Телефон",
    DIRECTION,
    "Подразделение",
    "Согласие на зачисление",
    "Приоритет",
    "Сумма баллов",
    "Контроль пройден",
    "Текущий статус конкурса",
    "Источник финансирования",
    "Форма обучения",
    "Гражданство",
    "Нуждаемость в общежитии",
]


def yes_count(series: pd.Series) -> int:
    return int((series.fillna("").astype(str).str.casefold() == "да").sum())


def no_count(series: pd.Series) -> int:
    return int((series.fillna("").astype(str).str.casefold() == "нет").sum())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, help="Anonymized XLSX export")
    parser.add_argument("--output", "-o", type=Path)
    args = parser.parse_args()

    data = pd.read_excel(args.input, usecols=USE_COLUMNS)
    phone = data["Телефон"].fillna("").astype(str).str.strip()
    data["master_applicant_id"] = phone.where(
        phone.ne(""), data["anon_applicant_id"].astype(str)
    )

    direction_sets = (
        data.dropna(subset=[DIRECTION])
        .groupby("master_applicant_id")[DIRECTION]
        .agg(lambda values: sorted(set(map(str, values))))
    )

    pair_counts: Counter[tuple[str, str]] = Counter()
    for directions in direction_sets:
        if len(directions) > 1:
            pair_counts.update(combinations(directions, 2))

    direction_metrics = (
        data.groupby(DIRECTION)
        .agg(
            applications=("master_applicant_id", "size"),
            applicants=("master_applicant_id", "nunique"),
            consents=("Согласие на зачисление", yes_count),
            median_score=("Сумма баллов", "median"),
            control_failed=("Контроль пройден", no_count),
        )
        .sort_values("applications", ascending=False)
        .head(16)
        .reset_index()
    )
    direction_metrics["consent_rate"] = (
        direction_metrics["consents"] / direction_metrics["applications"] * 100
    ).round(2)
    direction_metrics["median_score"] = direction_metrics["median_score"].round(1)

    faculty_metrics = (
        data.groupby("Подразделение")
        .agg(
            applications=("master_applicant_id", "size"),
            applicants=("master_applicant_id", "nunique"),
            consents=("Согласие на зачисление", yes_count),
            control_failed=("Контроль пройден", no_count),
        )
        .sort_values("applications", ascending=False)
        .reset_index()
    )

    statuses = (
        data["Текущий статус конкурса"]
        .fillna("Не указан")
        .astype(str)
        .value_counts()
        .to_dict()
    )

    result = {
        "source": args.input.name,
        "applications": int(len(data)),
        "applicants": int(data["master_applicant_id"].nunique()),
        "multi_direction_applicants": int((direction_sets.map(len) > 1).sum()),
        "three_plus_direction_applicants": int((direction_sets.map(len) >= 3).sum()),
        "consents": yes_count(data["Согласие на зачисление"]),
        "control_failed": no_count(data["Контроль пройден"]),
        "status_counts": {str(key): int(value) for key, value in statuses.items()},
        "top_intersections": [
            {"direction_a": a, "direction_b": b, "applicants": int(count)}
            for (a, b), count in pair_counts.most_common(24)
        ],
        "top_directions": direction_metrics.to_dict(orient="records"),
        "faculties": faculty_metrics.to_dict(orient="records"),
    }

    output = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(output, encoding="utf-8")
    else:
        print(output)


if __name__ == "__main__":
    main()
