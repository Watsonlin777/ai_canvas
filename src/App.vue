<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">🌟 AI 数学可视化工具</h1>
        <p class="app-subtitle">小学数学折线统计图教学神器</p>
      </div>
      <button class="settings-btn" @click="showSettings = !showSettings">
        <span class="icon">⚙️</span>
        设置
      </button>
    </header>
    
    <main class="app-main">
      <SceneSelection 
        v-if="!currentScene" 
        @sceneSelected="handleSceneSelected" 
      />
      
      <SceneContent 
        v-else 
        :scene="currentScene" 
        @back="handleBack" 
      />
    </main>
    
    <SettingsPanel v-if="showSettings" @close="showSettings = false" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useChartStore } from './store/chartStore'
import DataManager from './components/DataManager/DataManager.vue'
import ChartDisplay from './components/Chart/ChartDisplay.vue'
import PredictionPanel from './components/Prediction/PredictionPanel.vue'
import SettingsPanel from './components/Settings/SettingsPanel.vue'
import SceneSelection from './components/SceneSelection/SceneSelection.vue'
import SceneContent from './components/SceneContent/SceneContent.vue'

const chartStore = useChartStore()
const showSettings = ref(false)
const currentScene = ref(null)

function handleSceneSelected(scene) {
  currentScene.value = scene
}

function handleBack() {
  currentScene.value = null
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #F8F9FA 0%, #E8F4F8 100%);
}

.app-header {
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px 32px;
}

.header-content {
  text-align: center;
  margin-bottom: 8px;
}

.app-title {
  font-size: 32px;
  color: #4A90E2;
  margin: 0 0 8px 0;
  font-weight: 700;
  background: linear-gradient(135deg, #4A90E2 0%, #00BCD4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.settings-btn {
  position: absolute;
  top: 20px;
  right: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.settings-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(74, 144, 226, 0.4);
}

.app-main {
  flex: 1;
  padding: 40px 20px;
}

@media (max-width: 640px) {
  .app-header {
    padding: 16px 20px;
  }
  
  .app-title {
    font-size: 24px;
  }
  
  .app-subtitle {
    font-size: 14px;
  }
  
  .settings-btn {
    position: static;
    margin-top: 12px;
    width: 100%;
    justify-content: center;
  }
  
  .app-main {
    padding: 20px 12px;
  }
}
</style>
