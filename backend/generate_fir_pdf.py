import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

def create_fir_pdf():
    output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "FIR_CASE_001.pdf"))
    
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter
    
    # Header Box
    c.setFillColor(colors.HexColor("#1e3a8a"))
    c.rect(40, height - 80, width - 80, 50, fill=True, stroke=False)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, height - 55, "DELHI POLICE - FIRST INFORMATION REPORT (F.I.R.)")
    c.setFont("Helvetica", 10)
    c.drawCentredString(width / 2, height - 70, "[ Under Section 173 of Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) ]")
    
    # Body Content
    c.setFillColor(colors.black)
    y = height - 110
    
    def draw_line(label, value):
        nonlocal y
        c.setFont("Helvetica-Bold", 10)
        c.drawString(50, y, label)
        c.setFont("Helvetica", 10)
        c.drawString(200, y, value)
        y -= 18

    draw_line("1. District & Station:", "Central Railway District | PS New Delhi Railway Station")
    draw_line("2. F.I.R. Number:", "FIR-2026-001")
    draw_line("3. Date & Time of Report:", "01-09-2026 at 14:30 IST")
    draw_line("4. Acts & Sections:", "Section 303(2) Bharatiya Nyaya Sanhita, 2023 (Theft)")
    
    y -= 10
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(colors.HexColor("#1e3a8a"))
    c.drawString(50, y, "COMPLAINANT DETAILS:")
    y -= 18
    c.setFillColor(colors.black)
    draw_line("   - Name & Father:", "Rajesh Kumar (S/o Ramesh Kumar)")
    draw_line("   - Age & Contact:", "32 Years | +91 98765 43210")
    draw_line("   - Residence Address:", "Flat No. 402, Sector 4, Rohini, New Delhi")

    y -= 10
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(colors.HexColor("#1e3a8a"))
    c.drawString(50, y, "INCIDENT & OCCURRENCE DETAILS:")
    y -= 18
    c.setFillColor(colors.black)
    draw_line("   - Place of Occurrence:", "Platform 1, Executive Waiting Hall, NDLS")
    draw_line("   - Date & Time of Event:", "01-09-2026 between 14:00 hrs and 14:20 hrs")
    draw_line("   - Property Stolen:", "Lenovo ThinkPad T14 (Serial: TP-9988231) in Black Bag")
    
    y -= 10
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(colors.HexColor("#1e3a8a"))
    c.drawString(50, y, "STATEMENT OF FACTS:")
    y -= 18
    c.setFillColor(colors.black)
    
    statement = (
        "The complainant states that while waiting at the Executive Waiting Hall at Platform 1 "
        "to board Train #12011 to Chandigarh, he placed his black laptop bag on the adjacent seat. "
        "At approximately 14:15 hrs, he stepped away for 4 minutes to purchase a water bottle from the "
        "adjacent IRCTC stall. Upon returning at 14:19 hrs, the laptop bag was missing. "
        "Preliminary inspection of station CCTV Camera #4 revealed an unidentified male individual "
        "(approx. 25-30 years, wearing a black jacket and blue jeans) picking up the bag and exiting "
        "swiftly through Gate No. 2 towards the taxi stand."
    )
    
    # Text wrapping
    text_object = c.beginText(50, y)
    text_object.setFont("Helvetica", 9.5)
    text_object.setLeading(14)
    for line in [statement[i:i+85] for i in range(0, len(statement), 85)]:
        text_object.textLine(line)
    c.drawText(text_object)
    
    y -= 90
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(colors.HexColor("#1e3a8a"))
    c.drawString(50, y, "SUSPECT & ACTION DETAILS:")
    y -= 18
    c.setFillColor(colors.black)
    draw_line("   - Suspect Description:", "Unknown male, ~25-30 years, black jacket, blue jeans")
    draw_line("   - Investigating Officer:", "Sub-Inspector Amit Sharma (Belt No. 4412-D)")
    draw_line("   - Action Taken:", "Registered under BNS 303(2); CCTV footage preserved.")

    # Footer Box
    y -= 30
    c.setStrokeColor(colors.HexColor("#cbd5e1"))
    c.setFillColor(colors.HexColor("#f8fafc"))
    c.rect(40, y - 40, width - 80, 50, fill=True, stroke=True)
    
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 9)
    c.drawString(50, y - 10, "Officer-in-Charge: Sub-Inspector Amit Sharma (Digital e-Signed)")
    c.setFont("Courier", 8)
    c.drawString(50, y - 25, "Cryptographic e-Sign Token: ESIGN-UIDAI-2026-NDLS-788910")
    c.drawString(50, y - 35, "Government of India - National Crime Records Bureau (NCRB)")

    c.save()
    print(f"PDF Successfully Generated at: {output_path}")

if __name__ == "__main__":
    create_fir_pdf()
