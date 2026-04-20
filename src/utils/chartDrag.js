export function useChartDrag(options = {}) {
  const {
    onDragStart = () => {},
    onDragMove = () => {},
    onDragEnd = () => {},
    getValueFromPosition = null,
    enableTouch = true,
    enableMouse = true,
    throttleMs = 16
  } = options

  let isDragging = false
  let dragIndex = -1
  let lastMoveTime = 0
  let touchId = null

  function throttle(callback, delay) {
    return function(...args) {
      const now = Date.now()
      if (now - lastMoveTime >= delay) {
        callback.apply(this, args)
        lastMoveTime = now
      }
    }
  }

  function handleDragStart(params, event) {
    if (params.componentType !== 'series') return
    
    const chartType = params.seriesType
    if (chartType !== 'bar' && chartType !== 'line' && chartType !== 'scatter') return
    
    isDragging = true
    dragIndex = params.dataIndex
    
    onDragStart({
      index: dragIndex,
      value: params.value,
      event: event,
      seriesType: chartType
    })
    
    if (event) {
      event.preventDefault && event.preventDefault()
    }
  }

  function handleDragMove(event, chartContainer, chartInstance) {
    if (!isDragging || dragIndex < 0) return
    
    const clientY = event.clientY || (event.touches && event.touches[0]?.clientY)
    if (clientY === undefined) return
    
    const rect = chartContainer.getBoundingClientRect()
    const gridInfo = getGridInfo(chartInstance)
    
    if (!gridInfo) return
    
    const relativeY = clientY - rect.top - gridInfo.top
    const chartHeight = gridInfo.height
    const maxValue = gridInfo.maxValue
    const minValue = gridInfo.minValue
    
    let newValue
    if (getValueFromPosition) {
      newValue = getValueFromPosition(relativeY, chartHeight, maxValue, minValue)
    } else {
      const ratio = 1 - (relativeY / chartHeight)
      newValue = Math.round(minValue + ratio * (maxValue - minValue))
    }
    
    newValue = Math.max(minValue, Math.min(maxValue, newValue))
    
    onDragMove({
      index: dragIndex,
      value: newValue,
      event: event
    })
  }

  function handleDragEnd(event) {
    if (!isDragging) return
    
    onDragEnd({
      index: dragIndex,
      event: event
    })
    
    isDragging = false
    dragIndex = -1
    touchId = null
  }

  function getGridInfo(chartInstance) {
    if (!chartInstance) return null
    
    try {
      const model = chartInstance.getModel()
      const grid = model.getComponent('grid')
      if (!grid || !grid.coordinateSystem || typeof grid.coordinateSystem.getArea !== 'function') return null
      
      const gridRect = grid.coordinateSystem.getArea()
      const yAxis = model.getComponent('yAxis')
      if (!yAxis || !yAxis.axis) return null
      
      const extent = yAxis.axis.getExtent()
      
      return {
        top: gridRect.y,
        height: gridRect.height,
        maxValue: extent[1],
        minValue: extent[0]
      }
    } catch (error) {
      console.warn('Failed to get grid info:', error)
      return null
    }
  }

  function setupMouseEvents(chartContainer, chartInstance) {
    if (!enableMouse) return
    
    const throttledMove = throttle((e) => {
      handleDragMove(e, chartContainer, chartInstance)
    }, throttleMs)
    
    const mouseUpHandler = (e) => {
      handleDragEnd(e)
      document.removeEventListener('mousemove', throttledMove)
      document.removeEventListener('mouseup', mouseUpHandler)
    }
    
    return {
      mousedown: (params) => {
        handleDragStart(params, params.event?.event)
        if (isDragging) {
          document.addEventListener('mousemove', throttledMove)
          document.addEventListener('mouseup', mouseUpHandler)
        }
      }
    }
  }

  function setupTouchEvents(chartContainer, chartInstance) {
    if (!enableTouch) return
    
    const throttledMove = throttle((e) => {
      if (touchId !== null) {
        const touch = Array.from(e.touches).find(t => t.identifier === touchId)
        if (touch) {
          handleDragMove({ ...e, clientY: touch.clientY }, chartContainer, chartInstance)
        }
      }
    }, throttleMs)
    
    return {
      touchstart: (params) => {
        if (params.event?.event?.touches) {
          touchId = params.event.event.touches[0].identifier
        }
        handleDragStart(params, params.event?.event)
        if (isDragging) {
          chartContainer.addEventListener('touchmove', throttledMove, { passive: false })
          chartContainer.addEventListener('touchend', handleTouchEnd)
          chartContainer.addEventListener('touchcancel', handleTouchEnd)
        }
      }
    }
    
    function handleTouchEnd(e) {
      handleDragEnd(e)
      chartContainer.removeEventListener('touchmove', throttledMove)
      chartContainer.removeEventListener('touchend', handleTouchEnd)
      chartContainer.removeEventListener('touchcancel', handleTouchEnd)
    }
  }

  return {
    isDragging: () => isDragging,
    getDragIndex: () => dragIndex,
    setupMouseEvents,
    setupTouchEvents,
    handleDragStart,
    handleDragMove,
    handleDragEnd
  }
}

export function createDragFeedback(container, options = {}) {
  const {
    formatValue = (val) => val.toFixed(1),
    position = 'top',
    offset = 10,
    duration = 200,
    edgeThreshold = 0.1,
    showEdgeWarning = true,
    fixedContainer = null,
    fixedPosition = 'center'
  } = options
  
  let feedbackEl = null
  let edgeIndicatorEl = null
  let styleEl = null
  let targetContainer = fixedContainer || container
  
  function getFixedContainer() {
    if (typeof fixedContainer === 'string') {
      return document.querySelector(fixedContainer)
    }
    if (fixedContainer instanceof HTMLElement) {
      return fixedContainer
    }
    if (!fixedContainer) {
      const headerEl = container.querySelector('.chart-header')
      if (headerEl) return headerEl
    }
    return container
  }
  
  function injectStyles() {
    if (styleEl) return
    
    styleEl = document.createElement('style')
    styleEl.textContent = `
      @keyframes feedbackFadeIn {
        from {
          opacity: 0;
          transform: translateY(-5px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      @keyframes feedbackFadeOut {
        from {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateY(-5px) scale(0.95);
        }
      }
      
      @keyframes edgePulse {
        0%, 100% {
          box-shadow: 0 2px 8px rgba(231, 76, 60, 0.4);
        }
        50% {
          box-shadow: 0 4px 16px rgba(231, 76, 60, 0.6);
        }
      }
      
      @keyframes valueChange {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); }
        100% { transform: scale(1); }
      }

      .chart-drag-feedback-fixed {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 6px 14px;
        border-radius: 16px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 3px 10px rgba(102, 126, 234, 0.35);
        pointer-events: none;
        white-space: nowrap;
        animation: feedbackFadeIn ${duration}ms ease;
        z-index: 100;
        transition: background 0.3s ease, box-shadow 0.3s ease;
      }
      
      .chart-drag-feedback-fixed.edge-max {
        background: linear-gradient(135deg, #E74C3C 0%, #C0392B 100%) !important;
        animation: feedbackFadeIn ${duration}ms ease, edgePulse 0.8s ease-in-out infinite !important;
      }
      
      .chart-drag-feedback-fixed.edge-min {
        background: linear-gradient(135deg, #3498DB 0%, #2980B9 100%) !important;
        animation: feedbackFadeIn ${duration}ms ease, edgePulse 0.8s ease-in-out infinite !important;
      }
      
      .chart-drag-feedback-fixed .feedback-value {
        animation: valueChange 0.25s ease;
      }
      
      .chart-drag-feedback-fixed .feedback-label {
        font-size: 11px;
        opacity: 0.85;
        font-weight: 500;
      }
      
      .chart-drag-feedback-fixed .feedback-icon {
        font-size: 12px;
      }
      
      .chart-drag-feedback {
        transition: background 0.3s ease, box-shadow 0.3s ease;
      }
      
      .chart-drag-feedback.edge-max {
        background: linear-gradient(135deg, #E74C3C 0%, #C0392B 100%) !important;
        animation: edgePulse 0.8s ease-in-out infinite !important;
      }
      
      .chart-drag-feedback.edge-min {
        background: linear-gradient(135deg, #3498DB 0%, #2980B9 100%) !important;
        animation: edgePulse 0.8s ease-in-out infinite !important;
      }
      
      .chart-edge-indicator {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        padding: 6px 12px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        pointer-events: none;
        z-index: 9998;
        white-space: nowrap;
        animation: edgeIndicatorFadeIn 0.3s ease;
      }
      
      .chart-edge-indicator.max {
        top: 10px;
        background: rgba(231, 76, 60, 0.9);
      }
      
      .chart-edge-indicator.min {
        bottom: 10px;
        background: rgba(52, 152, 219, 0.9);
      }
    `
    document.head.appendChild(styleEl)
  }
  
  function getEdgeState(value, minValue, maxValue) {
    if (!showEdgeWarning) return null
    
    const range = maxValue - minValue
    const threshold = range * edgeThreshold
    
    if (value >= maxValue - threshold) {
      return 'max'
    } else if (value <= minValue + threshold) {
      return 'min'
    }
    
    return null
  }
  
  function show(value, x, y, minValue = 0, maxValue = 100) {
    hide()
    injectStyles()
    
    const edgeState = getEdgeState(value, minValue, maxValue)
    
    feedbackEl = document.createElement('div')
    const isFixedMode = !!getFixedContainer()
    
    if (isFixedMode) {
      targetContainer = getFixedContainer()
      feedbackEl.className = 'chart-drag-feedback-fixed'
      
      let additionalClass = ''
      if (edgeState === 'max') {
        additionalClass = 'edge-max'
      } else if (edgeState === 'min') {
        additionalClass = 'edge-min'
      }
      
      feedbackEl.className += ` ${additionalClass}`
      
      feedbackEl.innerHTML = `
        <span class="feedback-icon">📊</span>
        <span class="feedback-label">当前值:</span>
        <span class="feedback-value">${formatValue(value)}</span>
      `
      
      const positionStyles = {
        center: {
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        },
        right: {
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)'
        },
        left: {
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)'
        }
      }
      
      Object.assign(feedbackEl.style, positionStyles[fixedPosition] || positionStyles.center)
      
      targetContainer.appendChild(feedbackEl)
    } else {
      feedbackEl.className = 'chart-drag-feedback'
      feedbackEl.textContent = formatValue(value)
      
      let additionalClass = ''
      if (edgeState === 'max') {
        additionalClass = 'edge-max'
      } else if (edgeState === 'min') {
        additionalClass = 'edge-min'
      }
      
      feedbackEl.className += ` ${additionalClass}`
      feedbackEl.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y - offset}px;
        transform: translate(-50%, -100%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 16px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        pointer-events: none;
        z-index: 9999;
        white-space: nowrap;
        animation: feedbackFadeIn ${duration}ms ease;
      `
      
      container.appendChild(feedbackEl)
    }
    
    if (edgeState && showEdgeWarning && !isFixedMode) {
      showEdgeIndicator(edgeState, x)
    }
  }
  
  function showEdgeIndicator(edgeState, x) {
    if (edgeIndicatorEl) {
      edgeIndicatorEl.remove()
    }
    
    edgeIndicatorEl = document.createElement('div')
    edgeIndicatorEl.className = `chart-edge-indicator ${edgeState}`
    
    if (edgeState === 'max') {
      edgeIndicatorEl.textContent = '⚠️ 接近最大值'
    } else if (edgeState === 'min') {
      edgeIndicatorEl.textContent = '⚠️ 接近最小值'
    }
    
    edgeIndicatorEl.style.left = `${x}px`
    
    container.appendChild(edgeIndicatorEl)
  }
  
  function hide() {
    if (feedbackEl) {
      feedbackEl.style.animation = `feedbackFadeOut ${duration}ms ease`
      setTimeout(() => {
        feedbackEl?.remove()
        feedbackEl = null
      }, duration)
    }
    
    if (edgeIndicatorEl) {
      edgeIndicatorEl.remove()
      edgeIndicatorEl = null
    }
  }
  
  function update(value, x, y, minValue = 0, maxValue = 100) {
    if (feedbackEl) {
      const isFixedMode = feedbackEl.classList.contains('chart-drag-feedback-fixed')
      const edgeState = getEdgeState(value, minValue, maxValue)
      
      if (isFixedMode) {
        const valueEl = feedbackEl.querySelector('.feedback-value')
        if (valueEl) {
          valueEl.textContent = formatValue(value)
          valueEl.style.animation = 'none'
          void valueEl.offsetWidth
          valueEl.style.animation = 'valueChange 0.25s ease'
        }
        
        feedbackEl.classList.remove('edge-max', 'edge-min')
        if (edgeState === 'max') {
          feedbackEl.classList.add('edge-max')
        } else if (edgeState === 'min') {
          feedbackEl.classList.add('edge-min')
        }
      } else {
        feedbackEl.textContent = formatValue(value)
        feedbackEl.style.left = `${x}px`
        feedbackEl.style.top = `${y - offset}px`
        
        feedbackEl.classList.remove('edge-max', 'edge-min')
        if (edgeState === 'max') {
          feedbackEl.classList.add('edge-max')
        } else if (edgeState === 'min') {
          feedbackEl.classList.add('edge-min')
        }
        
        if (edgeState && showEdgeWarning) {
          showEdgeIndicator(edgeState, x)
        } else if (edgeIndicatorEl) {
          edgeIndicatorEl.remove()
          edgeIndicatorEl = null
        }
      }
    } else {
      show(value, x, y, minValue, maxValue)
    }
  }
  
  return {
    show,
    hide,
    update,
    setFixedContainer: (newContainer) => {
      fixedContainer = newContainer
    },
    getTargetContainer: () => targetContainer
  }
}

export function animateValueChange(chartInstance, seriesIndex, dataIndex, fromValue, toValue, duration = 300) {
  if (!chartInstance) return
  
  const startTime = Date.now()
  const option = chartInstance.getOption()
  
  function animate() {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    
    const currentValue = fromValue + (toValue - fromValue) * easeProgress
    
    if (option.series[seriesIndex] && option.series[seriesIndex].data) {
      option.series[seriesIndex].data[dataIndex] = currentValue
      chartInstance.setOption(option, { notMerge: false, lazyUpdate: true })
    }
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  
  requestAnimationFrame(animate)
}
