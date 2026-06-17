from pydantic import BaseModel

class PhonemeOut(BaseModel):
    id: str
    symbol: str
    onsetSeconds: float
    offsetSeconds: float
    onsetPPQ: float
    offsetPPQ: float
    confidence: float

class SyllableOut(BaseModel):
    id: str
    text: str
    phonemes: list[PhonemeOut]
    onsetSeconds: float
    offsetSeconds: float
    onsetPPQ: float
    offsetPPQ: float
    stress: float
    confidence: float
    isManuallyAdjusted: bool

class WordOut(BaseModel):
    id: str
    text: str
    syllableIds: list[str]
    onsetSeconds: float
    offsetSeconds: float
    onsetPPQ: float
    offsetPPQ: float

class AlignmentResult(BaseModel):
    words: list[WordOut]
    syllables: list[SyllableOut]
    phonemes: list[PhonemeOut]

class TaskStatus(BaseModel):
    task_id: str
    status: str # pending | processing | done | error
    result: AlignmentResult | None = None
    error: str | None = None
