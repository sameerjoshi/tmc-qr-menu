#!/usr/bin/env python3
"""
QR Code Generator with Logo
Generates a QR code for menu.themistycup.com with a centered logo
"""

import qrcode
from PIL import Image

# Configuration
URL = "https://menu.themistycup.com/"
LOGO_PATH = "/tmp/tmc.png"
OUTPUT_PATH = "tmc_qr_code.png"

# QR Code settings - Higher values for better quality
QR_VERSION = 1
QR_BOX_SIZE = 20  # Increased for higher resolution
QR_BORDER = 4

def generate_qr_with_logo(url, logo_path, output_path):
    """Generate QR code with centered logo"""

    # Create QR code
    qr = qrcode.QRCode(
        version=QR_VERSION,
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # High error correction for logo overlay
        box_size=QR_BOX_SIZE,
        border=QR_BORDER,
    )

    qr.add_data(url)
    qr.make(fit=True)

    # Create QR code image
    qr_img = qr.make_image(fill_color="black", back_color="white").convert('RGB')

    # Open and resize logo
    try:
        logo = Image.open(logo_path)

        # Calculate logo size (about 1/4 of QR code size for better visibility)
        qr_width, qr_height = qr_img.size
        logo_size = min(qr_width, qr_height) // 4

        # Convert to RGB if needed
        if logo.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', logo.size, (255, 255, 255))
            if logo.mode == 'P':
                logo = logo.convert('RGBA')
            if 'A' in logo.mode:
                background.paste(logo, mask=logo.split()[-1])
            else:
                background.paste(logo)
            logo = background

        # Resize logo maintaining aspect ratio with high quality
        logo = logo.resize(
            (logo_size, logo_size),
            Image.Resampling.LANCZOS
        )

        # Create a white box for the logo (slightly larger than logo)
        box_size = logo_size + 20
        box = Image.new('RGB', (box_size, box_size), 'white')

        # Calculate positions for centering
        logo_pos = ((box_size - logo.width) // 2, (box_size - logo.height) // 2)
        box_pos = ((qr_width - box_size) // 2, (qr_height - box_size) // 2)

        # Paste white box on QR code
        qr_img.paste(box, box_pos)

        # Paste logo on white box
        qr_img.paste(logo, (box_pos[0] + logo_pos[0], box_pos[1] + logo_pos[1]))

        print(f"✓ QR code with logo generated successfully!")
    except FileNotFoundError:
        print(f"⚠ Logo file not found at {logo_path}")
        print(f"✓ QR code generated without logo")
    except Exception as e:
        print(f"⚠ Error adding logo: {e}")
        print(f"✓ QR code generated without logo")

    # Save QR code with high quality
    qr_img.save(output_path, quality=95, optimize=False)
    print(f"✓ Saved to: {output_path}")
    print(f"✓ QR Code size: {qr_img.size[0]}x{qr_img.size[1]} pixels")
    print(f"✓ URL encoded: {url}")

    return output_path

if __name__ == "__main__":
    print("Generating QR Code for The Misty Cup...")
    print("=" * 50)
    generate_qr_with_logo(URL, LOGO_PATH, OUTPUT_PATH)
    print("=" * 50)
    print("Done!")
