import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChartStore } from '../store/chartStore'

describe('Drag to Table Sync - 拖拽图表同步表格数据', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('chartStore.updateDataItem - 拖拽时数据更新', () => {
    it('should update dataItem value when dragging chart bar', () => {
      const chartStore = useChartStore()
      
      const initialValue = chartStore.dataItems[0].value
      chartStore.updateDataItem(0, 'value', 75)
      
      expect(chartStore.dataItems[0].value).toBe(75)
      expect(chartStore.dataItems[0].value).not.toBe(initialValue)
    })

    it('should convert value to number when updating', () => {
      const chartStore = useChartStore()
      
      chartStore.updateDataItem(0, 'value', '85')
      
      expect(typeof chartStore.dataItems[0].value).toBe('number')
      expect(chartStore.dataItems[0].value).toBe(85)
    })

    it('should update label when field is label', () => {
      const chartStore = useChartStore()
      
      chartStore.updateDataItem(0, 'label', '新的一月')
      
      expect(chartStore.dataItems[0].label).toBe('新的一月')
    })

    it('should update specific index without affecting others', () => {
      const chartStore = useChartStore()
      const originalData = JSON.parse(JSON.stringify(chartStore.dataItems))
      
      chartStore.updateDataItem(2, 'value', 100)
      
      expect(chartStore.dataItems[0].value).toBe(originalData[0].value)
      expect(chartStore.dataItems[1].value).toBe(originalData[1].value)
      expect(chartStore.dataItems[2].value).toBe(100)
      expect(chartStore.dataItems[3].value).toBe(originalData[3].value)
    })

    it('should handle negative values as valid numbers', () => {
      const chartStore = useChartStore()
      
      chartStore.updateDataItem(0, 'value', -10)
      
      expect(chartStore.dataItems[0].value).toBe(-10)
    })
  })

  describe('convertToTableFormat - 数据转表格格式', () => {
    it('should convert dataItems to table format correctly', () => {
      const chartStore = useChartStore()
      chartStore.setDataItems([
        { label: '一月', value: 30 },
        { label: '二月', value: 45 },
        { label: '三月', value: 28 }
      ])
      
      const labels = chartStore.labels
      const values = chartStore.values
      
      expect(labels).toEqual(['一月', '二月', '三月'])
      expect(values).toEqual([30, 45, 28])
    })

    it('should handle empty dataItems', () => {
      const chartStore = useChartStore()
      chartStore.setDataItems([])
      
      expect(chartStore.labels).toEqual([])
      expect(chartStore.values).toEqual([])
    })

    it('should reflect data changes after updateDataItem', () => {
      const chartStore = useChartStore()
      chartStore.setDataItems([
        { label: '一月', value: 30 },
        { label: '二月', value: 45 }
      ])
      
      chartStore.updateDataItem(0, 'value', 75)
      chartStore.updateDataItem(1, 'value', 90)
      
      expect(chartStore.values[0]).toBe(75)
      expect(chartStore.values[1]).toBe(90)
    })
  })

  describe('saveSettings - 拖拽后保存设置', () => {
    it('should save settings after data update', () => {
      const chartStore = useChartStore()
      const mockLocalStorage = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn()
      }
      global.localStorage = mockLocalStorage
      
      chartStore.updateDataItem(0, 'value', 99)
      chartStore.saveSettings()
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'chartSettings',
        expect.stringContaining('"value":99')
      )
    })
  })

  describe('dragEnd event data structure', () => {
    it('should provide correct data structure for table sync', () => {
      const chartStore = useChartStore()
      chartStore.setDataItems([
        { label: '一月', value: 30 },
        { label: '二月', value: 45 },
        { label: '三月', value: 28 }
      ])
      
      const tableData = [chartStore.labels, chartStore.values]
      
      expect(tableData).toEqual([
        ['一月', '二月', '三月'],
        [30, 45, 28]
      ])
    })

    it('should track which index was changed', () => {
      const chartStore = useChartStore()
      chartStore.setDataItems([
        { label: '一月', value: 30 },
        { label: '二月', value: 45 },
        { label: '三月', value: 28 }
      ])
      
      const changedIndex = 1
      chartStore.updateDataItem(changedIndex, 'value', 88)
      
      const expectedDataAfterChange = [30, 88, 28]
      expect(chartStore.values[changedIndex]).toBe(88)
      expect(chartStore.values).toEqual(expectedDataAfterChange)
    })
  })

  describe('table headers generation', () => {
    it('should generate correct column headers', () => {
      const chartStore = useChartStore()
      chartStore.setDataItems([
        { label: '一月', value: 30 },
        { label: '二月', value: 45 }
      ])
      
      const columns = chartStore.labels
      expect(columns).toEqual(['一月', '二月'])
    })

    it('should generate correct row headers', () => {
      const chartStore = useChartStore()
      chartStore.setDataItems([
        { label: '一月', value: 30 },
        { label: '二月', value: 45 },
        { label: '三月', value: 28 }
      ])
      
      const rowHeaders = chartStore.values.map((_, index) => `数据${index + 1}`)
      expect(rowHeaders).toEqual(['数据1', '数据2', '数据3'])
    })
  })
})
