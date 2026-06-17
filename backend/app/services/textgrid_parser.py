import uuid
from praatio import textgrid

def parse_textgrid(tg_path: str) -> dict:
    tg = textgrid.openTextgrid(tg_path, includeEmptyIntervals=False)
    words_tier = tg.getTier("words")
    phones_tier = tg.getTier("phones")

    phonemes = []
    for start, end, label in phones_tier.entries:
        if not label.strip():
            continue
        phonemes.append({
            "id": f"ph_{uuid.uuid4().hex[:8]}",
            "symbol": label,
            "onsetSeconds": round(start, 4),
            "offsetSeconds": round(end, 4),
            "onsetPPQ": 0.0, "offsetPPQ": 0.0, # يحسبها المتصفح
            "confidence": 1.0,
        })

    words = []
    for start, end, label in words_tier.entries:
        if not label.strip():
            continue
        words.append({
            "id": f"w_{uuid.uuid4().hex[:8]}",
            "text": label,
            "onsetSeconds": round(start, 4),
            "offsetSeconds": round(end, 4),
            "onsetPPQ": 0.0, "offsetPPQ": 0.0,
            "syllableIds": [], # يملؤها الـ syllabifier
        })
    return {"words": words, "phonemes": phonemes}
