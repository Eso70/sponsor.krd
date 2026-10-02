"""Flatten extension lookups for ImageResponse's OpenType parser.

Requires fonttools. Run from the frontend directory. Retains Rabar glyphs,
shaping rules and font metadata; the normal browser font is unchanged.
"""
from pathlib import Path
from fontTools.ttLib import TTFont

font_directory = Path(__file__).resolve().parents[1] / "public" / "fonts"
font = TTFont(font_directory / "KurdishFont.ttf")
for table_name, extension_type in (("GSUB", 7), ("GPOS", 9)):
    if table_name not in font:
        continue
    for lookup in font[table_name].table.LookupList.Lookup:
        if lookup.LookupType != extension_type:
            continue
        types = {subtable.ExtensionLookupType for subtable in lookup.SubTable}
        if len(types) != 1:
            raise ValueError("Mixed extension lookup types cannot be flattened")
        lookup.LookupType = types.pop()
        lookup.SubTable = [subtable.ExtSubTable for subtable in lookup.SubTable]
        lookup.SubTableCount = len(lookup.SubTable)
font.save(font_directory / "KurdishFont-share.ttf")
print("Prepared compatible Rabar share-image font")
