import whisper
import torch

print("=" * 50)
print("SYNTERVIEW - WHISPER TEST")
print("=" * 50)

# Check GPU
if torch.cuda.is_available():
    device = "cuda"
    print(f"GPU detected: {torch.cuda.get_device_name(0)}")
else:
    device = "cpu"
    print("WARNING: CUDA not available. Using CPU.")

print(f"Device: {device}")

# Load pretrained Whisper model
print("\nLoading Whisper Small...")
model = whisper.load_model("small", device=device)

print("Whisper loaded successfully!")

# Put your interview file here
audio_file = r"C:\Users\shash\synterview-ai\interview.mp4"

print(f"\nTranscribing: {audio_file}")
print("This may take a while on the first run...\n")

result = model.transcribe(
    audio_file,
    fp16=(device == "cuda")
)

print("\n" + "=" * 50)
print("TRANSCRIPT")
print("=" * 50)

print(result["text"])

print("\n" + "=" * 50)
print("SEGMENTS")
print("=" * 50)

for segment in result["segments"]:
    start = segment["start"]
    end = segment["end"]
    text = segment["text"].strip()

    print(f"[{start:.2f}s → {end:.2f}s] {text}")

print("\nDone!")