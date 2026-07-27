#!/usr/bin/env python
"""
Small local GUI for anonymizing admissions exports.

This app is intentionally local-only: it does not create network clients,
does not call APIs, and only reads/writes files selected by the user.
"""

from __future__ import annotations

import sys
import threading
import traceback
from pathlib import Path
from tkinter import Tk, StringVar, BooleanVar, filedialog, messagebox
from tkinter import ttk

import anonymize_admissions_data as anonymizer

try:
    import openpyxl  # type: ignore
except Exception:  # pragma: no cover
    openpyxl = None


ACTION_LABELS = {
    "person_name": "ФИО -> стабильный псевдоним",
    "phone": "Телефон -> маска",
    "email": "Email -> anon@example.local",
    "sensitive_document": "Документ -> удалено",
    "birth_date": "Дата рождения -> год",
    "address": "Адрес -> обезличен",
    "free_text": "Свободный текст -> обезличен",
    "identifier": "ID/код -> anon_applicant_id",
    "event_date": "Дата события -> сдвиг",
    "keep": "Оставить",
}


class AnonymizerApp:
    def __init__(self, root: Tk) -> None:
        self.root = root
        self.root.title("Приемная кампания 360 - обезличивание данных")
        self.root.geometry("980x680")
        self.root.minsize(860, 620)

        self.input_path = StringVar()
        self.output_dir = StringVar()
        self.output_name = StringVar()
        self.sheet_name = StringVar()
        self.salt = StringVar(value="pk360-local-only")
        self.status = StringVar(value="Выберите CSV/XLSX-файл с выгрузкой.")
        self.keep_report = BooleanVar(value=True)

        self.columns: list[str] = []
        self.available_sheets: list[str] = []

        self._build_ui()

    def _build_ui(self) -> None:
        outer = ttk.Frame(self.root, padding=18)
        outer.pack(fill="both", expand=True)

        title = ttk.Label(
            outer,
            text="Локальное обезличивание данных приемной кампании",
            font=("Segoe UI", 18, "bold"),
        )
        title.pack(anchor="w")

        subtitle = ttk.Label(
            outer,
            text="Файл обрабатывается только на этом компьютере. Никаких сетевых запросов и отправки данных наружу.",
            foreground="#555555",
        )
        subtitle.pack(anchor="w", pady=(4, 16))

        file_frame = ttk.LabelFrame(outer, text="1. Исходный файл с персональными данными", padding=12)
        file_frame.pack(fill="x", pady=(0, 12))
        ttk.Entry(file_frame, textvariable=self.input_path).pack(side="left", fill="x", expand=True)
        ttk.Button(file_frame, text="Выбрать файл...", command=self.choose_input).pack(side="left", padx=(10, 0))

        sheet_frame = ttk.Frame(file_frame)
        sheet_frame.pack(fill="x", pady=(10, 0))
        ttk.Label(sheet_frame, text="Лист XLSX:").pack(side="left")
        self.sheet_combo = ttk.Combobox(sheet_frame, textvariable=self.sheet_name, state="readonly", width=36)
        self.sheet_combo.pack(side="left", padx=(8, 16))
        self.sheet_combo.bind("<<ComboboxSelected>>", lambda _event: self.inspect_file())
        ttk.Label(sheet_frame, text="Соль псевдонимов:").pack(side="left")
        ttk.Entry(sheet_frame, textvariable=self.salt, width=30).pack(side="left", padx=(8, 0))

        output_frame = ttk.LabelFrame(outer, text="2. Куда сохранить обезличенную копию", padding=12)
        output_frame.pack(fill="x", pady=(0, 12))
        row1 = ttk.Frame(output_frame)
        row1.pack(fill="x")
        ttk.Entry(row1, textvariable=self.output_dir).pack(side="left", fill="x", expand=True)
        ttk.Button(row1, text="Выбрать папку...", command=self.choose_output_dir).pack(side="left", padx=(10, 0))
        row2 = ttk.Frame(output_frame)
        row2.pack(fill="x", pady=(10, 0))
        ttk.Label(row2, text="Имя файла:").pack(side="left")
        ttk.Entry(row2, textvariable=self.output_name).pack(side="left", fill="x", expand=True, padx=(8, 16))
        ttk.Checkbutton(row2, text="Сохранить отчет о правилах", variable=self.keep_report).pack(side="left")

        rules_frame = ttk.LabelFrame(outer, text="3. Проверка правил по колонкам", padding=12)
        rules_frame.pack(fill="both", expand=True, pady=(0, 12))
        columns = ("column", "action")
        self.tree = ttk.Treeview(rules_frame, columns=columns, show="headings", height=12)
        self.tree.heading("column", text="Колонка")
        self.tree.heading("action", text="Что будет сделано")
        self.tree.column("column", width=430, anchor="w")
        self.tree.column("action", width=360, anchor="w")
        scroll = ttk.Scrollbar(rules_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scroll.set)
        self.tree.pack(side="left", fill="both", expand=True)
        scroll.pack(side="right", fill="y")

        actions = ttk.Frame(outer)
        actions.pack(fill="x")
        ttk.Button(actions, text="Проверить поля", command=self.inspect_file).pack(side="left")
        ttk.Button(actions, text="Обезличить", command=self.run_anonymization).pack(side="left", padx=(10, 0))
        ttk.Button(actions, text="Открыть папку результата", command=self.open_output_dir).pack(side="left", padx=(10, 0))
        ttk.Label(actions, textvariable=self.status, foreground="#555555").pack(side="left", padx=(18, 0))

    def choose_input(self) -> None:
        path = filedialog.askopenfilename(
            title="Выберите выгрузку",
            filetypes=[
                ("Табличные файлы", "*.xlsx *.xlsm *.csv *.tsv"),
                ("Excel", "*.xlsx *.xlsm"),
                ("CSV/TSV", "*.csv *.tsv"),
                ("Все файлы", "*.*"),
            ],
        )
        if not path:
            return
        self.input_path.set(path)
        source = Path(path)
        self.output_dir.set(str(source.parent))
        self.output_name.set(source.stem + "_anonymized" + source.suffix)
        self.load_sheets()
        self.inspect_file()

    def choose_output_dir(self) -> None:
        path = filedialog.askdirectory(title="Выберите папку для обезличенной копии")
        if path:
            self.output_dir.set(path)

    def load_sheets(self) -> None:
        self.available_sheets = []
        self.sheet_combo["values"] = []
        self.sheet_name.set("")
        path = Path(self.input_path.get())
        if path.suffix.lower() not in {".xlsx", ".xlsm"}:
            return
        if openpyxl is None:
            self.status.set("Для XLSX нужен пакет openpyxl. В Codex runtime он обычно есть.")
            return
        try:
            wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
            self.available_sheets = list(wb.sheetnames)
            self.sheet_combo["values"] = self.available_sheets
            if self.available_sheets:
                self.sheet_name.set(self.available_sheets[0])
        except Exception as exc:
            messagebox.showerror("Не удалось прочитать листы", str(exc))

    def inspect_file(self) -> None:
        path_text = self.input_path.get().strip()
        if not path_text:
            messagebox.showinfo("Файл не выбран", "Сначала выберите CSV/XLSX-файл.")
            return
        path = Path(path_text)
        if not path.exists():
            messagebox.showerror("Файл не найден", str(path))
            return
        try:
            suffix = path.suffix.lower()
            if suffix in {".csv", ".tsv"}:
                columns, rows, _dialect, _encoding = anonymizer.read_csv(path)
                sheet_note = ""
            elif suffix in {".xlsx", ".xlsm"}:
                columns, rows, sheet = anonymizer.read_xlsx(path, self.sheet_name.get() or None)
                sheet_note = f", лист: {sheet}"
            else:
                messagebox.showerror("Неподдерживаемый формат", "Используйте CSV, TSV, XLSX или XLSM.")
                return
            self.columns = columns
            self.tree.delete(*self.tree.get_children())
            for column in columns:
                action = anonymizer.classify_column(column)
                self.tree.insert("", "end", values=(column, ACTION_LABELS.get(action, action)))
            self.status.set(f"Найдено колонок: {len(columns)}, строк: {len(rows)}{sheet_note}. Проверьте правила.")
        except Exception as exc:
            messagebox.showerror("Ошибка проверки", f"{exc}\n\n{traceback.format_exc()}")

    def run_anonymization(self) -> None:
        if not self.input_path.get().strip():
            messagebox.showinfo("Файл не выбран", "Сначала выберите исходный файл.")
            return
        if not self.output_dir.get().strip():
            messagebox.showinfo("Папка не выбрана", "Выберите папку для результата.")
            return
        if not self.output_name.get().strip():
            messagebox.showinfo("Имя файла не задано", "Введите имя выходного файла.")
            return
        thread = threading.Thread(target=self._run_anonymization_worker, daemon=True)
        thread.start()

    def _run_anonymization_worker(self) -> None:
        try:
            self.root.after(0, self.status.set, "Идет обезличивание...")
            input_path = Path(self.input_path.get()).resolve()
            output_path = Path(self.output_dir.get()).joinpath(self.output_name.get()).resolve()
            suffix = input_path.suffix.lower()
            if suffix in {".csv", ".tsv"}:
                columns, rows, dialect, _encoding = anonymizer.read_csv(input_path)
                output_columns, output_rows, rules = anonymizer.anonymize_rows(columns, rows, self.salt.get())
                anonymizer.write_csv(output_path, output_columns, output_rows, dialect)
            elif suffix in {".xlsx", ".xlsm"}:
                columns, rows, sheet_name = anonymizer.read_xlsx(input_path, self.sheet_name.get() or None)
                output_columns, output_rows, rules = anonymizer.anonymize_rows(columns, rows, self.salt.get())
                anonymizer.write_xlsx(output_path, output_columns, output_rows, sheet_name)
            else:
                raise RuntimeError("Используйте CSV, TSV, XLSX или XLSM.")

            report_path = output_path.with_suffix(output_path.suffix + ".report.json")
            if self.keep_report.get():
                anonymizer.write_report(report_path, input_path, output_path, len(output_rows), rules)
                report_note = f"\nОтчет: {report_path}"
            else:
                report_note = ""

            def done() -> None:
                self.status.set(f"Готово: {len(output_rows)} строк.")
                messagebox.showinfo(
                    "Обезличивание завершено",
                    f"Создан файл:\n{output_path}{report_note}\n\nДанные не отправлялись в сеть.",
                )

            self.root.after(0, done)
        except Exception as exc:
            def fail() -> None:
                self.status.set("Ошибка обезличивания.")
                messagebox.showerror("Ошибка обезличивания", f"{exc}\n\n{traceback.format_exc()}")

            self.root.after(0, fail)

    def open_output_dir(self) -> None:
        path = self.output_dir.get().strip()
        if not path:
            messagebox.showinfo("Папка не выбрана", "Сначала выберите папку результата.")
            return
        output_dir = Path(path)
        if not output_dir.exists():
            messagebox.showerror("Папка не найдена", str(output_dir))
            return
        try:
            import os

            os.startfile(output_dir)  # type: ignore[attr-defined]
        except Exception as exc:
            messagebox.showerror("Не удалось открыть папку", str(exc))


def main() -> int:
    root = Tk()
    try:
        root.call("tk", "scaling", 1.2)
    except Exception:
        pass
    app = AnonymizerApp(root)
    root.mainloop()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
