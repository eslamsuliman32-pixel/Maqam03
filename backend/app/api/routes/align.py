import os, uuid, tempfile, asyncio
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.core.config import settings
from app.schemas.alignment import TaskStatus, AlignmentResult
from app.services.audio_processor import preprocess_audio
from app.services.text_normalizer import normalize_arabic
from app.services.mfa_wrapper import run_mfa
from app.services.textgrid_parser import parse_textgrid
from app.services.syllabifier import build_syllables
from app.tasks import TASKS

router = APIRouter(prefix="/align", tags=["alignment"])

@router.post("", response_model=TaskStatus)
async def start_alignment(
    audio: UploadFile = File(...),
    transcript: str = Form(...),
):
    task_id = uuid.uuid4().hex
    TASKS[task_id] = {"status": "pending", "result": None, "error": None}
    raw = await audio.read()
    asyncio.create_task(_pipeline(task_id, raw, transcript))
    return TaskStatus(task_id=task_id, status="pending")

@router.get("/{task_id}", response_model=TaskStatus)
async def get_status(task_id: str):
    t = TASKS.get(task_id)
    if not t:
        raise HTTPException(404, "مهمة غير موجودة")
    return TaskStatus(task_id=task_id, **t)

async def _pipeline(task_id: str, raw_audio: bytes, transcript: str):
    TASKS[task_id]["status"] = "processing"
    try:
        with tempfile.TemporaryDirectory() as in_dir, \
             tempfile.TemporaryDirectory() as out_dir:
            base = "utt"
            tmp = os.path.join(in_dir, "raw_input")
            with open(tmp, "wb") as f:
                f.write(raw_audio)

            # 1) تحويل الصوت (خيط منفصل - عملية CPU)
            wav = os.path.join(in_dir, f"{base}.wav")
            await asyncio.to_thread(preprocess_audio, tmp, wav,
                                    settings.TARGET_SAMPLE_RATE)
            os.remove(tmp)

            # 2) تطبيع النص
            with open(os.path.join(in_dir, f"{base}.txt"), "w",
                      encoding="utf-8") as f:
                f.write(normalize_arabic(transcript))

            # 3) MFA
            tg = await run_mfa(in_dir, out_dir)

            # 4) تحليل + تقطيع مقطعي
            parsed = parse_textgrid(tg)
            syllables = build_syllables(parsed["words"], parsed["phonemes"])

            result = AlignmentResult(
                words=parsed["words"],
                syllables=syllables,
                phonemes=parsed["phonemes"],
            )
            TASKS[task_id].update(status="done", result=result.model_dump())
    except Exception as e:
        TASKS[task_id].update(status="error", error=str(e))
