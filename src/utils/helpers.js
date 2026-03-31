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
