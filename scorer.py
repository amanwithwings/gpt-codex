from __future__ import annotations

import re

GENERIC_PHRASES = {
    "in conclusion",
    "it is important to note",
    "furthermore",
    "moreover",
    "overall",
    "on the other hand",
    "this highlights",
    "delve",
    "leverage",
}



def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))



def estimate_ai_percentage(text: str) -> float:
    """
    Heuristic AI-likelihood score (0-100).

    This is not a detector with ground-truth certainty; it estimates based on
    stylometric signals commonly seen in highly-polished generated text.
    """
    normalized = " ".join(text.split())
    if not normalized:
        return 0.0

    words = re.findall(r"\b[\w'-]+\b", normalized.lower())
    if not words:
        return 0.0

    sentences = [s.strip() for s in re.split(r"[.!?]+", normalized) if s.strip()]
    avg_sentence_len = len(words) / max(1, len(sentences))

    unique_ratio = len(set(words)) / len(words)
    punctuation_density = len(re.findall(r"[,;:]", normalized)) / len(words)

    phrase_hits = sum(1 for phrase in GENERIC_PHRASES if phrase in normalized.lower())

    score = 20.0
    score += min(avg_sentence_len, 40) * 0.9
    score += (1 - unique_ratio) * 35
    score += punctuation_density * 120
    score += phrase_hits * 5

    if re.search(r"\b(i|we|imo|idk|lol|gonna|wanna)\b", normalized.lower()):
        score -= 12

    if len(words) < 40:
        score -= 10

    return round(_clamp(score), 1)
