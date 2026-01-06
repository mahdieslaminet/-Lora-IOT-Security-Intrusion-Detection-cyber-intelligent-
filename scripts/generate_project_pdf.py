"""Generate a simple PDF from a Markdown file without external dependencies."""

from __future__ import annotations

import argparse
import textwrap
from pathlib import Path

PAGE_WIDTH = 612
PAGE_HEIGHT = 792
MARGIN = 72
FONT_SIZE = 10
LEADING = 12
WRAP_WIDTH = 100


def _escape_pdf(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _markdown_to_text_lines(md: str) -> list[str]:
    lines = md.splitlines()
    out: list[str] = []
    in_code = False

    for raw in lines:
        line = raw.rstrip()
        if line.strip().startswith("```"):
            in_code = not in_code
            out.append("")
            continue

        if in_code:
            out.append(line)
            continue

        if line.startswith("#"):
            heading = line.lstrip("#").strip()
            out.append(heading.upper())
            out.append("")
            continue

        if line.startswith("- "):
            out.append("* " + line[2:])
            continue

        out.append(line)

    return out


def _wrap_lines(lines: list[str]) -> list[str]:
    wrapped: list[str] = []
    for line in lines:
        if not line.strip():
            wrapped.append("")
            continue
        if line.startswith("* "):
            body = line[2:]
            wrapped_body = textwrap.fill(body, width=WRAP_WIDTH - 2)
            wrapped.append("* " + wrapped_body.split("\n")[0])
            for cont in wrapped_body.split("\n")[1:]:
                wrapped.append("  " + cont)
            continue
        if line.startswith("| ") or line.startswith("|"):
            # Keep tables readable by wrapping as-is
            wrapped.extend(textwrap.wrap(line, width=WRAP_WIDTH) or [""])
            continue
        wrapped.extend(textwrap.wrap(line, width=WRAP_WIDTH) or [""])
    return wrapped


def _build_pages(lines: list[str]) -> list[list[str]]:
    pages: list[list[str]] = []
    current: list[str] = []
    max_lines = int((PAGE_HEIGHT - 2 * MARGIN) / LEADING)

    for line in lines:
        if len(current) >= max_lines:
            pages.append(current)
            current = []
        current.append(line)

    if current:
        pages.append(current)

    return pages


def _build_pdf(pages: list[list[str]]) -> bytes:
    objects: list[bytes] = []
    offsets: list[int] = []

    def add_object(content: str) -> int:
        obj_number = len(objects) + 1
        objects.append(f"{obj_number} 0 obj\n{content}\nendobj\n".encode("utf-8"))
        return obj_number

    font_obj = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    content_objs = []
    page_objs = []
    for page_lines in pages:
        text_lines = []
        y = PAGE_HEIGHT - MARGIN - FONT_SIZE
        text_lines.append("BT")
        text_lines.append(f"/F1 {FONT_SIZE} Tf")
        text_lines.append(f"{MARGIN} {y} Td")
        first = True
        for line in page_lines:
            if not first:
                text_lines.append(f"0 -{LEADING} Td")
            first = False
            text_lines.append(f"({_escape_pdf(line)}) Tj")
        text_lines.append("ET")
        content_stream = "\n".join(text_lines)
        content_obj = add_object(f"<< /Length {len(content_stream.encode('utf-8'))} >>\nstream\n{content_stream}\nendstream")
        content_objs.append(content_obj)

        page_obj = add_object(
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            f"/Contents {content_obj} 0 R /Resources << /Font << /F1 {font_obj} 0 R >> >> >>"
        )
        page_objs.append(page_obj)

    kids = " ".join(f"{obj} 0 R" for obj in page_objs)
    pages_obj = add_object(f"<< /Type /Pages /Kids [{kids}] /Count {len(page_objs)} >>")

    catalog_obj = add_object(f"<< /Type /Catalog /Pages {pages_obj} 0 R >>")

    # Build xref
    output = bytearray()
    output.extend(b"%PDF-1.4\n")
    for obj in objects:
        offsets.append(len(output))
        output.extend(obj)

    xref_start = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n".encode("utf-8"))
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets:
        output.extend(f"{offset:010d} 00000 n \n".encode("utf-8"))

    output.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_obj} 0 R >>\nstartxref\n{xref_start}\n%%EOF\n".encode(
            "utf-8"
        )
    )

    return bytes(output)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    md = args.input.read_text(encoding="utf-8")
    lines = _markdown_to_text_lines(md)
    wrapped = _wrap_lines(lines)
    pages = _build_pages(wrapped)
    pdf_bytes = _build_pdf(pages)
    args.output.write_bytes(pdf_bytes)


if __name__ == "__main__":
    main()
