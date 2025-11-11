# ML Models Directory

Upload your Keras model file here for the civil issues classification system.

## How to Upload Your Model

1. **Model File**: `civil_issues_model.keras`
   - Place your trained Keras model file in this directory
   - Path: `public/models/civil_issues_model.keras`
   - File size: Keep under 50MB for optimal performance

2. **Model Requirements**:
   - Input: Image (224x224 RGB or similar)
   - Output: Classification scores for categories
     - pothole
     - garbage
     - streetlight
     - water-logging
     - other

3. **Supported Model Formats**:
   - `.keras` (recommended - Keras 3 format)
   - `.h5` (Keras 2 format)
   - `.onnx` (ONNX format)

## Usage in the Application

The model will be automatically loaded and used for classification when:
1. User uploads an image
2. Classification API route receives the request
3. System routes to the Keras classifier

To enable Keras model classification:
- Set `USE_KERAS_MODEL=true` in environment variables
- Or use the switch in the admin dashboard

## Model Loading

Models are loaded using TensorFlow.js:
- Browser-based inference (no server-side ML dependencies needed)
- Automatic fallback to keyword classifier if model fails

## Fallback Behavior

If the model file is missing or fails to load:
- System automatically falls back to keyword-based classification
- Users can still categorize issues manually
- No disruption to the application

## Testing Your Model

1. Upload your model file to `public/models/`
2. Restart the application
3. Open the reporting form
4. Upload a test image - you should see your model's prediction
5. Check browser console for any loading errors

## Model Conversion Tools

If you need to convert your model format:
- TensorFlow to ONNX: [convertmodel.com](https://convertmodel.com)
- Keras to ONNX: Use `tf2onnx` library
- ONNX to Web: Use ONNX Runtime Web
