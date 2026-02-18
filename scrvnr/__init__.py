"""
GHM SCRVNR Package
==================
AI detection + voice alignment gate for Website Studio.

Primary entry point: SCRVNRGate
Profile tools:       VoiceProfileExtractor, load_profile
"""

import sys
from pathlib import Path

# Make core importable from package root
sys.path.insert(0, str(Path(__file__).parent / "core"))

from core.scrvnr_gate import SCRVNRGate, load_profile
from core.pass1_ai_detection import AIDetector
from core.pass2_voice_alignment import VoiceAligner
from core.voice_profile_extractor import VoiceProfileExtractor

__version__ = "1.0.0"
__all__ = [
    "SCRVNRGate",
    "load_profile",
    "AIDetector",
    "VoiceAligner",
    "VoiceProfileExtractor",
]
