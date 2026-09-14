#!/usr/bin/env python3
"""Build the client-facing ForTheSoul admin guide as a styled PDF."""

from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "ADMIN.md"
OUTPUT = ROOT / "output" / "pdf" / "Guide-prise-en-main-ForTheSoul.pdf"

BROWN = colors.HexColor("#4A3525")
BRONZE = colors.HexColor("#A97C45")
VIOLET = colors.HexColor("#6250AC")
CREAM = colors.HexColor("#FBF3E9")
PALE = colors.HexColor("#F4ECF2")
INK = colors.HexColor("#443F38")
LINE = colors.HexColor("#E8D8C7")


def inline_markup(text: str) -> str:
    escaped = html.escape(text)
    escaped = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", escaped)
    escaped = re.sub(r"`(.+?)`", r'<font name="Courier">\1</font>', escaped)
    return escaped


def draw_page(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.line(22 * mm, height - 18 * mm, width - 22 * mm, height - 18 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(BRONZE)
    canvas.drawString(22 * mm, height - 14 * mm, "ForTheSoul · Guide de prise en main")
    canvas.drawRightString(width - 22 * mm, 12 * mm, f"{doc.page}")
    canvas.restoreState()


def make_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "Title", parent=base["Title"], fontName="Times-Roman", fontSize=27,
            leading=31, textColor=BROWN, alignment=TA_CENTER, spaceAfter=7 * mm,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle", parent=base["BodyText"], fontName="Helvetica", fontSize=11,
            leading=17, textColor=BRONZE, alignment=TA_CENTER, spaceAfter=8 * mm,
        ),
        "h2": ParagraphStyle(
            "H2", parent=base["Heading2"], fontName="Times-Roman", fontSize=19,
            leading=23, textColor=BROWN, spaceBefore=7 * mm, spaceAfter=3 * mm,
            keepWithNext=True,
        ),
        "h3": ParagraphStyle(
            "H3", parent=base["Heading3"], fontName="Helvetica-Bold", fontSize=12,
            leading=16, textColor=VIOLET, spaceBefore=4 * mm, spaceAfter=2 * mm,
            keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "Body", parent=base["BodyText"], fontName="Helvetica", fontSize=9.5,
            leading=14.2, textColor=INK, spaceAfter=2.5 * mm,
        ),
        "bullet": ParagraphStyle(
            "Bullet", parent=base["BodyText"], fontName="Helvetica", fontSize=9.5,
            leading=14.2, textColor=INK, leftIndent=6 * mm, firstLineIndent=-3.5 * mm,
            spaceAfter=1.5 * mm,
        ),
        "note": ParagraphStyle(
            "Note", parent=base["BodyText"], fontName="Helvetica", fontSize=9,
            leading=13.5, textColor=BROWN, leftIndent=5 * mm, rightIndent=5 * mm,
            borderColor=colors.HexColor("#D8CDEA"), borderWidth=0.8,
            borderPadding=4 * mm, backColor=PALE, spaceBefore=2 * mm, spaceAfter=4 * mm,
        ),
        "code": ParagraphStyle(
            "Code", parent=base["Code"], fontName="Courier", fontSize=8.5,
            leading=12, textColor=BROWN, leftIndent=5 * mm, rightIndent=5 * mm,
            borderColor=LINE, borderWidth=0.6, borderPadding=3 * mm,
            backColor=colors.white, spaceAfter=4 * mm,
        ),
    }


def markdown_story(text: str):
    styles = make_styles()
    story = []
    paragraph = []
    in_code = False
    code_lines = []
    quote_lines = []

    def flush_paragraph():
        nonlocal paragraph
        if paragraph:
            story.append(Paragraph(inline_markup(" ".join(paragraph)), styles["body"]))
            paragraph = []

    def flush_quote():
        nonlocal quote_lines
        if quote_lines:
            story.append(Paragraph(inline_markup(" ".join(quote_lines)), styles["note"]))
            quote_lines = []

    for raw in text.splitlines():
        line = raw.rstrip()
        if line.startswith("```"):
            flush_paragraph()
            flush_quote()
            if in_code:
                story.append(Paragraph("<br/>".join(html.escape(v) for v in code_lines), styles["code"]))
                code_lines = []
            in_code = not in_code
            continue
        if in_code:
            code_lines.append(line)
            continue
        if not line:
            flush_paragraph()
            flush_quote()
            continue
        if line.startswith("> "):
            flush_paragraph()
            quote_lines.append(line[2:])
            continue
        flush_quote()
        if line.startswith("# "):
            flush_paragraph()
            story.append(Spacer(1, 16 * mm))
            story.append(Paragraph(inline_markup(line[2:]), styles["title"]))
            story.append(Paragraph("Administration, publications, contacts et suivi", styles["subtitle"]))
        elif line.startswith("## "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(line[3:]), styles["h2"]))
        elif line.startswith("### "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(line[4:]), styles["h3"]))
        elif re.match(r"^[-*] ", line):
            flush_paragraph()
            story.append(Paragraph("• " + inline_markup(line[2:]), styles["bullet"]))
        elif re.match(r"^\d+\. ", line):
            flush_paragraph()
            number, content = line.split(". ", 1)
            story.append(Paragraph(f"<b>{number}.</b> " + inline_markup(content), styles["bullet"]))
        else:
            paragraph.append(line)
    flush_paragraph()
    flush_quote()
    return story


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    width, height = A4
    doc = BaseDocTemplate(
        str(OUTPUT), pagesize=A4, leftMargin=22 * mm, rightMargin=22 * mm,
        topMargin=24 * mm, bottomMargin=20 * mm,
        title="Guide de prise en main ForTheSoul",
        author="ForTheSoul",
        subject="Guide d’administration de la plateforme",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates([PageTemplate(id="guide", frames=[frame], onPage=draw_page)])
    story = markdown_story(SOURCE.read_text(encoding="utf-8"))
    story.append(Spacer(1, 7 * mm))
    story.append(Paragraph(
        "<b>Besoin d’aide ?</b><br/>Notez la page concernée, l’action effectuée et le message affiché. "
        "Une capture d’écran permet de diagnostiquer plus rapidement le problème.",
        make_styles()["note"],
    ))
    doc.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    main()
