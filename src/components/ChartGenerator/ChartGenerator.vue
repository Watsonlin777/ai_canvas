<template>
  <div class="chart-generator">
    <div class="chart-header">
      <h3 class="chart-title">📊 数据可视化</h3>
      <div class="chart-controls">
        <button 
          :class="['chart-type-btn', { active: chartType === 'bar' }]"
          @click="chartType = 'bar'"
          title="柱状图"
        >
          📊
        </button>
        <button 
          :class="['chart-type-btn', { active: chartType === 'line' }]"
          @click="chartType = 'line'"
          title="折线图"
        >
          📈
        </button>
        <button 
          :class="['chart-type-btn', { active: chartType === 'pie' }]"
          @click="chartType = 'pie'"
          title="饼图"
        >
          🥧
        </button>
      </div>
    </div>
    
    <div class="chart-container" ref="chartContainer">
      <v-chart 
        ref="chartRef"
        :option="chartOption" 
        :autoresize="true"
        theme="light"
      />
    </div>
    
    <div class="chart-info">
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
import { ref, computed, watch } from 'vue'
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
  }
})

const chartRef = ref(null)
const chartContainer = ref(null)
const chartType = ref('bar')

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
    toolbox: {
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
    }
  }

  let series = []
  let xAxis = null
  let yAxis = null
  let pieData = []

  if (props.data?.type === 'table') {
    const rows = props.data.data || []
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
      name: props.scene.content.unit || '数值',
      axisLabel: {
        fontSize: 12,
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#E1E4E8'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#F0F0F0',
          type: 'dashed'
        }
      }
    }

    if (chartType.value === 'bar' || chartType.value === 'line') {
      series = rows.map((row, index) => ({
        name: rowHeaders[index] || `行${index + 1}`,
        type: chartType.value,
        data: row,
        smooth: chartType.value === 'line',
        itemStyle: {
          color: getColor(index)
        },
        lineStyle: {
          width: 3
        },
        areaStyle: chartType.value === 'line' ? {
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
      name: props.scene.content.unit || '数量',
      axisLabel: {
        fontSize: 12,
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#E1E4E8'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#F0F0F0',
          type: 'dashed'
        }
      }
    }

    if (chartType.value === 'bar' || chartType.value === 'line') {
      series = [{
        name: props.scene.content.unit || '数量',
        type: chartType.value,
        data: values,
        smooth: chartType.value === 'line',
        itemStyle: {
          color: props.scene.color || '#4A90E2'
        },
        lineStyle: {
          width: 3
        },
        areaStyle: chartType.value === 'line' ? {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: (props.scene.color || '#4A90E2') + '4D' },
              { offset: 1, color: (props.scene.color || '#4A90E2') + '0D' }
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
      splitLine: {
        lineStyle: {
          color: '#F0F0F0',
          type: 'dashed'
        }
      }
    }

    if (chartType.value === 'bar' || chartType.value === 'line') {
      series = [{
        name: '人数',
        type: chartType.value,
        data: values,
        smooth: chartType.value === 'line',
        itemStyle: {
          color: props.scene.color || '#9C27B0'
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
      name: props.scene.content.unit || '数值',
      axisLabel: {
        fontSize: 12,
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#E1E4E8'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#F0F0F0',
          type: 'dashed'
        }
      }
    }

    if (chartType.value === 'bar' || chartType.value === 'line') {
      series = [{
        name: props.scene.content.unit || '数值',
        type: chartType.value,
        data: values,
        smooth: chartType.value === 'line',
        itemStyle: {
          color: props.scene.color || '#00BCD4'
        },
        lineStyle: {
          width: 3
        },
        areaStyle: chartType.value === 'line' ? {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: (props.scene.color || '#00BCD4') + '4D' },
              { offset: 1, color: (props.scene.color || '#00BCD4') + '0D' }
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
        name: props.scene.content.title || '数据分布',
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

function getAllValues() {
  const values = []
  const data = props.data?.data
  
  if (!data) return values
  
  if (props.data?.type === 'table') {
    data.forEach(row => {
      row.forEach(val => {
        if (val !== null && val !== undefined && !isNaN(val)) values.push(Number(val))
      })
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

watch(() => props.data, () => {
  if (chartRef.value) {
    chartRef.value.setOption(chartOption.value, { notMerge: true })
  }
}, { deep: true })

watch(chartType, () => {
  if (chartRef.value) {
    chartRef.value.setOption(chartOption.value, { notMerge: true })
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

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #E1E4E8;
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
</style>
