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

export function getThinkingSkills(sceneType) {
  const skillsMap = {
    height: {
      title: '身高数据分析技巧',
      skills: [
        { name: '数据分组', description: '将身高数据按范围分组，如130-139cm、140-149cm、150-159cm等' },
        { name: '统计计数', description: '统计每个身高范围内的人数，用"正"字计数法' },
        { name: '找出极值', description: '找出最高和最矮的身高值，了解数据范围' },
        { name: '计算平均', description: '计算全班平均身高，了解整体水平' }
      ]
    },
    shoes: {
      title: '鞋号数据分析技巧',
      skills: [
        { name: '分类整理', description: '将男生和女生的鞋号分开统计' },
        { name: '制作表格', description: '用表格清晰展示不同鞋号的人数' },
        { name: '对比分析', description: '比较男女鞋号分布的差异' },
        { name: '找出众数', description: '找出最常见的鞋号' }
      ]
    },
    temperature: {
      title: '温度数据分析技巧',
      skills: [
        { name: '时间序列', description: '按时间顺序排列温度数据，观察变化趋势' },
        { name: '找出极值', description: '找出最高温度和最低温度及对应日期' },
        { name: '计算温差', description: '计算日温差和周温差' },
        { name: '趋势预测', description: '根据趋势预测未来温度变化' }
      ]
    },
    money: {
      title: '零花钱分析技巧',
      skills: [
        { name: '分类统计', description: '按用途分类统计各项支出' },
        { name: '计算占比', description: '计算每项支出占总支出的百分比' },
        { name: '对比分析', description: '比较各项支出的大小' },
        { name: '合理规划', description: '思考如何合理分配零花钱' }
      ]
    },
    exam: {
      title: '成绩分析技巧',
      skills: [
        { name: '分段统计', description: '按分数段统计人数分布' },
        { name: '计算比率', description: '计算及格率、优秀率等指标' },
        { name: '绘制图表', description: '用条形图或饼图展示分布情况' },
        { name: '分析原因', description: '思考影响成绩的因素' }
      ]
    },
    reading: {
      title: '阅读时间分析技巧',
      skills: [
        { name: '时间统计', description: '统计每天、每周的阅读时间' },
        { name: '计算平均', description: '计算日均阅读时间' },
        { name: '找出规律', description: '分析哪些天阅读时间较长' },
        { name: '制定计划', description: '规划合理的阅读时间安排' }
      ]
    },
    sports: {
      title: '运动调查分析技巧',
      skills: [
        { name: '投票统计', description: '统计每项运动的得票数' },
        { name: '排序比较', description: '按受欢迎程度排序' },
        { name: '计算比例', description: '计算每项运动的占比' },
        { name: '分析原因', description: '思考为什么某些运动更受欢迎' }
      ]
    },
    fruit: {
      title: '销售数据分析技巧',
      skills: [
        { name: '销量排序', description: '按销量从高到低排序' },
        { name: '计算总量', description: '计算总销售量' },
        { name: '对比差异', description: '比较不同水果的销量差异' },
        { name: '分析原因', description: '分析影响销量的因素' }
      ]
    },
    traffic: {
      title: '交通调查分析技巧',
      skills: [
        { name: '分类计数', description: '统计每种交通方式的人数' },
        { name: '环保分析', description: '识别绿色出行方式及其人数' },
        { name: '计算比例', description: '计算各方式占比' },
        { name: '提出建议', description: '根据数据提出出行建议' }
      ]
    },
    default: {
      title: '数据分析技巧',
      skills: [
        { name: '数据整理', description: '将原始数据进行分类整理' },
        { name: '统计计数', description: '统计各类数据的数量' },
        { name: '计算分析', description: '计算总和、平均值等统计量' },
        { name: '图表展示', description: '用合适的图表展示数据' }
      ]
    }
  }
  
  return skillsMap[sceneType] || skillsMap.default
}

export function generateRealTimeAnswers(chartData, sceneType) {
  const answers = []
  
  if (!chartData || !chartData.data) return answers
  
  const values = extractValues(chartData)
  if (values.length === 0) return answers
  
  const stats = calculateBasicStats(values)
  
  switch (sceneType) {
    case 'height':
      answers.push({
        question: '如何整理身高数据？',
        answer: `建议将${values.length}个身高数据按10厘米为一段进行分组：130-139cm、140-149cm、150-159cm等。当前数据范围是${stats.min}-${stats.max}cm，平均身高约${stats.average.toFixed(1)}cm。`,
        hint: '使用"正"字计数法可以快速统计每个范围的人数'
      })
      answers.push({
        question: '身高数据有什么特点？',
        answer: `全班身高在${stats.min}cm到${stats.max}cm之间，平均身高${stats.average.toFixed(1)}cm。身高差距约${stats.max - stats.min}cm，说明同学们身高差异${stats.max - stats.min > 20 ? '较大' : '适中'}。`,
        hint: '可以找出最高和最矮的同学各是谁'
      })
      break
      
    case 'temperature':
      answers.push({
        question: '温度变化有什么规律？',
        answer: `本周温度在${stats.min}℃到${stats.max}℃之间波动，平均温度${stats.average.toFixed(1)}℃。温差${stats.max - stats.min}℃，温度变化${stats.max - stats.min > 5 ? '较大' : '较小'}。`,
        hint: '观察温度曲线可以更直观地看到变化趋势'
      })
      answers.push({
        question: '哪天温度最高/最低？',
        answer: `最高温度${stats.max}℃，最低温度${stats.min}℃。日平均温度${stats.average.toFixed(1)}℃，整体温度${stats.average > 25 ? '偏暖' : stats.average < 15 ? '偏凉' : '适中'}。`,
        hint: '可以结合天气情况分析温度变化原因'
      })
      break
      
    case 'money':
      answers.push({
        question: '哪项花费最多？',
        answer: `各项支出总和为${stats.sum}元，平均每项${stats.average.toFixed(1)}元。最多支出${stats.max}元，最少${stats.min}元。`,
        hint: '可以用饼图直观展示各项支出占比'
      })
      answers.push({
        question: '如何规划零花钱？',
        answer: `当前总支出${stats.sum}元。建议：必要支出优先（如文具、书籍），控制零食支出，适当储蓄。可按"50%必需品+30%储蓄+20%娱乐"分配。`,
        hint: '养成记账习惯有助于合理规划'
      })
      break
      
    case 'exam':
      answers.push({
        question: '成绩分布如何？',
        answer: `共有${values.length}个分数段，总人数${stats.sum}人。最多人数的分数段有${stats.max}人，最少${stats.min}人。`,
        hint: '用条形图可以清晰展示各分数段人数'
      })
      answers.push({
        question: '及格率和优秀率？',
        answer: `可根据数据计算：及格率 = (及格人数/总人数)×100%，优秀率 = (90分以上人数/总人数)×100%。`,
        hint: '及格一般指60分以上，优秀一般指90分以上'
      })
      break
      
    default:
      answers.push({
        question: '数据有什么特点？',
        answer: `共有${values.length}个数据点，数值范围${stats.min}-${stats.max}，平均值${stats.average.toFixed(1)}，总和${stats.sum}。`,
        hint: '选择合适的图表可以更好地展示数据'
      })
  }
  
  return answers
}

function extractValues(chartData) {
  const values = []
  
  if (chartData.type === 'table' && Array.isArray(chartData.data)) {
    chartData.data.forEach(row => {
      if (Array.isArray(row)) {
        row.forEach(val => {
          if (typeof val === 'number' && !isNaN(val)) values.push(val)
        })
      }
    })
  } else if (chartData.type === 'categories' && Array.isArray(chartData.data)) {
    chartData.data.forEach(item => {
      if (item.amount !== undefined && !isNaN(item.amount)) values.push(item.amount)
    })
  } else if (chartData.type === 'ranges' && Array.isArray(chartData.data)) {
    chartData.data.forEach(item => {
      if (item.count !== undefined && !isNaN(item.count)) values.push(item.count)
    })
  } else if (chartData.type === 'daily' && Array.isArray(chartData.data)) {
    chartData.data.forEach(item => {
      const keys = Object.keys(item).filter(k => k !== 'day')
      keys.forEach(key => {
        if (typeof item[key] === 'number' && !isNaN(item[key])) values.push(item[key])
      })
    })
  }
  
  return values
}

function calculateBasicStats(values) {
  if (values.length === 0) return { sum: 0, average: 0, max: 0, min: 0 }
  
  const sum = values.reduce((a, b) => a + b, 0)
  const average = sum / values.length
  const max = Math.max(...values)
  const min = Math.min(...values)
  
  return { sum, average, max, min }
}

export function getSceneTypeFromTitle(title) {
  const titleLower = (title || '').toLowerCase()
  
  if (titleLower.includes('身高')) return 'height'
  if (titleLower.includes('鞋号') || titleLower.includes('鞋')) return 'shoes'
  if (titleLower.includes('温度') || titleLower.includes('气温')) return 'temperature'
  if (titleLower.includes('零花') || titleLower.includes('花费')) return 'money'
  if (titleLower.includes('考试') || titleLower.includes('成绩') || titleLower.includes('分数')) return 'exam'
  if (titleLower.includes('阅读') || titleLower.includes('读书')) return 'reading'
  if (titleLower.includes('运动') || titleLower.includes('体育')) return 'sports'
  if (titleLower.includes('水果') || titleLower.includes('销售')) return 'fruit'
  if (titleLower.includes('交通') || titleLower.includes('出行')) return 'traffic'
  
  return 'default'
}
