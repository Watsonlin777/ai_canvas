<template>
  <div class="data-manager card">
    <h3 class="section-title">📊 数据管理</h3>
    
    <div class="data-list">
      <div 
        v-for="(item, index) in chartStore.dataItems" 
        :key="index" 
        class="data-item"
      >
        <div class="data-item-header">
          <span class="data-index">{{ index + 1 }}</span>
          <button class="btn-remove" @click="removeItem(index)">✕</button>
        </div>
        
        <div class="data-item-content">
          <div class="form-group">
            <label class="label">标签</label>
            <input 
              type="text" 
              class="input" 
              :value="item.label"
              @input="updateItem(index, 'label', $event.target.value)"
              placeholder="输入标签"
            />
          </div>
          
          <div class="form-group">
            <label class="label">数值</label>
            <input 
              type="number" 
              class="input" 
              :value="item.value"
              @input="updateItem(index, 'value', $event.target.value)"
              placeholder="输入数值"
            />
          </div>
        </div>
      </div>
    </div>
    
    <div class="add-item-form">
      <div class="form-group">
        <label class="label">新数据项</label>
        <div class="add-item-inputs">
          <input 
            type="text" 
            class="input" 
            v-model="newLabel"
            placeholder="标签"
          />
          <input 
            type="number" 
            class="input" 
            v-model="newValue"
            placeholder="数值"
          />
          <button class="btn btn-primary" @click="addItem">添加</button>
        </div>
      </div>
    </div>
    
    <div class="data-actions">
      <button class="btn btn-secondary" @click="importData">导入数据</button>
      <button class="btn btn-secondary" @click="exportData">导出数据</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useChartStore } from '../../store/chartStore'

const chartStore = useChartStore()
const newLabel = ref('')
const newValue = ref('')

function addItem() {
  if (newLabel.value && newValue.value !== '') {
    chartStore.addDataItem(newLabel.value, newValue.value)
    chartStore.saveSettings()
    newLabel.value = ''
    newValue.value = ''
  }
}

function removeItem(index) {
  chartStore.removeDataItem(index)
  chartStore.saveSettings()
}

function updateItem(index, field, value) {
  chartStore.updateDataItem(index, field, value)
  chartStore.saveSettings()
}

function importData() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        if (Array.isArray(data)) {
          chartStore.setDataItems(data)
          chartStore.saveSettings()
        }
      } catch (err) {
        alert('导入失败：文件格式不正确')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

function exportData() {
  const data = JSON.stringify(chartStore.dataItems, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'chart-data.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.data-manager {
  height: fit-content;
}

.section-title {
  font-size: 18px;
  margin-bottom: 16px;
  color: #333;
}

.data-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.data-item {
  background: #F8F9FA;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.data-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.data-index {
  width: 24px;
  height: 24px;
  background: #4A90E2;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.btn-remove {
  width: 24px;
  height: 24px;
  background: #E74C3C;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.btn-remove:hover {
  background: #C0392B;
  transform: scale(1.1);
}

.data-item-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.add-item-form {
  border-top: 1px solid #E1E4E8;
  padding-top: 16px;
  margin-top: 16px;
}

.add-item-inputs {
  display: flex;
  gap: 8px;
}

.add-item-inputs .input {
  flex: 1;
}

.data-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.data-actions .btn {
  flex: 1;
}
</style>
