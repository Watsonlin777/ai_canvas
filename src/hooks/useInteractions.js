import { ref, onMounted, onUnmounted } from 'vue'

export function useLocalStorage(key, defaultValue) {
  const value = ref(defaultValue)
  
  const load = () => {
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        value.value = JSON.parse(saved)
      } catch (e) {
        value.value = saved
      }
    }
  }
  
  const save = () => {
    localStorage.setItem(key, JSON.stringify(value.value))
  }
  
  const remove = () => {
    localStorage.removeItem(key)
    value.value = defaultValue
  }
  
  onMounted(load)
  
  return {
    value,
    load,
    save,
    remove
  }
}

export function useTouchDrag(onDrag, onDragEnd) {
  const isDragging = ref(false)
  const startPos = ref({ x: 0, y: 0 })
  
  const handleTouchStart = (e) => {
    isDragging.value = true
    const touch = e.touches[0]
    startPos.value = { x: touch.clientX, y: touch.clientY }
  }
  
  const handleTouchMove = (e) => {
    if (!isDragging.value) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - startPos.value.x
    const deltaY = touch.clientY - startPos.value.y
    onDrag?.({ deltaX, deltaY, x: touch.clientX, y: touch.clientY })
  }
  
  const handleTouchEnd = () => {
    isDragging.value = false
    onDragEnd?.()
  }
  
  onMounted(() => {
    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
  })
  
  onUnmounted(() => {
    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  })
  
  return {
    isDragging
  }
}

export function useMouseDrag(onDrag, onDragEnd) {
  const isDragging = ref(false)
  const startPos = ref({ x: 0, y: 0 })
  
  const handleMouseDown = (e) => {
    isDragging.value = true
    startPos.value = { x: e.clientX, y: e.clientY }
  }
  
  const handleMouseMove = (e) => {
    if (!isDragging.value) return
    const deltaX = e.clientX - startPos.value.x
    const deltaY = e.clientY - startPos.value.y
    onDrag?.({ deltaX, deltaY, x: e.clientX, y: e.clientY })
  }
  
  const handleMouseUp = () => {
    if (isDragging.value) {
      isDragging.value = false
      onDragEnd?.()
    }
  }
  
  onMounted(() => {
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  })
  
  onUnmounted(() => {
    document.removeEventListener('mousedown', handleMouseDown)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  })
  
  return {
    isDragging
  }
}

export function useWindowSize() {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)
  
  const update = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }
  
  onMounted(() => {
    window.addEventListener('resize', update)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })
  
  return {
    width,
    height
  }
}

export function useClickOutside(elementRef, callback) {
  const handleClick = (e) => {
    if (elementRef.value && !elementRef.value.contains(e.target)) {
      callback()
    }
  }
  
  onMounted(() => {
    document.addEventListener('click', handleClick)
  })
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClick)
  })
}
