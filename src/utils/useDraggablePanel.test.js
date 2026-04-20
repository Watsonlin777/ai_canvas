import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDraggablePanel, createResizeHandles } from './useDraggablePanel'

describe('useDraggablePanel', () => {
  let panelResult
  let mockPanelElement

  beforeEach(() => {
    mockPanelElement = document.createElement('div')
    mockPanelElement.style.width = '600px'
    mockPanelElement.style.height = '400px'
    document.body.appendChild(mockPanelElement)
  })

  afterEach(() => {
    document.body.removeChild(mockPanelElement)
  })

  describe('initialization', () => {
    it('should initialize with default options', () => {
      panelResult = useDraggablePanel()
      
      expect(panelResult.isDragging.value).toBe(false)
      expect(panelResult.isResizing.value).toBe(false)
      expect(panelResult.isMaximized.value).toBe(false)
    })

    it('should set custom initial dimensions', () => {
      panelResult = useDraggablePanel({
        initialWidth: 800,
        initialHeight: 600
      })
      
      expect(panelResult.size.width).toBe(800)
      expect(panelResult.size.height).toBe(600)
    })

    it('should set minimum dimensions', () => {
      panelResult = useDraggablePanel({
        minWidth: 200,
        minHeight: 150
      })
      
      expect(panelResult.size.width).toBeGreaterThanOrEqual(200)
    })

    it('should have correct refs initialized', () => {
      panelResult = useDraggablePanel()
      
      expect(panelResult.panelRef).toBeDefined()
      expect(panelResult.headerRef).toBeDefined()
    })

    it('should have position initialized', () => {
      panelResult = useDraggablePanel()
      
      expect(panelResult.position).toBeDefined()
      expect(panelResult.position.x).toBeDefined()
      expect(panelResult.position.y).toBeDefined()
    })
  })

  describe('drag functionality', () => {
    beforeEach(() => {
      panelResult = useDraggablePanel({
        enableDrag: true
      })
      panelResult.panelRef.value = mockPanelElement
    })

    it('should not start drag when disabled', () => {
      const panelDisabled = useDraggablePanel({ enableDrag: false })
      panelDisabled.panelRef.value = mockPanelElement
      
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      Object.defineProperty(event, 'target', { value: { closest: () => null } })
      
      panelDisabled.startDrag(event)
      
      expect(panelDisabled.isDragging.value).toBe(false)
    })

    it('should not start drag on buttons', () => {
      const button = document.createElement('button')
      mockPanelElement.appendChild(button)
      
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      Object.defineProperty(event, 'target', { value: button })
      
      panelResult.startDrag(event)
      
      expect(panelResult.isDragging.value).toBe(false)
    })

    it('should not start drag on inputs', () => {
      const input = document.createElement('input')
      mockPanelElement.appendChild(input)
      
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      Object.defineProperty(event, 'target', { value: input })
      
      panelResult.startDrag(event)
      
      expect(panelResult.isDragging.value).toBe(false)
    })

    it('should not start drag on selects', () => {
      const select = document.createElement('select')
      mockPanelElement.appendChild(select)
      
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      Object.defineProperty(event, 'target', { value: select })
      
      panelResult.startDrag(event)
      
      expect(panelResult.isDragging.value).toBe(false)
    })

    it('should not start drag on toggle switches', () => {
      const toggle = document.createElement('div')
      toggle.className = 'toggle-switch'
      mockPanelElement.appendChild(toggle)
      
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      Object.defineProperty(event, 'target', { value: toggle })
      
      panelResult.startDrag(event)
      
      expect(panelResult.isDragging.value).toBe(false)
    })

    it('should not start drag when maximized', () => {
      panelResult.isMaximized.value = true
      
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      Object.defineProperty(event, 'target', { value: { closest: () => null } })
      
      panelResult.startDrag(event)
      
      expect(panelResult.isDragging.value).toBe(false)
    })

    it('should start drag correctly', () => {
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      Object.defineProperty(event, 'target', { value: { closest: () => null } })
      
      panelResult.startDrag(event)
      expect(panelResult.isDragging.value).toBe(true)
    })
  })

  describe('resize functionality', () => {
    beforeEach(() => {
      panelResult = useDraggablePanel({
        enableResize: true
      })
      panelResult.panelRef.value = mockPanelElement
    })

    it('should not start resize when disabled', () => {
      const panelDisabled = useDraggablePanel({ enableResize: false })
      panelDisabled.panelRef.value = mockPanelElement
      
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      
      panelDisabled.startResize(event, 'e')
      
      expect(panelDisabled.isResizing.value).toBe(false)
    })

    it('should not start resize when maximized', () => {
      panelResult.isMaximized.value = true
      
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 })
      
      panelResult.startResize(event, 'e')
      
      expect(panelResult.isResizing.value).toBe(false)
    })
  })

  describe('maximize functionality', () => {
    beforeEach(() => {
      panelResult = useDraggablePanel({
        enableMaximize: true
      })
    })

    it('should not toggle maximize when disabled', () => {
      const panelDisabled = useDraggablePanel({ enableMaximize: false })
      
      panelDisabled.toggleMaximize()
      
      expect(panelDisabled.isMaximized.value).toBe(false)
    })

    it('should maximize panel', () => {
      panelResult.toggleMaximize()
      
      expect(panelResult.isMaximized.value).toBe(true)
    })

    it('should restore panel from maximize', () => {
      const savedX = panelResult.position.x
      const savedY = panelResult.position.y
      const savedWidth = panelResult.size.width
      const savedHeight = panelResult.size.height
      
      panelResult.toggleMaximize()
      expect(panelResult.isMaximized.value).toBe(true)
      
      panelResult.toggleMaximize()
      expect(panelResult.isMaximized.value).toBe(false)
      expect(panelResult.position.x).toBe(savedX)
      expect(panelResult.position.y).toBe(savedY)
      expect(panelResult.size.width).toBe(savedWidth)
      expect(panelResult.size.height).toBe(savedHeight)
    })

    it('should change panel style when maximized', () => {
      panelResult.toggleMaximize()
      
      const style = panelResult.panelStyle.value
      expect(style.position).toBe('fixed')
      expect(style.zIndex).toBe(9999)
    })
  })

  describe('panelStyle computed', () => {
    it('should return maximized style when maximized', () => {
      panelResult = useDraggablePanel()
      panelResult.isMaximized.value = true
      
      const style = panelResult.panelStyle.value
      
      expect(style.position).toBe('fixed')
      expect(style.top).toBe('0')
      expect(style.left).toBe('0')
      expect(style.width).toBe('100vw')
      expect(style.height).toBe('100vh')
      expect(style.zIndex).toBe(9999)
    })

    it('should return normal style when not maximized', () => {
      panelResult = useDraggablePanel()
      panelResult.position.x = 50
      panelResult.position.y = 100
      panelResult.size.width = 600
      panelResult.size.height = 400
      
      const style = panelResult.panelStyle.value
      
      expect(style.position).toBe('relative')
      expect(style.left).toBe('50px')
      expect(style.top).toBe('100px')
      expect(style.width).toBe('600px')
      expect(style.minHeight).toBe('400px')
    })

    it('should round position values', () => {
      panelResult = useDraggablePanel()
      panelResult.position.x = 50.7
      panelResult.position.y = 100.3
      
      const style = panelResult.panelStyle.value
      
      expect(style.left).toBe('51px')
      expect(style.top).toBe('100px')
    })
  })

  describe('createResizeHandles', () => {
    it('should return 8 resize handles', () => {
      const handles = createResizeHandles()
      
      expect(handles).toHaveLength(8)
    })

    it('should include all cardinal directions', () => {
      const handles = createResizeHandles()
      const directions = handles.map(h => h.direction)
      
      expect(directions).toContain('n')
      expect(directions).toContain('s')
      expect(directions).toContain('e')
      expect(directions).toContain('w')
    })

    it('should include all diagonal directions', () => {
      const handles = createResizeHandles()
      const directions = handles.map(h => h.direction)
      
      expect(directions).toContain('ne')
      expect(directions).toContain('nw')
      expect(directions).toContain('se')
      expect(directions).toContain('sw')
    })

    it('should have correct cursor styles for cardinal directions', () => {
      const handles = createResizeHandles()
      
      const nHandle = handles.find(h => h.direction === 'n')
      expect(nHandle.cursor).toBe('ns-resize')
      
      const eHandle = handles.find(h => h.direction === 'e')
      expect(eHandle.cursor).toBe('ew-resize')
    })

    it('should have correct cursor styles for diagonal directions', () => {
      const handles = createResizeHandles()
      
      const neHandle = handles.find(h => h.direction === 'ne')
      expect(neHandle.cursor).toBe('nesw-resize')
      
      const seHandle = handles.find(h => h.direction === 'se')
      expect(seHandle.cursor).toBe('nwse-resize')
    })

    it('should have proper class names', () => {
      const handles = createResizeHandles()
      
      handles.forEach(handle => {
        expect(handle.class).toContain('resize-handle-')
        expect(handle.class).toContain(handle.direction)
      })
    })
  })

  describe('initPosition', () => {
    it('should be a function', () => {
      panelResult = useDraggablePanel()
      
      expect(typeof panelResult.initPosition).toBe('function')
    })
  })
})
