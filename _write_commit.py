#!/usr/bin/env python3
import os, subprocess

msg = """Phase 13: Deep Researcher Dashboard Audit & Rewrite

CRITICAL FIXES:
- FUNC-1: PDF upload endpoint mismatch - client called /pdf but server registers /upload-pdf
- FUNC-2: PDF size limit mismatch - client allowed 20MB, server enforces 10MB. Aligned to 10MB
- FUNC-3: Sync tab duplicate raw fetch() replaced with proper syncMutation

DESIGN SYSTEM:
- Replaced 5 hardcoded bg-[#0B1F3A] with bg-primary hover:bg-primary/90
- Replaced custom header with clean white border-b header + primary icon
- Added GlobalFooter mode="app"

ACCESSIBILITY:
- All form labels have proper htmlFor/id pairing (15+ fields)
- Star toggle has aria-pressed and aria-label
- Section action buttons have descriptive aria-labels
- Theme buttons have aria-pressed and aria-label
- Password toggles have aria-labels

UX:
- Merged Social tab into Profile (6 tabs to 5)
- Social links in responsive 2-col grid
- Scrollable tab bar on mobile with icon-only labels

PERFORMANCE:
- Publications/sections/sync-logs/themes queries lazy-load per active tab

CODE QUALITY:
- Consolidated 9 useState hooks into single ProfileFormState object
- PDF upload/delete extracted into proper useMutation hooks
- Handlers wrapped in useCallback
"""

root = os.path.dirname(os.path.abspath(__file__))
msg_path = os.path.join(root, "_commitmsg.txt")
with open(msg_path, "w") as f:
    f.write(msg)
print(f"Wrote commit message to {msg_path}")
