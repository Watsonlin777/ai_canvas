import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useChartDrag, createDragFeedback, animateValueChange } from './chartDrag'

describe('chartDrag', () => {
  describe('useChartDrag', () => {
    let dragHandler
    let mockOnDragStart
    let mockOnDragMove
    let mockOnDragEnd
    let mockChartContainer
    let mockChartInstance

    beforeEach(() => {
      mockOnDragStart = vi.fn()
      mockOnDragMove = vi.fn()
      mockOnDragEnd = vi.fn()
      
      dragHandler = useChartDrag({
        onDragStart: mockOnDragStart,
        onDragMove: mockOnDragMove,
        onDragEnd: mockOnDragEnd,
        throttleMs: 0
      })

      mockChartContainer = {
        getBoundingClientRect: () => ({
          top: 0,
          left: 0,
          width: 400,
          height: 300
        })
      }

      mockChartInstance = {
        getModel: () => ({
          getComponent: (name) => {
            if (name === 'grid') {
              return {
                coordinateSystem: {
                  getArea: () => ({
                    y: 50,
                    height: 200
                  })
                }
              }
            }
            if (name === 'yAxis') {
              return {
                axis: {
                  getExtent: () => [0, 100]
                }
              }
            }
            return null
          }
        }),
        convertToPixel: () => [200, 150]
      }
    })

    describe('handleDragStart', () => {
      it('should start drag on valid series', () => {
        const params = {
          componentType: 'series',
          seriesType: 'bar',
          dataIndex: 0,
          value: 50
        }
        
        dragHandler.handleDragStart(params, null)
        
        expect(mockOnDragStart).toHaveBeenCalledWith({
          index: 0,
          value: 50,
          event: null,
          seriesType: 'bar'
        })
      })

      it('should not start drag on invalid series type', () => {
        const params = {
          componentType: 'series',
          seriesType: 'pie',
          dataIndex: 0,
          value: 50
        }
        
        dragHandler.handleDragStart(params, null)
        
        expect(mockOnDragStart).not.toHaveBeenCalled()
      })

      it('should not start drag on non-series component', () => {
        const params = {
          componentType: 'title',
          dataIndex: 0,
          value: 50
        }
        
        dragHandler.handleDragStart(params, null)
        
        expect(mockOnDragStart).not.toHaveBeenCalled()
      })
    })

    describe('handleDragMove', () => {
      it('should not move if not dragging', () => {
        const event = { clientY: 150 }
        
        dragHandler.handleDragMove(event, mockChartContainer, mockChartInstance)
        
        expect(mockOnDragMove).not.toHaveBeenCalled()
      })

      it('should calculate correct value during drag', () => {
        const startParams = {
          componentType: 'series',
          seriesType: 'bar',
          dataIndex: 0,
          value: 50
        }
        
        dragHandler.handleDragStart(startParams, null)
        
        const moveEvent = { clientY: 150 }
        dragHandler.handleDragMove(moveEvent, mockChartContainer, mockChartInstance)
        
        expect(mockOnDragMove).toHaveBeenCalled()
        const callArgs = mockOnDragMove.mock.calls[0][0]
        expect(callArgs.value).toBeLessThanOrEqual(100)
      })
    })

    describe('handleDragEnd', () => {
      it('should end drag and call callback', () => {
        const startParams = {
          componentType: 'series',
          seriesType: 'bar',
          dataIndex: 0,
          value: 50
        }
        
        dragHandler.handleDragStart(startParams, null)
        expect(dragHandler.isDragging()).toBe(true)
        
        dragHandler.handleDragEnd(null)
        
        expect(mockOnDragEnd).toHaveBeenCalled()
        expect(dragHandler.isDragging()).toBe(false)
        expect(dragHandler.getDragIndex()).toBe(-1)
      })

      it('should not call callback if not dragging', () => {
        dragHandler.handleDragEnd(null)
        
        expect(mockOnDragEnd).not.toHaveBeenCalled()
      })
    })
  })

  describe('createDragFeedback', () => {
    let container
    let feedback

    beforeEach(() => {
      container = document.createElement('div')
      container.style.position = 'relative'
      container.style.width = '400px'
      container.style.height = '300px'
      document.body.appendChild(container)
    })

    afterEach(() => {
      if (feedback) {
        feedback.hide()
      }
      document.body.removeChild(container)
    })

    it('should create feedback element', () => {
      feedback = createDragFeedback(container, {
        formatValue: (val) => val.toFixed(1),
        duration: 100
      })
      
      feedback.show(50, 200, 150, 0, 100)
      
      const feedbackEl = container.querySelector('.chart-drag-feedback')
      expect(feedbackEl).not.toBeNull()
      expect(feedbackEl.textContent).toBe('50.0')
    })

    it('should show edge warning for max value', () => {
      feedback = createDragFeedback(container, {
        showEdgeWarning: true,
        edgeThreshold: 0.1
      })
      
      feedback.show(95, 200, 150, 0, 100)
      
      const feedbackEl = container.querySelector('.chart-drag-feedback')
      expect(feedbackEl.classList.contains('edge-max')).toBe(true)
    })

    it('should show edge warning for min value', () => {
      feedback = createDragFeedback(container, {
        showEdgeWarning: true,
        edgeThreshold: 0.1
      })
      
      feedback.show(5, 200, 150, 0, 100)
      
      const feedbackEl = container.querySelector('.chart-drag-feedback')
      expect(feedbackEl.classList.contains('edge-min')).toBe(true)
    })

    it('should not show edge warning when disabled', () => {
      feedback = createDragFeedback(container, {
        showEdgeWarning: false,
        edgeThreshold: 0.1
      })
      
      feedback.show(95, 200, 150, 0, 100)
      
      const feedbackEl = container.querySelector('.chart-drag-feedback')
      expect(feedbackEl.classList.contains('edge-max')).toBe(false)
    })
  })

  describe('animateValueChange', () => {
    let mockChartInstance

    beforeEach(() => {
      mockChartInstance = {
        getOption: () => ({
          series: [{
            data: [10, 20, 30, 40, 50]
          }]
        }),
        setOption: vi.fn()
      }
    })

    it('should animate value change', (done) => {
      animateValueChange(mockChartInstance, 0, 2, 30, 60, 100)
      
      setTimeout(() => {
        expect(mockChartInstance.setOption).toHaveBeenCalled()
        done()
      }, 150)
    })

    it('should not animate if chartInstance is null', () => {
      animateValueChange(null, 0, 2, 30, 60, 100)
    })
  })
})
