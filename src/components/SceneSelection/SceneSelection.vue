<template>
  <div class="scene-selection">
    <div class="scene-header">
      <h1 class="scene-title">🌟 生活场景主题</h1>
      <p class="scene-subtitle">选择一个场景开始学习数据统计</p>
    </div>
    
    <div class="scene-grid">
      <div 
        v-for="scene in scenes" 
        :key="scene.id"
        :class="['scene-card', { selected: selectedScene?.id === scene.id }]"
        :style="{ '--card-color': scene.color, '--card-bg': scene.bgColor }"
        @click="selectScene(scene)"
        @mouseenter="hoveredCard = scene.id"
        @mouseleave="hoveredCard = null"
      >
        <div class="card-icon" :style="{ backgroundColor: scene.bgColor }">
          <span class="icon-emoji">{{ scene.icon }}</span>
        </div>
        
        <div class="card-content">
          <h3 class="card-title">{{ scene.title }}</h3>
          <p class="card-description">{{ scene.description }}</p>
        </div>
        
        <div class="card-indicator">
          <div class="indicator-ring"></div>
        </div>
      </div>
    </div>
    
    <div v-if="selectedScene" class="scene-actions">
      <button class="btn btn-primary btn-large" @click="enterScene">
        🚀 进入学习
      </button>
      <button class="btn btn-secondary btn-large" @click="clearSelection">
        重新选择
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { lifeScenes } from '@/data/lifeScenes'

const emit = defineEmits(['sceneSelected'])

const scenes = lifeScenes
const selectedScene = ref(null)
const hoveredCard = ref(null)

function selectScene(scene) {
  selectedScene.value = scene
}

function enterScene() {
  if (selectedScene.value) {
    emit('sceneSelected', selectedScene.value)
  }
}

function clearSelection() {
  selectedScene.value = null
}
</script>

<style scoped>
.scene-selection {
  padding: 40px 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.scene-header {
  text-align: center;
  margin-bottom: 40px;
}

.scene-title {
  font-size: 36px;
  color: #333;
  margin-bottom: 12px;
  font-weight: 700;
}

.scene-subtitle {
  font-size: 18px;
  color: #666;
}

.scene-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 40px;
}

.scene-card {
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 32px 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px solid transparent;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.scene-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--card-color);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.scene-card:hover::before {
  transform: scaleX(1);
}

.scene-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.scene-card.selected {
  border-color: var(--card-color);
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.card-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  transition: all 0.3s ease;
}

.scene-card:hover .card-icon {
  transform: scale(1.1) rotate(5deg);
}

.icon-emoji {
  font-size: 40px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.card-content {
  text-align: center;
}

.card-title {
  font-size: 22px;
  color: #333;
  margin-bottom: 12px;
  font-weight: 600;
}

.card-description {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.card-indicator {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 24px;
  height: 24px;
}

.indicator-ring {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid var(--card-color);
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.3s ease;
}

.scene-card.selected .indicator-ring {
  opacity: 1;
  transform: scale(1);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.scene-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px;
}

.btn-large {
  padding: 16px 48px;
  font-size: 18px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.btn-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

@media (max-width: 1024px) {
  .scene-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .scene-grid {
    grid-template-columns: 1fr;
  }
  
  .scene-title {
    font-size: 28px;
  }
  
  .scene-subtitle {
    font-size: 16px;
  }
  
  .scene-card {
    padding: 24px 20px;
  }
  
  .scene-actions {
    flex-direction: column;
  }
  
  .btn-large {
    width: 100%;
  }
}
</style>
