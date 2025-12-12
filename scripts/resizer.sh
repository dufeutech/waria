#!/bin/bash

# Files & Folder
FILE="docs/static/img/logo.png"
FOUT="docs/static/img/"

# Logo Resizer
uv run --with Pillow scripts/img_resizer.py "$FILE" "$FOUT"