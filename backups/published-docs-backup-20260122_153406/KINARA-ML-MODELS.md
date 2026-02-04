# Kinara - ML Models Documentation

> Machine learning models for women's health prediction and analysis

---

## Tags
`AI/ML` `Analytics` `Prediction` `Healthcare` `Edge ML`

---

## Overview

Kinara provides pre-trained ML models for:
- **Hot Flash Prediction**: Early warning before symptoms
- **Sleep Analysis**: Stage classification and quality scoring
- **Pattern Recognition**: Trigger identification
- **Anomaly Detection**: Unusual pattern alerts

All models are:
- Trained on diverse datasets
- Validated clinically
- Available in ONNX format for portability
- Optimized for edge deployment

---

## Model Catalog

| Model | Version | Input | Output | Size | Edge Ready |
|-------|---------|-------|--------|------|------------|
| Hot Flash Predictor | 1.2.0 | Sensor window | Probability | 85KB | Yes |
| Sleep Stage Classifier | 1.0.0 | Night data | Stages | 120KB | Yes |
| Trigger Correlator | 1.1.0 | Historical | Correlations | 45KB | No (cloud) |
| Anomaly Detector | 1.0.0 | Reading stream | Anomaly score | 30KB | Yes |

---

## Hot Flash Prediction Model

### Model Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                HOT FLASH PREDICTION MODEL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT (5-minute window, 1Hz sampling = 300 samples)            │
│  ════════════════════════════════════════════════════════════  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Feature Vector (per timestamp):                         │   │
│  │  • temperature (°C)                                      │   │
│  │  • heart_rate (bpm)                                      │   │
│  │  • hrv_rmssd (ms)                                        │   │
│  │  • hrv_sdnn (ms)                                         │   │
│  │  • gsr (µS) [optional]                                   │   │
│  │  • activity_level (0-10)                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  PREPROCESSING                                                  │
│  ════════════                                                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Normalization (z-score per user baseline)            │   │
│  │  2. Compute derived features:                            │   │
│  │     • temp_delta (change from 5-min-ago)                 │   │
│  │     • temp_rate_of_change (slope)                        │   │
│  │     • hr_variability (std in window)                     │   │
│  │     • hrv_trend (slope)                                  │   │
│  │  3. Add temporal features:                               │   │
│  │     • hour_sin, hour_cos (cyclical encoding)             │   │
│  │     • minutes_since_last_hot_flash                       │   │
│  │     • hot_flash_count_24h                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ARCHITECTURE (1D-CNN + LSTM)                                   │
│  ═══════════════════════════                                    │
│                                                                 │
│  Input: (batch, 300, 6) → Raw features                          │
│     │                                                           │
│     ▼                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Conv1D(32, kernel=5, stride=2) → (batch, 148, 32)       │   │
│  │  BatchNorm → ReLU → Dropout(0.2)                         │   │
│  │                                                          │   │
│  │  Conv1D(64, kernel=3, stride=2) → (batch, 73, 64)        │   │
│  │  BatchNorm → ReLU → Dropout(0.2)                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│     │                                                           │
│     ▼                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  LSTM(64, bidirectional=True) → (batch, 73, 128)         │   │
│  │  Attention Layer → (batch, 128)                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│     │                                                           │
│     ▼                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Concat with derived features (12) → (batch, 140)        │   │
│  │  Dense(64) → ReLU → Dropout(0.3)                         │   │
│  │  Dense(32) → ReLU                                        │   │
│  │  Dense(3) → Softmax                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│     │                                                           │
│     ▼                                                           │
│  OUTPUT                                                         │
│  ══════                                                         │
│  • probability: [no_event, mild, moderate_severe]               │
│  • eta_seconds: Estimated time (regression head)                │
│  • confidence: Model uncertainty                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Sensitivity | 85% | Correctly predicted hot flashes |
| Specificity | 82% | Correctly identified non-events |
| False Positive Rate | 18% | Acceptable for early warning |
| Lead Time | 60-120 sec | Advance warning |
| Accuracy | 83% | Overall |
| AUC-ROC | 0.89 | Discrimination ability |

### Training Data

```
Dataset: Kinara-HF-v1 (proprietary + partnerships)

Sources:
• Clinical study data: 500 women, 6 months
• Synthetic augmentation: Pattern-based generation
• Public datasets: MESA, UK Biobank (limited)

Statistics:
• Total hot flash events: 45,000+
• Total hours of data: 120,000+
• Age range: 42-58 years
• Menopause stages: All represented

Preprocessing:
• 80/10/10 train/val/test split
• Stratified by user (no leakage)
• Class balancing via oversampling
```

### Inference API

```python
from kinara_ml import HotFlashPredictor

# Load model
model = HotFlashPredictor.load("hot_flash_v1.2.0.onnx")

# Prepare input (last 5 minutes of data)
features = {
    "temperature": [...],      # 300 values
    "heart_rate": [...],       # 300 values
    "hrv_rmssd": [...],        # 300 values
    "activity_level": [...],   # 300 values
}

user_context = {
    "baseline_temp": 36.5,
    "baseline_hr": 72,
    "hot_flash_count_24h": 2,
    "minutes_since_last": 180,
    "hour": 14
}

# Predict
result = model.predict(features, user_context)

# Result:
# {
#   "probability": 0.78,
#   "severity": "moderate",
#   "eta_seconds": 90,
#   "confidence": 0.85,
#   "should_alert": True
# }
```

### Edge Deployment

```c
// TensorFlow Lite Micro inference on nRF52840

#include "hot_flash_model.h"  // Model in C array
#include "tensorflow/lite/micro/all_ops_resolver.h"
#include "tensorflow/lite/micro/micro_interpreter.h"

// Model size: ~85KB, fits in flash
// Inference time: ~45ms on nRF52840 @ 64MHz
// RAM usage: ~20KB tensor arena

typedef struct {
    float probability;
    float eta_seconds;
    float confidence;
} hot_flash_prediction_t;

hot_flash_prediction_t predict_hot_flash(float* features, int len) {
    // Copy features to input tensor
    memcpy(interpreter->input(0)->data.f, features, len * sizeof(float));

    // Run inference
    interpreter->Invoke();

    // Get output
    hot_flash_prediction_t result;
    result.probability = interpreter->output(0)->data.f[0];
    result.eta_seconds = interpreter->output(1)->data.f[0];
    result.confidence = interpreter->output(2)->data.f[0];

    return result;
}
```

---

## Sleep Stage Classifier

### Model Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│               SLEEP STAGE CLASSIFIER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT (30-second epochs)                                       │
│  ═══════════════════════                                        │
│                                                                 │
│  Features per epoch:                                            │
│  • heart_rate_mean                                              │
│  • heart_rate_std                                               │
│  • hrv_rmssd                                                    │
│  • hrv_hf_power                                                 │
│  • hrv_lf_hf_ratio                                              │
│  • movement_intensity                                           │
│  • respiratory_rate (if available)                              │
│  • temperature                                                  │
│                                                                 │
│  ARCHITECTURE                                                   │
│  ════════════                                                   │
│                                                                 │
│  Epoch features (8) → Sequence of epochs (e.g., 10 epochs)      │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  BiLSTM(32) → Captures temporal dependencies             │   │
│  │  Attention → Focus on relevant epochs                    │   │
│  │  Dense(16) → ReLU                                        │   │
│  │  Dense(4) → Softmax                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                         │
│       ▼                                                         │
│  OUTPUT                                                         │
│  ══════                                                         │
│  • stage: [wake, light, deep, rem]                              │
│  • confidence: per-class probabilities                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Sleep Quality Scoring

```python
def calculate_sleep_score(sleep_data: SleepData) -> SleepScore:
    """
    Calculate comprehensive sleep score (0-100)
    Based on clinical sleep assessment criteria
    """
    score = 100

    # Duration component (30% weight)
    ideal_duration = 7.5 * 60  # 7.5 hours in minutes
    duration_score = min(1.0, sleep_data.total_minutes / ideal_duration)
    score -= (1 - duration_score) * 30

    # Efficiency component (25% weight)
    # Time asleep / Time in bed
    efficiency = sleep_data.sleep_minutes / sleep_data.time_in_bed_minutes
    if efficiency < 0.85:
        score -= (0.85 - efficiency) * 100

    # Deep sleep component (20% weight)
    # Target: 15-20% of sleep
    deep_percent = sleep_data.deep_minutes / sleep_data.sleep_minutes
    if deep_percent < 0.15:
        score -= (0.15 - deep_percent) * 100

    # REM component (15% weight)
    # Target: 20-25% of sleep
    rem_percent = sleep_data.rem_minutes / sleep_data.sleep_minutes
    if rem_percent < 0.20:
        score -= (0.20 - rem_percent) * 75

    # Awakenings component (10% weight)
    # Penalize excessive awakenings
    if sleep_data.awakenings > 2:
        score -= (sleep_data.awakenings - 2) * 3

    return SleepScore(
        overall=max(0, min(100, score)),
        duration_score=duration_score * 100,
        efficiency_score=efficiency * 100,
        deep_score=deep_percent / 0.20 * 100,
        rem_score=rem_percent / 0.25 * 100
    )
```

---

## Trigger Correlation Model

### Statistical Analysis

```python
class TriggerAnalyzer:
    """
    Identify correlations between activities/inputs and hot flashes
    Uses statistical analysis + ML feature importance
    """

    POTENTIAL_TRIGGERS = [
        "caffeine",
        "alcohol",
        "spicy_food",
        "stress",
        "exercise",
        "hot_environment",
        "anxiety",
        "certain_medications"
    ]

    def analyze_triggers(
        self,
        user_id: str,
        period_days: int = 90
    ) -> List[TriggerCorrelation]:
        # Get hot flash events
        hot_flashes = self.get_hot_flashes(user_id, period_days)

        # Get logged activities/events
        activities = self.get_activities(user_id, period_days)

        correlations = []

        for trigger in self.POTENTIAL_TRIGGERS:
            # Calculate time-windowed correlation
            # Hot flash within 2 hours of trigger?
            trigger_events = [a for a in activities if a.type == trigger]

            if len(trigger_events) < 5:
                continue  # Not enough data

            # Calculate correlation
            correlation = self.calculate_temporal_correlation(
                trigger_events,
                hot_flashes,
                window_hours=2
            )

            # Statistical significance
            p_value = self.calculate_significance(
                trigger_events,
                hot_flashes,
                correlation
            )

            if p_value < 0.05:  # Significant
                correlations.append(TriggerCorrelation(
                    trigger=trigger,
                    correlation=correlation,
                    confidence=1 - p_value,
                    occurrences=len(trigger_events),
                    recommendation=self.get_recommendation(trigger, correlation)
                ))

        # Sort by correlation strength
        return sorted(correlations, key=lambda x: abs(x.correlation), reverse=True)
```

### Feature Importance (ML-based)

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance

def get_ml_feature_importance(user_data: pd.DataFrame) -> Dict[str, float]:
    """
    Use ML to identify which features predict hot flashes
    """
    features = [
        'caffeine_2h', 'alcohol_4h', 'spicy_food_2h',
        'stress_level', 'exercise_2h', 'ambient_temp',
        'sleep_quality_prev_night', 'hydration_level',
        'hour_of_day', 'day_of_cycle'
    ]

    X = user_data[features]
    y = user_data['hot_flash_occurred']

    model = RandomForestClassifier(n_estimators=100)
    model.fit(X, y)

    # Permutation importance (more reliable)
    importance = permutation_importance(model, X, y, n_repeats=10)

    return {
        features[i]: importance.importances_mean[i]
        for i in range(len(features))
    }
```

---

## Personalization System

### User Model Adaptation

```
┌─────────────────────────────────────────────────────────────────┐
│               PERSONALIZATION PIPELINE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BASE MODEL (Population-level)                                  │
│       │                                                         │
│       │  User data accumulates                                  │
│       │  (minimum 2 weeks)                                      │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  BASELINE CALIBRATION                                    │   │
│  │                                                          │   │
│  │  • Calculate user's normal ranges                        │   │
│  │  • Temperature baseline (mean, std)                      │   │
│  │  • HR baseline (resting, active)                         │   │
│  │  • HRV baseline                                          │   │
│  │  • Circadian pattern                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  FINE-TUNING (Optional, with enough data)                │   │
│  │                                                          │   │
│  │  • Transfer learning from base model                     │   │
│  │  • Train on user's labeled events                        │   │
│  │  • Update decision thresholds                            │   │
│  │  • Typically 50+ events needed                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                         │
│       ▼                                                         │
│  PERSONALIZED MODEL                                             │
│  • User-specific baselines                                      │
│  • Adjusted thresholds                                          │
│  • Individual trigger sensitivities                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Continuous Learning

```python
class PersonalizationService:
    """
    Manages per-user model customization
    """

    def update_user_baseline(self, user_id: str):
        """
        Recalculate user baselines from recent data
        Called weekly
        """
        # Get last 30 days of data
        readings = self.get_readings(user_id, days=30)

        # Calculate baselines during "normal" periods
        # (exclude hot flash events ±30 min)
        normal_readings = self.filter_normal_periods(readings)

        baseline = UserBaseline(
            temperature_mean=np.mean(normal_readings.temperature),
            temperature_std=np.std(normal_readings.temperature),
            hr_resting=np.percentile(normal_readings.heart_rate, 10),
            hr_mean=np.mean(normal_readings.heart_rate),
            hrv_mean=np.mean(normal_readings.hrv_rmssd),
            hrv_std=np.std(normal_readings.hrv_rmssd)
        )

        self.save_baseline(user_id, baseline)

    def adjust_thresholds(self, user_id: str):
        """
        Adjust prediction thresholds based on user feedback
        """
        # Get recent predictions and outcomes
        predictions = self.get_predictions(user_id, days=14)
        feedback = self.get_feedback(user_id, days=14)

        # Calculate precision/recall
        precision = self.calculate_precision(predictions, feedback)
        recall = self.calculate_recall(predictions, feedback)

        # Adjust threshold
        current_threshold = self.get_threshold(user_id)

        if precision < 0.7:  # Too many false positives
            new_threshold = current_threshold + 0.05
        elif recall < 0.8:   # Missing too many events
            new_threshold = current_threshold - 0.05
        else:
            new_threshold = current_threshold

        self.save_threshold(user_id, new_threshold)
```

---

## Model Training Pipeline

### Training Infrastructure

```yaml
# training/config.yaml

model:
  name: hot_flash_predictor
  version: 1.2.0
  architecture: cnn_lstm_attention

data:
  train_path: s3://kinara-ml/datasets/hf_train_v2.parquet
  val_path: s3://kinara-ml/datasets/hf_val_v2.parquet
  test_path: s3://kinara-ml/datasets/hf_test_v2.parquet

preprocessing:
  window_size: 300  # 5 minutes at 1Hz
  features:
    - temperature
    - heart_rate
    - hrv_rmssd
    - hrv_sdnn
    - activity_level
  normalization: z_score_per_user

training:
  epochs: 100
  batch_size: 64
  learning_rate: 0.001
  optimizer: adam
  early_stopping:
    patience: 10
    monitor: val_auc

augmentation:
  noise_injection: 0.01
  time_warping: true
  synthetic_ratio: 0.3

export:
  formats:
    - onnx
    - tflite
  quantization: int8  # For edge
```

### Training Script

```python
# training/train_hot_flash.py

import pytorch_lightning as pl
from kinara_ml.models import HotFlashModel
from kinara_ml.data import HotFlashDataModule

def train():
    # Load config
    config = load_config("config.yaml")

    # Initialize data module
    data = HotFlashDataModule(
        train_path=config.data.train_path,
        val_path=config.data.val_path,
        batch_size=config.training.batch_size
    )

    # Initialize model
    model = HotFlashModel(
        input_features=len(config.preprocessing.features),
        window_size=config.preprocessing.window_size
    )

    # Callbacks
    callbacks = [
        pl.callbacks.EarlyStopping(
            monitor='val_auc',
            patience=config.training.early_stopping.patience,
            mode='max'
        ),
        pl.callbacks.ModelCheckpoint(
            monitor='val_auc',
            mode='max',
            save_top_k=3
        )
    ]

    # Train
    trainer = pl.Trainer(
        max_epochs=config.training.epochs,
        callbacks=callbacks,
        accelerator='gpu'
    )
    trainer.fit(model, data)

    # Export
    export_onnx(model, "hot_flash_v1.2.0.onnx")
    export_tflite(model, "hot_flash_v1.2.0.tflite", quantize=True)

if __name__ == "__main__":
    train()
```

---

## Model Evaluation

### Evaluation Framework

```python
from kinara_ml.evaluation import ModelEvaluator

evaluator = ModelEvaluator(
    model_path="hot_flash_v1.2.0.onnx",
    test_data_path="hf_test_v2.parquet"
)

# Run comprehensive evaluation
results = evaluator.evaluate(
    metrics=['accuracy', 'precision', 'recall', 'f1', 'auc_roc', 'auc_pr'],
    stratify_by=['age_group', 'menopause_stage', 'device_type'],
    confidence_intervals=True,
    n_bootstrap=1000
)

# Generate report
report = evaluator.generate_report(results)
report.save("evaluation_report_v1.2.0.pdf")
```

### Clinical Validation Protocol

```
┌─────────────────────────────────────────────────────────────────┐
│            CLINICAL VALIDATION PROTOCOL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STUDY DESIGN                                                   │
│  ════════════                                                   │
│  • Prospective observational study                              │
│  • N = 100 women (perimenopause/menopause)                      │
│  • Duration: 3 months                                           │
│  • IRB approved                                                 │
│                                                                 │
│  PROTOCOL                                                       │
│  ════════                                                       │
│  Week 1-2:   Baseline (no predictions shown)                    │
│  Week 3-12:  Predictions enabled, user reports outcomes         │
│                                                                 │
│  ENDPOINTS                                                      │
│  ═════════                                                      │
│  Primary:                                                       │
│  • Sensitivity ≥ 80% (detect true hot flashes)                  │
│  • Lead time ≥ 60 seconds (actionable warning)                  │
│                                                                 │
│  Secondary:                                                     │
│  • User satisfaction score                                      │
│  • Symptom severity reduction                                   │
│  • Quality of life improvement (MENQOL)                         │
│                                                                 │
│  ANALYSIS                                                       │
│  ════════                                                       │
│  • Per-user and population-level metrics                        │
│  • Subgroup analysis by age, stage, symptom frequency           │
│  • Comparison to baseline period                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deployment

### Model Serving (Cloud)

```yaml
# kubernetes/ml-service.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: kinara-ml-service
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: ml-service
        image: kinara/ml-service:1.2.0
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        env:
        - name: MODEL_PATH
          value: "/models"
        - name: ONNX_PROVIDERS
          value: "CPUExecutionProvider"
        volumeMounts:
        - name: models
          mountPath: /models
```

### Edge Deployment (Device)

```c
// Firmware integration

#include "kinara_ml.h"

void on_sensor_reading(sensor_reading_t* reading) {
    // Add to sliding window
    feature_buffer_push(reading);

    // Check if we have enough data
    if (feature_buffer_count() >= 300) {
        // Run prediction
        hot_flash_prediction_t pred = kinara_predict_hot_flash(
            feature_buffer_get()
        );

        if (pred.probability > ALERT_THRESHOLD) {
            // Trigger alert
            trigger_haptic_feedback();
            send_ble_notification(&pred);

            // Optional: Activate cooling
            if (cooling_enabled && pred.probability > COOLING_THRESHOLD) {
                activate_cooling(pred.eta_seconds);
            }
        }
    }
}
```

---

## Privacy & Ethics

### Data Handling

- Models trained on consented, anonymized data
- No PII in model artifacts
- Federated learning exploration (future)
- User can opt-out of model improvement

### Bias Mitigation

- Training data balanced across demographics
- Regular bias audits
- Subgroup performance monitoring
- Transparent model cards

### Model Card

```yaml
model_card:
  name: Hot Flash Predictor
  version: 1.2.0
  description: Predicts hot flash onset from physiological signals

  intended_use:
    - Early warning for hot flash symptoms
    - Trigger comfort interventions
    - NOT for medical diagnosis

  limitations:
    - Requires 5 minutes of continuous data
    - Performance varies with sensor quality
    - Not validated for women under 40

  performance:
    overall_accuracy: 0.83
    sensitivity: 0.85
    specificity: 0.82

    by_age_group:
      40-45: { sensitivity: 0.82, specificity: 0.80 }
      46-50: { sensitivity: 0.86, specificity: 0.83 }
      51-55: { sensitivity: 0.85, specificity: 0.82 }
      56+:   { sensitivity: 0.83, specificity: 0.81 }

  ethical_considerations:
    - May cause anxiety if over-alerted
    - Should not replace medical care
    - User control over predictions essential
```

---

## Roadmap

### Current (v1.x)
- Hot flash prediction ✅
- Sleep stage classification ✅
- Basic trigger analysis ✅

### Next (v2.x)
- Improved prediction accuracy (target 90%)
- Mood prediction model
- Personalized recommendation engine
- Federated learning support

### Future (v3.x)
- Multi-modal fusion (wearable + phone + environmental)
- Generative models for synthetic data
- Causal inference for intervention planning

---

*Building AI that truly helps women*
