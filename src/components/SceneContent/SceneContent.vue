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
          @viewModeChange="handleViewModeChange"
        />
        
        <div 
          class="questions-section" 
          :class="{ 
            'is-dragging': isQuestionsDragging, 
            'is-resizing': isQuestionsResizing,
            'is-maximized': isQuestionsMaximized,
            'draggable-panel': true
          }"
          ref="questionsPanelRef"
          :style="questionsPanelStyle"
        >
          <div class="resize-handles" v-if="!isQuestionsMaximized">
            <div 
              v-for="handle in resizeHandles" 
              :key="handle.direction"
              :class="['resize-handle', handle.class]"
              :style="{ cursor: handle.cursor }"
              @mousedown="(e) => startQuestionsResize(e, handle.direction)"
            ></div>
          </div>
          
          <div class="section-header" ref="questionsHeaderRef" @mousedown="startQuestionsDrag">
            <div class="header-left-area">
              <span class="drag-indicator" title="拖拽移动">⋮⋮</span>
              <div class="header-icon">💡</div>
              <h3>探究问题</h3>
            </div>
            <div class="header-actions">
              <button class="btn-maximize" @click.stop="toggleQuestionsMaximize" :title="isQuestionsMaximized ? '退出全屏' : '全屏显示'">
                {{ isQuestionsMaximized ? '⤓' : '⤢' }}
              </button>
            </div>
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
          
          <div class="thinking-skills-section">
            <div class="skills-header" @click="showThinkingSkills = !showThinkingSkills">
              <div class="skills-title">
                <span class="skills-icon">🧠</span>
                <span>思考技巧</span>
              </div>
              <button class="btn-toggle-skills">
                <span :class="['toggle-arrow', { 'rotated': showThinkingSkills }]">▼</span>
              </button>
            </div>
            
            <div class="skills-content" :class="{ 'collapsed': !showThinkingSkills }">
              <h4 class="skills-subtitle">{{ thinkingSkills.title }}</h4>
              <div class="skills-grid">
                <div 
                  v-for="(skill, index) in thinkingSkills.skills" 
                  :key="index"
                  class="skill-card"
                >
                  <div class="skill-icon">{{ ['📊', '✏️', '🔍', '📐'][index % 4] }}</div>
                  <div class="skill-info">
                    <h5 class="skill-name">{{ skill.name }}</h5>
                    <p class="skill-desc">{{ skill.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="realtime-answers-section">
            <div class="answers-header" @click="showRealTimeAnswers = !showRealTimeAnswers">
              <div class="answers-title">
                <span class="answers-icon">🎯</span>
                <span>实时答案</span>
                <span class="data-badge">基于当前数据</span>
              </div>
              <button class="btn-toggle-answers">
                <span :class="['toggle-arrow', { 'rotated': showRealTimeAnswers }]">▼</span>
              </button>
            </div>
            
            <div class="answers-content" :class="{ 'collapsed': !showRealTimeAnswers }">
              <div v-if="realTimeAnswers.length > 0" class="answers-list">
                <div 
                  v-for="(answer, index) in realTimeAnswers" 
                  :key="index"
                  class="answer-item"
                >
                  <div class="answer-question">
                    <span class="q-icon">Q</span>
                    <span>{{ answer.question }}</span>
                  </div>
                  <div class="answer-text">
                    <span class="a-icon">A</span>
                    <span>{{ answer.answer }}</span>
                  </div>
                  <div class="answer-hint">
                    <span class="hint-icon">💡</span>
                    <span>{{ answer.hint }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="no-data-hint">
                <span class="hint-icon">📝</span>
                <span>请先输入数据以获取实时答案</span>
              </div>
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
          :viewMode="viewMode"
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
import { ref, reactive, watch, onMounted, computed } from 'vue'
import EditableData from '../EditableData/EditableData.vue'
import ChartGenerator from '../ChartGenerator/ChartGenerator.vue'
import { getThinkingSkills, generateRealTimeAnswers, getSceneTypeFromTitle } from '../../utils/helpers'
import { createResizeHandles } from '../../utils/useDraggablePanel'

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
const viewMode = ref('table')

const showThinkingSkills = ref(false)
const showRealTimeAnswers = ref(false)

const resizeHandles = createResizeHandles()

const questionsPanelRef = ref(null)
const questionsHeaderRef = ref(null)
const isQuestionsDragging = ref(false)
const isQuestionsResizing = ref(false)
const isQuestionsMaximized = ref(false)

const questionsPosition = reactive({ x: 0, y: 0 })
const questionsSize = reactive({ width: 600, height: 400 })
const questionsSavedState = reactive({ x: 0, y: 0, width: 0, height: 0 })
const questionsResizeDirection = ref('')
const questionsDragStart = reactive({ x: 0, y: 0 })
const questionsResizeStart = reactive({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 })

const questionsPanelStyle = computed(() => {
  if (isQuestionsMaximized.value) {
    return {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: 9999
    }
  }
  return {
    position: 'relative',
    left: `${Math.round(questionsPosition.x)}px`,
    top: `${Math.round(questionsPosition.y)}px`,
    width: `${Math.round(questionsSize.width)}px`,
    minHeight: `${Math.round(questionsSize.height)}px`
  }
})

function startQuestionsDrag(e) {
  if (isQuestionsMaximized.value) return
  if (e.target.closest('.btn-toggle') || 
      e.target.closest('.toggle-switch') || 
      e.target.closest('button') ||
      e.target.closest('input') ||
      e.target.closest('select')) return
  
  isQuestionsDragging.value = true
  questionsDragStart.x = e.clientX - questionsPosition.x
  questionsDragStart.y = e.clientY - questionsPosition.y
  
  document.addEventListener('mousemove', onQuestionsDrag)
  document.addEventListener('mouseup', stopQuestionsDrag)
  
  if (questionsPanelRef.value) {
    questionsPanelRef.value.style.transition = 'none'
  }
}

function onQuestionsDrag(e) {
  if (!isQuestionsDragging.value) return
  
  const newX = e.clientX - questionsDragStart.x
  const newY = e.clientY - questionsDragStart.y
  
  questionsPosition.x = Math.max(0, Math.min(newX, window.innerWidth - questionsSize.width))
  questionsPosition.y = Math.max(0, Math.min(newY, window.innerHeight - questionsSize.height))
}

function stopQuestionsDrag() {
  isQuestionsDragging.value = false
  document.removeEventListener('mousemove', onQuestionsDrag)
  document.removeEventListener('mouseup', stopQuestionsDrag)
  
  if (questionsPanelRef.value) {
    questionsPanelRef.value.style.transition = ''
  }
}

function startQuestionsResize(e, direction) {
  if (isQuestionsMaximized.value) return
  e.preventDefault()
  e.stopPropagation()
  
  isQuestionsResizing.value = true
  questionsResizeDirection.value = direction
  
  questionsResizeStart.x = e.clientX
  questionsResizeStart.y = e.clientY
  questionsResizeStart.width = questionsSize.width
  questionsResizeStart.height = questionsSize.height
  questionsResizeStart.left = questionsPosition.x
  questionsResizeStart.top = questionsPosition.y
  
  document.addEventListener('mousemove', onQuestionsResize)
  document.addEventListener('mouseup', stopQuestionsResize)
  
  if (questionsPanelRef.value) {
    questionsPanelRef.value.style.transition = 'none'
  }
}

function onQuestionsResize(e) {
  if (!isQuestionsResizing.value) return
  
  const deltaX = e.clientX - questionsResizeStart.x
  const deltaY = e.clientY - questionsResizeStart.y
  const dir = questionsResizeDirection.value
  
  let newWidth = questionsResizeStart.width
  let newHeight = questionsResizeStart.height
  let newX = questionsResizeStart.left
  let newY = questionsResizeStart.top
  
  if (dir.includes('e')) {
    newWidth = Math.max(300, Math.min(window.innerWidth, questionsResizeStart.width + deltaX))
  }
  if (dir.includes('w')) {
    const widthChange = Math.min(deltaX, questionsResizeStart.width - 300)
    newWidth = questionsResizeStart.width - widthChange
    newX = questionsResizeStart.left + widthChange
  }
  if (dir.includes('s')) {
    newHeight = Math.max(200, Math.min(window.innerHeight, questionsResizeStart.height + deltaY))
  }
  if (dir.includes('n')) {
    const heightChange = Math.min(deltaY, questionsResizeStart.height - 200)
    newHeight = questionsResizeStart.height - heightChange
    newY = questionsResizeStart.top + heightChange
  }
  
  questionsSize.width = newWidth
  questionsSize.height = newHeight
  questionsPosition.x = newX
  questionsPosition.y = newY
}

function stopQuestionsResize() {
  isQuestionsResizing.value = false
  questionsResizeDirection.value = ''
  document.removeEventListener('mousemove', onQuestionsResize)
  document.removeEventListener('mouseup', stopQuestionsResize)
  
  if (questionsPanelRef.value) {
    questionsPanelRef.value.style.transition = ''
  }
}

function toggleQuestionsMaximize() {
  if (isQuestionsMaximized.value) {
    questionsPosition.x = questionsSavedState.x
    questionsPosition.y = questionsSavedState.y
    questionsSize.width = questionsSavedState.width
    questionsSize.height = questionsSavedState.height
    isQuestionsMaximized.value = false
  } else {
    questionsSavedState.x = questionsPosition.x
    questionsSavedState.y = questionsPosition.y
    questionsSavedState.width = questionsSize.width
    questionsSavedState.height = questionsSize.height
    isQuestionsMaximized.value = true
  }
}

const sceneType = computed(() => {
  return getSceneTypeFromTitle(currentScene.value.content?.title)
})

const thinkingSkills = computed(() => {
  return getThinkingSkills(sceneType.value)
})

const realTimeAnswers = computed(() => {
  return generateRealTimeAnswers(chartData.value, sceneType.value)
})

function handleDataChange(updatedData) {
  chartData.value = updatedData
  autoSave()
}

function handleViewModeChange(mode) {
  viewMode.value = mode
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

.questions-section.draggable-panel {
  position: relative;
  transition: box-shadow 0.3s ease;
}

.questions-section.is-dragging {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  cursor: grabbing;
  user-select: none;
}

.questions-section.is-resizing {
  user-select: none;
}

.questions-section.is-maximized {
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

.header-left-area {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
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

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  cursor: grab;
}

.section-header:active {
  cursor: grabbing;
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

.thinking-skills-section,
.realtime-answers-section {
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
}

.skills-header,
.answers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.skills-header {
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
}

.answers-header {
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
}

.skills-header:hover,
.answers-header:hover {
  filter: brightness(0.95);
}

.skills-title,
.answers-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.skills-icon,
.answers-icon {
  font-size: 18px;
}

.data-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(74, 144, 226, 0.2);
  color: #1565C0;
  border-radius: 10px;
  font-weight: 500;
}

.btn-toggle-skills,
.btn-toggle-answers {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.5);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.toggle-arrow {
  font-size: 12px;
  color: #666;
  transition: transform 0.3s ease;
  display: inline-block;
}

.toggle-arrow.rotated {
  transform: rotate(180deg);
}

.skills-content,
.answers-content {
  max-height: 500px;
  overflow: hidden;
  transition: all 0.4s ease;
  background: white;
  border: 1px solid #E1E4E8;
  border-top: none;
}

.skills-content.collapsed,
.answers-content.collapsed {
  max-height: 0;
  border-color: transparent;
}

.skills-subtitle {
  font-size: 14px;
  color: #2E7D32;
  margin: 0 0 12px 0;
  padding: 12px 16px 0;
  font-weight: 600;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 16px 16px;
}

.skill-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #F8F9FA;
  border-radius: 8px;
  border-left: 3px solid #4CAF50;
  transition: all 0.3s ease;
}

.skill-card:hover {
  background: #E8F5E9;
  transform: translateX(4px);
}

.skill-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.skill-info {
  flex: 1;
}

.skill-name {
  font-size: 14px;
  color: #333;
  margin: 0 0 4px 0;
  font-weight: 600;
}

.skill-desc {
  font-size: 12px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.answers-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.answer-item {
  padding: 16px;
  background: linear-gradient(135deg, #F8F9FA 0%, #E8F4F8 100%);
  border-radius: 10px;
  border-left: 4px solid #4A90E2;
}

.answer-question {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
}

.q-icon {
  width: 22px;
  height: 22px;
  background: #F5A623;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.answer-question span:last-child {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.answer-text {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
}

.a-icon {
  width: 22px;
  height: 22px;
  background: #4A90E2;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.answer-text span:last-child {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.answer-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 193, 7, 0.15);
  border-radius: 6px;
}

.hint-icon {
  font-size: 14px;
}

.answer-hint span:last-child {
  font-size: 12px;
  color: #F57C00;
}

.no-data-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px;
  color: #999;
  font-size: 14px;
}

.no-data-hint .hint-icon {
  font-size: 20px;
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
