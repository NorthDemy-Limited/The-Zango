#!/usr/bin/env python3
import os
import shutil
from PIL import Image, ImageDraw, ImageFont

def main():
    artifact_dir = "/home/abujulaybeeb/.gemini/antigravity/brain/53bfdf80-b400-4fcc-b572-e7264e29c29f"
    public_dir = "/home/abujulaybeeb/Documents/TheZango/public"
    os.makedirs(artifact_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)

    admin_src = "/tmp/sc_admin_full.png"
    author_src = "/tmp/sc_author_full.png"
    portal_src = "/tmp/sc_portal_full.png"

    # 1. Primary SC-Manual is the Chief CMS Dashboard
    sc_manual_target = os.path.join(public_dir, "SC-Manual.png")
    shutil.copyfile(admin_src, sc_manual_target)
    shutil.copyfile(admin_src, os.path.join(artifact_dir, "SC-Manual.png"))
    print(f"Created primary SC-Manual.png at {sc_manual_target}")

    # Copy individual sub-manual screenshots
    shutil.copyfile(author_src, os.path.join(public_dir, "SC-Manual-Writer.png"))
    shutil.copyfile(author_src, os.path.join(artifact_dir, "SC-Manual-Writer.png"))
    shutil.copyfile(portal_src, os.path.join(public_dir, "SC-Manual-Portal.png"))
    shutil.copyfile(portal_src, os.path.join(artifact_dir, "SC-Manual-Portal.png"))

    # 2. Build High-Fidelity 3-Panel Composite Manual Figure
    im_portal = Image.open(portal_src)
    im_author = Image.open(author_src)
    im_admin = Image.open(admin_src)

    # Scale down slightly for a clean unified canvas
    target_w = 1200
    ratio = target_w / im_admin.width
    target_h = int(im_admin.height * ratio)

    p_portal = im_portal.resize((target_w, target_h), Image.Resampling.LANCZOS)
    p_author = im_author.resize((target_w, target_h), Image.Resampling.LANCZOS)
    p_admin = im_admin.resize((target_w, target_h), Image.Resampling.LANCZOS)

    header_h = 90
    panel_gap = 45
    footer_h = 60
    total_w = target_w + 80
    total_h = header_h + (target_h * 3) + (panel_gap * 3) + footer_h

    canvas = Image.new("RGB", (total_w, total_h), color="#0F172A")
    draw = ImageDraw.Draw(canvas)

    font_path_bold = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
    font_path_reg = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
    font_title = ImageFont.truetype(font_path_bold, 24)
    font_sub = ImageFont.truetype(font_path_reg, 14)
    font_label = ImageFont.truetype(font_path_bold, 16)
    font_desc = ImageFont.truetype(font_path_reg, 13)

    # Document Header
    draw.text((40, 24), "THE ZANGO — USER MANUAL & SYSTEM INTERFACE REFERENCE", fill="#F8FAFC", font=font_title)
    draw.text((40, 58), "Operational Interfaces: Public Portal (/) | Writer Studio (/dashboard/author) | Chief CMS (/dashboard/admin)", fill="#94A3B8", font=font_sub)

    # Panels
    panels = [
        ("FIGURE 1: PUBLIC NEWSROOM & READER INTERFACE (/)", "Access point for breaking news ticker, beat desks, search (⌘K), reading list drawer, and reader comments.", p_portal),
        ("FIGURE 2: WRITER & CONTRIBUTOR STUDIO (/dashboard/author)", "Investigative story composer with WYSIWYG editing, word count velocity, offline autosave, and pitch review queue.", p_author),
        ("FIGURE 3: CHIEF EDITOR & NEWSROOM CMS (/dashboard/admin)", "Administrative command center with platform metrics, review queue triage, staff RBAC clearance, and merchant vetting.", p_admin)
    ]

    curr_y = header_h + 10
    for label, desc, img in panels:
        # Title badge
        draw.text((40, curr_y), label, fill="#38BDF8", font=font_label)
        draw.text((40, curr_y + 22), desc, fill="#CBD5E1", font=font_desc)

        # Image border
        border_box = [38, curr_y + 46, 40 + target_w + 2, curr_y + 46 + target_h + 2]
        draw.rectangle(border_box, outline="#334155", width=2)
        canvas.paste(img, (40, curr_y + 48))

        curr_y += target_h + panel_gap + 48

    # Footer
    draw.line([40, total_h - 45, total_w - 40, total_h - 45], fill="#1E293B", width=1)
    draw.text((40, total_h - 32), "Document Reference: SC-Manual | The Zango Sahel Journalism Platform | Verified Production-Ready", fill="#64748B", font=font_desc)

    composite_path = os.path.join(public_dir, "SC-Manual-Composite.png")
    composite_artifact = os.path.join(artifact_dir, "SC-Manual-Composite.png")
    canvas.save(composite_path, "PNG")
    canvas.save(composite_artifact, "PNG")
    print(f"Created composite manual figure at {composite_path}")

if __name__ == "__main__":
    main()
