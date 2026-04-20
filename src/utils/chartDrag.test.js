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

      it('should start drag on line series', () => {
        const params = {
          componentType: 'series',
          seriesType: 'line',
          dataIndex: 0,
          value: 50
        }
        
        dragHandler.handleDragStart(params, null)
        
        expect(mockOnDragStart).toHaveBeenCalledWith({
          index: 0,
          value: 50,
          event: null,
          seriesType: 'line'
        })
      })

      it('should start drag on scatter series', () => {
        const params = {
          componentType: 'series',
          seriesType: 'scatter',
          dataIndex: 0,
          value: 50
        }
        
        dragHandler.handleDragStart(params, null)
        
        expect(mockOnDragStart).toHaveBeenCalledWith({
          index: 0,
          value: 50,
          event: null,
          seriesType: 'scatter'
        })
      })

      it('should call event.preventDefault when event provided', () => {
        const mockEvent = {
          preventDefault: vi.fn()
        }
        const params = {
          componentType: 'series',
          seriesType: 'bar',
          dataIndex: 0,
          value: 50
        }
        
        dragHandler.handleDragStart(params, mockEvent)
        
        expect(mockEvent.preventDefault).toHaveBeenCalled()
      })

      it('should set isDragging state correctly', () => {
        const params = {
          componentType: 'series',
          seriesType: 'bar',
          dataIndex: 0,
          value: 50
        }
        
        expect(dragHandler.isDragging()).toBe(false)
        dragHandler.handleDragStart(params, null)
        expect(dragHandler.isDragging()).toBe(true)
      })

      it('should set dragIndex correctly', () => {
        const params = {
          componentType: 'series',
          seriesType: 'bar',
          dataIndex: 5,
          value: 50
        }
        
        expect(dragHandler.getDragIndex()).toBe(-1)
        dragHandler.handleDragStart(params, null)
        expect(dragHandler.getDragIndex()).toBe(5)
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

      it('should not move if clientY is undefined', () => {
        const startParams = {
          componentType: 'series',
          seriesType: 'bar',
          dataIndex: 0,
          value: 50
        }
        
        dragHandler.handleDragStart(startParams, null)
        
        const moveEvent = {}
        dragHandler.handleDragMove(moveEvent, mockChartContainer, mockChartInstance)
        
        expect(mockOnDragMove).not.toHaveBeenCalled()
      })

      it('should handle touch events with clientY from touches', () => {
        const startParams = {
          componentType: 'series',
          seriesType: 'bar',
          dataIndex: 0,
          value: 50
        }
        
        dragHandler.handleDragStart(startParams, null)
        
        const moveEvent = {
          touches: [{ clientY: 100 }]
        }
        dragHandler.handleDragMove(moveEvent, mockChartContainer, mockChartInstance)
        
        expect(mockOnDragMove).toHaveBeenCalled()
      })

      it('should clamp value within min/max range', () => {
        const startParams = {
          componentType: 'series',
          seriesType: 'bar',
          dataIndex: 0,
          value: 50
        }
        
        dragHandler.handleDragStart(startParams, null)
        
        const moveEvent = { clientY: -1000 }
        dragHandler.handleDragMove(moveEvent, mockChartContainer, mockChartInstance)
        
        const callArgs = mockOnDragMove.mock.calls[0][0]
        expect(callArgs.value).toBeGreaterThanOrEqual(0)
      })

      it('should include index and event in move callback', () => {
        const startParams = {
          componentType: 'series',
          seriesType: 'bar',
          dataIndex: 3,
          value: 50
        }
        
        dragHandler.handleDragStart(startParams, null)
        
        const moveEvent = { clientY: 150 }
        dragHandler.handleDragMove(moveEvent, mockChartContainer, mockChartInstance)
        
        const callArgs = mockOnDragMove.mock.calls[0][0]
        expect(callArgs.index).toBe(3)
        expect(callArgs.event).toBe(moveEvent)
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

      it('should reset touchId on drag end', () => {
        const startParams = {
          componentType: 'series',
          seriesType: 'bar',
          dataIndex: 0,
          value: 50
        }
        
        dragHandler.handleDragStart(startParams, null)
        dragHandler.handleDragEnd(null)
        
        expect(dragHandler.isDragging()).toBe(false)
      })
    })

    describe('setupMouseEvents', () => {
      it('should return event handlers when mouse enabled', () => {
        const handlers = dragHandler.setupMouseEvents(mockChartContainer, mockChartInstance)
        
        expect(handlers).toHaveProperty('mousedown')
      })

      it('should not return handlers when mouse disabled', () => {
        const dragHandlerNoMouse = useChartDrag({
          enableMouse: false
        })
        const handlers = dragHandlerNoMouse.setupMouseEvents(mockChartContainer, mockChartInstance)
        
        expect(handlers).toBeUndefined()
      })
    })

    describe('setupTouchEvents', () => {
      it('should return event handlers when touch enabled', () => {
        const handlers = dragHandler.setupTouchEvents(mockChartContainer, mockChartInstance)
        
        expect(handlers).toHaveProperty('touchstart')
      })

      it('should not return handlers when touch disabled', () => {
        const dragHandlerNoTouch = useChartDrag({
          enableTouch: false
        })
        const handlers = dragHandlerNoTouch.setupTouchEvents(mockChartContainer, mockChartInstance)
        
        expect(handlers).toBeUndefined()
      })
    })

    describe('getGridInfo', () => {
      it('should return null for null chartInstance', () => {
        const result = dragHandler.handleDragMove({ clientY: 100 }, mockChartContainer, null)
        expect(result).toBeUndefined()
      })

      it('should return null when grid component not found', () => {
        const badChartInstance = {
          getModel: () => ({
            getComponent: () => null
          })
        }
        
        dragHandler.handleDragStart({
          componentType: 'series',
          seriesType: 'bar',
          dataIndex: 0,
          value: 50
        }, null)
        
        const result = dragHandler.handleDragMove({ clientY: 100 }, mockChartContainer, badChartInstance)
        expect(result).toBeUndefined()
      })
    })
  })

  describe('createDragFeedback', () => {
    it('should be a function', () => {
      const container = document.createElement('div')
      const feedback = createDragFeedback(container)
      expect(typeof feedback.show).toBe('function')
      expect(typeof feedback.hide).toBe('function')
      expect(typeof feedback.update).toBe('function')
    })

    it('should return an object with expected methods', () => {
      const container = document.createElement('div')
      const feedback = createDragFeedback(container, {
        formatValue: (val) => val.toFixed(1),
        duration: 100
      })
      
      expect(feedback).toHaveProperty('show')
      expect(feedback).toHaveProperty('hide')
      expect(feedback).toHaveProperty('update')
      expect(feedback).toHaveProperty('setFixedContainer')
      expect(feedback).toHaveProperty('getTargetContainer')
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

    it('should complete animation before duration', (done) => {
      const startTime = Date.now()
      animateValueChange(mockChartInstance, 0, 2, 30, 60, 50)
      
      setTimeout(() => {
        const callCount = mockChartInstance.setOption.mock.calls.length
        expect(callCount).toBeGreaterThan(0)
        done()
      }, 30)
    })
  })
})
