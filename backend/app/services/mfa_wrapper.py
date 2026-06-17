import os, asyncio
from app.core.config import settings

async def run_mfa(input_dir: str, output_dir: str) -> str:
    cmd = [
        "mfa", "align",
        input_dir,
        settings.MFA_DICTIONARY,
        settings.MFA_ACOUSTIC,
        output_dir,
        "--clean", "--single_speaker",
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"MFA failed: {stderr.decode()}")

    base = os.listdir(input_dir)[0].rsplit(".", 1)[0]
    tg_path = os.path.join(output_dir, f"{base}.TextGrid")
    if not os.path.exists(tg_path):
        raise RuntimeError("MFA انتهى دون إنتاج TextGrid")
    return tg_path
