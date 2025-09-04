import { describe, it, expect } from 'vitest'
import {
  navigate,
  FREIGHT_EDITOR_PATH,
  FREIGHT_SEARCH_PATH,
  PRICEPROPOSAL_PATH,
  VEHICLE_EDITOR_PATH,
  VEHICLE_SEARCH_PATH,
  WAREHOUSE_EDITOR_PATH,
  WAREHOUSE_SEARCH_PATH,
  EBID_TENDERS_PATH,
  EBID_BIDS_PATH,
  ROUTE_AND_COSTS_PATH,
  DEALS_MY_DEALS_PATH,
  DEALS_RECEIVED_DEALS_PATH,
  ORDER_MY_ORDERS_PATH,
  ORDER_RECEIVED_ORDERS_PATH,
  ORDER_STATISTICS_PRINCIPAL_PATH,
  ORDER_STATISTICS_CONTRACTOR_PATH,
  SHIPMENT_PATH,
  FLEET_MY_FLEET_PATH,
  SHRAK_PATH,
  SHRAK_SHARED_VEHICLES_PATH,
  SHRAK_RECEIVED_VEHICLES_PATH,
  VEHICLE_MANAGEMENT_PATH,
  gotoFreightEditor,
  gotoFreightSearch,
  gotoPriceProposals,
  gotoVehicleEditor,
  gotoVehicleSearch,
  gotoWarehouseEditor,
  gotoWarehouseSearch,
  gotoEbidTenders,
  gotoEbidBids,
  gotoRouteAndCosts,
  gotoDealsMyDeals,
  gotoDealsReceivedDeals,
  gotoOrderMyOrders,
  gotoOrderReceivedOrders,
  gotoOrderStatisticsPrincipal,
  gotoOrderStatisticsContractor,
  gotoShipment,
  gotoFleetMyFleet,
  gotoShrak,
  gotoShrakSharedVehicles,
  gotoShrakReceivedVehicles,
  gotoVehicleManagement,
} from './navigation'

// Helper to create a mock Page-like object
function createMockPage(calls: string[]) {
  return { goto: async (u: string) => calls.push(u) }
}

describe('navigate()', () => {
  it('passes relative path verbatim to page.goto', async () => {
    const calls: string[] = []
    const page: any = createMockPage(calls)
    await navigate(page, FREIGHT_EDITOR_PATH)
    expect(calls).toEqual([FREIGHT_EDITOR_PATH])
  })

  it('allows absolute URL (bypassing baseURL resolution semantics)', async () => {
    const calls: string[] = []
    const page: any = createMockPage(calls)
    const abs = 'https://example.com/health'
    await navigate(page, abs)
    expect(calls).toEqual([abs])
  })
})

// Table mapping of goto* functions to their expected path constants
const gotoCases: Array<[string, (p: any) => Promise<void>, string]> = [
  ['gotoFreightEditor', gotoFreightEditor, FREIGHT_EDITOR_PATH],
  ['gotoFreightSearch', gotoFreightSearch, FREIGHT_SEARCH_PATH],
  ['gotoPriceProposals', gotoPriceProposals, PRICEPROPOSAL_PATH],
  ['gotoVehicleEditor', gotoVehicleEditor, VEHICLE_EDITOR_PATH],
  ['gotoVehicleSearch', gotoVehicleSearch, VEHICLE_SEARCH_PATH],
  ['gotoWarehouseEditor', gotoWarehouseEditor, WAREHOUSE_EDITOR_PATH],
  ['gotoWarehouseSearch', gotoWarehouseSearch, WAREHOUSE_SEARCH_PATH],
  ['gotoEbidTenders', gotoEbidTenders, EBID_TENDERS_PATH],
  ['gotoEbidBids', gotoEbidBids, EBID_BIDS_PATH],
  ['gotoRouteAndCosts', gotoRouteAndCosts, ROUTE_AND_COSTS_PATH],
  ['gotoDealsMyDeals', gotoDealsMyDeals, DEALS_MY_DEALS_PATH],
  ['gotoDealsReceivedDeals', gotoDealsReceivedDeals, DEALS_RECEIVED_DEALS_PATH],
  ['gotoOrderMyOrders', gotoOrderMyOrders, ORDER_MY_ORDERS_PATH],
  ['gotoOrderReceivedOrders', gotoOrderReceivedOrders, ORDER_RECEIVED_ORDERS_PATH],
  ['gotoOrderStatisticsPrincipal', gotoOrderStatisticsPrincipal, ORDER_STATISTICS_PRINCIPAL_PATH],
  [
    'gotoOrderStatisticsContractor',
    gotoOrderStatisticsContractor,
    ORDER_STATISTICS_CONTRACTOR_PATH,
  ],
  ['gotoShipment', gotoShipment, SHIPMENT_PATH],
  ['gotoFleetMyFleet', gotoFleetMyFleet, FLEET_MY_FLEET_PATH],
  ['gotoShrak', gotoShrak, SHRAK_PATH],
  ['gotoShrakSharedVehicles', gotoShrakSharedVehicles, SHRAK_SHARED_VEHICLES_PATH],
  ['gotoShrakReceivedVehicles', gotoShrakReceivedVehicles, SHRAK_RECEIVED_VEHICLES_PATH],
  ['gotoVehicleManagement', gotoVehicleManagement, VEHICLE_MANAGEMENT_PATH],
]

describe('goto* functions', () => {
  for (const [name, fn, expected] of gotoCases) {
    it(`${name} calls page.goto with its path constant`, async () => {
      const calls: string[] = []
      const page: any = createMockPage(calls)
      await fn(page)
      expect(calls).toEqual([expected])
    })
  }
})
