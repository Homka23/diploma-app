import os
import subprocess
import tempfile
import pretty_midi
from flask import Flask, request, jsonify

app = Flask(__name__)


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

        transkun_bin = os.path.join(
            os.path.dirname(__file__), 'venv', 'bin', 'transkun'
        ) if os.path.exists(os.path.join(os.path.dirname(__file__), 'venv', 'bin', 'transkun')) else 'transkun'
        result = subprocess.run(
            [transkun_bin, audio_path, midi_path],
            capture_output=True, text=True, timeout=180,
        )

        if not os.path.exists(midi_path):
            return jsonify({'error': 'Transcription failed', 'details': result.stderr}), 500

        notes = parse_midi(midi_path)
        return jsonify({'notes': notes})


if __name__ == '__main__':
    app.run(port=5001, debug=False)
