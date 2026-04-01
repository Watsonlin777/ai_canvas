<template>
  <div class="editable-data-manager">
    <div class="data-manager-header">
      <h3 class="section-title">📝 数据编辑</h3>
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
    
    <div class="data-description" v-if="scene.content">
      <div class="description-item">
        <span class="description-icon">📋</span>
        <span class="description-text">{{ getDataDescription() }}</span>
      </div>
    </div>
    
    <div class="data-editor">
      <div v-if="dataType === 'table'" class="table-editor">
        <div class="column-headers">
          <div class="header-row">
            <div class="corner-cell">
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
                v-if="tableHeaders.length > 1"
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
        
        <div class="table-wrapper">
          <table class="editable-table">
            <tbody>
              <tr v-for="(row, rowIndex) in editableData.rows" :key="rowIndex">
                <td class="row-header-cell">
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
                <td class="actions-cell">
                  <button class="btn-delete" @click="deleteRow(rowIndex)" title="删除此行">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="add-row-section">
          <button class="btn-add-row" @click="addRow">
            <span class="add-icon">+</span>
            <span class="add-text">添加新行</span>
          </button>
        </div>
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
    
    <div class="data-stats">
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
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  scene: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['dataChange'])

const dataType = ref('table')
const valueKey = ref('value')
const tableHeaders = ref([])
const rowHeaders = ref([])

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
  
  if (dataType.value === 'table') {
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

function resetData() {
  if (confirm('确定要重置为原始数据吗？所有修改将丢失。')) {
    loadData()
    handleDataChange()
  }
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

.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #E1E4E8;
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

.actions-cell {
  width: 50px;
  padding: 4px;
  background: #F8F9FA;
  border: 1px solid #E1E4E8;
  border-right: none;
  text-align: center;
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
</style>
