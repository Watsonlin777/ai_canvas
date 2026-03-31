import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useChartStore = defineStore('chart', () => {
  const title = ref('折线统计图')
  const xAxisName = ref('月份')
  const yAxisName = ref('数量')
  const chartType = ref('bar')
  const animationSpeed = ref(1)
  
  const dataItems = ref([
    { label: '一月', value: 30 },
    { label: '二月', value: 45 },
    { label: '三月', value: 28 },
    { label: '四月', value: 56 },
    { label: '五月', value: 42 },
    { label: '六月', value: 68 }
  ])
  
  const predictionResult = ref(null)
  const showPrediction = ref(false)
  const showTrendLine = ref(false)
  
  const labels = computed(() => dataItems.value.map(item => item.label))
  const values = computed(() => dataItems.value.map(item => item.value))
  
  function setTitle(newTitle) {
    title.value = newTitle
    saveSettings()
  }
  
  function setAxisNames(xAxis, yAxis) {
    xAxisName.value = xAxis
    yAxisName.value = yAxis
    saveSettings()
  }
  
  function setChartType(type) {
    chartType.value = type
  }
  
  function setAnimationSpeed(speed) {
    animationSpeed.value = speed
    saveSettings()
  }
  
  function addDataItem(label, value) {
    dataItems.value.push({ label, value: Number(value) })
  }
  
  function removeDataItem(index) {
    dataItems.value.splice(index, 1)
  }
  
  function updateDataItem(index, field, value) {
    if (field === 'value') {
      dataItems.value[index][field] = Number(value)
    } else {
      dataItems.value[index][field] = value
    }
  }
  
  function setDataItems(items) {
    dataItems.value = items
  }
  
  function setPredictionResult(result) {
    predictionResult.value = result
    showPrediction.value = true
  }
  
  function clearPrediction() {
    predictionResult.value = null
    showPrediction.value = false
  }
  
  function toggleTrendLine() {
    showTrendLine.value = !showTrendLine.value
  }
  
  function saveSettings() {
    const settings = {
      title: title.value,
      xAxisName: xAxisName.value,
      yAxisName: yAxisName.value,
      animationSpeed: animationSpeed.value,
      dataItems: dataItems.value
    }
    localStorage.setItem('chartSettings', JSON.stringify(settings))
  }
  
  function loadSettings() {
    const saved = localStorage.getItem('chartSettings')
    if (saved) {
      const settings = JSON.parse(saved)
      title.value = settings.title || '折线统计图'
      xAxisName.value = settings.xAxisName || '月份'
      yAxisName.value = settings.yAxisName || '数量'
      animationSpeed.value = settings.animationSpeed || 1
      if (settings.dataItems && settings.dataItems.length > 0) {
        dataItems.value = settings.dataItems
      }
    }
  }
  
  function resetSettings() {
    title.value = '折线统计图'
    xAxisName.value = '月份'
    yAxisName.value = '数量'
    chartType.value = 'bar'
    animationSpeed.value = 1
    dataItems.value = [
      { label: '一月', value: 30 },
      { label: '二月', value: 45 },
      { label: '三月', value: 28 },
      { label: '四月', value: 56 },
      { label: '五月', value: 42 },
      { label: '六月', value: 68 }
    ]
    predictionResult.value = null
    showPrediction.value = false
    showTrendLine.value = false
    localStorage.removeItem('chartSettings')
  }
  
  loadSettings()
  
  return {
    title,
    xAxisName,
    yAxisName,
    chartType,
    animationSpeed,
    dataItems,
    predictionResult,
    showPrediction,
    showTrendLine,
    labels,
    values,
    setTitle,
    setAxisNames,
    setChartType,
    setAnimationSpeed,
    addDataItem,
    removeDataItem,
    updateDataItem,
    setDataItems,
    setPredictionResult,
    clearPrediction,
    toggleTrendLine,
    saveSettings,
    loadSettings,
    resetSettings
  }
})
