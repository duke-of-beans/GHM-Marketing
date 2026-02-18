"""
GHM SCRVNR Core Package
"""

from .pass1_ai_detection import AIDetector
from .pass2_voice_alignment import VoiceAligner
from .scrvnr_gate import SCRVNRGate, load_profile
from .voice_profile_extractor import VoiceProfileExtractor

__all__ = [
    "AIDetector",
    "VoiceAligner",
    "SCRVNRGate",
    "load_profile",
    "VoiceProfileExtractor",
]

__version__ = "1.0.0"
