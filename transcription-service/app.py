import os
import subprocess
import tempfile
import pkg_resources
import pretty_midi
import torch
import soxr
from flask import Flask, request, jsonify

import transkun.transcribe as tr
import moduleconf

app = Flask(__name__)

# ── Load model once at startup ────────────────────────────────────────────────
WEIGHT_PATH = pkg_resources.resource_filename('transkun', 'pretrained/2.0.pt')
CONF_PATH   = pkg_resources.resource_filename('transkun', 'pretrained/2.0.conf')
DEVICE      = 'cpu'

print('Loading transkun model...', flush=True)
conf_manager = moduleconf.parseFromFile(CONF_PATH)
TransKun = conf_manager['Model'].module.TransKun
conf     = conf_manager['Model'].config
checkpoint = torch.load(WEIGHT_PATH, map_location=DEVICE)
model = TransKun(conf=conf).to(DEVICE)
if 'best_state_dict' in checkpoint:
    model.load_state_dict(checkpoint['best_state_dict'], strict=False)
else:
    model.load_state_dict(checkpoint['state_dict'], strict=False)
model.eval()
torch.set_grad_enabled(False)
print('Model ready.', flush=True)


@app.route('/health')
def health():
    return jsonify({'status': 'ok'})


def parse_midi(midi_path):
    midi = pretty_midi.PrettyMIDI(midi_path)
    notes = []
    for instrument in midi.instruments:
        for note in instrument.notes:
            notes.append({
                'start':    round(note.start, 2),
                'end':      round(note.end, 2),
                'duration': round(note.end - note.start, 2),
                'note':     pretty_midi.note_number_to_name(note.pitch),
                'velocity': note.velocity,
            })
    notes.sort(key=lambda n: n['start'])
    return notes


@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file'}), 400

    file = request.files['audio']
    ext  = os.path.splitext(file.filename)[1] if file.filename else '.wav'

    with tempfile.TemporaryDirectory() as tmpdir:
        audio_path = os.path.join(tmpdir, f'audio{ext}')
        midi_path  = os.path.join(tmpdir, 'output.mid')
        file.save(audio_path)

        # Read and resample audio
        wav_path = os.path.join(tmpdir, 'normalized.wav')
        subprocess.run(
            ['ffmpeg', '-y', '-i', audio_path, '-ar', '44100', '-ac', '1', wav_path],
            capture_output=True, timeout=30,
        )
        src = wav_path if os.path.exists(wav_path) else audio_path

        fs, audio = tr.readAudio(src)
        if fs != model.fs:
            audio = soxr.resample(audio, fs, model.fs)

        x = torch.from_numpy(audio).to(DEVICE)
        notes_est = model.transcribe(x, stepInSecond=None, segmentSizeInSecond=None, discardSecondHalf=False)

        output_midi = tr.writeMidi(notes_est)
        output_midi.write(midi_path)

        notes = parse_midi(midi_path)
        return jsonify({'notes': notes})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 7860))
    app.run(host='0.0.0.0', port=port, debug=False)
