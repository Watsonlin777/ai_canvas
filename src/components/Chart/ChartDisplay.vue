<template>
  <div class="chart-display card">
    <div class="chart-toolbar">
      <div class="chart-type-buttons">
        <button 
          v-for="type in chartTypes" 
          :key="type.value"
          :class="['type-btn', { active: chartStore.chartType === type.value }]"
          @click="changeChartType(type.value)"
        >
          {{ type.icon }} {{ type.label }}
        </button>
      </div>
      
      <div class="chart-actions">
        <button 
          :class="['action-btn', { active: chartStore.showTrendLine }]"
          @click="chartStore.toggleTrendLine"
        >
          📈 趋势线
        </button>
        <button 
          :class="['action-btn', { active: enableDrag }]"
          @click="enableDrag = !enableDrag"
          :title="enableDrag ? '禁用拖拽编辑' : '启用拖拽编辑'"
        >
          {{ enableDrag ? '🎯 拖拽开启' : '🎯 拖拽关闭' }}
        </button>
      </div>
    </div>
    
    <div class="chart-container" ref="chartContainer">
      <v-chart 
        v-if="chartReady"
        ref="chartRef"
        :option="chartOption" 
        :autoresize="true"
        @click="handleChartClick"
        @mousedown="handleMouseDown"
        @touchstart="handleTouchStart"
      />
    </div>
    
    <div class="chart-info">
      <span>数据点: {{ chartStore.dataItems.length }}</span>
      <span>最大值: {{ maxValue }}</span>
      <span>最小值: {{ minValue }}</span>
      <span>平均值: {{ avgValue.toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, ScatterChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { useChartStore } from '../../store/chartStore'
import gsap from 'gsap'
import { createDragFeedback } from '../../utils/chartDrag'

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  ScatterChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
])

const chartStore = useChartStore()
const chartRef = ref(null)
const chartContainer = ref(null)
const chartReady = ref(false)
const isDragging = ref(false)
const dragIndex = ref(-1)
const enableDrag = ref(true)
const showEdgeWarning = ref(true)
let dragFeedback = null

const chartTypes = [
  { value: 'bar', label: '柱形图', icon: '📊' },
  { value: 'scatter', label: '点状图', icon: '⭐' },
  { value: 'line', label: '折线图', icon: '📈' }
]

const maxValue = computed(() => Math.max(...chartStore.values))
const minValue = computed(() => Math.min(...chartStore.values))
const avgValue = computed(() => {
  const sum = chartStore.values.reduce((a, b) => a + b, 0)
  return sum / chartStore.values.length
})

const chartOption = computed(() => {
  const baseOption = {
    title: {
      text: chartStore.title,
      left: 'center',
      textStyle: {
        fontSize: 20,
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: chartStore.chartType === 'bar' ? 'shadow' : 'cross'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      name: chartStore.xAxisName,
      nameLocation: 'middle',
      nameGap: 30,
      data: chartStore.labels,
      axisLabel: {
        fontSize: 14
      }
    },
    yAxis: {
      type: 'value',
      name: chartStore.yAxisName,
      nameLocation: 'middle',
      nameGap: 40,
      axisLabel: {
        fontSize: 14
      }
    },
    animationDuration: 1000 / chartStore.animationSpeed,
    animationEasing: 'elasticOut'
  }

  let series = []

  if (chartStore.chartType === 'bar') {
    series.push({
      name: chartStore.yAxisName,
      type: 'bar',
      data: chartStore.values.map((value, index) => ({
        value,
        itemStyle: {
          color: dragIndex.value === index ? '#F5A623' : '#4A90E2'
        }
      })),
      barWidth: '50%',
      emphasis: {
        itemStyle: {
          color: '#F5A623'
        }
      }
    })
  } else if (chartStore.chartType === 'scatter') {
    series.push({
      name: chartStore.yAxisName,
      type: 'scatter',
      data: chartStore.values.map((value, index) => ({
        value: [index, value],
        itemStyle: {
          color: dragIndex.value === index ? '#F5A623' : '#4A90E2'
        },
        symbolSize: 15
      })),
      emphasis: {
        itemStyle: {
          color: '#F5A623'
        }
      }
    })
  } else if (chartStore.chartType === 'line') {
    series.push({
      name: chartStore.yAxisName,
      type: 'line',
      data: chartStore.values,
      smooth: true,
      lineStyle: {
        width: 3,
        color: '#4A90E2'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(74, 144, 226, 0.3)' },
            { offset: 1, color: 'rgba(74, 144, 226, 0.05)' }
          ]
        }
      },
      itemStyle: {
        color: '#4A90E2'
      },
      emphasis: {
        itemStyle: {
          color: '#F5A623'
        }
      }
    })
  }

  if (chartStore.showTrendLine) {
    const trendData = calculateTrendLine()
    series.push({
      name: '趋势线',
      type: 'line',
      data: trendData,
      lineStyle: {
        type: 'dashed',
        color: '#7ED321',
        width: 2
      },
      symbol: 'none',
      smooth: true
    })
  }

  if (chartStore.showPrediction && chartStore.predictionResult) {
    const predictionData = new Array(chartStore.values.length).fill(null)
    predictionData.push(...chartStore.predictionResult.predictions)
    
    const predictionLabels = [...chartStore.labels]
    for (let i = 0; i < chartStore.predictionResult.predictions.length; i++) {
      predictionLabels.push(`预测${i + 1}`)
    }

    series.push({
      name: '预测值',
      type: 'line',
      data: predictionData,
      lineStyle: {
        type: 'dotted',
        color: '#E74C3C',
        width: 2
      },
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: {
        color: '#E74C3C'
      }
    })
  }

  if (!series || series.length === 0) {
    series = [{
      type: chartStore.chartType || 'bar',
      data: chartStore.values || []
    }]
  }

  return {
    ...baseOption,
    series
  }
})

function calculateTrendLine() {
  const n = chartStore.values.length
  const x = chartStore.values.map((_, i) => i)
  const y = chartStore.values
  
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0)
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  return x.map(xi => slope * xi + intercept)
}

function changeChartType(type) {
  const types = ['bar', 'scatter', 'line']
  const currentIndex = types.indexOf(chartStore.chartType)
  const targetIndex = types.indexOf(type)
  
  if (currentIndex !== targetIndex) {
    animateChartTransition(type)
  }
}

function animateChartTransition(targetType) {
  gsap.to({}, {
    duration: 0.3,
    onStart: () => {
      chartStore.setChartType(targetType)
    }
  })
}

function handleChartClick(params) {
  if (params.componentType === 'series') {
    dragIndex.value = params.dataIndex
    setTimeout(() => {
      dragIndex.value = -1
    }, 500)
  }
}

function handleMouseDown(params) {
  if (!enableDrag.value) {
    console.log('[ChartDisplay Drag] Drag disabled, returning')
    return
  }
  if (params.componentType !== 'series') {
    console.log('[ChartDisplay Drag] Not a series component, returning')
    return
  }
  if (chartStore.chartType !== 'bar') {
    console.log('[ChartDisplay Drag] Only bar chart supports drag, returning')
    return
  }
  
  isDragging.value = true
  dragIndex.value = params.dataIndex
  
  if (!dragFeedback && chartContainer.value) {
    dragFeedback = createDragFeedback(chartContainer.value, {
      formatValue: (val) => val.toFixed(1),
      offset: 15,
      showEdgeWarning: showEdgeWarning.value
    })
  }
  
  const handleMouseMove = (e) => {
    if (isDragging.value && chartContainer.value) {
      const rect = chartContainer.value.getBoundingClientRect()
      const chartInstance = chartRef.value?.chart
      
      if (!chartInstance) {
        console.log('[ChartDisplay Drag] No chartInstance in handleMouseMove')
        return
      }
      
      try {
        const model = chartInstance.getModel()
        const grid = model.getComponent('grid')
        if (!grid) {
          console.log('[ChartDisplay Drag] Grid component not found')
          return
        }
        
        // 获取 grid 的矩形区域 - 尝试多种方式
        let gridRect = null
        
        // 方式1: 通过 coordinateSystem.getArea()
        if (grid.coordinateSystem && typeof grid.coordinateSystem.getArea === 'function') {
          gridRect = grid.coordinateSystem.getArea()
        }
        // 方式2: 通过 coordinateSystem.getRect()
        else if (grid.coordinateSystem && typeof grid.coordinateSystem.getRect === 'function') {
          gridRect = grid.coordinateSystem.getRect()
        }
        // 方式3: 直接从 grid 对象获取
        else if (grid.getRect && typeof grid.getRect === 'function') {
          gridRect = grid.getRect()
        }
        
        if (!gridRect) {
          console.log('[ChartDisplay Drag] Cannot get grid rect')
          return
        }
        
        const yAxis = model.getComponent('yAxis')
        if (!yAxis || !yAxis.axis) {
          console.log('[ChartDisplay Drag] YAxis not ready')
          return
        }
        
        const extent = yAxis.axis.getExtent()
        const maxValue = extent[1]
        const minValue = extent[0]
        
        const relativeY = e.clientY - rect.top - gridRect.y
        const chartHeight = gridRect.height
        
        const ratio = 1 - (relativeY / chartHeight)
        const newValue = Math.round(minValue + ratio * (maxValue - minValue))
        const clampedValue = Math.max(minValue, Math.min(maxValue, newValue))
        
        if (clampedValue >= 0 && dragIndex.value >= 0) {
          chartStore.updateDataItem(dragIndex.value, 'value', Math.max(0, clampedValue))
          
          if (dragFeedback) {
            const point = chartInstance.convertToPixel({ seriesIndex: 0 }, [dragIndex.value, clampedValue])
            if (point) {
              dragFeedback.update(clampedValue, point[0], point[1], minValue, maxValue)
            }
          }
        }
      } catch (error) {
        console.warn('handleMouseMove error:', error)
      }
    }
  }
  
  const handleMouseUp = () => {
    isDragging.value = false
    dragIndex.value = -1
    if (dragFeedback) {
      dragFeedback.hide()
    }
    chartStore.saveSettings()
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleTouchStart(params) {
  
  if (!enableDrag.value) {
    console.log('[ChartDisplay Drag Touch] Drag disabled, returning')
    return
  }
  if (params.componentType !== 'series') {
    console.log('[ChartDisplay Drag Touch] Not a series component, returning')
    return
  }
  if (chartStore.chartType !== 'bar') {
    console.log('[ChartDisplay Drag Touch] Only bar chart supports drag, returning')
    return
  }
  isDragging.value = true
  dragIndex.value = params.dataIndex
  
  if (!dragFeedback && chartContainer.value) {
    dragFeedback = createDragFeedback(chartContainer.value, {
      formatValue: (val) => val.toFixed(1),
      offset: 15,
      showEdgeWarning: showEdgeWarning.value
    })
  }
  
  const touchId = params.event.event.touches[0].identifier
  
  const handleTouchMove = (e) => {
    if (!isDragging.value || dragIndex.value < 0 || !chartContainer.value) return
    
    const touch = Array.from(e.touches).find(t => t.identifier === touchId)
    if (!touch) return
    
    e.preventDefault()
    
    const rect = chartContainer.value.getBoundingClientRect()
    const chartInstance = chartRef.value?.chart
    
    if (!chartInstance) {
      console.log('[ChartDisplay Drag Touch] No chartInstance in handleTouchMove')
      return
    }
    
    try {
      const model = chartInstance.getModel()
      const grid = model.getComponent('grid')
      if (!grid) {
        console.log('[ChartDisplay Drag Touch] Grid component not found')
        return
      }
      
      // 获取 grid 的矩形区域 - 尝试多种方式
      let gridRect = null
      
      // 方式1: 通过 coordinateSystem.getArea()
      if (grid.coordinateSystem && typeof grid.coordinateSystem.getArea === 'function') {
        gridRect = grid.coordinateSystem.getArea()
      }
      // 方式2: 通过 coordinateSystem.getRect()
      else if (grid.coordinateSystem && typeof grid.coordinateSystem.getRect === 'function') {
        gridRect = grid.coordinateSystem.getRect()
      }
      // 方式3: 直接从 grid 对象获取
      else if (grid.getRect && typeof grid.getRect === 'function') {
        gridRect = grid.getRect()
      }
      
      if (!gridRect) {
        console.log('[ChartDisplay Drag Touch] Cannot get grid rect')
        return
      }
      
      const yAxis = model.getComponent('yAxis')
      if (!yAxis || !yAxis.axis) {
        console.log('[ChartDisplay Drag Touch] YAxis not ready')
        return
      }
      
      const extent = yAxis.axis.getExtent()
      const maxValue = extent[1]
      const minValue = extent[0]
      
      const relativeY = touch.clientY - rect.top - gridRect.y
      const chartHeight = gridRect.height
      
      const ratio = 1 - (relativeY / chartHeight)
      const newValue = Math.round(minValue + ratio * (maxValue - minValue))
      const clampedValue = Math.max(minValue, Math.min(maxValue, newValue))
      
      
      if (clampedValue >= 0 && dragIndex.value >= 0) {
        chartStore.updateDataItem(dragIndex.value, 'value', Math.max(0, clampedValue))
        
        if (dragFeedback) {
          const point = chartInstance.convertToPixel({ seriesIndex: 0 }, [dragIndex.value, clampedValue])
          if (point) {
            dragFeedback.update(clampedValue, point[0], point[1], minValue, maxValue)
          }
        }
      }
    } catch (error) {
      console.warn('handleTouchMove error:', error)
    }
  }
  
  const handleTouchEnd = () => {
    isDragging.value = false
    dragIndex.value = -1
    if (dragFeedback) {
      dragFeedback.hide()
    }
    chartStore.saveSettings()
    chartContainer.value.removeEventListener('touchmove', handleTouchMove)
    chartContainer.value.removeEventListener('touchend', handleTouchEnd)
    chartContainer.value.removeEventListener('touchcancel', handleTouchEnd)
  }
  
  if (chartContainer.value) {
    chartContainer.value.addEventListener('touchmove', handleTouchMove, { passive: false })
    chartContainer.value.addEventListener('touchend', handleTouchEnd)
    chartContainer.value.addEventListener('touchcancel', handleTouchEnd)
  }
}

onMounted(() => {
  chartReady.value = true
  if (chartContainer.value) {
    dragFeedback = createDragFeedback(chartContainer.value, {
      formatValue: (val) => val.toFixed(1),
      offset: 15,
      showEdgeWarning: showEdgeWarning.value
    })
  }
})

onBeforeUnmount(() => {
  chartReady.value = false
  if (dragFeedback) {
    dragFeedback.hide()
    dragFeedback = null
  }
})

watch(showEdgeWarning, (newValue) => {
  if (chartContainer.value) {
    if (dragFeedback) {
      dragFeedback.hide()
    }
    dragFeedback = createDragFeedback(chartContainer.value, {
      formatValue: (val) => val.toFixed(1),
      offset: 15,
      showEdgeWarning: newValue
    })
  }
})


</script>

<style scoped>
.chart-display {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E1E4E8;
}

.chart-type-buttons {
  display: flex;
  gap: 8px;
}

.type-btn {
  padding: 8px 16px;
  background: #F8F9FA;
  border: 2px solid #E1E4E8;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.type-btn:hover {
  border-color: #4A90E2;
}

.type-btn.active {
  background: #4A90E2;
  color: white;
  border-color: #4A90E2;
}

.action-btn {
  padding: 8px 16px;
  background: #F8F9FA;
  border: 2px solid #E1E4E8;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.action-btn.active {
  background: #7ED321;
  color: white;
  border-color: #7ED321;
}

.chart-container {
  flex: 1;
  min-height: 400px;
}

.chart-info {
  display: flex;
  justify-content: space-around;
  padding: 12px;
  background: #F8F9FA;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 14px;
  color: #666;
}

.chart-info span {
  padding: 4px 12px;
  background: white;
  border-radius: 4px;
}
</style>
