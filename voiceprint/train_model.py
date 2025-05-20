import os
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow.keras import layers, models, regularizers, callbacks, optimizers # type: ignore
import matplotlib.pyplot as plt

# Create data augmentation for training using tf.data API
def augment_map_fn(x, y):
    """Apply augmentation to a single example"""
    # Random noise
    if tf.random.uniform([], 0, 1) > 0.5:
        noise_level = tf.random.uniform([], 0.001, 0.005)
        noise = tf.random.normal(tf.shape(x), mean=0.0, stddev=noise_level)
        x = x + noise
        
    # Time masking
    if tf.random.uniform([], 0, 1) > 0.5:
        t_width = tf.random.uniform([], 1, 5, dtype=tf.int32)
        t_start = tf.random.uniform([], 0, tf.shape(x)[0] - t_width, dtype=tf.int32)
        mask = tf.ones([t_width, tf.shape(x)[1], tf.shape(x)[2]])
        paddings = [[t_start, tf.shape(x)[0] - t_start - t_width], [0, 0], [0, 0]]
        mask = tf.pad(mask, paddings)
        x = x * (1.0 - mask)
    
    # Frequency masking
    if tf.random.uniform([], 0, 1) > 0.5:
        f_width = tf.random.uniform([], 1, 3, dtype=tf.int32)
        f_start = tf.random.uniform([], 0, tf.shape(x)[1] - f_width, dtype=tf.int32)
        mask = tf.ones([tf.shape(x)[0], f_width, tf.shape(x)[2]])
        paddings = [[0, 0], [f_start, tf.shape(x)[1] - f_start - f_width], [0, 0]]
        mask = tf.pad(mask, paddings)
        x = x * (1.0 - mask)
        
    return x, y

def train_model(model_path="model"):
    # Load the data
    mfccs = np.load(os.path.join(model_path, 'mfccs.npy'))
    labels = np.load(os.path.join(model_path, 'labels.npy'))

    # Ensure consistent shapes (e.g., add channel dimension for CNN)
    if len(mfccs.shape) == 3:  # Shape: (n_samples, n_frames, n_mfcc)
        mfccs = np.expand_dims(mfccs, axis=-1)  # Add channel dimension: (n_samples, n_frames, n_mfcc, 1)

    # Encode labels if not already done
    encoder = LabelEncoder()
    encoded_labels = encoder.fit_transform(labels)

    # Split into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(mfccs, encoded_labels, test_size=0.2, random_state=42)

    # Normalize MFCCs
    scaler = StandardScaler()
    X_train_flat = X_train.reshape(X_train.shape[0], -1)  # Flatten for scaling
    X_test_flat = X_test.reshape(X_test.shape[0], -1)
    scaler.fit(X_train_flat)
    X_train_flat = scaler.transform(X_train_flat)
    X_test_flat = scaler.transform(X_test_flat)

    # Save scaler parameters for later use in prediction
    np.save(os.path.join(model_path, 'scaler_mean.npy'), scaler.mean_)
    np.save(os.path.join(model_path, 'scaler_scale.npy'), scaler.scale_)

    # Reshape back to original shape
    X_train = X_train_flat.reshape(X_train.shape)
    X_test = X_test_flat.reshape(X_test.shape)

    # Create TensorFlow datasets
    batch_size = 32
    X_train_tensor = tf.convert_to_tensor(X_train, dtype=tf.float32)
    y_train_tensor = tf.convert_to_tensor(y_train, dtype=tf.int32)
    X_test_tensor = tf.convert_to_tensor(X_test, dtype=tf.float32)
    y_test_tensor = tf.convert_to_tensor(y_test, dtype=tf.int32)

    train_dataset = tf.data.Dataset.from_tensor_slices((X_train_tensor, y_train_tensor))
    train_dataset = train_dataset.shuffle(buffer_size=X_train.shape[0])
    train_dataset = train_dataset.map(augment_map_fn, num_parallel_calls=tf.data.AUTOTUNE)
    train_dataset = train_dataset.batch(batch_size).prefetch(tf.data.AUTOTUNE)

    val_dataset = tf.data.Dataset.from_tensor_slices((X_test_tensor, y_test_tensor))
    val_dataset = val_dataset.batch(batch_size).prefetch(tf.data.AUTOTUNE)

    # Define the Model
    l2 = regularizers.l2
    model = models.Sequential([
        layers.Conv2D(32, (3, 3), padding='same', activation='relu', input_shape=X_train.shape[1:], 
                      kernel_regularizer=l2(0.001)),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.2),
        layers.Conv2D(64, (3, 3), padding='same', activation='relu', kernel_regularizer=l2(0.001)),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.3),
        layers.Flatten(),
        layers.Dense(128, activation='relu', kernel_regularizer=l2(0.001)),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(len(np.unique(encoded_labels)), activation='softmax')
    ])

    optimizer = optimizers.Adam(learning_rate=0.001)
    model.compile(optimizer=optimizer,
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])

    # Define callbacks
    early_stopping = callbacks.EarlyStopping(
        monitor='val_loss',
        patience=5,
        restore_best_weights=True,
        verbose=1
    )
    reduce_lr = callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.2,
        patience=3,
        min_lr=0.0001,
        verbose=1
    )

    # Train the model
    epochs = 50
    history = model.fit(
        train_dataset,
        epochs=epochs,
        validation_data=val_dataset,
        callbacks=[early_stopping, reduce_lr],
        verbose=1
    )

    # Plot and save training history
    plt.figure(figsize=(12, 4))
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Training Accuracy')
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
    plt.title('Model Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()

    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Training Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title('Model Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()

    plt.tight_layout()
    plt.savefig(os.path.join(model_path, 'training_history.png'))
    print(f"Training history plot saved as '{os.path.join(model_path, 'training_history.png')}'")

    # Evaluate the model
    test_loss, test_accuracy = model.evaluate(X_test, y_test)
    print(f"Test accuracy: {test_accuracy:.4f}")

    # Save the model
    model.save(os.path.join(model_path, 'voiceprint_model.h5'))
    print(f"Model saved to '{os.path.join(model_path, 'voiceprint_model.h5')}'")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train a voiceprint model.")
    parser.add_argument("--model_path", type=str, default="model", help="Path to save/load model files.")
    args = parser.parse_args()
    train_model(model_path=args.model_path)