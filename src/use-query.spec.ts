import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { UseQueryOptions, useQuery } from './use-query'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('useQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const runTimers = async (onlyPending = true) => {
    if (onlyPending) {
      await vi.runOnlyPendingTimersAsync()
    } else {
      // vi.runAllTimers()
      await vi.runAllTimersAsync()
    }
    await nextTick()
  }

  const mountSimple = (options: Partial<UseQueryOptions> = {}) => {
    const fetcher = options.fetcher
      ? vi.fn(options.fetcher)
      : vi.fn(async () => {
          await delay(0)
          return 42
        })
    const wrapper = mount(
      {
        render: () => null,
        setup() {
          return {
            ...useQuery({
              key: 'foo',
              ...options,
              fetcher,
            }),
          }
        },
      },
      {
        global: {
          plugins: [createPinia()],
        },
      }
    )
    return { wrapper, fetcher }
  }

  it('fetches data and updates on mount', async () => {
    const { wrapper } = mountSimple()

    expect(wrapper.vm.data).toBeUndefined()
    await runTimers()
    expect(wrapper.vm.data).toBe(42)
  })

  it('sets the fetching state', async () => {
    const { wrapper } = mountSimple()

    expect(wrapper.vm.isFetching).toBe(true)
    await runTimers()
    expect(wrapper.vm.isFetching).toBe(false)
  })

  it('sets the pending state', async () => {
    const { wrapper } = mountSimple()

    expect(wrapper.vm.isPending).toBe(true)
    await runTimers()
    expect(wrapper.vm.isPending).toBe(false)
  })

  it('sets the error state', async () => {
    const { wrapper } = mountSimple({
      fetcher: async () => {
        throw new Error('foo')
      },
    })

    expect(wrapper.vm.error).toBeNull()
    await runTimers()
    expect(wrapper.vm.error).toEqual(new Error('foo'))
  })

  // NOTE: is this worth adding?
  it.skip('it works with a synchronously thrown Error', async () => {
    const { wrapper } = mountSimple({
      fetcher: () => {
        throw new Error('foo')
      },
    })

    expect(wrapper.vm.error).toBeNull()
    await runTimers()
    expect(wrapper.vm.error).toEqual(new Error('foo'))
  })
})
