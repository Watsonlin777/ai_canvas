import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChartStore } from '../store/chartStore'

describe('chartStore - 状态管理测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const chartStore = useChartStore()
      
      expect(chartStore.title).toBe('折线统计图')
      expect(chartStore.xAxisName).toBe('月份')
      expect(chartStore.yAxisName).toBe('数量')
      expect(chartStore.chartType).toBe('bar')
      expect(chartStore.animationSpeed).toBe(1)
    })

    it('should have default dataItems', () => {
      const chartStore = useChartStore()
      
      expect(chartStore.dataItems).toBeDefined()
      expect(Array.isArray(chartStore.dataItems)).toBe(true)
      expect(chartStore.dataItems.length).toBeGreaterThan(0)
    })

    it('should initialize computed labels and values', () => {
      const chartStore = useChartStore()
      
      expect(chartStore.labels).toBeDefined()
      expect(chartStore.values).toBeDefined()
      expect(Array.isArray(chartStore.labels)).toBe(true)
      expect(Array.isArray(chartStore.values)).toBe(true)
    })

    it('should initialize prediction state', () => {
      const chartStore = useChartStore()
      
      expect(chartStore.predictionResult).toBeNull()
      expect(chartStore.showPrediction).toBe(false)
      expect(chartStore.showTrendLine).toBe(false)
    })
  })

  describe('title management', () => {
    it('should set title', () => {
      const chartStore = useChartStore()
      
      chartStore.setTitle('新标题')
      expect(chartStore.title).toBe('新标题')
    })
  })

  describe('axis names management', () => {
    it('should set axis names', () => {
      const chartStore = useChartStore()
      
      chartStore.setAxisNames('X轴', 'Y轴')
      expect(chartStore.xAxisName).toBe('X轴')
      expect(chartStore.yAxisName).toBe('Y轴')
    })
  })

  describe('chart type management', () => {
    it('should set chart type', () => {
      const chartStore = useChartStore()
      
      chartStore.setChartType('line')
      expect(chartStore.chartType).toBe('line')
    })

    it('should allow bar chart type', () => {
      const chartStore = useChartStore()
      
      chartStore.setChartType('bar')
      expect(chartStore.chartType).toBe('bar')
    })
  })

  describe('animation speed management', () => {
    it('should set animation speed', () => {
      const chartStore = useChartStore()
      
      chartStore.setAnimationSpeed(2)
      expect(chartStore.animationSpeed).toBe(2)
    })
  })

  describe('data items management', () => {
    it('should add data item', () => {
      const chartStore = useChartStore()
      const initialLength = chartStore.dataItems.length
      
      chartStore.addDataItem('七月', 80)
      
      expect(chartStore.dataItems.length).toBe(initialLength + 1)
      expect(chartStore.dataItems[chartStore.dataItems.length - 1].label).toBe('七月')
      expect(chartStore.dataItems[chartStore.dataItems.length - 1].value).toBe(80)
    })

    it('should convert value to number when adding', () => {
      const chartStore = useChartStore()
      
      chartStore.addDataItem('七月', '80')
      
      expect(typeof chartStore.dataItems[chartStore.dataItems.length - 1].value).toBe('number')
    })

    it('should remove data item', () => {
      const chartStore = useChartStore()
      const initialLength = chartStore.dataItems.length
      
      chartStore.removeDataItem(0)
      
      expect(chartStore.dataItems.length).toBe(initialLength - 1)
    })

    it('should update data item', () => {
      const chartStore = useChartStore()
      
      chartStore.updateDataItem(0, 'value', 99)
      
      expect(chartStore.dataItems[0].value).toBe(99)
    })

    it('should update label field', () => {
      const chartStore = useChartStore()
      
      chartStore.updateDataItem(0, 'label', '新的一月')
      
      expect(chartStore.dataItems[0].label).toBe('新的一月')
    })

    it('should set data items', () => {
      const chartStore = useChartStore()
      
      chartStore.setDataItems([
        { label: 'A', value: 10 },
        { label: 'B', value: 20 }
      ])
      
      expect(chartStore.dataItems.length).toBe(2)
      expect(chartStore.labels).toEqual(['A', 'B'])
      expect(chartStore.values).toEqual([10, 20])
    })

    it('should compute labels correctly', () => {
      const chartStore = useChartStore()
      chartStore.setDataItems([
        { label: '一月', value: 30 },
        { label: '二月', value: 45 }
      ])
      
      expect(chartStore.labels).toEqual(['一月', '二月'])
    })

    it('should compute values correctly', () => {
      const chartStore = useChartStore()
      chartStore.setDataItems([
        { label: '一月', value: 30 },
        { label: '二月', value: 45 }
      ])
      
      expect(chartStore.values).toEqual([30, 45])
    })
  })

  describe('prediction management', () => {
    it('should set prediction result', () => {
      const chartStore = useChartStore()
      
      chartStore.setPredictionResult({ predictions: [1, 2, 3] })
      
      expect(chartStore.predictionResult).toEqual({ predictions: [1, 2, 3] })
      expect(chartStore.showPrediction).toBe(true)
    })

    it('should clear prediction', () => {
      const chartStore = useChartStore()
      
      chartStore.setPredictionResult({ predictions: [1, 2, 3] })
      chartStore.clearPrediction()
      
      expect(chartStore.predictionResult).toBeNull()
      expect(chartStore.showPrediction).toBe(false)
    })

    it('should toggle trend line', () => {
      const chartStore = useChartStore()
      
      expect(chartStore.showTrendLine).toBe(false)
      
      chartStore.toggleTrendLine()
      expect(chartStore.showTrendLine).toBe(true)
      
      chartStore.toggleTrendLine()
      expect(chartStore.showTrendLine).toBe(false)
    })
  })

  describe('settings persistence', () => {
    it('should save settings to localStorage', () => {
      const chartStore = useChartStore()
      const mockLocalStorage = {
        setItem: vi.fn(),
        getItem: vi.fn(() => null)
      }
      global.localStorage = mockLocalStorage
      
      chartStore.setTitle('测试标题')
      chartStore.saveSettings()
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'chartSettings',
        expect.stringContaining('测试标题')
      )
    })

    it('should load settings from localStorage', () => {
      const savedSettings = JSON.stringify({
        title: '加载的标题',
        xAxisName: 'X轴名',
        yAxisName: 'Y轴名',
        animationSpeed: 2,
        dataItems: [
          { label: '加载的一月', value: 100 }
        ]
      })
      
      const mockLocalStorage = {
        getItem: vi.fn(() => savedSettings),
        setItem: vi.fn()
      }
      global.localStorage = mockLocalStorage
      
      const chartStore = useChartStore()
      
      expect(chartStore.title).toBe('加载的标题')
      expect(chartStore.xAxisName).toBe('X轴名')
      expect(chartStore.dataItems[0].label).toBe('加载的一月')
    })

    it('should use defaults when no saved settings', () => {
      const mockLocalStorage = {
        getItem: vi.fn(() => null),
        setItem: vi.fn()
      }
      global.localStorage = mockLocalStorage
      
      const chartStore = useChartStore()
      
      expect(chartStore.title).toBe('折线统计图')
    })

    it('should reset settings to defaults', () => {
      const chartStore = useChartStore()
      const mockLocalStorage = {
        removeItem: vi.fn(),
        getItem: vi.fn(() => null),
        setItem: vi.fn()
      }
      global.localStorage = mockLocalStorage
      
      chartStore.setTitle('修改的标题')
      chartStore.setChartType('line')
      chartStore.resetSettings()
      
      expect(chartStore.title).toBe('折线统计图')
      expect(chartStore.chartType).toBe('bar')
      expect(chartStore.showPrediction).toBe(false)
    })
  })

  describe('store return values', () => {
    it('should expose all required properties', () => {
      const chartStore = useChartStore()
      
      expect(chartStore).toHaveProperty('title')
      expect(chartStore).toHaveProperty('xAxisName')
      expect(chartStore).toHaveProperty('yAxisName')
      expect(chartStore).toHaveProperty('chartType')
      expect(chartStore).toHaveProperty('animationSpeed')
      expect(chartStore).toHaveProperty('dataItems')
      expect(chartStore).toHaveProperty('predictionResult')
      expect(chartStore).toHaveProperty('showPrediction')
      expect(chartStore).toHaveProperty('showTrendLine')
      expect(chartStore).toHaveProperty('labels')
      expect(chartStore).toHaveProperty('values')
    })

    it('should expose all required methods', () => {
      const chartStore = useChartStore()
      
      expect(chartStore).toHaveProperty('setTitle')
      expect(chartStore).toHaveProperty('setAxisNames')
      expect(chartStore).toHaveProperty('setChartType')
      expect(chartStore).toHaveProperty('setAnimationSpeed')
      expect(chartStore).toHaveProperty('addDataItem')
      expect(chartStore).toHaveProperty('removeDataItem')
      expect(chartStore).toHaveProperty('updateDataItem')
      expect(chartStore).toHaveProperty('setDataItems')
      expect(chartStore).toHaveProperty('setPredictionResult')
      expect(chartStore).toHaveProperty('clearPrediction')
      expect(chartStore).toHaveProperty('toggleTrendLine')
      expect(chartStore).toHaveProperty('saveSettings')
      expect(chartStore).toHaveProperty('loadSettings')
      expect(chartStore).toHaveProperty('resetSettings')
    })
  })
})
