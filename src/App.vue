<template>
  <div class="app-container">
    <header class="app-header">
      <h1 class="app-title">{{ chartStore.title }}</h1>
      <button class="settings-btn" @click="showSettings = !showSettings">
        <span class="icon">⚙️</span>
        设置
      </button>
    </header>
    
    <main class="app-main">
      <aside class="sidebar-left">
        <DataManager />
      </aside>
      
      <section class="chart-area">
        <ChartDisplay />
      </section>
      
      <aside class="sidebar-right">
        <PredictionPanel />
      </aside>
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

const chartStore = useChartStore()
const showSettings = ref(false)
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F8F9FA;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.app-title {
  font-size: 24px;
  color: #4A90E2;
  margin: 0;
}

.settings-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #4A90E2;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.settings-btn:hover {
  background: #357ABD;
  transform: translateY(-2px);
}

.app-main {
  display: flex;
  flex: 1;
  padding: 20px;
  gap: 20px;
}

.sidebar-left {
  width: 280px;
  flex-shrink: 0;
}

.chart-area {
  flex: 1;
  min-width: 0;
}

.sidebar-right {
  width: 280px;
  flex-shrink: 0;
}

@media (max-width: 1200px) {
  .app-main {
    flex-direction: column;
  }
  
  .sidebar-left,
  .sidebar-right {
    width: 100%;
  }
}
</style>
