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
      <div class="data-section">
        <div class="section-header">
          <div class="header-icon">📊</div>
          <h3>图表整理</h3>
        </div>
        
        <div v-if="scene.content.data" class="data-table-container">
          <div class="data-table-wrapper">
            <table class="data-table">
              <tbody>
                <tr v-for="(row, rowIndex) in scene.content.data" :key="rowIndex">
                  <td v-for="(value, colIndex) in row" :key="colIndex">
                    {{ value }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="scene.content.unit" class="unit-label">
            单位：{{ scene.content.unit }}
          </div>
        </div>
        
        <div v-if="scene.content.tables" class="tables-container">
          <div v-for="(table, index) in scene.content.tables" :key="index" class="dual-table">
            <h4 class="table-title">{{ table.title }}</h4>
            <div class="data-table-wrapper">
              <table class="data-table">
                <tbody>
                  <tr v-for="(row, rowIndex) in table.data" :key="rowIndex">
                    <td v-for="(value, colIndex) in row" :key="colIndex">
                      {{ value }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div v-if="scene.content.categories" class="category-list">
          <div 
            v-for="(item, index) in scene.content.categories" 
            :key="index"
            class="category-item"
            :style="{ borderLeftColor: scene.color }"
          >
            <span class="category-name">{{ item.name }}</span>
            <span class="category-value">{{ item.amount }} {{ scene.content.unit }}</span>
          </div>
        </div>
        
        <div v-if="scene.content.ranges" class="range-list">
          <div 
            v-for="(item, index) in scene.content.ranges" 
            :key="index"
            class="range-item"
            :style="{ backgroundColor: scene.bgColor }"
          >
            <span class="range-label">{{ item.range }}</span>
            <div class="range-bar">
              <div 
                class="range-fill" 
                :style="{ width: (item.count / maxCount * 100) + '%', backgroundColor: scene.color }"
              ></div>
            </div>
            <span class="range-count">{{ item.count }}人</span>
          </div>
        </div>
        
        <div v-if="scene.content.data && Array.isArray(scene.content.data) && scene.content.data[0]?.day" class="chart-container">
          <div class="chart-wrapper">
            <div 
              v-for="(item, index) in scene.content.data" 
              :key="index"
              class="chart-bar-item"
            >
              <div class="bar-label">{{ item.day }}</div>
              <div class="bar-container">
                <div 
                  class="bar-fill" 
                  :style="{ height: (item[Object.keys(item).find(k => k !== 'day')] / maxValue * 100) + '%', backgroundColor: scene.color }"
                ></div>
              </div>
              <div class="bar-value">{{ item[Object.keys(item).find(k => k !== 'day')] }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="questions-section">
        <div class="section-header">
          <div class="header-icon">💡</div>
          <h3>探究新知</h3>
        </div>
        
        <div class="questions-list">
          <div 
            v-for="(question, index) in scene.content.questions" 
            :key="index"
            class="question-item"
            :class="{ 'highlight': index === 0 }"
          >
            <div class="question-number">{{ index + 1 }}</div>
            <div class="question-text">{{ question }}</div>
          </div>
        </div>
        
        <div class="activity-box">
          <h4>活动</h4>
          <ol class="activity-list">
            <li>小组讨论，说一说数据是怎么整理的？</li>
            <li>补充完整，想一想，在整理数据的时候应该注意什么？</li>
          </ol>
        </div>
      </div>
    </div>
    
    <div class="content-footer">
      <button class="btn btn-primary" @click="$emit('back')">
        ✓ 完成学习
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  scene: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['back'])

const maxCount = computed(() => {
  if (props.scene.content.ranges) {
    return Math.max(...props.scene.content.ranges.map(r => r.count))
  }
  return 1
})

const maxValue = computed(() => {
  if (props.scene.content.data && Array.isArray(props.scene.content.data)) {
    const values = props.scene.content.data.map(item => {
      const key = Object.keys(item).find(k => k !== 'day')
      return item[key]
    })
    return Math.max(...values)
  }
  return 1
})
</script>

<style scoped>
.scene-content {
  max-width: 1200px;
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

.data-section,
.questions-section {
  background: white;
  border-radius: 16px;
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

.data-table-container {
  margin-bottom: 20px;
}

.data-table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #E1E4E8;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table td {
  padding: 12px;
  text-align: center;
  border: 1px solid #E1E4E8;
  background: #F8F9FA;
  min-width: 50px;
}

.data-table tr:hover td {
  background: #E3F2FD;
}

.unit-label {
  text-align: right;
  font-size: 13px;
  color: #666;
  margin-top: 8px;
  font-style: italic;
}

.tables-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.dual-table {
  background: #F8F9FA;
  padding: 16px;
  border-radius: 8px;
}

.table-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 12px;
  text-align: center;
  font-weight: 600;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #F8F9FA;
  border-radius: 8px;
  border-left: 4px solid;
  transition: all 0.3s ease;
}

.category-item:hover {
  transform: translateX(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.category-name {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.category-value {
  font-size: 18px;
  color: #4A90E2;
  font-weight: 700;
}

.range-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.range-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 8px;
}

.range-label {
  width: 100px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.range-bar {
  flex: 1;
  height: 24px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  overflow: hidden;
}

.range-fill {
  height: 100%;
  border-radius: 12px;
  transition: width 0.5s ease;
}

.range-count {
  width: 50px;
  text-align: right;
  font-size: 14px;
  color: #666;
  font-weight: 600;
}

.chart-container {
  margin-top: 20px;
}

.chart-wrapper {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;
  padding: 20px;
  background: #F8F9FA;
  border-radius: 8px;
}

.chart-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.bar-label {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.bar-container {
  width: 40px;
  height: 120px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
}

.bar-fill {
  width: 100%;
  border-radius: 4px;
  transition: height 0.5s ease;
  animation: growUp 0.8s ease-out;
}

@keyframes growUp {
  from {
    height: 0;
  }
}

.bar-value {
  font-size: 14px;
  color: #333;
  font-weight: 600;
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
  padding: 20px;
}

.content-footer .btn {
  padding: 16px 48px;
  font-size: 18px;
}

@media (max-width: 900px) {
  .content-body {
    grid-template-columns: 1fr;
  }
  
  .tables-container {
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
  
  .chart-wrapper {
    height: 150px;
  }
  
  .bar-container {
    height: 80px;
    width: 30px;
  }
}
</style>
