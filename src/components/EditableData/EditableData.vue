<template>
  <div class="editable-data-manager">
    <div class="data-manager-header">
      <div class="header-left">
        <h3 class="section-title">📝 数据编辑</h3>
        <button class="btn-toggle" @click="showSettings = !showSettings" :title="showSettings ? '收起设置' : '展开设置'">
          <span :class="['toggle-icon', { rotated: showSettings }]">▼</span>
        </button>
      </div>
      <div class="data-actions">
        <button class="btn btn-sm btn-primary" @click="addColumn" v-if="dataType === 'table'">
          ➕ 添加列
        </button>
        <button class="btn btn-sm btn-primary" @click="addRow">
          ➕ 添加行
        </button>
        <button class="btn btn-sm btn-secondary" @click="resetData">
          🔄 重置
        </button>
      </div>
    </div>
    
    <div class="settings-panel" :class="{ collapsed: !showSettings }">
      <div class="settings-grid">
        <div class="setting-item">
          <label class="setting-label">显示行标题</label>
          <button :class="['toggle-switch', { on: showRowHeaders }]" @click="showRowHeaders = !showRowHeaders">
            <span class="toggle-knob"></span>
          </button>
        </div>
        <div class="setting-item">
          <label class="setting-label">显示列标题</label>
          <button :class="['toggle-switch', { on: showColHeaders }]" @click="showColHeaders = !showColHeaders">
            <span class="toggle-knob"></span>
          </button>
        </div>
        <div class="setting-item">
          <label class="setting-label">显示数据统计</label>
          <button :class="['toggle-switch', { on: showStats }]" @click="showStats = !showStats">
            <span class="toggle-knob"></span>
          </button>
        </div>
        <div class="setting-item">
          <label class="setting-label">显示数据说明</label>
          <button :class="['toggle-switch', { on: showDescription }]" @click="showDescription = !showDescription">
            <span class="toggle-knob"></span>
          </button>
        </div>
        <div class="setting-item">
          <label class="setting-label">允许删除行</label>
          <button :class="['toggle-switch', { on: allowDelete }]" @click="allowDelete = !allowDelete">
            <span class="toggle-knob"></span>
          </button>
        </div>
        <div class="setting-item">
          <label class="setting-label">允许删除列</label>
          <button :class="['toggle-switch', { on: allowDeleteCol }]" @click="allowDeleteCol = !allowDeleteCol">
            <span class="toggle-knob"></span>
          </button>
        </div>
        <div class="setting-item" v-if="dataType === 'table'">
          <label class="setting-label">视图切换按钮</label>
          <button :class="['toggle-switch', { on: showViewSwitch }]" @click="showViewSwitch = !showViewSwitch">
            <span class="toggle-knob"></span>
          </button>
        </div>
      </div>
    </div>
    
    <div class="data-description" v-if="scene.content && showDescription">
      <div class="description-item">
        <span class="description-icon">📋</span>
        <span class="description-text">{{ getDataDescription() }}</span>
      </div>
    </div>
    
    <div class="data-editor">
      <div v-if="dataType === 'table'" class="table-editor">
        <div class="view-mode-switch" v-if="showViewSwitch">
          <button 
            :class="['mode-btn', { active: viewMode === 'table' }]" 
            @click="switchViewMode('table')"
          >
            📋 表格视图
          </button>
          <button 
            :class="['mode-btn', { active: viewMode === 'flat' }]" 
            @click="switchViewMode('flat')"
          >
            📑 平铺视图
          </button>
        </div>

        <template v-if="viewMode === 'table'">
          <div class="column-headers" v-if="showColHeaders">
            <div class="header-row">
              <div class="corner-cell" v-if="showRowHeaders">
                <span class="corner-label">行\\列</span>
              </div>
              <div 
                v-for="(header, index) in tableHeaders" 
                :key="index" 
                class="header-cell"
              >
                <input 
                  type="text" 
                  class="header-input"
                  v-model="tableHeaders[index]"
                  @input="handleDataChange"
                  :placeholder="`列${index + 1}`"
                />
                <button 
                  class="btn-delete-col" 
                  @click="deleteColumn(index)"
                  v-if="allowDeleteCol && tableHeaders.length > 1"
                  title="删除此列"
                >✕</button>
              </div>
              <div class="add-column-cell">
                <button class="btn-add-column" @click="addColumn" title="添加新列">
                  +
                </button>
              </div>
            </div>
          </div>
          
          <div class="table-with-actions">
            <div class="table-wrapper">
              <table class="editable-table">
                <tbody>
                  <tr v-for="(row, rowIndex) in editableData.rows" :key="rowIndex">
                    <td class="row-header-cell" v-if="showRowHeaders">
                      <input 
                        type="text" 
                        class="row-header-input"
                        v-model="rowHeaders[rowIndex]"
                        @input="handleDataChange"
                        :placeholder="`行${rowIndex + 1}`"
                      />
                    </td>
                    <td v-for="(cell, colIndex) in row" :key="colIndex" class="data-cell">
                      <input 
                        type="number" 
                        class="cell-input"
                        v-model.number="editableData.rows[rowIndex][colIndex]"
                        @input="handleDataChange"
                        :placeholder="getPlaceholder(rowIndex, colIndex)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="table-actions-row" v-if="allowDelete">
              <div class="action-cell" v-for="(row, rowIndex) in editableData.rows" :key="'del-'+rowIndex">
                <button class="btn-delete" @click="deleteRow(rowIndex)" title="删除此行">✕</button>
              </div>
            </div>
          </div>
          
          <div class="add-row-section">
            <button class="btn-add-row" @click="addRow">
              <span class="add-icon">+</span>
              <span class="add-text">添加新行</span>
            </button>
          </div>
        </template>

        <template v-else-if="viewMode === 'flat'">
          <div class="flat-editor">
            <div class="flat-header-row">
              <div class="flat-header-label">序号</div>
              <div class="flat-header-label">标签</div>
              <div class="flat-header-label">数值</div>
              <div class="flat-header-label" v-if="allowDelete">操作</div>
            </div>
            <div 
              v-for="(item, index) in flatData" 
              :key="index" 
              class="flat-row"
              :class="{ 'flat-row-alt': index % 2 === 0 }"
            >
              <div class="flat-cell flat-index">{{ index + 1 }}</div>
              <div class="flat-cell flat-label-cell">
                <input 
                  type="text" 
                  class="input-field flat-input"
                  v-model="flatData[index].label"
                  @input="handleFlatDataChange"
                  placeholder="输入标签"
                />
              </div>
              <div class="flat-cell flat-value-cell">
                <input 
                  type="number" 
                  class="input-field flat-input"
                  v-model.number="flatData[index].value"
                  @input="handleFlatDataChange"
                  placeholder="输入数值"
                />
              </div>
              <div class="flat-cell flat-action-cell" v-if="allowDelete">
                <button class="btn-delete-round" @click="deleteFlatItem(index)" title="删除此项">✕</button>
              </div>
            </div>
            <button class="btn-add-item" @click="addFlatItem">
              <span class="add-icon">+</span>
              <span class="add-text">添加新数据项</span>
            </button>
          </div>
        </template>
      </div>
      
      <div v-else-if="dataType === 'categories'" class="categories-editor">
        <div class="editor-header">
          <div class="header-info">
            <span class="info-icon">📊</span>
            <span class="info-text">分类数据编辑 - 每行表示一个类别及其对应数值</span>
          </div>
        </div>
        <div v-for="(item, index) in editableData.categories" :key="index" class="category-row">
          <div class="row-number">{{ index + 1 }}</div>
          <div class="category-input-group">
            <label class="input-label">类别名称</label>
            <input 
              type="text" 
              class="input-field"
              v-model="editableData.categories[index].name"
              @input="handleDataChange"
              placeholder="输入类别名称"
            />
          </div>
          <div class="category-input-group">
            <label class="input-label">数值 ({{ scene.content.unit || '单位' }})</label>
            <input 
              type="number" 
              class="input-field"
              v-model.number="editableData.categories[index].amount"
              @input="handleDataChange"
              placeholder="输入数值"
            />
          </div>
          <button class="btn-delete-round" @click="deleteCategory(index)" title="删除此项">✕</button>
        </div>
        <button class="btn-add-item" @click="addCategory">
          <span class="add-icon">+</span>
          <span class="add-text">添加新类别</span>
        </button>
      </div>
      
      <div v-else-if="dataType === 'ranges'" class="ranges-editor">
        <div class="editor-header">
          <div class="header-info">
            <span class="info-icon">📈</span>
            <span class="info-text">范围数据编辑 - 每行表示一个数值范围及对应人数</span>
          </div>
        </div>
        <div v-for="(item, index) in editableData.ranges" :key="index" class="range-row">
          <div class="row-number">{{ index + 1 }}</div>
          <div class="range-input-group">
            <label class="input-label">分数范围</label>
            <input 
              type="text" 
              class="input-field"
              v-model="editableData.ranges[index].range"
              @input="handleDataChange"
              placeholder="如: 90-100分"
            />
          </div>
          <div class="range-input-group">
            <label class="input-label">人数</label>
            <input 
              type="number" 
              class="input-field"
              v-model.number="editableData.ranges[index].count"
              @input="handleDataChange"
              placeholder="输入人数"
              min="0"
            />
          </div>
          <button class="btn-delete-round" @click="deleteRange(index)" title="删除此项">✕</button>
        </div>
        <button class="btn-add-item" @click="addRange">
          <span class="add-icon">+</span>
          <span class="add-text">添加新范围</span>
        </button>
      </div>
      
      <div v-else-if="dataType === 'daily'" class="daily-editor">
        <div class="editor-header">
          <div class="header-info">
            <span class="info-icon">📅</span>
            <span class="info-text">时间序列数据编辑 - 每行表示一个时间点及对应数值</span>
          </div>
        </div>
        <div v-for="(item, index) in editableData.data" :key="index" class="daily-row">
          <div class="row-number">{{ index + 1 }}</div>
          <div class="daily-input-group">
            <label class="input-label">时间/标签</label>
            <input 
              type="text" 
              class="input-field"
              v-model="editableData.data[index].day"
              @input="handleDataChange"
              placeholder="如: 周一"
            />
          </div>
          <div class="daily-input-group">
            <label class="input-label">数值 ({{ scene.content.unit || '单位' }})</label>
            <input 
              type="number" 
              class="input-field"
              v-model.number="editableData.data[index][valueKey]"
              @input="handleDataChange"
              placeholder="输入数值"
            />
          </div>
          <button class="btn-delete-round" @click="deleteDaily(index)" title="删除此项">✕</button>
        </div>
        <button class="btn-add-item" @click="addDaily">
          <span class="add-icon">+</span>
          <span class="add-text">添加新时间点</span>
        </button>
      </div>
    </div>
    
    <div class="data-stats" v-if="showStats">
      <div class="stat-item">
        <span class="stat-label">📊 数据量</span>
        <span class="stat-value">{{ dataCount }}</span>
      </div>
      <div class="stat-item" v-if="dataStats.sum !== undefined">
        <span class="stat-label">➕ 总和</span>
        <span class="stat-value">{{ dataStats.sum }}</span>
      </div>
      <div class="stat-item" v-if="dataStats.average !== undefined">
        <span class="stat-label">📈 平均值</span>
        <span class="stat-value">{{ dataStats.average.toFixed(1) }}</span>
      </div>
      <div class="stat-item" v-if="dataStats.max !== undefined">
        <span class="stat-label">🔺 最大值</span>
        <span class="stat-value">{{ dataStats.max }}</span>
      </div>
      <div class="stat-item" v-if="dataStats.min !== undefined">
        <span class="stat-label">🔻 最小值</span>
        <span class="stat-value">{{ dataStats.min }}</span>
      </div>
    </div>
    
    <div class="ai-prediction-section">
      <div class="prediction-header" @click="showPredictionPanel = !showPredictionPanel">
        <h3 class="prediction-title">🤖 AI 智能预测</h3>
        <button class="btn-toggle-prediction">
          <span :class="['toggle-icon', { rotated: showPredictionPanel }]">▼</span>
        </button>
      </div>
      
      <div class="prediction-panel" :class="{ collapsed: !showPredictionPanel }">
        <div class="prediction-config">
          <div class="config-row">
            <div class="config-item">
              <label class="config-label">预测算法</label>
              <select class="config-select" v-model="predictionAlgorithm">
                <option value="auto">🤖 自动选择</option>
                <option value="linear">📈 线性回归</option>
                <option value="polynomial">📊 多项式拟合</option>
              </select>
            </div>
            <div class="config-item">
              <label class="config-label">预测数量</label>
              <input 
                type="number" 
                class="config-input" 
                v-model.number="predictionCount"
                min="1"
                max="10"
              />
            </div>
          </div>
          
          <div class="scene-info" v-if="getSceneType() !== 'default'">
            <span class="scene-icon">🎯</span>
            <span class="scene-text">场景识别: {{ getSceneBasedPredictionConfig(getSceneType()).description }}</span>
          </div>
          
          <button 
            class="btn btn-primary prediction-btn"
            @click="runAIPredictionForData"
            :disabled="isPredicting || dataCount < 2"
          >
            <span v-if="isPredicting" class="loading-spinner"></span>
            {{ isPredicting ? 'AI 分析中...' : '🔮 开始预测' }}
          </button>
          
          <p class="prediction-hint" v-if="dataCount < 2">
            ⚠️ 需要至少2个数据点才能进行预测
          </p>
        </div>
        
        <div v-if="predictionResult" class="prediction-result">
          <div class="result-header">
            <h4 class="result-title">📋 预测结果</h4>
            <div class="result-badges">
              <span :class="['trend-badge', predictionResult.trend]">
                {{ getTrendIcon(predictionResult.trend) }} {{ getTrendText(predictionResult.trend) }}
              </span>
              <span class="confidence-badge">
                置信度: {{ predictionResult.confidence }}%
              </span>
            </div>
          </div>
          
          <div class="prediction-metrics">
            <div class="metric-item">
              <span class="metric-label">R² 拟合度</span>
              <span class="metric-value">{{ (predictionResult.r2Score * 100).toFixed(1) }}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">算法类型</span>
              <span class="metric-value">{{ predictionResult.algorithm === 'linear' ? '线性回归' : '多项式拟合' }}</span>
            </div>
          </div>
          
          <div class="prediction-values">
            <div 
              v-for="(value, index) in predictionResult.predictions" 
              :key="index"
              class="prediction-item"
            >
              <span class="prediction-label">预测 {{ index + 1 }}</span>
              <span class="prediction-value">{{ value }}</span>
              <span class="prediction-unit">{{ predictionResult.unit }}</span>
            </div>
          </div>
          
          <div class="prediction-actions">
            <button class="btn btn-success apply-btn" @click="applyPredictionToData">
              ✅ 应用预测数据
            </button>
            <button class="btn btn-secondary clear-btn" @click="clearPrediction">
              🗑️ 清除预测
            </button>
          </div>
        </div>
        
        <div v-else class="prediction-placeholder">
          <div class="placeholder-icon">🔮</div>
          <p>点击"开始预测"按钮</p>
          <p>AI 将根据现有数据分析趋势并预测未来数值</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { runAIPrediction, getSceneBasedPredictionConfig } from '../../utils/helpers'

const props = defineProps({
  scene: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['dataChange', 'viewModeChange'])

const dataType = ref('table')
const valueKey = ref('value')
const tableHeaders = ref([])
const rowHeaders = ref([])

const showSettings = ref(false)
const showRowHeaders = ref(true)
const showColHeaders = ref(true)
const showStats = ref(true)
const showDescription = ref(true)
const allowDelete = ref(true)
const allowDeleteCol = ref(true)
const showViewSwitch = ref(true)
const viewMode = ref('table')
const flatData = ref([])

const showPredictionPanel = ref(false)
const predictionCount = ref(3)
const predictionAlgorithm = ref('linear')
const isPredicting = ref(false)
const predictionResult = ref(null)

const editableData = ref({
  rows: [],
  categories: [],
  ranges: [],
  data: []
})

const dataCount = computed(() => {
  if (dataType.value === 'table') {
    return editableData.value.rows.reduce((sum, row) => sum + row.filter(v => v !== null && v !== undefined).length, 0)
  } else if (dataType.value === 'categories') {
    return editableData.value.categories.length
  } else if (dataType.value === 'ranges') {
    return editableData.value.ranges.length
  } else if (dataType.value === 'daily') {
    return editableData.value.data.length
  }
  return 0
})

const dataStats = computed(() => {
  const values = getAllValues()
  if (values.length === 0) return {}
  
  const sum = values.reduce((a, b) => a + b, 0)
  const average = sum / values.length
  const max = Math.max(...values)
  const min = Math.min(...values)
  
  return { sum, average, max, min }
})

function getDataDescription() {
  const descriptions = {
    table: '表格数据编辑 - 每个单元格可输入数值，支持添加/删除行列',
    categories: '分类数据编辑 - 输入类别名称和对应数值',
    ranges: '范围数据编辑 - 输入数值范围和对应人数',
    daily: '时间序列数据编辑 - 输入时间标签和对应数值'
  }
  return descriptions[dataType.value] || '数据编辑'
}

function getPlaceholder(row, col) {
  const rowLabel = rowHeaders.value[row] || `行${row + 1}`
  const colLabel = tableHeaders.value[col] || `列${col + 1}`
  return `${rowLabel}-${colLabel}`
}

function getAllValues() {
  const values = []
  
  if (dataType.value === 'table') {
    editableData.value.rows.forEach(row => {
      row.forEach(val => {
        if (val !== null && val !== undefined && !isNaN(val)) values.push(Number(val))
      })
    })
  } else if (dataType.value === 'categories') {
    editableData.value.categories.forEach(item => {
      if (item.amount !== null && item.amount !== undefined && !isNaN(item.amount)) {
        values.push(Number(item.amount))
      }
    })
  } else if (dataType.value === 'ranges') {
    editableData.value.ranges.forEach(item => {
      if (item.count !== null && item.count !== undefined && !isNaN(item.count)) {
        values.push(Number(item.count))
      }
    })
  } else if (dataType.value === 'daily') {
    editableData.value.data.forEach(item => {
      const val = item[valueKey.value]
      if (val !== null && val !== undefined && !isNaN(val)) values.push(Number(val))
    })
  }
  
  return values
}

function loadData() {
  const content = props.scene.content
  
  if (content.data && Array.isArray(content.data[0])) {
    dataType.value = 'table'
    editableData.value.rows = content.data.map(row => [...row])
    tableHeaders.value = content.data[0].map((_, i) => `列${i + 1}`)
    rowHeaders.value = content.data.map((_, i) => `行${i + 1}`)
  } else if (content.categories) {
    dataType.value = 'categories'
    editableData.value.categories = content.categories.map(item => ({ ...item }))
  } else if (content.ranges) {
    dataType.value = 'ranges'
    editableData.value.ranges = content.ranges.map(item => ({ ...item }))
  } else if (content.data && Array.isArray(content.data) && content.data[0]?.day) {
    dataType.value = 'daily'
    editableData.value.data = content.data.map(item => ({ ...item }))
    valueKey.value = Object.keys(content.data[0]).find(k => k !== 'day')
  } else if (content.tables) {
    dataType.value = 'table'
    const firstTable = content.tables[0]?.data || []
    editableData.value.rows = firstTable.map(row => [...row])
    tableHeaders.value = firstTable[0]?.map((_, i) => `列${i + 1}`) || []
    rowHeaders.value = firstTable.map((_, i) => `行${i + 1}`) || []
  }
}

function handleDataChange() {
  emitDataUpdate()
}

function emitDataUpdate() {
  const updatedData = {
    type: dataType.value,
    data: null,
    headers: {
      columns: [...tableHeaders.value],
      rows: [...rowHeaders.value]
    }
  }
  
  if (viewMode.value === 'flat') {
    updatedData.data = flatData.value.map(item => ({ ...item }))
  } else if (dataType.value === 'table') {
    updatedData.data = editableData.value.rows.map(row => [...row])
  } else if (dataType.value === 'categories') {
    updatedData.data = editableData.value.categories.map(item => ({ ...item }))
  } else if (dataType.value === 'ranges') {
    updatedData.data = editableData.value.ranges.map(item => ({ ...item }))
  } else if (dataType.value === 'daily') {
    updatedData.data = editableData.value.data.map(item => ({ ...item }))
  }
  
  emit('dataChange', updatedData)
}

function addColumn() {
  if (dataType.value === 'table') {
    const colIndex = tableHeaders.value.length
    tableHeaders.value.push(`列${colIndex + 1}`)
    editableData.value.rows.forEach(row => {
      row.push(0)
    })
    handleDataChange()
  }
}

function deleteColumn(index) {
  if (tableHeaders.value.length > 1) {
    tableHeaders.value.splice(index, 1)
    editableData.value.rows.forEach(row => {
      row.splice(index, 1)
    })
    handleDataChange()
  }
}

function addRow() {
  if (dataType.value === 'table') {
    const rowIndex = editableData.value.rows.length
    const newRow = new Array(tableHeaders.value.length).fill(0)
    editableData.value.rows.push(newRow)
    rowHeaders.value.push(`行${rowIndex + 1}`)
  } else if (dataType.value === 'categories') {
    editableData.value.categories.push({ name: '新类别', amount: 0 })
  } else if (dataType.value === 'ranges') {
    editableData.value.ranges.push({ range: '新范围', count: 0 })
  } else if (dataType.value === 'daily') {
    const newItem = { day: '新时间', [valueKey.value]: 0 }
    editableData.value.data.push(newItem)
  }
  handleDataChange()
}

function addCategory() {
  editableData.value.categories.push({ name: '新类别', amount: 0 })
  handleDataChange()
}

function addRange() {
  editableData.value.ranges.push({ range: '新范围', count: 0 })
  handleDataChange()
}

function addDaily() {
  const newItem = { day: '新时间', [valueKey.value]: 0 }
  editableData.value.data.push(newItem)
  handleDataChange()
}

function deleteRow(index) {
  if (editableData.value.rows.length > 1) {
    editableData.value.rows.splice(index, 1)
    rowHeaders.value.splice(index, 1)
    handleDataChange()
  }
}

function deleteCategory(index) {
  if (editableData.value.categories.length > 1) {
    editableData.value.categories.splice(index, 1)
    handleDataChange()
  }
}

function deleteRange(index) {
  if (editableData.value.ranges.length > 1) {
    editableData.value.ranges.splice(index, 1)
    handleDataChange()
  }
}

function deleteDaily(index) {
  if (editableData.value.data.length > 1) {
    editableData.value.data.splice(index, 1)
    handleDataChange()
  }
}

function switchViewMode(mode) {
  if (mode === 'flat') {
    convertToFlat()
  } else if (viewMode.value === 'flat') {
    convertFromFlat()
  }
  viewMode.value = mode
  emit('viewModeChange', mode)
  handleDataChange()
}

function convertToFlat() {
  const items = []
  if (dataType.value === 'table') {
    editableData.value.rows.forEach((row, rowIndex) => {
      row.forEach((val, colIndex) => {
        const rowLabel = rowHeaders.value[rowIndex] || `行${rowIndex + 1}`
        const colLabel = tableHeaders.value[colIndex] || `列${colIndex + 1}`
        items.push({
          label: `${rowLabel}-${colLabel}`,
          value: val || 0
        })
      })
    })
  } else if (dataType.value === 'categories') {
    editableData.value.categories.forEach(item => {
      items.push({ label: item.name, value: item.amount })
    })
  } else if (dataType.value === 'ranges') {
    editableData.value.ranges.forEach(item => {
      items.push({ label: item.range, value: item.count })
    })
  } else if (dataType.value === 'daily') {
    editableData.value.data.forEach(item => {
      const val = item[valueKey.value]
      items.push({ label: item.day, value: val })
    })
  }
  flatData.value = items
}

function convertFromFlat() {
  if (dataType.value === 'table') {
    const maxCols = tableHeaders.value.length || 3
    
    if (maxCols === 0 || flatData.value.length === 0) {
      return
    }
    
    const numRows = Math.ceil(flatData.value.length / maxCols)
    const newRows = []
    const newRowHeaders = []
    
    for (let r = 0; r < numRows; r++) {
      const row = []
      let rowLabel = `行${r + 1}`
      
      for (let c = 0; c < maxCols; c++) {
        const flatIndex = r * maxCols + c
        if (flatData.value[flatIndex]) {
          const labelParts = flatData.value[flatIndex].label.split('-')
          if (labelParts.length === 2) {
            rowLabel = labelParts[0]
          }
          row.push(flatData.value[flatIndex].value)
        } else {
          row.push(0)
        }
      }
      newRows.push(row)
      newRowHeaders.push(rowLabel)
    }
    
    editableData.value.rows = newRows
    rowHeaders.value = newRowHeaders
  } else if (dataType.value === 'categories') {
    editableData.value.categories = flatData.value.map(item => ({
      name: item.label,
      amount: item.value
    }))
  } else if (dataType.value === 'ranges') {
    editableData.value.ranges = flatData.value.map(item => ({
      range: item.label,
      count: item.value
    }))
  } else if (dataType.value === 'daily') {
    editableData.value.data = flatData.value.map(item => ({
      day: item.label,
      [valueKey.value]: item.value
    }))
  }
}

function handleFlatDataChange() {
  convertFromFlat()
  handleDataChange()
}

function addFlatItem() {
  flatData.value.push({ label: '新数据', value: 0 })
  handleFlatDataChange()
}

function deleteFlatItem(index) {
  if (flatData.value.length > 1) {
    flatData.value.splice(index, 1)
    handleFlatDataChange()
  }
}

function resetData() {
  if (confirm('确定要重置为原始数据吗？所有修改将丢失。')) {
    loadData()
    handleDataChange()
  }
}

function getSceneType() {
  const title = props.scene.content?.title || ''
  const titleLower = title.toLowerCase()
  
  if (titleLower.includes('销售') || titleLower.includes('营收') || titleLower.includes('sales')) {
    return 'sales'
  } else if (titleLower.includes('温度') || titleLower.includes('气温') || titleLower.includes('temperature')) {
    return 'temperature'
  } else if (titleLower.includes('人口') || titleLower.includes('population')) {
    return 'population'
  } else if (titleLower.includes('股票') || titleLower.includes('股价') || titleLower.includes('stock')) {
    return 'stock'
  } else if (titleLower.includes('流量') || titleLower.includes('访问') || titleLower.includes('traffic')) {
    return 'traffic'
  }
  return 'default'
}

function runAIPredictionForData() {
  isPredicting.value = true
  
  setTimeout(() => {
    const values = getAllValues()
    const sceneType = getSceneType()
    const config = getSceneBasedPredictionConfig(sceneType)
    
    if (predictionAlgorithm.value === 'auto') {
      predictionAlgorithm.value = config.algorithm
    }
    
    const result = runAIPrediction(values, predictionCount.value, predictionAlgorithm.value)
    
    predictionResult.value = {
      ...result,
      sceneDescription: config.description,
      unit: config.unit
    }
    
    isPredicting.value = false
  }, 800)
}

function applyPredictionToData() {
  if (!predictionResult.value || predictionResult.value.predictions.length === 0) return
  
  const predictions = predictionResult.value.predictions
  
  if (dataType.value === 'table') {
    predictions.forEach((value, index) => {
      const rowIndex = editableData.value.rows.length
      const newRow = new Array(tableHeaders.value.length).fill(0)
      newRow[newRow.length - 1] = value
      editableData.value.rows.push(newRow)
      rowHeaders.value.push(`预测${index + 1}`)
    })
  } else if (dataType.value === 'categories') {
    predictions.forEach((value, index) => {
      editableData.value.categories.push({
        name: `预测${index + 1}`,
        amount: value
      })
    })
  } else if (dataType.value === 'ranges') {
    predictions.forEach((value, index) => {
      editableData.value.ranges.push({
        range: `预测${index + 1}`,
        count: Math.round(value)
      })
    })
  } else if (dataType.value === 'daily') {
    predictions.forEach((value, index) => {
      editableData.value.data.push({
        day: `预测${index + 1}`,
        [valueKey.value]: value
      })
    })
  }
  
  handleDataChange()
}

function clearPrediction() {
  predictionResult.value = null
}

function getTrendIcon(trend) {
  const icons = {
    up: '📈',
    down: '📉',
    stable: '➡️'
  }
  return icons[trend] || '➡️'
}

function getTrendText(trend) {
  const texts = {
    up: '上升趋势',
    down: '下降趋势',
    stable: '平稳趋势'
  }
  return texts[trend] || '平稳趋势'
}

watch(() => props.scene, () => {
  loadData()
}, { immediate: true, deep: true })

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.editable-data-manager {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.data-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid #E1E4E8;
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
  max-height: 200px;
  transition: max-height 0.4s ease, opacity 0.3s ease, margin 0.3s ease, padding 0.3s ease;
  opacity: 1;
  margin-bottom: 16px;
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

.view-mode-switch {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: #F0F0F0;
  border-radius: 8px;
  padding: 4px;
}

.mode-btn {
  flex: 1;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  font-weight: 500;
  transition: all 0.3s ease;
}

.mode-btn:hover {
  color: #333;
  background: rgba(74, 144, 226, 0.1);
}

.mode-btn.active {
  background: white;
  color: #4A90E2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-weight: 600;
}

.flat-editor {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.flat-header-row {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0;
}

.flat-header-label {
  flex: 1;
  padding: 10px 12px;
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  color: white;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}

.flat-header-label:first-child {
  width: 48px;
  flex: none;
  border-radius: 6px 0 0 0;
}

.flat-header-label:last-child {
  width: 44px;
  flex: none;
  border-radius: 0 6px 0 0;
}

.flat-row {
  display: flex;
  align-items: center;
  gap: 2px;
  transition: background 0.2s ease;
}

.flat-row:hover {
  background: #E3F2FD;
}

.flat-row-alt {
  background: #F8F9FA;
}

.flat-row-alt:hover {
  background: #E3F2FD;
}

.flat-cell {
  padding: 0;
}

.flat-index {
  width: 48px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #999;
  font-weight: 600;
  flex-shrink: 0;
}

.flat-label-cell {
  flex: 1;
}

.flat-value-cell {
  flex: 1;
}

.flat-input {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 0;
  font-size: 14px;
  padding: 0 12px;
}

.flat-input:focus {
  outline: none;
  background: #E3F2FD;
  box-shadow: inset 0 0 0 2px #4A90E2;
}

.flat-action-cell {
  width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-title {
  font-size: 18px;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.data-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 6px;
}

.data-description {
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.description-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.description-icon {
  font-size: 18px;
}

.description-text {
  font-size: 14px;
  color: #1565C0;
  font-weight: 500;
}

.data-editor {
  margin-bottom: 20px;
}

.column-headers {
  margin-bottom: 8px;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 2px;
}

.corner-cell {
  width: 80px;
  height: 40px;
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  border-radius: 6px 0 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.corner-label {
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.header-cell {
  flex: 1;
  min-width: 80px;
  height: 40px;
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
}

.header-cell:last-of-type {
  border-radius: 0 6px 6px 0;
}

.header-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  padding: 6px 8px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.header-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.header-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.3);
}

.btn-delete-col {
  width: 20px;
  height: 20px;
  background: rgba(231, 76, 60, 0.8);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 10px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.btn-delete-col:hover {
  background: #E74C3C;
  transform: scale(1.1);
}

.add-column-cell {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-add-column {
  width: 32px;
  height: 32px;
  background: #4A90E2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-add-column:hover {
  background: #357ABD;
  transform: scale(1.1);
}

.table-with-actions {
  display: flex;
  border: 1px solid #E1E4E8;
  border-radius: 8px;
  overflow: hidden;
}

.table-wrapper {
  flex: 1;
  overflow-x: auto;
  border: none;
  border-radius: 0;
}

.editable-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.editable-table tbody tr {
  transition: background 0.2s ease;
}

.editable-table tbody tr:hover {
  background: #F0F7FF;
}

.row-header-cell {
  width: 80px;
  padding: 4px;
  background: #F8F9FA;
  border: 1px solid #E1E4E8;
  border-left: none;
}

.row-header-input {
  width: 100%;
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  background: transparent;
  color: #333;
}

.row-header-input:focus {
  outline: none;
  border-color: #4A90E2;
  background: white;
}

.data-cell {
  padding: 4px;
  border: 1px solid #E1E4E8;
  min-width: 80px;
}

.cell-input {
  width: 100%;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
  transition: all 0.2s ease;
}

.cell-input:focus {
  outline: none;
  border-color: #4A90E2;
  background: white;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.cell-input::placeholder {
  color: #999;
  font-size: 12px;
}

.table-actions-row {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 44px;
  border-left: 1px solid #E1E4E8;
  overflow: hidden;
}

.action-cell {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8F9FA;
  border-bottom: 1px solid #E1E4E8;
}

.action-cell:last-child {
  border-bottom: none;
}

.btn-delete {
  width: 28px;
  height: 28px;
  background: #E74C3C;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.btn-delete:hover {
  background: #C0392B;
  transform: scale(1.1);
}

.add-row-section {
  margin-top: 12px;
}

.btn-add-row, .btn-add-item {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #F8F9FA 0%, #E8F4F8 100%);
  border: 2px dashed #4A90E2;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-add-row:hover, .btn-add-item:hover {
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
  border-color: #357ABD;
}

.add-icon {
  font-size: 20px;
  color: #4A90E2;
  font-weight: bold;
}

.add-text {
  font-size: 14px;
  color: #4A90E2;
  font-weight: 500;
}

.editor-header {
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-icon {
  font-size: 18px;
}

.info-text {
  font-size: 14px;
  color: #2E7D32;
  font-weight: 500;
}

.categories-editor,
.ranges-editor,
.daily-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-row,
.range-row,
.daily-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #F8F9FA;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.category-row:hover,
.range-row:hover,
.daily-row:hover {
  background: #E8F4F8;
  transform: translateX(4px);
}

.row-number {
  width: 32px;
  height: 32px;
  background: #4A90E2;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.category-input-group,
.range-input-group,
.daily-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.input-field {
  padding: 10px 12px;
  border: 1px solid #E1E4E8;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.input-field:focus {
  outline: none;
  border-color: #4A90E2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.btn-delete-round {
  width: 32px;
  height: 32px;
  background: #E74C3C;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.btn-delete-round:hover {
  background: #C0392B;
  transform: scale(1.1);
}

.data-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #F8F9FA 0%, #E8F4F8 100%);
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  color: #4A90E2;
  font-weight: 700;
}

.ai-prediction-section {
  margin-top: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  overflow: hidden;
}

.prediction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.prediction-header:hover {
  background: rgba(255, 255, 255, 0.1);
}

.prediction-title {
  font-size: 18px;
  color: white;
  margin: 0;
  font-weight: 600;
}

.btn-toggle-prediction {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-toggle-prediction:hover {
  background: rgba(255, 255, 255, 0.3);
}

.prediction-panel {
  background: white;
  padding: 20px;
  transition: all 0.4s ease;
}

.prediction-panel.collapsed {
  max-height: 0;
  padding: 0 20px;
  overflow: hidden;
}

.prediction-config {
  margin-bottom: 20px;
}

.config-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.config-select,
.config-input {
  padding: 10px 12px;
  border: 2px solid #E1E4E8;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
}

.config-select:focus,
.config-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.scene-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  border-radius: 8px;
  margin-bottom: 16px;
}

.scene-icon {
  font-size: 16px;
}

.scene-text {
  font-size: 13px;
  color: #2E7D32;
  font-weight: 500;
}

.prediction-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.prediction-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.prediction-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.prediction-hint {
  text-align: center;
  color: #E74C3C;
  font-size: 13px;
  margin-top: 12px;
}

.prediction-result {
  background: linear-gradient(135deg, #F8F9FA 0%, #E8F4F8 100%);
  border-radius: 12px;
  padding: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.result-title {
  font-size: 16px;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.result-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.trend-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.trend-badge.up {
  background: rgba(126, 211, 33, 0.2);
  color: #7ED321;
}

.trend-badge.down {
  background: rgba(231, 76, 60, 0.2);
  color: #E74C3C;
}

.trend-badge.stable {
  background: rgba(74, 144, 226, 0.2);
  color: #4A90E2;
}

.confidence-badge {
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.prediction-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: white;
  border-radius: 8px;
}

.metric-label {
  font-size: 13px;
  color: #666;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.prediction-values {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.prediction-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.prediction-label {
  font-size: 14px;
  color: #666;
  min-width: 60px;
}

.prediction-value {
  font-size: 20px;
  font-weight: 700;
  color: #667eea;
  flex: 1;
}

.prediction-unit {
  font-size: 12px;
  color: #999;
}

.prediction-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.apply-btn,
.clear-btn {
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.apply-btn {
  background: linear-gradient(135deg, #7ED321 0%, #5CB85C 100%);
  color: white;
}

.apply-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(126, 211, 33, 0.4);
}

.clear-btn {
  background: #F8F9FA;
  color: #666;
  border: 2px solid #E1E4E8;
}

.clear-btn:hover {
  background: #E1E4E8;
}

.prediction-placeholder {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.prediction-placeholder p {
  font-size: 14px;
  margin: 4px 0;
  line-height: 1.6;
}
</style>
