/**
 * Keras Model Loader
 *
 * Loads and uses the civil_issues_model.keras file for classification.
 * Falls back to keyword classification if model is unavailable.
 *
 * IMPORTANT: Upload your model file to public/models/civil_issues_model.keras
 */

import type { ClassificationResult, IssueCategory } from "./ml-classifier"

// Model configuration
const MODEL_PATH = "../public/models/civil_issues_model.keras"
const MODEL_ENABLED = true

let modelLoaded = false
let modelError: string | null = null

/**
 * Initialize TensorFlow.js and load the Keras model
 * This is called once when the app first needs to classify with the model
 */
export async function initializeKerasModel(): Promise<boolean> {
  if (!MODEL_ENABLED) {
    console.log("[v0] Keras model disabled (NEXT_PUBLIC_USE_KERAS_MODEL not set)")
    return false
  }

  if (modelLoaded) return true
  if (modelError) return false

  try {
    // Load TensorFlow.js library
    if (typeof window === "undefined") {
      modelError = "TensorFlow.js only works in browser"
      return false
    }

    // Dynamically import TensorFlow.js
    const tf = await import("@tensorflow/tfjs")

    // Try to load the model
    console.log("[v0] Loading Keras model from:", MODEL_PATH)
    const model = await tf.loadLayersModel(`file://${MODEL_PATH}`)

    console.log("[v0] Model loaded successfully")
    modelLoaded = true
    return true
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    modelError = `Failed to load Keras model: ${errorMsg}`
    console.error("[v0]", modelError)
    return false
  }
}

/**
 * Classify image using the Keras model
 * Expects image tensor and returns predicted category
 */
export async function classifyWithKerasModel(imageFile: File): Promise<ClassificationResult | null> {
  if (!MODEL_ENABLED || !modelLoaded) {
    return null
  }

  try {
    // Dynamically import TensorFlow.js
    const tf = await import("@tensorflow/tfjs")

    // Load the model
    const model = await tf.loadLayersModel(`file://${MODEL_PATH}`)

    // Convert file to tensor
    const imageTensor = await fileToTensor(imageFile)

    // Make prediction
    const predictions = model.predict(imageTensor) as any
    const predictionsArray = await predictions.data()

    // Category indices
    const categories: IssueCategory[] = ["pothole", "garbage", "other"]

    // Find highest confidence prediction
    let maxConfidence = 0
    let maxIndex = 0

    for (let i = 0; i < predictionsArray.length; i++) {
      if (predictionsArray[i] > maxConfidence) {
        maxConfidence = predictionsArray[i]
        maxIndex = i
      }
    }

    // Cleanup tensors
    imageTensor.dispose()
    predictions.dispose()
    model.dispose()

    return {
      category: categories[maxIndex],
      confidence: maxConfidence,
      reason: `Keras model prediction with ${(maxConfidence * 100).toFixed(1)}% confidence`,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error("[v0] Keras model classification failed:", errorMsg)
    return null
  }
}

/**
 * Convert image file to TensorFlow tensor
 * Preprocesses image to match model input requirements (224x224)
 */
async function fileToTensor(file: File): Promise<any> {
  const tf = await import("@tensorflow/tfjs")

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
          // Create canvas and resize image to 224x224
          const canvas = document.createElement("canvas")
          canvas.width = 224
          canvas.height = 224
          const ctx = canvas.getContext("2d")

          if (!ctx) {
            reject(new Error("Failed to get canvas context"))
            return
          }

          ctx.drawImage(img, 0, 0, 224, 224)

          // Get image data and convert to tensor
          const imageData = ctx.getImageData(0, 0, 224, 224)
          const data = imageData.data

          // Normalize pixel values to [0, 1]
          const normalizedData: number[] = []
          for (let i = 0; i < data.length; i += 4) {
            normalizedData.push(data[i] / 255) // R
            normalizedData.push(data[i + 1] / 255) // G
            normalizedData.push(data[i + 2] / 255) // B
          }

          // Create tensor with shape [1, 224, 224, 3]
          const tensor = tf.tensor4d(normalizedData, [1, 224, 224, 3])
          resolve(tensor)
        }

        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = event.target?.result as string
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

/**
 * Check if Keras model is available
 */
export function isKerasModelAvailable(): boolean {
  return MODEL_ENABLED && modelLoaded && !modelError
}

/**
 * Get model status for debugging
 */
export function getModelStatus(): {
  enabled: boolean
  loaded: boolean
  error: string | null
} {
  return {
    enabled: MODEL_ENABLED,
    loaded: modelLoaded,
    error: modelError,
  }
}
