from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MFA_DICTIONARY: str = "arabic_mfa" # قاموس النطق العربي v2/v3
    MFA_ACOUSTIC: str = "arabic_mfa" # النموذج الصوتي العربي
    TARGET_SAMPLE_RATE: int = 16000 # شرط MFA الإلزامي
    MAX_UTTERANCE_SECONDS: int = 30 # تقسيم ما يطول عن ذلك
    TEMP_ROOT: str = "/tmp/maqam_align"

settings = Settings()
