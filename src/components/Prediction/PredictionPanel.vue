<template>
  <div class="prediction-panel card">
    <h3 class="section-title">🤖 AI 智能预测</h3>
    
    <div class="prediction-form">
      <div class="form-group">
        <label class="label">预测数量</label>
        <input 
          type="number" 
          class="input" 
          v-model.number="predictionCount"
          min="1"
          max="10"
          placeholder="输入预测数量"
        />
      </div>
      
      <button 
        class="btn btn-primary prediction-btn"
        @click="runPrediction"
        :disabled="isPredicting"
      >
        {{ isPredicting ? '预测中...' : '🔮 开始预测' }}
      </button>
    </div>
    
    <div v-if="chartStore.showPrediction && chartStore.predictionResult" class="prediction-result">
      <h4 class="result-title">预测结果</h4>
      
      <div class="prediction-values">
        <div 
          v-for="(value, index) in chartStore.predictionResult.predictions" 
          :key="index"
          class="prediction-item"
        >
          <span class="prediction-label">预测 {{ index + 1 }}</span>
          <span class="prediction-value">{{ value.toFixed(1) }}</span>
        </div>
      </div>
      
      <div class="prediction-info">
        <div class="info-item">
          <span class="info-label">趋势方向</span>
          <span :class="['trend-badge', trendDirection]">
            {{ trendDirection === 'up' ? '📈 上升' : trendDirection === 'down' ? '📉 下降' : '➡️ 平稳' }}
          </span>
        </div>
        
        <div class="info-item">
          <span class="info-label">置信度</span>
          <span class="confidence-value">{{ chartStore.predictionResult.confidence.toFixed(1) }}%</span>
        </div>
      </div>
      
      <button class="btn btn-secondary clear-btn" @click="clearPrediction">
        清除预测
      </button>
    </div>
    
    <div v-else class="prediction-placeholder">
      <p>点击"开始预测"按钮，AI 将根据现有数据分析趋势并预测未来数值</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useChartStore } from '../../store/chartStore'

const chartStore = useChartStore()
const predictionCount = ref(3)
const isPredicting = ref(false)

const trendDirection = computed(() => {
  if (!chartStore.predictionResult) return 'stable'
  const predictions = chartStore.predictionResult.predictions
  if (predictions.length < 2) return 'stable'
  
  const lastPrediction = predictions[predictions.length - 1]
  const lastActual = chartStore.values[chartStore.values.length - 1]
  
  if (lastPrediction > lastActual * 1.05) return 'up'
  if (lastPrediction < lastActual * 0.95) return 'down'
  return 'stable'
})

function runPrediction() {
  isPredicting.value = true
  
  setTimeout(() => {
    const values = chartStore.values
    const predictions = linearRegressionPredict(values, predictionCount.value)
    const confidence = calculateConfidence(values)
    
    chartStore.setPredictionResult({
      predictions,
      confidence
    })
    
    isPredicting.value = false
  }, 1000)
}

function linearRegressionPredict(data, count) {
  const n = data.length
  const x = data.map((_, i) => i)
  const y = data
  
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0)
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  const predictions = []
  for (let i = 0; i < count; i++) {
    const predictedValue = slope * (n + i) + intercept
    predictions.push(Math.max(0, predictedValue))
  }
  
  return predictions
}

function calculateConfidence(data) {
  if (data.length < 3) return 50
  
  const mean = data.reduce((a, b) => a + b, 0) / data.length
  const variance = data.reduce((total, val) => total + Math.pow(val - mean, 2), 0) / data.length
  const stdDev = Math.sqrt(variance)
  const coefficientOfVariation = (stdDev / mean) * 100
  
  const confidence = Math.max(30, Math.min(95, 100 - coefficientOfVariation))
  return confidence
}

function clearPrediction() {
  chartStore.clearPrediction()
}
</script>

<style scoped>
.prediction-panel {
  height: fit-content;
}

.section-title {
  font-size: 18px;
  margin-bottom: 16px;
  color: #333;
}

.prediction-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.prediction-btn {
  width: 100%;
  padding: 12px;
  font-size: 16px;
}

.prediction-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.prediction-result {
  background: #F8F9FA;
  border-radius: 8px;
  padding: 16px;
}

.result-title {
  font-size: 16px;
  margin-bottom: 12px;
  color: #333;
}

.prediction-values {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.prediction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
}

.prediction-label {
  font-size: 14px;
  color: #666;
}

.prediction-value {
  font-size: 16px;
  font-weight: bold;
  color: #E74C3C;
}

.prediction-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 14px;
  color: #666;
}

.trend-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.trend-badge.up {
  background: rgba(126, 211, 33, 0.2);
  color: #7ED321;
}

.trend-badge.down {
  background: rgba(231, 76, 60, 0.2);
  color: #E74C3C;
}

.trend-badge.stable {
  background: rgba(74, 144, 226, 0.2);
  color: #4A90E2;
}

.confidence-value {
  font-size: 16px;
  font-weight: bold;
  color: #4A90E2;
}

.clear-btn {
  width: 100%;
}

.prediction-placeholder {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
  line-height: 1.6;
}
</style>
