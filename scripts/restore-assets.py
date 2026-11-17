"""Restore the unchanged image from the already published submission archive, without extraction."""
from pathlib import Path
import hashlib,zipfile
ROOT=Path(__file__).resolve().parents[1]
TARGET=ROOT/'web/food-atlas-v1.png'
EXPECTED='5175e013468a34ee889760e66bc503673d31496546015689570ef89db29af4d5'
if TARGET.exists():
 if hashlib.sha256(TARGET.read_bytes()).hexdigest()!=EXPECTED:raise SystemExit('Existing image differs; left unchanged for review.')
 print('Image already verified.')
else:
 with zipfile.ZipFile(ROOT/'Matbudget-source-2026-11-16.zip') as archive:
  info=archive.getinfo('matbudget/web/food-atlas-v1.png')
  if info.file_size>10_000_000:raise SystemExit('Unexpected archive image size.')
  content=archive.read(info)
 if hashlib.sha256(content).hexdigest()!=EXPECTED:raise SystemExit('Image checksum mismatch.')
 TARGET.parent.mkdir(parents=True,exist_ok=True)
 TARGET.write_bytes(content)
 print('Verified image restored from the original source archive.')
