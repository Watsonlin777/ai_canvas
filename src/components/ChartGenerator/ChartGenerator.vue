<template>
  <div 
    class="chart-generator" 
    :class="{ 
      'is-dragging': isDragging, 
      'is-resizing': isResizing,
      'is-maximized': isMaximized,
      'draggable-panel': true
    }"
    ref="panelRef"
    :style="panelStyle"
  >
    <div class="resize-handles" v-if="!isMaximized">
      <div 
        v-for="handle in resizeHandles" 
        :key="handle.direction"
        :class="['resize-handle', handle.class]"
        :style="{ cursor: handle.cursor }"
        @mousedown="(e) => startResize(e, handle.direction)"
      ></div>
    </div>
    
    <div class="chart-header" ref="headerRef" @mousedown="startDrag">
      <div class="header-left">
        <span class="drag-indicator" title="拖拽移动">⋮⋮</span>
        <h3 class="chart-title">📊 数据可视化</h3>
        <button class="btn-toggle" @click.stop="showSettings = !showSettings" :title="showSettings ? '收起设置' : '展开设置'">
          <span :class="['toggle-icon', { rotated: showSettings }]">▼</span>
        </button>
      </div>
      <div class="header-actions">
        <button class="btn-maximize" @click.stop="toggleMaximize" :title="isMaximized ? '退出全屏' : '全屏显示'">
          {{ isMaximized ? '⤓' : '⤢' }}
        </button>
      </div>
      <div class="chart-controls">
        <button 
          :class="['chart-type-btn', { active: chartType === 'bar' }]"
          @click.stop="chartType = 'bar'"
          title="柱状图"
        >
          📊
        </button>
        <button 
          :class="['chart-type-btn', { active: chartType === 'line' }]"
          @click.stop="chartType = 'line'"
          title="折线图"
        >
          📈
        </button>
        <button 
          :class="['chart-type-btn', { active: chartType === 'pie' }]"
          @click.stop="chartType = 'pie'"
          title="饼图"
        >
          🥧
        </button>
        <button 
          class="chart-type-btn btn-refresh"
          :class="{ refreshing: isRefreshing }"
          @click.stop="refreshChart"
          title="刷新图表"
        >
          🔄
        </button>
      </div>
    </div>
    
    <div class="settings-panel" :class="{ collapsed: !showSettings }">
      <div class="settings-grid">
        <div class="setting-item">
          <label class="setting-label">显示图例</label>
          <button :class="['toggle-switch', { on: showLegend }]" @click="showLegend = !showLegend">
            <span class="toggle-knob"></span>
          </button>
        </div>
        <div class="setting-item">
          <label class="setting-label">显示工具栏</label>
          <button :class="['toggle-switch', { on: showToolbox }]" @click="showToolbox = !showToolbox">
            <span class="toggle-knob"></span>
          </button>
        </div>
        <div class="setting-item">
          <label class="setting-label">平滑曲线</label>
          <button :class="['toggle-switch', { on: smoothLine }]" @click="smoothLine = !smoothLine">
            <span class="toggle-knob"></span>
          </button>
        </div>
        <div class="setting-item">
          <label class="setting-label">显示数据标签</label>
          <button :class="['toggle-switch', { on: showLabel }]" @click="showLabel = !showLabel">
            <span class="toggle-knob"></span>
          </button>
        </div>
        <div class="setting-item">
          <label class="setting-label">显示面积填充</label>
          <button :class="['toggle-switch', { on: showArea }]" @click="showArea = !showArea">
            <span class="toggle-knob"></span>
          </button>
        </div>
        <div class="setting-item">
          <label class="setting-label">显示网格线</label>
          <button :class="['toggle-switch', { on: showGrid }]" @click="showGrid = !showGrid">
            <span class="toggle-knob"></span>
          </button>
        </div>
        <div class="setting-item">
          <label class="setting-label">启用拖拽编辑</label>
          <button :class="['toggle-switch', { on: enableDrag }]" @click="enableDrag = !enableDrag">
            <span class="toggle-knob"></span>
          </button>
        </div>
        <div class="setting-item" v-if="enableDrag">
          <label class="setting-label">边缘警告提示</label>
          <button :class="['toggle-switch', { on: showEdgeWarning }]" @click="showEdgeWarning = !showEdgeWarning">
            <span class="toggle-knob"></span>
          </button>
        </div>
      </div>
      
      <div class="drag-hint" v-if="enableDrag">
        <div class="hint-icon">💡</div>
        <div class="hint-text">
          <div class="hint-title">拖拽编辑提示</div>
          <div class="hint-desc">点击并拖动图表数据点可实时修改数值，支持鼠标和触控操作</div>
        </div>
      </div>
    </div>
    
    <div class="chart-container" ref="chartContainer">
      <v-chart 
        v-if="chartReady"
        ref="chartRef"
        :option="chartOption" 
        :autoresize="true"
        theme="light"
        @click="handleChartClick"
        @mousedown="handleMouseDown"
        @touchstart="handleTouchStart"
      />
    </div>
    
    <div class="chart-info" v-if="showChartInfo">
      <div class="info-item">
        <span class="info-label">图表类型</span>
        <span class="info-value">{{ chartTypeNames[chartType] }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">数据系列</span>
        <span class="info-value">{{ seriesCount }}</span>
      </div>
      <div class="info-item" v-if="dataStats.total">
        <span class="info-label">数据总量</span>
        <span class="info-value">{{ dataStats.total }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { useChartDrag, createDragFeedback, animateValueChange } from '../../utils/chartDrag'
import { useDraggablePanel, createResizeHandles } from '../../utils/useDraggablePanel'

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent
])

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  scene: {
    type: Object,
    required: true
  },
  viewMode: {
    type: String,
    default: 'table'
  }
})

const emit = defineEmits(['dataChange', 'dragEnd'])

const {
  panelRef,
  headerRef,
  isDragging,
  isResizing,
  isMaximized,
  position,
  size,
  panelStyle,
  startDrag,
  startResize,
  toggleMaximize
} = useDraggablePanel({
  minWidth: 400,
  minHeight: 300,
  initialWidth: null,
  initialHeight: null
})

const resizeHandles = createResizeHandles()

const chartRef = ref(null)
const chartContainer = ref(null)
const chartType = ref('bar')

const showSettings = ref(false)
const showLegend = ref(true)
const showToolbox = ref(true)
const smoothLine = ref(true)
const showLabel = ref(false)
const showArea = ref(true)
const showGrid = ref(true)
const showChartInfo = ref(true)
const isRefreshing = ref(false)
const enableDrag = ref(true)
const showEdgeWarning = ref(true)
const chartReady = ref(false)

const dragIndex = ref(-1)
const dragValue = ref(null)
let dragFeedback = null

const getSceneUnit = () => props.scene?.content?.unit || '数值'
const getSceneTitle = () => props.scene?.content?.title || '数据分布'
const getSceneColor = () => props.scene?.color || '#4A90E2'

const chartTypeNames = {
  bar: '柱状图',
  line: '折线图',
  pie: '饼图'
}

const seriesCount = computed(() => {
  if (props.data?.type === 'table') {
    return props.data.data?.length || 0
  }
  return props.data?.data?.length || 0
})

const dataStats = computed(() => {
  const values = getAllValues()
  if (values.length === 0) return {}
  
  const total = values.reduce((a, b) => a + b, 0)
  return { total }
})

const chartOption = computed(() => {
  const baseOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E1E4E8',
      borderWidth: 1,
      textStyle: {
        color: '#333',
        fontSize: 13
      },
      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 8px;'
    },
    toolbox: showToolbox.value ? {
      feature: {
        saveAsImage: {
          title: '保存图片',
          pixelRatio: 2
        },
        dataView: {
          title: '数据视图',
          readOnly: true
        }
      },
      right: 20,
      top: 20
    } : undefined,
    legend: showLegend.value ? {
      top: 10,
      textStyle: {
        fontSize: 12,
        color: '#666'
      }
    } : undefined
  }

  let series = []
  let xAxis = null
  let yAxis = null
  let pieData = []

  const isFlat = props.viewMode === 'flat'

  if (isFlat) {
    const flatItems = convertDataToFlat()
    
    if (!flatItems || flatItems.length === 0) {
      xAxis = { type: 'category', data: [] }
      yAxis = { type: 'value', data: [] }
      series = []
    } else {
        const labels = flatItems.map(item => item.label || '')
        const values = flatItems.map(item => Number(item.value) || 0)

        xAxis = {
          type: 'category',
          data: labels,
          axisLabel: {
            fontSize: 11,
            color: '#666',
            rotate: labels.length > 8 ? 30 : 0
          },
          axisLine: {
            lineStyle: {
              color: '#E1E4E8'
            }
          }
        }

        yAxis = {
          type: 'value',
          name: getSceneUnit(),
          axisLabel: {
            fontSize: 12,
            color: '#666'
          },
          axisLine: {
            lineStyle: {
              color: '#E1E4E8'
            }
          },
          splitLine: showGrid.value ? {
            lineStyle: {
              color: '#F0F0F0',
              type: 'dashed'
            }
          } : { show: false }
        }

      if (chartType.value === 'bar' || chartType.value === 'line') {
        series = [{
          name: getSceneUnit(),
          type: chartType.value,
          data: values,
          smooth: chartType.value === 'line' ? smoothLine.value : undefined,
          label: showLabel.value ? {
            show: true,
            position: 'top',
            fontSize: 11,
            color: '#333'
          } : undefined,
          itemStyle: {
            color: getSceneColor()
          },
          lineStyle: {
            width: 3
          },
          areaStyle: chartType.value === 'line' && showArea.value ? {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: getSceneColor() + '4D' },
                { offset: 1, color: getSceneColor() + '0D' }
              ]
            }
          } : null
        }]
      } else if (chartType.value === 'pie') {
        pieData = flatItems.map(item => ({
          name: item.label,
          value: Number(item.value) || 0
        }))
      }
    }
  } else if (props.data?.type === 'table') {
    const rows = props.data.data || []
    
    if (!Array.isArray(rows) || rows.length === 0) {
      xAxis = { type: 'category', data: [] }
      yAxis = { type: 'value', data: [] }
      series = []
    } else {
        const colHeaders = props.data.headers?.columns || rows[0]?.map((_, i) => `列${i + 1}`) || []
        const rowHeaders = props.data.headers?.rows || rows.map((_, i) => `行${i + 1}`) || []
        
        xAxis = {
          type: 'category',
          data: colHeaders,
          axisLabel: {
            fontSize: 12,
            color: '#666'
          },
          axisLine: {
            lineStyle: {
              color: '#E1E4E8'
            }
          }
        }

        yAxis = {
          type: 'value',
          name: getSceneUnit(),
          axisLabel: {
            fontSize: 12,
            color: '#666'
          },
          axisLine: {
            lineStyle: {
              color: '#E1E4E8'
            }
          },
          splitLine: showGrid.value ? {
            lineStyle: {
              color: '#F0F0F0',
              type: 'dashed'
            }
          } : { show: false }
        }

      if (chartType.value === 'bar' || chartType.value === 'line') {
        series = rows.map((row, index) => ({
          name: rowHeaders[index] || `行${index + 1}`,
          type: chartType.value,
          data: row,
          smooth: chartType.value === 'line' ? smoothLine.value : undefined,
          label: showLabel.value ? {
            show: true,
            position: 'top',
            fontSize: 11,
            color: '#333'
          } : undefined,
          itemStyle: {
            color: getColor(index)
          },
          lineStyle: {
            width: 3
          },
          areaStyle: chartType.value === 'line' && showArea.value ? {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: getColor(index, 0.3) },
                { offset: 1, color: getColor(index, 0.05) }
              ]
            }
          } : null
        }))
      } else if (chartType.value === 'pie') {
        const totalPerRow = rows.map((row, index) => ({
          name: rowHeaders[index] || `行${index + 1}`,
          value: row.reduce((a, b) => a + (Number(b) || 0), 0)
        }))
        pieData = totalPerRow
      }
    }
  } else if (props.data?.type === 'categories') {
    const categories = props.data.data || []
    const labels = categories.map(item => item.name)
    const values = categories.map(item => item.amount)

    xAxis = {
      type: 'category',
      data: labels,
      axisLabel: {
        fontSize: 12,
        color: '#666',
        rotate: labels.some(l => l.length > 4) ? 30 : 0
      },
      axisLine: {
        lineStyle: {
          color: '#E1E4E8'
        }
      }
    }

    yAxis = {
      type: 'value',
      name: getSceneUnit(),
      axisLabel: {
        fontSize: 12,
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#E1E4E8'
        }
      },
      splitLine: showGrid.value ? {
        lineStyle: {
          color: '#F0F0F0',
          type: 'dashed'
        }
      } : { show: false }
    }

    if (chartType.value === 'bar' || chartType.value === 'line') {
      series = [{
        name: getSceneUnit(),
        type: chartType.value,
        data: values,
        smooth: chartType.value === 'line' ? smoothLine.value : undefined,
        label: showLabel.value ? { show: true, position: 'top', fontSize: 11, color: '#333' } : undefined,
        itemStyle: {
          color: getSceneColor()
        },
        lineStyle: {
          width: 3
        },
        areaStyle: chartType.value === 'line' && showArea.value ? {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: getSceneColor() + '4D' },
              { offset: 1, color: getSceneColor() + '0D' }
            ]
          }
        } : null
      }]
    } else if (chartType.value === 'pie') {
      pieData = categories.map(item => ({
        name: item.name,
        value: item.amount
      }))
    }
  } else if (props.data?.type === 'ranges') {
    const ranges = props.data.data || []
    const labels = ranges.map(item => item.range)
    const values = ranges.map(item => item.count)

    xAxis = {
      type: 'category',
      data: labels,
      axisLabel: {
        fontSize: 12,
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#E1E4E8'
        }
      }
    }

    yAxis = {
      type: 'value',
      name: '人数',
      axisLabel: {
        fontSize: 12,
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#E1E4E8'
        }
      },
      splitLine: showGrid.value ? {
        lineStyle: {
          color: '#F0F0F0',
          type: 'dashed'
        }
      } : { show: false }
    }

    if (chartType.value === 'bar' || chartType.value === 'line') {
      series = [{
        name: '人数',
        type: chartType.value,
        data: values,
        smooth: chartType.value === 'line' ? smoothLine.value : undefined,
        label: showLabel.value ? { show: true, position: 'top', fontSize: 11, color: '#333' } : undefined,
        itemStyle: {
          color: getSceneColor()
        },
        lineStyle: {
          width: 3
        }
      }]
    } else if (chartType.value === 'pie') {
      pieData = ranges.map(item => ({
        name: item.range,
        value: item.count
      }))
    }
  } else if (props.data?.type === 'daily') {
    const daily = props.data.data || []
    const valueKey = Object.keys(daily[0] || {}).find(k => k !== 'day')
    const labels = daily.map(item => item.day)
    const values = daily.map(item => item[valueKey])

    xAxis = {
      type: 'category',
      data: labels,
      axisLabel: {
        fontSize: 12,
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#E1E4E8'
        }
      }
    }

    yAxis = {
      type: 'value',
      name: getSceneUnit(),
      axisLabel: {
        fontSize: 12,
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#E1E4E8'
        }
      },
      splitLine: showGrid.value ? {
        lineStyle: {
          color: '#F0F0F0',
          type: 'dashed'
        }
      } : { show: false }
    }

    if (chartType.value === 'bar' || chartType.value === 'line') {
      series = [{
        name: getSceneUnit(),
        type: chartType.value,
        data: values,
        smooth: chartType.value === 'line' ? smoothLine.value : undefined,
        label: showLabel.value ? { show: true, position: 'top', fontSize: 11, color: '#333' } : undefined,
        itemStyle: {
          color: getSceneColor()
        },
        lineStyle: {
          width: 3
        },
        areaStyle: chartType.value === 'line' && showArea.value ? {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: getSceneColor() + '4D' },
              { offset: 1, color: getSceneColor() + '0D' }
            ]
          }
        } : null
      }]
    } else if (chartType.value === 'pie') {
      pieData = daily.map(item => ({
        name: item.day,
        value: item[valueKey]
      }))
    }
  }

  if (chartType.value === 'pie') {
    if (!pieData || pieData.length === 0) {
      pieData = [{ name: '暂无数据', value: 1 }]
    }
    return {
      ...baseOption,
      tooltip: {
        ...baseOption.tooltip,
        formatter: '{a} <br/>{b} : {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: {
          fontSize: 12,
          color: '#666'
        }
      },
      series: [{
        name: props.scene?.content?.title || '数据分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: pieData,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          fontSize: 12,
          color: '#333'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      }]
    }
  }

  if (!series || series.length === 0) {
    series = [{
      type: chartType.value || 'bar',
      data: []
    }]
  }

  if (!xAxis) {
    xAxis = { type: 'category', data: [] }
  }
  if (!yAxis) {
    yAxis = { type: 'value' }
  }

  return {
    ...baseOption,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis,
    yAxis,
    series
  }
})

function convertDataToFlat() {
  const items = []
  const data = props.data?.data

  if (!data) return items

  if (props.viewMode === 'flat') {
    return data.map(item => ({
      label: item.label,
      value: Number(item.value) || 0
    }))
  }

  if (props.data?.type === 'table') {
    const rowHeaders = props.data.headers?.rows || data.map((_, i) => `行${i + 1}`)
    const colHeaders = props.data.headers?.columns || (data[0]?.map((_, i) => `列${i + 1}`) || [])
    data.forEach((row, rowIndex) => {
      row.forEach((val, colIndex) => {
        const rowLabel = rowHeaders[rowIndex] || `行${rowIndex + 1}`
        const colLabel = colHeaders[colIndex] || `列${colIndex + 1}`
        items.push({
          label: `${rowLabel}-${colLabel}`,
          value: Number(val) || 0
        })
      })
    })
  } else if (props.data?.type === 'categories') {
    data.forEach(item => {
      items.push({ label: item.name, value: Number(item.amount) || 0 })
    })
  } else if (props.data?.type === 'ranges') {
    data.forEach(item => {
      items.push({ label: item.range, value: Number(item.count) || 0 })
    })
  } else if (props.data?.type === 'daily') {
    const valueKey = Object.keys(data[0] || {}).find(k => k !== 'day')
    data.forEach(item => {
      items.push({ label: item.day, value: Number(item[valueKey]) || 0 })
    })
  }

  return items
}

function getAllValues() {
  const values = []
  const data = props.data?.data
  
  if (!data) return values

  if (props.viewMode === 'flat') {
    const flatItems = convertDataToFlat()
    flatItems.forEach(item => {
      if (item.value !== null && item.value !== undefined && !isNaN(item.value)) {
        values.push(Number(item.value))
      }
    })
    return values
  }
  
  if (props.data?.type === 'table') {
    data.forEach(row => {
      if (Array.isArray(row)) {
        row.forEach(val => {
          if (val !== null && val !== undefined && !isNaN(val)) values.push(Number(val))
        })
      }
    })
  } else if (props.data?.type === 'categories') {
    data.forEach(item => {
      if (item.amount !== null && item.amount !== undefined && !isNaN(item.amount)) {
        values.push(Number(item.amount))
      }
    })
  } else if (props.data?.type === 'ranges') {
    data.forEach(item => {
      if (item.count !== null && item.count !== undefined && !isNaN(item.count)) {
        values.push(Number(item.count))
      }
    })
  } else if (props.data?.type === 'daily') {
    const valueKey = Object.keys(data[0] || {}).find(k => k !== 'day')
    data.forEach(item => {
      const val = item[valueKey]
      if (val !== null && val !== undefined && !isNaN(val)) values.push(Number(val))
    })
  }
  
  return values
}

function getColor(index, alpha = 1) {
  const colors = [
    `rgba(74, 144, 226, ${alpha})`,
    `rgba(245, 166, 35, ${alpha})`,
    `rgba(231, 76, 60, ${alpha})`,
    `rgba(126, 211, 33, ${alpha})`,
    `rgba(156, 39, 176, ${alpha})`,
    `rgba(0, 188, 212, ${alpha})`,
    `rgba(255, 87, 34, ${alpha})`,
    `rgba(255, 152, 0, ${alpha})`
  ]
  return colors[index % colors.length]
}

function refreshChart() {
  if (isRefreshing.value) return
  isRefreshing.value = true
  setTimeout(() => {
    isRefreshing.value = false
  }, 600)
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
    console.log('[Drag] Drag disabled, returning')
    return
  }
  if (params.componentType !== 'series') {
    console.log('[Drag] Not a series component, returning')
    return
  }
  if (chartType.value === 'pie') {
    console.log('[Drag] Pie chart does not support drag, returning')
    return
  }
  
  const seriesType = params.seriesType
  if (seriesType !== 'bar' && seriesType !== 'line' && seriesType !== 'scatter') {
    console.log('[Drag] Series type not supported:', seriesType)
    return
  }
  
  dragIndex.value = params.dataIndex
  dragValue.value = params.value
  
  if (!dragFeedback && chartContainer.value) {
    const headerEl = chartContainer.value.querySelector('.chart-header')
    dragFeedback = createDragFeedback(chartContainer.value, {
      formatValue: (val) => val.toFixed(1),
      offset: 15,
      showEdgeWarning: showEdgeWarning.value,
      fixedContainer: headerEl || null,
      fixedPosition: 'right'
    })
  }
  
  const handleMouseMove = (e) => {
    if (dragIndex.value < 0 || !chartContainer.value) return
    
    const rect = chartContainer.value.getBoundingClientRect()
    const chartInstance = chartRef.value?.chart
    
    if (!chartInstance) {
      console.log('[Drag] No chartInstance in handleMouseMove')
      return
    }
    
    try {
      const model = chartInstance.getModel()
      const grid = model.getComponent('grid')
      if (!grid) {
        console.log('[Drag] Grid component not found')
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
        console.log('[Drag] Cannot get grid rect, grid:', grid)
        return
      }
      const yAxis = model.getComponent('yAxis')
      if (!yAxis || !yAxis.axis) {
        console.log('[Drag] YAxis not ready in handleMouseMove')
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
      
      updateDataValue(dragIndex.value, clampedValue)
      
      if (dragFeedback) {
        const point = chartInstance.convertToPixel({ seriesIndex: 0 }, [dragIndex.value, clampedValue])
        if (point) {
          dragFeedback.update(clampedValue, point[0], point[1], minValue, maxValue)
        }
      }
    } catch (error) {
      console.warn('handleMouseMove error:', error)
    }
  }
  
  const handleMouseUp = () => {
    const previousDragIndex = dragIndex.value
    dragIndex.value = -1
    dragValue.value = null
    
    if (dragFeedback) {
      dragFeedback.hide()
    }
    
    if (previousDragIndex >= 0) {
      emit('dragEnd', { changedIndex: previousDragIndex })
      
      const updatedData = getCurrentTableData()
      emit('dataChange', updatedData)
    }
    
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleTouchStart(params) {
  console.log('[Drag Touch] handleTouchStart triggered', {
    enableDrag: enableDrag.value,
    componentType: params.componentType,
    seriesType: params.seriesType,
    dataIndex: params.dataIndex,
    value: params.value,
    chartType: chartType.value
  })
  
  if (!enableDrag.value) {
    console.log('[Drag Touch] Drag disabled, returning')
    return
  }
  if (params.componentType !== 'series') {
    console.log('[Drag Touch] Not a series component, returning')
    return
  }
  if (chartType.value === 'pie') {
    console.log('[Drag Touch] Pie chart does not support drag, returning')
    return
  }
  
  const seriesType = params.seriesType
  if (seriesType !== 'bar' && seriesType !== 'line' && seriesType !== 'scatter') {
    console.log('[Drag Touch] Series type not supported:', seriesType)
    return
  }
  
  dragIndex.value = params.dataIndex
  dragValue.value = params.value
  
  if (!dragFeedback && chartContainer.value) {
    const headerEl = chartContainer.value.querySelector('.chart-header')
    dragFeedback = createDragFeedback(chartContainer.value, {
      formatValue: (val) => val.toFixed(1),
      offset: 15,
      showEdgeWarning: showEdgeWarning.value,
      fixedContainer: headerEl || null,
      fixedPosition: 'right'
    })
  }
  
  const touchId = params.event.event.touches[0].identifier
  
  const handleTouchMove = (e) => {
    if (dragIndex.value < 0 || !chartContainer.value) return
    
    const touch = Array.from(e.touches).find(t => t.identifier === touchId)
    if (!touch) return
    
    e.preventDefault()
    
    const rect = chartContainer.value.getBoundingClientRect()
    const chartInstance = chartRef.value?.chart
    
    if (!chartInstance) return
    
    try {
      const model = chartInstance.getModel()
      const grid = model.getComponent('grid')
      if (!grid) {
        console.log('[Drag Touch] Grid component not found')
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
        console.log('[Drag Touch] Cannot get grid rect')
        return
      }
      
      const yAxis = model.getComponent('yAxis')
      if (!yAxis || !yAxis.axis) {
        console.log('[Drag Touch] YAxis not ready')
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
      
      updateDataValue(dragIndex.value, clampedValue)
      
      if (dragFeedback) {
        const point = chartInstance.convertToPixel({ seriesIndex: 0 }, [dragIndex.value, clampedValue])
        if (point) {
          dragFeedback.update(clampedValue, point[0], point[1], minValue, maxValue)
        }
      }
    } catch (error) {
      console.warn('handleTouchMove error:', error)
    }
  }
  
  const handleTouchEnd = (e) => {
    dragIndex.value = -1
    dragValue.value = null
    if (dragFeedback) {
      dragFeedback.hide()
    }
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

function updateDataValue(index, value) {
  const data = props.data?.data
  if (!data) {
    console.log('[Drag] No data found')
    return
  }
  
  if (props.viewMode === 'flat') {
    if (data[index]) {
      data[index].value = value
    }
  } else if (props.data?.type === 'table') {
    const colIndex = index % (data[0]?.length || 1)
    const rowIndex = Math.floor(index / (data[0]?.length || 1))
    if (data[rowIndex] && data[rowIndex][colIndex] !== undefined) {
      data[rowIndex][colIndex] = value
    }
  } else if (props.data?.type === 'categories') {
    if (data[index]) {
      data[index].amount = value
    }
  } else if (props.data?.type === 'ranges') {
    if (data[index]) {
      data[index].count = value
    }
  } else if (props.data?.type === 'daily') {
    const valueKey = Object.keys(data[0] || {}).find(k => k !== 'day')
    if (data[index] && valueKey) {
      data[index][valueKey] = value
    }
  }
  
  emit('dataChange', props.data)
}

function getCurrentTableData() {
  if (props.data?.type === 'table') {
    const data = props.data?.data || []
    return {
      type: 'table',
      data: data,
      headers: {
        columns: props.data?.headers?.columns || (data[0]?.map((_, i) => `列${i + 1}`) || []),
        rows: props.data?.headers?.rows || data.map((_, i) => `行${i + 1}`)
      }
    }
  } else if (props.data?.type === 'categories') {
    return {
      type: 'categories',
      data: props.data?.data || [],
      headers: {}
    }
  } else if (props.data?.type === 'ranges') {
    return {
      type: 'ranges',
      data: props.data?.data || [],
      headers: {}
    }
  } else if (props.data?.type === 'daily') {
    return {
      type: 'daily',
      data: props.data?.data || [],
      headers: {}
    }
  }
  
  return props.data
}

onMounted(() => {
  chartReady.value = true
  if (chartContainer.value) {
    const headerEl = chartContainer.value.querySelector('.chart-header')
    dragFeedback = createDragFeedback(chartContainer.value, {
      formatValue: (val) => val.toFixed(1),
      offset: 15,
      showEdgeWarning: showEdgeWarning.value,
      fixedContainer: headerEl || null,
      fixedPosition: 'right'
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
      showEdgeWarning: newValue,
      fixedContainer: chartContainer.value.querySelector('.chart-header') || null,
      fixedPosition: 'right'
    })
  }
})
</script>

<style scoped>
.chart-generator {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.chart-generator.draggable-panel {
  position: relative;
  transition: box-shadow 0.3s ease;
}

.chart-generator.is-dragging {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  cursor: grabbing;
  user-select: none;
}

.chart-generator.is-resizing {
  user-select: none;
}

.chart-generator.is-maximized {
  border-radius: 0;
  z-index: 9999;
}

.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  pointer-events: auto;
  background: transparent;
}

.resize-handle-n {
  top: 0;
  left: 10px;
  right: 10px;
  height: 6px;
}

.resize-handle-s {
  bottom: 0;
  left: 10px;
  right: 10px;
  height: 6px;
}

.resize-handle-e {
  right: 0;
  top: 10px;
  bottom: 10px;
  width: 6px;
}

.resize-handle-w {
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 6px;
}

.resize-handle-ne {
  top: 0;
  right: 0;
  width: 10px;
  height: 10px;
}

.resize-handle-nw {
  top: 0;
  left: 0;
  width: 10px;
  height: 10px;
}

.resize-handle-se {
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
}

.resize-handle-sw {
  bottom: 0;
  left: 0;
  width: 10px;
  height: 10px;
}

.resize-handle:hover {
  background: rgba(74, 144, 226, 0.2);
}

.drag-indicator {
  cursor: grab;
  color: #999;
  font-size: 14px;
  padding: 4px;
  user-select: none;
}

.drag-indicator:hover {
  color: #4A90E2;
}

.header-actions {
  display: flex;
  align-items: center;
  margin-right: 12px;
}

.btn-maximize {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  color: white;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-maximize:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #E1E4E8;
  cursor: grab;
}

.chart-header:active {
  cursor: grabbing;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-toggle {
  width: 28px;
  height: 28px;
  background: #F8F9FA;
  border: 1px solid #E1E4E8;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.3s ease;
}

.btn-toggle:hover {
  background: #E1E4E8;
}

.toggle-icon {
  font-size: 12px;
  color: #666;
  transition: transform 0.3s ease;
  display: inline-block;
}

.toggle-icon.rotated {
  transform: rotate(0deg);
}

.settings-panel {
  overflow: hidden;
  max-height: 400px;
  transition: max-height 0.4s ease, opacity 0.3s ease, margin 0.3s ease, padding 0.3s ease;
  opacity: 1;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #F8F9FA 0%, #EDE7F6 100%);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #E1E4E8;
}

.settings-panel.collapsed {
  max-height: 0;
  opacity: 0;
  margin-bottom: 0;
  padding: 0 16px;
  border-color: transparent;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
}

.setting-label {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.toggle-switch {
  width: 40px;
  height: 22px;
  background: #D1D5DB;
  border: none;
  border-radius: 11px;
  cursor: pointer;
  position: relative;
  transition: background 0.3s ease;
  padding: 0;
}

.toggle-switch.on {
  background: #4A90E2;
}

.toggle-knob {
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-switch.on .toggle-knob {
  transform: translateX(18px);
}

.chart-title {
  font-size: 18px;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.chart-controls {
  display: flex;
  gap: 8px;
}

.chart-type-btn {
  width: 40px;
  height: 40px;
  background: #F8F9FA;
  border: 2px solid #E1E4E8;
  border-radius: 8px;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.3s ease;
}

.chart-type-btn:hover {
  border-color: #4A90E2;
  transform: translateY(-2px);
}

.chart-type-btn.active {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  border-color: #4A90E2;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.btn-refresh {
  transition: all 0.3s ease;
}

.btn-refresh:hover {
  border-color: #4CAF50;
  transform: translateY(-2px);
}

.btn-refresh.refreshing {
  animation: spin 0.6s ease;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.chart-container {
  height: 400px;
  width: 100%;
}

.chart-info {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: linear-gradient(135deg, #F8F9FA 0%, #E8F4F8 100%);
  border-radius: 8px;
  margin-top: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #666;
}

.info-value {
  font-size: 16px;
  color: #4A90E2;
  font-weight: 600;
}

.drag-hint {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
  border-radius: 8px;
  margin-top: 12px;
  border: 1px solid #90CAF9;
}

.hint-icon {
  font-size: 24px;
  line-height: 1;
}

.hint-text {
  flex: 1;
}

.hint-title {
  font-size: 14px;
  font-weight: 600;
  color: #1976D2;
  margin-bottom: 4px;
}

.hint-desc {
  font-size: 12px;
  color: #1565C0;
  line-height: 1.5;
}
</style>
