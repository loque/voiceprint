import os
import librosa
import numpy as np
from sklearn.preprocessing import LabelEncoder

def extract_mfccs(source_path, output_path=None):
    if output_path is None:
        output_path = source_path

    speakers = os.listdir(source_path)  # List of speaker folders

    mfcc_data = []
    labels = []

    for speaker in speakers:
        speaker_dir = os.path.join(source_path, speaker)
        if not os.path.isdir(speaker_dir):  # Skip if not a directory
            continue
        for audio_file in os.listdir(speaker_dir):
            if audio_file.endswith(".wav"):
                audio_path = os.path.join(speaker_dir, audio_file)
                audio, sr = librosa.load(audio_path, sr=16000)
                mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
                mfcc_data.append(mfccs.T)  # Transpose to (n_frames, n_mfcc)
                labels.append(speaker)  # Store speaker label

    print("Processed", len(mfcc_data), "audio files")

    # Trim or Pad MFCCs
    fixed_length = 100  # Fixed number of frames
    processed_mfccs = []

    for mfccs in mfcc_data:
        if mfccs.shape[0] > fixed_length:
            mfccs = mfccs[:fixed_length]  # Trim
        elif mfccs.shape[0] < fixed_length:
            padding = np.zeros((fixed_length - mfccs.shape[0], mfccs.shape[1]))
            mfccs = np.vstack((mfccs, padding))  # Pad
        processed_mfccs.append(mfccs)

    processed_mfccs = np.array(processed_mfccs)  # Shape: (n_samples, fixed_length, n_mfcc)
    labels = np.array(labels)
    print("Processed MFCCs shape:", processed_mfccs.shape)

    encoder = LabelEncoder()
    encoded_labels = encoder.fit_transform(labels)
    print("Encoded labels:", encoded_labels)

    # Save label mapping
    label_mapping = dict(zip(encoder.classes_, range(len(encoder.classes_))))
    np.save(os.path.join(output_path, "label_mapping.npy"), label_mapping)
    print("Saved label mapping to", os.path.join(output_path, "label_mapping.npy"))

    # Save processed MFCCs and labels
    np.save(os.path.join(output_path, "mfccs.npy"), processed_mfccs)
    np.save(os.path.join(output_path, "labels.npy"), encoded_labels)
    print("Saved MFCCs and labels to", output_path)

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Extract MFCCs from audio files.")
    parser.add_argument("source_path", type=str, help="Path to the source directory containing audio files.")
    parser.add_argument("--output_path", type=str, default=None, help="Path to save the processed MFCCs and labels.")

    args = parser.parse_args()
    extract_mfccs(args.source_path, args.output_path)