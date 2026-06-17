from pydub import AudioSegment

def preprocess_audio(input_path: str, output_path: str, sr: int = 16000) -> str:
    audio = AudioSegment.from_file(input_path)
    audio = audio.set_channels(1).set_frame_rate(sr).set_sample_width(2)
    audio.export(output_path, format="wav")
    return output_path
