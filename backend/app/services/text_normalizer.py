import re

TASHKEEL = re.compile(r"[\u064B-\u0652\u0670]") # الحركات
TATWEEL = "\u0640"

def normalize_arabic(text: str) -> str:
    text = TASHKEEL.sub("", text)
    text = text.replace(TATWEEL, "")
    text = re.sub(r"[^\u0600-\u06FF\s]", " ", text) # عربي ومسافات فقط
    return re.sub(r"\s+", " ", text).strip()
