import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  debounce,
  throttle,
  formatNumber,
  clamp,
  linearRegression,
  predictValues,
  calculateMean,
  calculateStandardDeviation,
  calculateConfidence,
  polynomialRegression,
  predictWithPolynomial,
  calculateR2Score,
  calculatePredictionConfidence,
  runAIPrediction,
  getSceneBasedPredictionConfig,
  generateId,
  deepClone,
  getThinkingSkills,
  generateRealTimeAnswers,
  getSceneTypeFromTitle
} from './helpers'

describe('helpers - 工具函数测试', () => {
  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should delay function execution', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)
      
      debouncedFn()
      expect(fn).not.toHaveBeenCalled()
      
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should only execute once for rapid calls', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)
      
      debouncedFn()
      debouncedFn()
      debouncedFn()
      
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments to the debounced function', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)
      
      debouncedFn('arg1', 'arg2')
      vi.advanceTimersByTime(100)
      
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should execute function immediately on first call', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)
      
      throttledFn()
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should not execute again within delay period', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)
      
      throttledFn()
      throttledFn()
      
      vi.advanceTimersByTime(50)
      throttledFn()
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should execute again after delay period', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)
      
      throttledFn()
      vi.advanceTimersByTime(100)
      throttledFn()
      
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('formatNumber', () => {
    it('should format number with commas', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1000000)).toBe('1,000,000')
    })

    it('should handle small numbers', () => {
      expect(formatNumber(100)).toBe('100')
    })

    it('should handle decimal numbers', () => {
      expect(formatNumber(1000.99)).toBe('1,000.99')
    })
  })

  describe('clamp', () => {
    it('should return value when within range', () => {
      expect(clamp(50, 0, 100)).toBe(50)
    })

    it('should return min when value is below', () => {
      expect(clamp(-10, 0, 100)).toBe(0)
    })

    it('should return max when value is above', () => {
      expect(clamp(150, 0, 100)).toBe(100)
    })

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 100)).toBe(0)
      expect(clamp(100, 0, 100)).toBe(100)
    })
  })

  describe('linearRegression', () => {
    it('should calculate slope and intercept for linear data', () => {
      const data = [1, 2, 3, 4, 5]
      const result = linearRegression(data)
      
      expect(result).toHaveProperty('slope')
      expect(result).toHaveProperty('intercept')
      expect(typeof result.slope).toBe('number')
      expect(typeof result.intercept).toBe('number')
    })

    it('should return approximately correct values for known data', () => {
      const data = [2, 4, 6, 8, 10]
      const result = linearRegression(data)
      
      expect(result.slope).toBeCloseTo(2, 1)
    })

    it('should handle increasing data', () => {
      const data = [10, 20, 30, 40, 50]
      const result = linearRegression(data)
      
      expect(result.slope).toBeGreaterThan(0)
    })

    it('should handle decreasing data', () => {
      const data = [50, 40, 30, 20, 10]
      const result = linearRegression(data)
      
      expect(result.slope).toBeLessThan(0)
    })
  })

  describe('predictValues', () => {
    it('should predict future values based on linear regression', () => {
      const data = [1, 2, 3, 4, 5]
      const predictions = predictValues(data, 3)
      
      expect(predictions).toHaveLength(3)
      expect(predictions.every(p => typeof p === 'number')).toBe(true)
    })

    it('should continue the trend', () => {
      const data = [2, 4, 6, 8, 10]
      const predictions = predictValues(data, 2)
      
      expect(predictions[0]).toBeGreaterThan(10)
    })

    it('should handle flat data', () => {
      const data = [5, 5, 5, 5, 5]
      const predictions = predictValues(data, 2)
      
      expect(predictions[0]).toBeCloseTo(5, 0)
    })
  })

  describe('calculateMean', () => {
    it('should calculate correct mean', () => {
      expect(calculateMean([10, 20, 30])).toBe(20)
      expect(calculateMean([1, 2, 3, 4, 5])).toBe(3)
    })

    it('should handle negative numbers', () => {
      expect(calculateMean([-10, 0, 10])).toBe(0)
    })

    it('should handle decimal numbers', () => {
      expect(calculateMean([0.1, 0.2, 0.3])).toBeCloseTo(0.2)
    })
  })

  describe('calculateStandardDeviation', () => {
    it('should return 0 for identical values', () => {
      expect(calculateStandardDeviation([5, 5, 5, 5])).toBe(0)
    })

    it('should return positive value for varied data', () => {
      expect(calculateStandardDeviation([1, 2, 3, 4, 5])).toBeGreaterThan(0)
    })

    it('should handle small dataset', () => {
      expect(calculateStandardDeviation([1, 2])).toBeGreaterThanOrEqual(0)
    })
  })

  describe('calculateConfidence', () => {
    it('should return 50 for insufficient data', () => {
      expect(calculateConfidence([1, 2])).toBe(50)
    })

    it('should return value between 30 and 95', () => {
      const confidence = calculateConfidence([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      expect(confidence).toBeGreaterThanOrEqual(30)
      expect(confidence).toBeLessThanOrEqual(95)
    })

    it('should return higher confidence for consistent data', () => {
      const consistentData = [50, 51, 49, 50, 50]
      const variedData = [10, 90, 50, 30, 70]
      
      const consistentConfidence = calculateConfidence(consistentData)
      const variedConfidence = calculateConfidence(variedData)
      
      expect(consistentConfidence).toBeGreaterThan(variedConfidence)
    })
  })

  describe('polynomialRegression', () => {
    it('should return coefficients array', () => {
      const coefficients = polynomialRegression([1, 2, 3, 4, 5])
      expect(Array.isArray(coefficients)).toBe(true)
    })

    it('should return correct degree coefficients', () => {
      const coefficients = polynomialRegression([1, 2, 3], 2)
      expect(coefficients.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('predictWithPolynomial', () => {
    it('should generate correct number of predictions', () => {
      const coefficients = [1, 2, 1]
      const predictions = predictWithPolynomial(coefficients, 0, 5)
      expect(predictions).toHaveLength(5)
    })

    it('should return array of numbers', () => {
      const coefficients = [1, 1]
      const predictions = predictWithPolynomial(coefficients, 0, 3)
      expect(predictions.every(p => typeof p === 'number')).toBe(true)
    })
  })

  describe('calculateR2Score', () => {
    it('should return 1 for perfect predictions', () => {
      const actual = [1, 2, 3, 4, 5]
      const predicted = [1, 2, 3, 4, 5]
      expect(calculateR2Score(actual, predicted)).toBeCloseTo(1)
    })

    it('should return value between 0 and 1', () => {
      const actual = [1, 2, 3, 4, 5]
      const predicted = [1.5, 2.5, 3.5, 4.5, 5.5]
      const r2 = calculateR2Score(actual, predicted)
      expect(r2).toBeLessThanOrEqual(1)
      expect(r2).toBeGreaterThanOrEqual(0)
    })

    it('should handle zero variance in actual data', () => {
      const actual = [5, 5, 5, 5]
      const predicted = [5, 5, 5, 5]
      expect(calculateR2Score(actual, predicted)).toBe(1)
    })
  })

  describe('calculatePredictionConfidence', () => {
    it('should return default for insufficient data', () => {
      const result = calculatePredictionConfidence([1], [1, 2])
      expect(result.confidence).toBe(50)
      expect(result.r2Score).toBe(0)
    })

    it('should include trend in result', () => {
      const data = [10, 20, 30, 40, 50]
      const predictions = [60, 70]
      const result = calculatePredictionConfidence(data, predictions)
      
      expect(result).toHaveProperty('trend')
      expect(['up', 'down', 'stable']).toContain(result.trend)
    })

    it('should calculate confidence for linear algorithm', () => {
      const data = [10, 20, 30, 40, 50]
      const predictions = [60, 70]
      const result = calculatePredictionConfidence(data, predictions, 'linear')
      
      expect(result.confidence).toBeGreaterThan(0)
    })
  })

  describe('runAIPrediction', () => {
    it('should return empty predictions for insufficient data', () => {
      const result = runAIPrediction([1], 5)
      expect(result.predictions).toEqual([])
    })

    it('should return predictions array for valid data', () => {
      const result = runAIPrediction([10, 20, 30, 40, 50], 3)
      expect(result.predictions).toHaveLength(3)
    })

    it('should include confidence and trend', () => {
      const result = runAIPrediction([10, 20, 30, 40, 50], 3)
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('trend')
    })

    it('should filter out invalid data', () => {
      const result = runAIPrediction([10, NaN, 30, undefined, 50], 3)
      expect(result.predictions.length).toBeGreaterThan(0)
    })

    it('should work with polynomial algorithm', () => {
      const result = runAIPrediction([10, 20, 30, 40, 50], 3, 'polynomial')
      expect(result.predictions).toHaveLength(3)
      expect(result.algorithm).toBe('polynomial')
    })

    it('should not return negative predictions', () => {
      const result = runAIPrediction([10, 20, 30, 40, 50], 3)
      expect(result.predictions.every(p => p >= 0)).toBe(true)
    })
  })

  describe('getSceneBasedPredictionConfig', () => {
    it('should return correct config for sales', () => {
      const config = getSceneBasedPredictionConfig('sales')
      expect(config.algorithm).toBe('linear')
      expect(config.unit).toBe('销售额')
    })

    it('should return correct config for temperature', () => {
      const config = getSceneBasedPredictionConfig('temperature')
      expect(config.algorithm).toBe('polynomial')
      expect(config.unit).toBe('温度')
    })

    it('should return default config for unknown scene', () => {
      const config = getSceneBasedPredictionConfig('unknown')
      expect(config.algorithm).toBe('linear')
    })

    it('should include description', () => {
      const config = getSceneBasedPredictionConfig('sales')
      expect(config.description).toBeDefined()
    })
  })

  describe('generateId', () => {
    it('should generate string', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
    })

    it('should generate unique ids', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(100)
    })

    it('should have reasonable length', () => {
      const id = generateId()
      expect(id.length).toBeGreaterThan(0)
      expect(id.length).toBeLessThanOrEqual(10)
    })
  })

  describe('deepClone', () => {
    it('should create independent copy', () => {
      const original = { a: 1, b: { c: 2 } }
      const clone = deepClone(original)
      
      clone.b.c = 3
      expect(original.b.c).toBe(2)
    })

    it('should handle arrays', () => {
      const original = [1, [2, 3], { a: 4 }]
      const clone = deepClone(original)
      
      clone[1][0] = 99
      expect(original[1][0]).toBe(2)
    })

    it('should handle primitive values', () => {
      expect(deepClone(42)).toBe(42)
      expect(deepClone('hello')).toBe('hello')
      expect(deepClone(null)).toBe(null)
    })
  })

  describe('getThinkingSkills', () => {
    it('should return skills for height scene', () => {
      const skills = getThinkingSkills('height')
      expect(skills.title).toContain('身高')
      expect(skills.skills).toHaveLength(4)
    })

    it('should return skills for temperature scene', () => {
      const skills = getThinkingSkills('temperature')
      expect(skills.title).toContain('温度')
    })

    it('should return default skills for unknown scene', () => {
      const skills = getThinkingSkills('unknown')
      expect(skills.title).toContain('数据分析')
    })

    it('should return array of skills', () => {
      const skills = getThinkingSkills('height')
      expect(Array.isArray(skills.skills)).toBe(true)
    })

    it('should include name and description in each skill', () => {
      const skills = getThinkingSkills('height')
      skills.skills.forEach(skill => {
        expect(skill).toHaveProperty('name')
        expect(skill).toHaveProperty('description')
      })
    })
  })

  describe('generateRealTimeAnswers', () => {
    it('should return array', () => {
      const answers = generateRealTimeAnswers({ type: 'table', data: [[1, 2], [30, 50]] }, 'default')
      expect(Array.isArray(answers)).toBe(true)
    })

    it('should return empty array for invalid input', () => {
      expect(generateRealTimeAnswers(null, 'default')).toEqual([])
      expect(generateRealTimeAnswers({}, 'default')).toEqual([])
      expect(generateRealTimeAnswers({ data: [] }, 'default')).toEqual([])
    })

    it('should generate answers for height scene', () => {
      const chartData = {
        type: 'ranges',
        data: [
          { range: '140-149', count: 5 },
          { range: '150-159', count: 10 },
          { range: '160-169', count: 8 }
        ]
      }
      const answers = generateRealTimeAnswers(chartData, 'height')
      expect(answers.length).toBeGreaterThan(0)
    })

    it('should include question and answer in each item', () => {
      const chartData = {
        type: 'table',
        data: [['一月', '二月'], [30, 50]]
      }
      const answers = generateRealTimeAnswers(chartData, 'temperature')
      answers.forEach(answer => {
        expect(answer).toHaveProperty('question')
        expect(answer).toHaveProperty('answer')
      })
    })

    it('should handle different chart data types', () => {
      const tableData = { type: 'table', data: [['A', 'B'], [10, 20]] }
      const categoriesData = { type: 'categories', data: [{ name: 'A', amount: 10 }] }
      const rangesData = { type: 'ranges', data: [{ range: 'A', count: 10 }] }
      const dailyData = { type: 'daily', data: [{ day: '周一', value: 10 }] }
      
      expect(generateRealTimeAnswers(tableData, 'default').length).toBeGreaterThanOrEqual(0)
      expect(generateRealTimeAnswers(categoriesData, 'default').length).toBeGreaterThanOrEqual(0)
      expect(generateRealTimeAnswers(rangesData, 'default').length).toBeGreaterThanOrEqual(0)
      expect(generateRealTimeAnswers(dailyData, 'default').length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getSceneTypeFromTitle', () => {
    it('should return height for 身高', () => {
      expect(getSceneTypeFromTitle('身高数据')).toBe('height')
      expect(getSceneTypeFromTitle('学生身高统计')).toBe('height')
    })

    it('should return shoes for 鞋号', () => {
      expect(getSceneTypeFromTitle('鞋号统计')).toBe('shoes')
      expect(getSceneTypeFromTitle('鞋码调查')).toBe('shoes')
    })

    it('should return temperature for 温度', () => {
      expect(getSceneTypeFromTitle('温度变化')).toBe('temperature')
      expect(getSceneTypeFromTitle('气温统计')).toBe('temperature')
    })

    it('should return money for 零花钱', () => {
      expect(getSceneTypeFromTitle('零花钱使用')).toBe('money')
      expect(getSceneTypeFromTitle('花费统计')).toBe('money')
    })

    it('should return exam for 考试', () => {
      expect(getSceneTypeFromTitle('考试成绩')).toBe('exam')
      expect(getSceneTypeFromTitle('分数分析')).toBe('exam')
    })

    it('should return default for unknown titles', () => {
      expect(getSceneTypeFromTitle('未知类型')).toBe('default')
      expect(getSceneTypeFromTitle('')).toBe('default')
      expect(getSceneTypeFromTitle(null)).toBe('default')
    })
  })
})
