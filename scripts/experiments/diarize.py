import os
import torch
from pyannote.audio import Pipeline

VIDEO = "interview.mp4"

print("Loading speaker diarization model...")

pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization-community-1",
    token=os.environ["HF_TOKEN"]
)

# Use GPU
if torch.cuda.is_available():
    pipeline.to(torch.device("cuda"))
    print("Using GPU:", torch.cuda.get_device_name(0))
else:
    print("Using CPU")

print("Running diarization...")

diarization = pipeline(VIDEO)

print("\n===== SPEAKER SEGMENTS =====")

for turn, _, speaker in diarization.itertracks(yield_label=True):
    print(
        f"{turn.start:7.2f}s - "
        f"{turn.end:7.2f}s  "
        f"{speaker}"
    )
