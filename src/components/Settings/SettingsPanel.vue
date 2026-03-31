<template>
  <div class="settings-overlay" @click.self="$emit('close')">
    <div class="settings-panel">
      <div class="settings-header">
        <h2>⚙️ 设置</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <div class="settings-content">
        <div class="settings-section">
          <h3>图表设置</h3>
          
          <div class="form-group">
            <label class="label">图表标题</label>
            <input 
              type="text" 
              class="input" 
              v-model="localSettings.title"
              placeholder="输入图表标题"
            />
          </div>
          
          <div class="form-group">
            <label class="label">X 轴名称</label>
            <input 
              type="text" 
              class="input" 
              v-model="localSettings.xAxisName"
              placeholder="输入 X 轴名称"
            />
          </div>
          
          <div class="form-group">
            <label class="label">Y 轴名称</label>
            <input 
              type="text" 
              class="input" 
              v-model="localSettings.yAxisName"
              placeholder="输入 Y 轴名称"
            />
          </div>
        </div>
        
        <div class="settings-section">
          <h3>动画设置</h3>
          
          <div class="form-group">
            <label class="label">动画速度: {{ localSettings.animationSpeed }}x</label>
            <input 
              type="range" 
              class="slider" 
              v-model.number="localSettings.animationSpeed"
              min="0.5"
              max="2"
              step="0.1"
            />
          </div>
        </div>
        
        <div class="settings-section">
          <h3>数据操作</h3>
          
          <div class="button-group">
            <button class="btn btn-secondary" @click="resetAllSettings">
              🔄 重置设置
            </button>
            <button class="btn btn-secondary" @click="clearAllData">
              🗑️ 清空数据
            </button>
          </div>
        </div>
      </div>
      
      <div class="settings-footer">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="saveSettings">保存设置</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useChartStore } from '../../store/chartStore'

const emit = defineEmits(['close'])
const chartStore = useChartStore()

const localSettings = ref({
  title: '',
  xAxisName: '',
  yAxisName: '',
  animationSpeed: 1
})

onMounted(() => {
  localSettings.value = {
    title: chartStore.title,
    xAxisName: chartStore.xAxisName,
    yAxisName: chartStore.yAxisName,
    animationSpeed: chartStore.animationSpeed
  }
})

function saveSettings() {
  chartStore.setTitle(localSettings.value.title)
  chartStore.setAxisNames(localSettings.value.xAxisName, localSettings.value.yAxisName)
  chartStore.setAnimationSpeed(localSettings.value.animationSpeed)
  chartStore.saveSettings()
  emit('close')
}

function resetAllSettings() {
  if (confirm('确定要重置所有设置吗？')) {
    chartStore.resetSettings()
    localSettings.value = {
      title: chartStore.title,
      xAxisName: chartStore.xAxisName,
      yAxisName: chartStore.yAxisName,
      animationSpeed: chartStore.animationSpeed
    }
  }
}

function clearAllData() {
  if (confirm('确定要清空所有数据吗？')) {
    chartStore.setDataItems([])
    chartStore.saveSettings()
  }
}
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-panel {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E1E4E8;
}

.settings-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: #F8F9FA;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #E74C3C;
  color: white;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.settings-section {
  margin-bottom: 24px;
}

.settings-section h3 {
  font-size: 16px;
  margin-bottom: 16px;
  color: #4A90E2;
}

.form-group {
  margin-bottom: 16px;
}

.slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #E1E4E8;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #4A90E2;
  cursor: pointer;
}

.button-group {
  display: flex;
  gap: 12px;
}

.button-group .btn {
  flex: 1;
}

.settings-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #E1E4E8;
}

.settings-footer .btn {
  flex: 1;
  padding: 12px;
}
</style>
