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
      const gridRect = grid.coordinateSystem.getArea()
      const yAxis = model.getComponent('yAxis')
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
    duration = 200
  } = options
  
  let feedbackEl = null
  
  function show(value, x, y) {
    hide()
    
    feedbackEl = document.createElement('div')
    feedbackEl.className = 'chart-drag-feedback'
    feedbackEl.textContent = formatValue(value)
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
    
    const style = document.createElement('style')
    style.textContent = `
      @keyframes feedbackFadeIn {
        from {
          opacity: 0;
          transform: translate(-50%, -100%) scale(0.8);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -100%) scale(1);
        }
      }
    `
    document.head.appendChild(style)
    container.appendChild(feedbackEl)
  }
  
  function hide() {
    if (feedbackEl) {
      feedbackEl.style.animation = `feedbackFadeOut ${duration}ms ease`
      setTimeout(() => {
        feedbackEl?.remove()
        feedbackEl = null
      }, duration)
    }
  }
  
  function update(value, x, y) {
    if (feedbackEl) {
      feedbackEl.textContent = formatValue(value)
      feedbackEl.style.left = `${x}px`
      feedbackEl.style.top = `${y - offset}px`
    } else {
      show(value, x, y)
    }
  }
  
  return {
    show,
    hide,
    update
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
