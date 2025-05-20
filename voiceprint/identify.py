import numpy as np
import librosa
import tensorflow as tf
from sklearn.preprocessing import LabelEncoder
import sys
import os

def identify(
        audio_file,
        model_path='model/voiceprint_model.h5',
        labels_path='model/labels.npy',
        scaler_mean_path=None,
        scaler_scale_path=None,
        label_mapping_path='model/label_mapping.npy'):
    print(f"Processing file: {audio_file}")
    
    if not os.path.exists(audio_file):
        print(f"Error: File {audio_file} not found")
        sys.exit(1)
    
    # Load the audio file
    y, sr = librosa.load(audio_file, sr=None)
    
    # Extract MFCCs
    n_mfcc = 13
    n_frames = 100
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
    
    # Transpose to get time as the first dimension
    mfccs = mfccs.T
    
    # Pad or truncate to fixed length
    if mfccs.shape[0] < n_frames:
        # Pad with zeros
        pad_width = n_frames - mfccs.shape[0]
        mfccs = np.pad(mfccs, ((0, pad_width), (0, 0)), mode='constant')
    else:
        # Truncate
        mfccs = mfccs[:n_frames, :]
    
    # Add channel dimension for CNN
    mfccs = np.expand_dims(mfccs, axis=-1)
    
    # Add batch dimension
    mfccs = np.expand_dims(mfccs, axis=0)
    
    print(f"MFCC shape: {mfccs.shape}")
    
    # Load the model
    model = tf.keras.models.load_model(model_path)
    
    # Load the labels
    labels = np.load(labels_path)
    encoder = LabelEncoder()
    encoder.fit(labels)

    # Load label mapping
    if os.path.exists(label_mapping_path):
        label_mapping = np.load(label_mapping_path, allow_pickle=True).item()
        reverse_label_mapping = {v: k for k, v in label_mapping.items()}
    else:
        print(f"Error: Label mapping file {label_mapping_path} not found")
        sys.exit(1)
    
    # If scaler parameters exist, apply scaling
    if scaler_mean_path and scaler_scale_path and os.path.exists(scaler_mean_path) and os.path.exists(scaler_scale_path):
        mean = np.load(scaler_mean_path)
        scale = np.load(scaler_scale_path)
        
        # Flatten for scaling
        mfccs_flat = mfccs.reshape(mfccs.shape[0], -1)
        
        # Check if shapes are compatible
        if mfccs_flat.shape[1] == mean.shape[0]:
            # Apply scaling
            mfccs_flat = (mfccs_flat - mean) / scale
            mfccs = mfccs_flat.reshape(mfccs.shape)
            print("Scaling applied")
    
    # Predict
    prediction = model.predict(mfccs, verbose=1)
    print(f"Raw prediction: {prediction}")
    
    predicted_class = np.argmax(prediction, axis=1)[0]
    confidence = prediction[0][predicted_class]
    
    # Get the speaker name
    speaker_name = reverse_label_mapping.get(predicted_class, "Unknown")
    
    # Print results
    print(f"\nResults:")
    print(f"Predicted speaker: {speaker_name}")
    print(f"Confidence: {confidence:.4f}")
    
    print("\nAll predictions:")
    for i, conf in enumerate(prediction[0]):
        speaker = reverse_label_mapping.get(i, "Unknown")
        print(f"{speaker}: {conf:.4f}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Speaker identification script")
    parser.add_argument("audio_file", help="Path to the audio file")
    parser.add_argument("--model_path", default="model/voiceprint_model.h5", help="Path to the model file")
    parser.add_argument("--labels_path", default="model/labels.npy", help="Path to the labels file")
    parser.add_argument("--scaler_mean_path", default=None, help="Path to the scaler mean file")
    parser.add_argument("--scaler_scale_path", default=None, help="Path to the scaler scale file")
    parser.add_argument("--label_mapping_path", default="model/label_mapping.npy", help="Path to the label mapping file")
    
    args = parser.parse_args()
    
    identify(
        args.audio_file,
        model_path=args.model_path,
        labels_path=args.labels_path,
        scaler_mean_path=args.scaler_mean_path,
        scaler_scale_path=args.scaler_scale_path,
        label_mapping_path=args.label_mapping_path
    )
