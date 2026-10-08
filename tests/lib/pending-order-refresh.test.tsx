import { act, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
const refresh = vi.hoisted(() => vi.fn())
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }))
import { PendingOrderRefresh } from "@/components/orders/pending-order-refresh"
afterEach(() => { vi.useRealTimers(); refresh.mockClear() })
it("refreshes a pending confirmation so webhook-issued tickets become visible, then stops when paid", () => {
  vi.useFakeTimers()
  const view = render(<PendingOrderRefresh pending />)
  act(() => vi.advanceTimersByTime(2000))
  expect(refresh).toHaveBeenCalledTimes(1)
  view.rerender(<PendingOrderRefresh pending={false} />)
  act(() => vi.advanceTimersByTime(4000))
  expect(refresh).toHaveBeenCalledTimes(1)
})
it("bounds automatic polling and offers a manual status check after two minutes", () => {
  vi.useFakeTimers()
  render(<PendingOrderRefresh pending />)
  act(() => vi.advanceTimersByTime(124000))
  expect(refresh).toHaveBeenCalledTimes(60)
  expect(screen.getByRole("button", { name: "Check payment status" })).toBeInTheDocument()
})
