<template>
  <div class="editable-data-manager">
    <div class="data-manager-header">
      <h3 class="section-title">📝 数据编辑</h3>
      <div class="data-actions">
        <button class="btn btn-sm btn-primary" @click="addRow">
          ➕ 添加行
        </button>
        <button class="btn btn-sm btn-secondary" @click="resetData">
          🔄 重置
        </button>
      </div>
    </div>
    
    <div class="data-editor">
      <div v-if="dataType === 'table'" class="table-editor">
        <div class="table-wrapper">
          <table class="editable-table">
            <thead>
              <tr>
                <th class="row-number">#</th>
                <th v-for="(header, index) in tableHeaders" :key="index">
                  {{ header }}
                </th>
                <th class="actions">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in editableData.rows" :key="rowIndex" :class="{ 'highlight-row': rowIndex % 2 === 0 }">
                <td class="row-number">{{ rowIndex + 1 }}</td>
                <td v-for="(cell, colIndex) in row" :key="colIndex">
                  <input 
                    type="number" 
                    class="cell-input"
                    v-model.number="editableData.rows[rowIndex][colIndex]"
                    @input="handleDataChange"
                  />
                </td>
                <td class="actions">
                  <button class="btn-delete" @click="deleteRow(rowIndex)">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div v-else-if="dataType === 'categories'" class="categories-editor">
        <div v-for="(item, index) in editableData.categories" :key="index" class="category-row">
          <div class="category-input-group">
            <label class="input-label">名称</label>
            <input 
              type="text" 
              class="input-field"
              v-model="editableData.categories[index].name"
              @input="handleDataChange"
            />
          </div>
          <div class="category-input-group">
            <label class="input-label">数值</label>
            <input 
              type="number" 
              class="input-field"
              v-model.number="editableData.categories[index].amount"
              @input="handleDataChange"
            />
          </div>
          <button class="btn-delete-round" @click="deleteCategory(index)">✕</button>
        </div>
      </div>
      
      <div v-else-if="dataType === 'ranges'" class="ranges-editor">
        <div v-for="(item, index) in editableData.ranges" :key="index" class="range-row">
          <div class="range-input-group">
            <label class="input-label">范围</label>
            <input 
              type="text" 
              class="input-field"
              v-model="editableData.ranges[index].range"
              @input="handleDataChange"
            />
          </div>
          <div class="range-input-group">
            <label class="input-label">人数</label>
            <input 
              type="number" 
              class="input-field"
              v-model.number="editableData.ranges[index].count"
              @input="handleDataChange"
            />
          </div>
          <button class="btn-delete-round" @click="deleteRange(index)">✕</button>
        </div>
      </div>
      
      <div v-else-if="dataType === 'daily'" class="daily-editor">
        <div v-for="(item, index) in editableData.data" :key="index" class="daily-row">
          <div class="daily-input-group">
            <label class="input-label">日期/标签</label>
            <input 
              type="text" 
              class="input-field"
              v-model="editableData.data[index].day"
              @input="handleDataChange"
            />
          </div>
          <div class="daily-input-group">
            <label class="input-label">数值</label>
            <input 
              type="number" 
              class="input-field"
              v-model.number="editableData.data[index][valueKey]"
              @input="handleDataChange"
            />
          </div>
          <button class="btn-delete-round" @click="deleteDaily(index)">✕</button>
        </div>
      </div>
    </div>
    
    <div class="data-stats">
      <div class="stat-item">
        <span class="stat-label">数据量</span>
        <span class="stat-value">{{ dataCount }}</span>
      </div>
      <div class="stat-item" v-if="dataStats.sum !== undefined">
        <span class="stat-label">总和</span>
        <span class="stat-value">{{ dataStats.sum }}</span>
      </div>
      <div class="stat-item" v-if="dataStats.average !== undefined">
        <span class="stat-label">平均值</span>
        <span class="stat-value">{{ dataStats.average.toFixed(1) }}</span>
      </div>
      <div class="stat-item" v-if="dataStats.max !== undefined">
        <span class="stat-label">最大值</span>
        <span class="stat-value">{{ dataStats.max }}</span>
      </div>
      <div class="stat-item" v-if="dataStats.min !== undefined">
        <span class="stat-label">最小值</span>
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
const tableHeaders = ref(['列 1', '列 2', '列 3', '列 4', '列 5'])

const editableData = ref({
  rows: [],
  categories: [],
  ranges: [],
  data: []
})

const dataCount = computed(() => {
  if (dataType.value === 'table') {
    return editableData.value.rows.reduce((sum, row) => sum + row.length, 0)
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

function getAllValues() {
  const values = []
  
  if (dataType.value === 'table') {
    editableData.value.rows.forEach(row => {
      row.forEach(val => {
        if (val !== null && val !== undefined) values.push(val)
      })
    })
  } else if (dataType.value === 'categories') {
    editableData.value.categories.forEach(item => {
      if (item.amount !== null && item.amount !== undefined) values.push(item.amount)
    })
  } else if (dataType.value === 'ranges') {
    editableData.value.ranges.forEach(item => {
      if (item.count !== null && item.count !== undefined) values.push(item.count)
    })
  } else if (dataType.value === 'daily') {
    editableData.value.data.forEach(item => {
      const val = item[valueKey.value]
      if (val !== null && val !== undefined) values.push(val)
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
  }
}

function handleDataChange() {
  emitDataUpdate()
}

function emitDataUpdate() {
  const updatedData = {
    type: dataType.value,
    data: null
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

function addRow() {
  if (dataType.value === 'table') {
    const newRow = new Array(tableHeaders.value.length).fill(0)
    editableData.value.rows.push(newRow)
  } else if (dataType.value === 'categories') {
    editableData.value.categories.push({ name: '新项目', amount: 0 })
  } else if (dataType.value === 'ranges') {
    editableData.value.ranges.push({ range: '新范围', count: 0 })
  } else if (dataType.value === 'daily') {
    const newItem = { day: '新日期', [valueKey.value]: 0 }
    editableData.value.data.push(newItem)
  }
  handleDataChange()
}

function deleteRow(index) {
  if (editableData.value.rows.length > 1) {
    editableData.value.rows.splice(index, 1)
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
  if (confirm('确定要重置为原始数据吗？')) {
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
  margin-bottom: 20px;
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

.data-editor {
  margin-bottom: 20px;
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

.editable-table thead {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  color: white;
}

.editable-table th {
  padding: 12px;
  text-align: center;
  font-weight: 600;
  white-space: nowrap;
}

.editable-table td {
  padding: 8px;
  text-align: center;
  border: 1px solid #E1E4E8;
  background: #F8F9FA;
}

.highlight-row {
  background: #F0F7FF;
}

.cell-input {
  width: 100%;
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
  transition: all 0.3s ease;
}

.cell-input:focus {
  outline: none;
  border-color: #4A90E2;
  background: white;
}

.cell-input:hover {
  background: white;
}

.actions {
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
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-delete:hover {
  background: #C0392B;
  transform: scale(1.1);
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
  padding: 8px 12px;
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
