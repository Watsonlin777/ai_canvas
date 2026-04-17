import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'

export function useDraggablePanel(options = {}) {
  const {
    minWidth = 300,
    minHeight = 200,
    maxWidth = window.innerWidth,
    maxHeight = window.innerHeight,
    initialWidth = null,
    initialHeight = null,
    enableResize = true,
    enableDrag = true,
    enableMaximize = true
  } = options

  const panelRef = ref(null)
  const headerRef = ref(null)
  
  const isDragging = ref(false)
  const isResizing = ref(false)
  const isMaximized = ref(false)
  
  const position = reactive({
    x: 0,
    y: 0
  })
  
  const size = reactive({
    width: initialWidth || 600,
    height: initialHeight || 400
  })
  
  const savedState = reactive({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  })
  
  const resizeDirection = ref('')
  const dragStart = reactive({ x: 0, y: 0 })
  const resizeStart = reactive({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 })

  const panelStyle = computed(() => {
    if (isMaximized.value) {
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
      left: `${Math.round(position.x)}px`,
      top: `${Math.round(position.y)}px`,
      width: `${Math.round(size.width)}px`,
      minHeight: `${Math.round(size.height)}px`
    }
  })

  function startDrag(e) {
    if (!enableDrag || isMaximized.value) return
    if (e.target.closest('.btn-toggle') || 
        e.target.closest('.toggle-switch') || 
        e.target.closest('button') ||
        e.target.closest('input') ||
        e.target.closest('select')) return
    
    isDragging.value = true
    dragStart.x = e.clientX - position.x
    dragStart.y = e.clientY - position.y
    
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
    
    if (panelRef.value) {
      panelRef.value.style.transition = 'none'
    }
  }

  function onDrag(e) {
    if (!isDragging.value) return
    
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    
    position.x = Math.max(0, Math.min(newX, window.innerWidth - size.width))
    position.y = Math.max(0, Math.min(newY, window.innerHeight - size.height))
  }

  function stopDrag() {
    isDragging.value = false
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
    
    if (panelRef.value) {
      panelRef.value.style.transition = ''
    }
  }

  function startResize(e, direction) {
    if (!enableResize || isMaximized.value) return
    e.preventDefault()
    e.stopPropagation()
    
    isResizing.value = true
    resizeDirection.value = direction
    
    resizeStart.x = e.clientX
    resizeStart.y = e.clientY
    resizeStart.width = size.width
    resizeStart.height = size.height
    resizeStart.left = position.x
    resizeStart.top = position.y
    
    document.addEventListener('mousemove', onResize)
    document.addEventListener('mouseup', stopResize)
    
    if (panelRef.value) {
      panelRef.value.style.transition = 'none'
    }
  }

  function onResize(e) {
    if (!isResizing.value) return
    
    const deltaX = e.clientX - resizeStart.x
    const deltaY = e.clientY - resizeStart.y
    const dir = resizeDirection.value
    
    let newWidth = resizeStart.width
    let newHeight = resizeStart.height
    let newX = resizeStart.left
    let newY = resizeStart.top
    
    if (dir.includes('e')) {
      newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStart.width + deltaX))
    }
    if (dir.includes('w')) {
      const widthChange = Math.min(deltaX, resizeStart.width - minWidth)
      newWidth = resizeStart.width - widthChange
      newX = resizeStart.left + widthChange
    }
    if (dir.includes('s')) {
      newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStart.height + deltaY))
    }
    if (dir.includes('n')) {
      const heightChange = Math.min(deltaY, resizeStart.height - minHeight)
      newHeight = resizeStart.height - heightChange
      newY = resizeStart.top + heightChange
    }
    
    size.width = newWidth
    size.height = newHeight
    position.x = newX
    position.y = newY
  }

  function stopResize() {
    isResizing.value = false
    resizeDirection.value = ''
    document.removeEventListener('mousemove', onResize)
    document.removeEventListener('mouseup', stopResize)
    
    if (panelRef.value) {
      panelRef.value.style.transition = ''
    }
  }

  function toggleMaximize() {
    if (!enableMaximize) return
    
    if (isMaximized.value) {
      position.x = savedState.x
      position.y = savedState.y
      size.width = savedState.width
      size.height = savedState.height
      isMaximized.value = false
    } else {
      savedState.x = position.x
      savedState.y = position.y
      savedState.width = size.width
      savedState.height = size.height
      isMaximized.value = true
    }
  }

  function initPosition() {
    if (panelRef.value && initialWidth === null && initialHeight === null) {
      const rect = panelRef.value.getBoundingClientRect()
      size.width = rect.width
      size.height = rect.height
    }
  }

  onMounted(() => {
    initPosition()
    
    window.addEventListener('resize', () => {
      if (isMaximized.value) return
      position.x = Math.min(position.x, window.innerWidth - size.width)
      position.y = Math.min(position.y, window.innerHeight - size.height)
    })
  })

  onBeforeUnmount(() => {
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
    document.removeEventListener('mousemove', onResize)
    document.removeEventListener('mouseup', stopResize)
  })

  return {
    panelRef,
    headerRef,
    isDragging,
    isResizing,
    isMaximized,
    position,
    size,
    panelStyle,
    startDrag,
    startResize,
    toggleMaximize,
    initPosition
  }
}

export function createResizeHandles() {
  return [
    { direction: 'n', class: 'resize-handle-n', cursor: 'ns-resize' },
    { direction: 's', class: 'resize-handle-s', cursor: 'ns-resize' },
    { direction: 'e', class: 'resize-handle-e', cursor: 'ew-resize' },
    { direction: 'w', class: 'resize-handle-w', cursor: 'ew-resize' },
    { direction: 'ne', class: 'resize-handle-ne', cursor: 'nesw-resize' },
    { direction: 'nw', class: 'resize-handle-nw', cursor: 'nwse-resize' },
    { direction: 'se', class: 'resize-handle-se', cursor: 'nwse-resize' },
    { direction: 'sw', class: 'resize-handle-sw', cursor: 'nesw-resize' }
  ]
}
