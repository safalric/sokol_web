from pathlib import Path
import shutil

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf"
PUBLIC = ROOT / "public" / "posters"
LOGO = ROOT / "public" / "brand" / "sokol-symbol-rgb.png"

pdfmetrics.registerFont(TTFont("SokolSans", r"C:\Windows\Fonts\arial.ttf"))
pdfmetrics.registerFont(TTFont("SokolSansBold", r"C:\Windows\Fonts\arialbd.ttf"))

POSTERS = [
    {
        "file": "sokolsky-vylet-2026.pdf",
        "label": "RODINNÝ VÝLET",
        "title": "Sokolský výlet do Orlických hor",
        "date": "SOBOTA 19. ZÁŘÍ 2026",
        "details": ["Odjezd v 8:30", "Sraz u sokolovny", "Kapacita 30 míst"],
        "description": "Lehčí trasa pro děti, rodiče i členy jednoty. Společný oběd a návrat odpoledne.",
    },
    {
        "file": "sokolsky-beh-republiky-2026.pdf",
        "label": "KOMUNITNÍ AKCE",
        "title": "Sokolský běh republiky",
        "date": "ŘÍJEN 2026",
        "details": ["Čas bude upřesněn", "Doudleby nad Orlicí", "Otevřeno veřejnosti"],
        "description": "Běh pro všechny věkové kategorie. Připravujeme tratě pro děti i dospělé.",
    },
    {
        "file": "letni-tabor-2027.pdf",
        "label": "LETNÍ TÁBOR",
        "title": "Letní tábor TJ Sokol",
        "date": "ČERVENEC 2027",
        "details": ["Týdenní pobyt", "Místo bude potvrzeno", "Předběžný zájem"],
        "description": "Připravujeme termín, cenu a pokyny pro rodiče. Sledujte aktuální informace na webu.",
    },
]


def draw_paragraph(pdf, text, style, x, y, width, height):
    paragraph = Paragraph(text, style)
    _, used_height = paragraph.wrap(width, height)
    paragraph.drawOn(pdf, x, y - used_height)
    return y - used_height


def create_poster(data, path):
    width, height = A4
    pdf = canvas.Canvas(str(path), pagesize=A4)
    pdf.setTitle(data["title"])
    pdf.setAuthor("TJ Sokol Doudleby nad Orlicí")

    red = HexColor("#D8172F")
    navy = HexColor("#132238")
    paper = HexColor("#F7F4F0")
    gray = HexColor("#4B5563")

    pdf.setFillColor(paper)
    pdf.rect(0, 0, width, height, fill=1, stroke=0)
    pdf.setFillColor(red)
    pdf.rect(0, height - 92 * mm, width, 92 * mm, fill=1, stroke=0)
    pdf.setFillColor(navy)
    pdf.rect(0, height - 96 * mm, width, 4 * mm, fill=1, stroke=0)
    pdf.drawImage(str(LOGO), 18 * mm, height - 40 * mm, 22 * mm, 22 * mm, mask="auto", preserveAspectRatio=True)

    pdf.setFillColor(white)
    pdf.setFont("SokolSansBold", 13)
    pdf.drawString(47 * mm, height - 25 * mm, "TJ SOKOL DOUDLEBY NAD ORLICÍ")
    pdf.setFont("SokolSansBold", 10)
    pdf.drawString(47 * mm, height - 33 * mm, data["label"])

    title_style = ParagraphStyle("title", fontName="SokolSansBold", fontSize=30, leading=32, textColor=white, alignment=TA_LEFT)
    draw_paragraph(pdf, data["title"], title_style, 18 * mm, height - 50 * mm, width - 36 * mm, 42 * mm)

    y = height - 116 * mm
    pdf.setFillColor(red)
    pdf.setFont("SokolSansBold", 22)
    pdf.drawString(18 * mm, y, data["date"])
    y -= 15 * mm

    for detail in data["details"]:
        pdf.setFillColor(navy)
        pdf.circle(20 * mm, y + 1.5 * mm, 1.6 * mm, fill=1, stroke=0)
        pdf.setFont("SokolSansBold", 13)
        pdf.drawString(27 * mm, y - 1.5 * mm, detail)
        y -= 11 * mm

    description_style = ParagraphStyle("description", fontName="SokolSans", fontSize=13, leading=20, textColor=gray)
    draw_paragraph(pdf, data["description"], description_style, 18 * mm, y - 4 * mm, width - 36 * mm, 45 * mm)

    pdf.setFillColor(navy)
    pdf.rect(0, 0, width, 34 * mm, fill=1, stroke=0)
    pdf.setFillColor(white)
    pdf.setFont("SokolSansBold", 10)
    pdf.drawString(18 * mm, 22 * mm, "UKÁZKOVÝ PLAKÁT")
    pdf.setFont("SokolSans", 9)
    pdf.drawString(18 * mm, 14 * mm, "Termín a údaje musí před zveřejněním potvrdit vedení jednoty.")
    pdf.drawRightString(width - 18 * mm, 14 * mm, "sokoldoudleby.cz")

    pdf.showPage()
    pdf.save()


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for poster in POSTERS:
        output_path = OUTPUT / poster["file"]
        create_poster(poster, output_path)
        shutil.copy2(output_path, PUBLIC / poster["file"])


if __name__ == "__main__":
    main()
