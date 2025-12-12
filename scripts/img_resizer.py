#!/usr/bin/env python3
"""
Logo Resizer for Web Projects

Resizes a source logo to common sizes needed for web projects:
- favicon.ico (16x16, 32x32, 48x48 multi-size)
- favicon-16x16.png
- favicon-32x32.png
- apple-touch-icon.png (180x180)
- logo-192.png (PWA)
- logo-512.png (PWA)
- navbar logo (configurable, default 32px height)
- og-image.png (1200x630 with logo centered)

Usage:
    python resize-logo.py <source_logo> [output_dir]
    python resize-logo.py logo.png static/img/
    python resize-logo.py logo.png  # outputs to current directory

Requirements:
    pip install Pillow
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is required. Install with: pip install Pillow")
    sys.exit(1)


def resize_logo(source_path: str, output_dir: str = ".") -> None:
    """Resize logo to common web sizes."""

    source = Path(source_path)
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)

    if not source.exists():
        print(f"Error: Source file not found: {source}")
        sys.exit(1)

    # Open source image
    img = Image.open(source)

    # Convert to RGBA if needed
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    print(f"Source: {source} ({img.width}x{img.height})")
    print(f"Output: {output}")
    print()

    # Define sizes to generate
    sizes = {
        "favicon-16x16.png": (16, 16),
        "favicon-32x32.png": (32, 32),
        "favicon-48x48.png": (48, 48),
        "apple-touch-icon.png": (180, 180),
        "logo-192.png": (192, 192),
        "logo-512.png": (512, 512),
        "logo-64.png": (64, 64),  # navbar logo
    }

    for filename, size in sizes.items():
        output_path = output / filename

        # Skip if output would overwrite the source file
        if output_path.resolve() == source.resolve():
            print(f"  Skipped: {filename} (would overwrite source)")
            continue

        resized = img.copy()
        resized.thumbnail(size, Image.Resampling.LANCZOS)

        # Create square canvas and center the image
        canvas = Image.new("RGBA", size, (0, 0, 0, 0))
        x = (size[0] - resized.width) // 2
        y = (size[1] - resized.height) // 2
        canvas.paste(resized, (x, y))

        canvas.save(output_path, "PNG", optimize=True)
        print(f"  Created: {filename} ({size[0]}x{size[1]})")

    # Create favicon.ico with multiple sizes
    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    ico_images = []

    for size in ico_sizes:
        resized = img.copy()
        resized.thumbnail(size, Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", size, (0, 0, 0, 0))
        x = (size[0] - resized.width) // 2
        y = (size[1] - resized.height) // 2
        canvas.paste(resized, (x, y))
        ico_images.append(canvas)

    ico_path = output / "favicon.ico"
    ico_images[0].save(
        ico_path,
        format="ICO",
        sizes=[(s[0], s[1]) for s in ico_sizes],
        append_images=ico_images[1:]
    )
    print(f"  Created: favicon.ico (16x16, 32x32, 48x48)")

    # Create OG image (1200x630 with centered logo)
    og_size = (1200, 630)
    og_image = Image.new("RGBA", og_size, (255, 255, 255, 255))

    # Scale logo to fit nicely (max 300px)
    og_logo = img.copy()
    og_logo.thumbnail((300, 300), Image.Resampling.LANCZOS)

    x = (og_size[0] - og_logo.width) // 2
    y = (og_size[1] - og_logo.height) // 2
    og_image.paste(og_logo, (x, y), og_logo)

    og_path = output / "og-image.png"
    og_image.convert("RGB").save(og_path, "PNG", optimize=True)
    print(f"  Created: og-image.png ({og_size[0]}x{og_size[1]})")

    print()
    print("Done!")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    source = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "."

    resize_logo(source, output_dir)


if __name__ == "__main__":
    main()
