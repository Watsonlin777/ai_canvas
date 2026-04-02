export function debounce(fn, delay) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

export function throttle(fn, delay) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function linearRegression(data) {
  const n = data.length
  const x = data.map((_, i) => i)
  const y = data
  
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0)
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  return { slope, intercept }
}

export function predictValues(data, count) {
  const { slope, intercept } = linearRegression(data)
  const predictions = []
  const n = data.length
  
  for (let i = 0; i < count; i++) {
    predictions.push(slope * (n + i) + intercept)
  }
  
  return predictions
}

export function calculateMean(data) {
  return data.reduce((a, b) => a + b, 0) / data.length
}

export function calculateStandardDeviation(data) {
  const mean = calculateMean(data)
  const squaredDiffs = data.map(value => Math.pow(value - mean, 2))
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / data.length
  return Math.sqrt(avgSquaredDiff)
}

export function calculateConfidence(data) {
  if (data.length < 3) return 50
  
  const mean = calculateMean(data)
  const stdDev = calculateStandardDeviation(data)
  const coefficientOfVariation = (stdDev / mean) * 100
  
  return Math.max(30, Math.min(95, 100 - coefficientOfVariation))
}

export function polynomialRegression(data, degree = 2) {
  const n = data.length
  const x = data.map((_, i) => i)
  const y = data
  
  const matrix = []
  const vector = []
  
  for (let i = 0; i <= degree; i++) {
    matrix[i] = []
    for (let j = 0; j <= degree; j++) {
      let sum = 0
      for (let k = 0; k < n; k++) {
        sum += Math.pow(x[k], i + j)
      }
      matrix[i][j] = sum
    }
    
    let sum = 0
    for (let k = 0; k < n; k++) {
      sum += y[k] * Math.pow(x[k], i)
    }
    vector[i] = sum
  }
  
  const coefficients = solveLinearSystem(matrix, vector)
  return coefficients
}

function solveLinearSystem(matrix, vector) {
  const n = matrix.length
  const augmented = matrix.map((row, i) => [...row, vector[i]])
  
  for (let i = 0; i < n; i++) {
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k
      }
    }
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]]
    
    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i]
      for (let j = i; j <= n; j++) {
        augmented[k][j] -= factor * augmented[i][j]
      }
    }
  }
  
  const solution = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    solution[i] = augmented[i][n]
    for (let j = i + 1; j < n; j++) {
      solution[i] -= augmented[i][j] * solution[j]
    }
    solution[i] /= augmented[i][i]
  }
  
  return solution
}

export function predictWithPolynomial(coefficients, startIndex, count) {
  const predictions = []
  for (let i = 0; i < count; i++) {
    let value = 0
    const x = startIndex + i
    for (let j = 0; j < coefficients.length; j++) {
      value += coefficients[j] * Math.pow(x, j)
    }
    predictions.push(value)
  }
  return predictions
}

export function calculateR2Score(actual, predicted) {
  const mean = calculateMean(actual)
  let ssRes = 0
  let ssTot = 0
  
  for (let i = 0; i < actual.length; i++) {
    ssRes += Math.pow(actual[i] - predicted[i], 2)
    ssTot += Math.pow(actual[i] - mean, 2)
  }
  
  if (ssTot === 0) return 1
  return 1 - (ssRes / ssTot)
}

export function calculatePredictionConfidence(data, predictions, algorithm = 'linear') {
  if (data.length < 3) return { confidence: 50, r2Score: 0, trend: 'stable' }
  
  let predictedHistorical
  let r2Score
  
  if (algorithm === 'polynomial') {
    const coefficients = polynomialRegression(data, 2)
    predictedHistorical = data.map((_, i) => {
      let value = 0
      for (let j = 0; j < coefficients.length; j++) {
        value += coefficients[j] * Math.pow(i, j)
      }
      return value
    })
  } else {
    const { slope, intercept } = linearRegression(data)
    predictedHistorical = data.map((_, i) => slope * i + intercept)
  }
  
  r2Score = calculateR2Score(data, predictedHistorical)
  
  const mean = calculateMean(data)
  const stdDev = calculateStandardDeviation(data)
  const coefficientOfVariation = mean !== 0 ? (stdDev / mean) * 100 : 50
  
  let baseConfidence = Math.max(30, Math.min(95, 100 - coefficientOfVariation))
  let confidence = baseConfidence * (0.5 + 0.5 * r2Score)
  confidence = Math.max(20, Math.min(98, confidence))
  
  const lastActual = data[data.length - 1]
  const lastPrediction = predictions[predictions.length - 1]
  let trend = 'stable'
  if (lastPrediction > lastActual * 1.05) trend = 'up'
  else if (lastPrediction < lastActual * 0.95) trend = 'down'
  
  return {
    confidence: Math.round(confidence * 10) / 10,
    r2Score: Math.round(r2Score * 1000) / 1000,
    trend
  }
}

export function runAIPrediction(data, count, algorithm = 'linear') {
  if (!data || data.length < 2) {
    return { predictions: [], confidence: 0, r2Score: 0, trend: 'stable' }
  }
  
  const validData = data.filter(v => v !== null && v !== undefined && !isNaN(v))
  if (validData.length < 2) {
    return { predictions: [], confidence: 0, r2Score: 0, trend: 'stable' }
  }
  
  let predictions
  
  if (algorithm === 'polynomial') {
    const coefficients = polynomialRegression(validData, Math.min(2, validData.length - 1))
    predictions = predictWithPolynomial(coefficients, validData.length, count)
  } else {
    predictions = predictValues(validData, count)
  }
  
  predictions = predictions.map(p => Math.max(0, Math.round(p * 10) / 10))
  
  const { confidence, r2Score, trend } = calculatePredictionConfidence(validData, predictions, algorithm)
  
  return {
    predictions,
    confidence,
    r2Score,
    trend,
    algorithm
  }
}

export function getSceneBasedPredictionConfig(sceneType) {
  const configs = {
    sales: {
      algorithm: 'linear',
      description: '销售趋势预测',
      unit: '销售额'
    },
    temperature: {
      algorithm: 'polynomial',
      description: '温度变化预测',
      unit: '温度'
    },
    population: {
      algorithm: 'polynomial',
      description: '人口增长预测',
      unit: '人口'
    },
    stock: {
      algorithm: 'linear',
      description: '股票走势预测',
      unit: '价格'
    },
    traffic: {
      algorithm: 'polynomial',
      description: '流量趋势预测',
      unit: '访问量'
    },
    default: {
      algorithm: 'linear',
      description: '数据趋势预测',
      unit: '数值'
    }
  }
  
  return configs[sceneType] || configs.default
}

export function exportToJSON(data, filename) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        resolve(data)
      } catch (err) {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}
