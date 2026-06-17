import uuid

ARABIC_VOWELS = {"a", "i", "u", "aː", "iː", "uː", "a:", "i:", "u:"}

def build_syllables(words: list, phonemes: list) -> list:
    syllables = []
    for w in words:
        in_word = [p for p in phonemes
                   if p["onsetSeconds"] >= w["onsetSeconds"]
                   and p["offsetSeconds"] <= w["offsetSeconds"]]
        current = []
        for ph in in_word:
            current.append(ph)
            if ph["symbol"] in ARABIC_VOWELS: # النواة تُغلق المقطع
                syllables.append(_make_syllable(current))
                w["syllableIds"].append(syllables[-1]["id"])
                current = []
        if current: # بقايا ساكنة
            syllables.append(_make_syllable(current))
            w["syllableIds"].append(syllables[-1]["id"])
    return syllables

def _make_syllable(phs: list) -> dict:
    return {
        "id": f"syl_{uuid.uuid4().hex[:8]}",
        "text": "".join(p["symbol"] for p in phs),
        "phonemes": phs,
        "onsetSeconds": phs[0]["onsetSeconds"],
        "offsetSeconds": phs[-1]["offsetSeconds"],
        "onsetPPQ": 0.0, "offsetPPQ": 0.0,
        "stress": 0.0,
        "confidence": sum(p["confidence"] for p in phs) / len(phs),
        "isManuallyAdjusted": False,
    }
