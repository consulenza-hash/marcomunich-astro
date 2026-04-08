#!/usr/bin/env python3
"""
generate-book-pdfs-rl.py

Genera PDF professionali con ReportLab — controllo totale sul layout,
nessun browser, page-break perfetti garantiti.

Output: public/libri/pdf/{slug}.pdf
"""

import sys, io, os
from pathlib import Path
from docx import Document

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    KeepTogether, HRFlowable, Image as RLImage, BaseDocTemplate,
    Frame, PageTemplate
)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PDF_OUT = PROJECT_ROOT / "public" / "libri" / "pdf"
COVERS_DIR = PROJECT_ROOT / "public" / "libri" / "copertine"
PDF_OUT.mkdir(parents=True, exist_ok=True)

BOOKS = [
    {
        "slug": "scrivere-per-restare",
        "title": "Scrivere per restare",
        "subtitle": "Il personal branding olistico spiegato attraverso piccoli spaccati di vita",
        "author": "Marco Munich",
        "docx": r"D:/Download/scrivere-per-restare-REVISED.docx",
        "accent": "#E8590C",
        "price": "7,90 €",
    },
    {
        "slug": "restare-autentici-con-ai",
        "title": "Restare autentici scrivendo con l'intelligenza artificiale",
        "subtitle": "Guida pratica per counselor, coach e operatori olistici",
        "author": "Marco Munich",
        "docx": r"D:/Download/restare-autentici-ai-REVISED.docx",
        "accent": "#E8590C",
        "price": "9,90 €",
    },
    {
        "slug": "un-anno-di-scrittura",
        "title": "Un anno di scrittura per scoprire chi sei davvero",
        "subtitle": "Un viaggio di 52 settimane per raccontarti online",
        "author": "Marco Munich",
        "docx": r"D:/Download/un-anno-di-scrittura-REVISED.docx",
        "accent": "#E8590C",
        "price": "12,90 €",
    },
]

SKIP_STYLES = {"toc 1", "toc 2", "toc 3"}
PAGE_W, PAGE_H = A4
MARGIN = 22 * mm
ACCENT = HexColor("#E8590C")
INK = HexColor("#1a1a1a")
LIGHT = HexColor("#666666")
DARK_BG = HexColor("#0d1117")


def make_styles():
    base = getSampleStyleSheet()

    body = ParagraphStyle(
        "Body",
        fontName="Helvetica",
        fontSize=10.5,
        leading=18,
        textColor=INK,
        alignment=TA_JUSTIFY,
        spaceAfter=4 * mm,
        firstLineIndent=0,
        allowOrphans=0,
        allowWidows=0,
    )

    chapter = ParagraphStyle(
        "Chapter",
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=DARK_BG,
        spaceBefore=0,
        spaceAfter=6 * mm,
        alignment=TA_LEFT,
        allowOrphans=0,
        allowWidows=0,
    )

    h2 = ParagraphStyle(
        "H2",
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=18,
        textColor=DARK_BG,
        spaceBefore=6 * mm,
        spaceAfter=3 * mm,
        alignment=TA_LEFT,
        allowOrphans=0,
        allowWidows=0,
    )

    h3 = ParagraphStyle(
        "H3",
        fontName="Helvetica-BoldOblique",
        fontSize=11,
        leading=16,
        textColor=LIGHT,
        spaceBefore=4 * mm,
        spaceAfter=2 * mm,
        alignment=TA_LEFT,
        allowOrphans=0,
        allowWidows=0,
    )

    title_page_title = ParagraphStyle(
        "TitlePageTitle",
        fontName="Helvetica-Bold",
        fontSize=26,
        leading=30,
        textColor=DARK_BG,
        spaceAfter=8 * mm,
        alignment=TA_LEFT,
    )

    title_page_author = ParagraphStyle(
        "TitlePageAuthor",
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=16,
        textColor=ACCENT,
        spaceAfter=4 * mm,
        alignment=TA_LEFT,
        letterSpacing=1.5,
    )

    title_page_sub = ParagraphStyle(
        "TitlePageSub",
        fontName="Helvetica",
        fontSize=12,
        leading=18,
        textColor=LIGHT,
        spaceAfter=4 * mm,
        alignment=TA_LEFT,
    )

    legal = ParagraphStyle(
        "Legal",
        fontName="Helvetica",
        fontSize=7.5,
        leading=12,
        textColor=HexColor("#aaaaaa"),
        alignment=TA_LEFT,
    )

    return {
        "body": body,
        "chapter": chapter,
        "h2": h2,
        "h3": h3,
        "title": title_page_title,
        "author": title_page_author,
        "subtitle": title_page_sub,
        "legal": legal,
    }


def extract_sections(docx_path):
    doc = Document(docx_path)
    sections = []
    for p in doc.paragraphs:
        text = p.text.strip()
        if not text or p.style.name in SKIP_STYLES:
            continue
        sections.append({"style": p.style.name, "text": text})
    return sections


def add_cover_page(story, cover_png):
    """La copertina viene disegnata nel callback canvas — niente da aggiungere allo story."""
    pass  # gestita in make_on_page()


def add_title_page(story, book, styles):
    """Pagina titolo con autore, titolo, legal."""
    story.append(Spacer(1, 50 * mm))
    story.append(Paragraph("MARCO MUNICH", styles["author"]))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(book["title"], styles["title"]))
    story.append(Spacer(1, 4 * mm))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(book["subtitle"], styles["subtitle"]))
    story.append(Spacer(1, 80 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=HexColor("#e0e0e0")))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        f"© Marco Munich · marcomunich.com · {book['price']}<br/>"
        "Licenza Creative Commons BY-NC-ND 4.0 · Uso personale — vietata la riproduzione e distribuzione",
        styles["legal"]
    ))
    story.append(PageBreak())


def build_story(book, styles):
    sections = extract_sections(book["docx"])
    story = []

    # Copertina (pagina vuota — l'immagine è disegnata via canvas callback)
    cover_png = COVERS_DIR / f'cover-{book["slug"]}.png'
    story.append(PageBreak())  # p.1 = copertina disegnata dal callback

    # Pagina titolo
    add_title_page(story, book, styles)

    # Contenuto — raggruppa heading + primo paragrafo in KeepTogether
    i = 0
    while i < len(sections):
        sec = sections[i]
        style_name = sec["style"]
        text = sec["text"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        if style_name in ("Title", "Subtitle"):
            i += 1
            continue

        is_h1 = "Heading 1" in style_name
        is_h2 = "Heading 2" in style_name
        is_h3 = "Heading 3" in style_name or "Heading 4" in style_name

        if is_h1:
            # Capitolo: inizia su nuova pagina
            group = [
                PageBreak(),
                HRFlowable(width="100%", thickness=3, color=ACCENT, spaceAfter=4 * mm),
                Paragraph(text, styles["chapter"]),
            ]
            # Aggiungi i prossimi 1-2 paragrafi al gruppo (mai separati dal titolo)
            j = i + 1
            added = 0
            while j < len(sections) and added < 2:
                ns = sections[j]
                if "Heading" in ns["style"]:
                    break
                nt = ns["text"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                group.append(Paragraph(nt, styles["body"]))
                j += 1
                added += 1
            story.append(KeepTogether(group))
            i = j
            continue

        elif is_h2:
            group = [Paragraph(text, styles["h2"])]
            j = i + 1
            if j < len(sections) and "Heading" not in sections[j]["style"]:
                nt = sections[j]["text"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                group.append(Paragraph(nt, styles["body"]))
                j += 1
            else:
                j = i + 1
            story.append(KeepTogether(group))
            i = j
            continue

        elif is_h3:
            group = [Paragraph(text, styles["h3"])]
            j = i + 1
            if j < len(sections) and "Heading" not in sections[j]["style"]:
                nt = sections[j]["text"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                group.append(Paragraph(nt, styles["body"]))
                j += 1
            else:
                j = i + 1
            story.append(KeepTogether(group))
            i = j
            continue

        else:
            story.append(Paragraph(text, styles["body"]))

        i += 1

    return story


def make_on_page(cover_png):
    """Restituisce callback canvas che disegna copertina a p.1 e numero a pagine successive."""
    def on_page(canvas, doc):
        canvas.saveState()
        if doc.page == 1 and cover_png and cover_png.exists():
            # Copertina: immagine a pagina intera, senza margini
            canvas.drawImage(str(cover_png), 0, 0,
                             width=PAGE_W, height=PAGE_H,
                             preserveAspectRatio=False, mask='auto')
        elif doc.page > 2:
            # Numero pagina dal cap. 1 in poi (p.1=copertina, p.2=titolo)
            canvas.setFont("Helvetica", 8)
            canvas.setFillColor(HexColor("#bbbbbb"))
            canvas.drawCentredString(PAGE_W / 2, 10 * mm, str(doc.page - 2))
        canvas.restoreState()
    return on_page


def generate_pdf(book, styles):
    out_pdf = PDF_OUT / f'{book["slug"]}.pdf'
    doc = SimpleDocTemplate(
        str(out_pdf),
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
        title=book["title"],
        author=book["author"],
        subject=book["subtitle"],
    )
    cover_png = COVERS_DIR / f'cover-{book["slug"]}.png'
    story = build_story(book, styles)
    on_page = make_on_page(cover_png)
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    size_kb = out_pdf.stat().st_size // 1024
    print(f"  OK  {book['slug']}.pdf ({size_kb} KB)")


def main():
    styles = make_styles()
    print("\nGenerazione PDF con ReportLab...\n")
    for book in BOOKS:
        print(f"→ {book['title'][:55]}...")
        try:
            generate_pdf(book, styles)
        except Exception as e:
            import traceback
            print(f"  ERR: {e}")
            traceback.print_exc()
    print(f"\nPDF salvati in: {PDF_OUT}\n")


if __name__ == "__main__":
    main()
