<template>
  <div class="scene-content">
    <div class="content-header">
      <button class="btn-back" @click="$emit('back')">
        ← 返回场景选择
      </button>
      <div class="scene-info">
        <span class="scene-icon">{{ scene.icon }}</span>
        <h2 class="scene-title">{{ scene.content.title }}</h2>
      </div>
    </div>
    
    <div class="content-body">
      <div class="left-panel">
        <EditableData 
          :scene="currentScene" 
          @dataChange="handleDataChange" 
        />
        
        <div class="questions-section">
          <div class="section-header">
            <div class="header-icon">💡</div>
            <h3>探究问题</h3>
          </div>
          
          <div class="questions-list">
            <div 
              v-for="(question, index) in currentScene.content.questions" 
              :key="index"
              class="question-item"
              :class="{ 'highlight': index === 0 }"
            >
              <div class="question-number">{{ index + 1 }}</div>
              <div class="question-text">{{ question }}</div>
            </div>
          </div>
          
          <div class="activity-box">
            <h4>📝 活动</h4>
            <ol class="activity-list">
              <li>小组讨论，说一说数据是怎么整理的？</li>
              <li>补充完整，想一想，在整理数据的时候应该注意什么？</li>
            </ol>
          </div>
        </div>
      </div>
      
      <div class="right-panel">
        <ChartGenerator 
          :data="chartData" 
          :scene="currentScene" 
        />
      </div>
    </div>
    
    <div class="content-footer">
      <button class="btn btn-primary" @click="saveData">
        💾 保存数据
      </button>
      <button class="btn btn-secondary" @click="$emit('back')">
        ✓ 完成学习
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import EditableData from '../EditableData/EditableData.vue'
import ChartGenerator from '../ChartGenerator/ChartGenerator.vue'

const props = defineProps({
  scene: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['back'])

const currentScene = ref({ ...props.scene })
const chartData = ref({
  type: 'table',
  data: []
})

function handleDataChange(updatedData) {
  chartData.value = updatedData
  autoSave()
}

function autoSave() {
  const key = `scene_data_${currentScene.value.id}`
  localStorage.setItem(key, JSON.stringify(chartData.value))
}

function saveData() {
  const key = `scene_data_${currentScene.value.id}`
  localStorage.setItem(key, JSON.stringify(chartData.value))
  alert('数据已保存！下次打开时会自动加载。')
}

function loadSavedData() {
  const key = `scene_data_${currentScene.value.id}`
  const saved = localStorage.getItem(key)
  if (saved) {
    try {
      chartData.value = JSON.parse(saved)
    } catch (e) {
      console.error('加载保存的数据失败', e)
    }
  }
}

watch(() => props.scene, (newScene) => {
  currentScene.value = { ...newScene }
  loadSavedData()
}, { immediate: true })

onMounted(() => {
  loadSavedData()
})
</script>

<style scoped>
.scene-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
}

.content-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #E1E4E8;
}

.btn-back {
  padding: 10px 20px;
  background: #F8F9FA;
  border: 2px solid #E1E4E8;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: #E1E4E8;
  color: #333;
}

.scene-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.scene-icon {
  font-size: 36px;
}

.scene-title {
  font-size: 28px;
  color: #333;
  margin: 0;
  font-weight: 700;
}

.content-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 30px;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.right-panel {
  display: flex;
  flex-direction: column;
}

.questions-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.header-icon {
  font-size: 24px;
}

.section-header h3 {
  font-size: 20px;
  color: #333;
  margin: 0;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.question-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #F8F9FA;
  border-radius: 8px;
  border-left: 4px solid #E1E4E8;
}

.question-item.highlight {
  background: #FFF3E0;
  border-left-color: #F5A623;
}

.question-number {
  width: 28px;
  height: 28px;
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

.question-item.highlight .question-number {
  background: #F5A623;
}

.question-text {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  flex: 1;
}

.activity-box {
  background: linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 100%);
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #C8E6C9;
}

.activity-box h4 {
  font-size: 18px;
  color: #2E7D32;
  margin-bottom: 12px;
  font-weight: 600;
}

.activity-list {
  padding-left: 20px;
  margin: 0;
}

.activity-list li {
  font-size: 15px;
  color: #333;
  line-height: 1.8;
  margin-bottom: 8px;
}

.content-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px;
}

.content-footer .btn {
  padding: 16px 48px;
  font-size: 18px;
}

@media (max-width: 1200px) {
  .content-body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .content-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .scene-info {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .content-footer {
    flex-direction: column;
  }
  
  .content-footer .btn {
    width: 100%;
  }
}
</style>
