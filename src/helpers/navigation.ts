import type { Page } from '@playwright/test'

/**
 * Minimal Wrapper um page.goto – verlässt sich vollständig auf Playwrights baseURL Auflösung.
 *  - einen relativen Pfad (mit oder ohne führenden Slash)
 */
export async function navigate(page: Page, path: string): Promise<void> {
  await page.goto(path)
}

export const FREIGHT_EDITOR_PATH = 'app/tccargo/freights/editor/'
export const FREIGHT_SEARCH_PATH = 'app/tccargo/freights/search/'
export const PRICEPROPOSAL_PATH = 'app/tccargo/freights/priceproposals/'

export const VEHICLE_EDITOR_PATH = 'app/tccargo/vehicles/editor/'
export const VEHICLE_SEARCH_PATH = 'app/tccargo/vehicles/search/'

export const WAREHOUSE_EDITOR_PATH = 'app/tcw/edit'
export const WAREHOUSE_SEARCH_PATH = 'app/tcw/search'

export const EBID_TENDERS_PATH = 'app/tcebid/tenders/'
export const EBID_BIDS_PATH = 'app/tcebid/bids/'

export const ROUTE_AND_COSTS_PATH = 'app/roco/'

export const DEALS_MY_DEALS_PATH = 'app/deals/mydeals/'
export const DEALS_RECEIVED_DEALS_PATH = 'app/deals/received-deals'

export const ORDER_MY_ORDERS_PATH = 'app/tcorder/?tab=myOrders'
export const ORDER_RECEIVED_ORDERS_PATH = 'app/tcorder/?tab=receivedOrders'
export const ORDER_STATISTICS_PRINCIPAL_PATH = 'app/tcorder/statistics/principal'
export const ORDER_STATISTICS_CONTRACTOR_PATH = 'app/tcorder/statistics/contractor'

export const SHIPMENT_PATH = 'app/tcshipment/'

export const FLEET_MY_FLEET_PATH = 'app/tcfleet/'
export const SHRAK_PATH = 'app/shrack/'
export const SHRAK_SHARED_VEHICLES_PATH = 'app/shrack/shared'
export const SHRAK_RECEIVED_VEHICLES_PATH = 'app/shrack/received'
export const VEHICLE_MANAGEMENT_PATH = 'app/tcprofile/edit/devicemanagement'

export async function gotoFreightEditor(page: Page): Promise<void> {
  await navigate(page, FREIGHT_EDITOR_PATH)
}

export async function gotoFreightSearch(page: Page): Promise<void> {
  await navigate(page, FREIGHT_SEARCH_PATH)
}

export async function gotoPriceProposals(page: Page): Promise<void> {
  await navigate(page, PRICEPROPOSAL_PATH)
}

export async function gotoVehicleEditor(page: Page): Promise<void> {
  await navigate(page, VEHICLE_EDITOR_PATH)
}

export async function gotoVehicleSearch(page: Page): Promise<void> {
  await navigate(page, VEHICLE_SEARCH_PATH)
}

export async function gotoWarehouseEditor(page: Page): Promise<void> {
  await navigate(page, WAREHOUSE_EDITOR_PATH)
}

export async function gotoWarehouseSearch(page: Page): Promise<void> {
  await navigate(page, WAREHOUSE_SEARCH_PATH)
}

export async function gotoEbidTenders(page: Page): Promise<void> {
  await navigate(page, EBID_TENDERS_PATH)
}

export async function gotoEbidBids(page: Page): Promise<void> {
  await navigate(page, EBID_BIDS_PATH)
}

export async function gotoRouteAndCosts(page: Page): Promise<void> {
  await navigate(page, ROUTE_AND_COSTS_PATH)
}

export async function gotoDealsMyDeals(page: Page): Promise<void> {
  await navigate(page, DEALS_MY_DEALS_PATH)
}

export async function gotoDealsReceivedDeals(page: Page): Promise<void> {
  await navigate(page, DEALS_RECEIVED_DEALS_PATH)
}

export async function gotoOrderMyOrders(page: Page): Promise<void> {
  await navigate(page, ORDER_MY_ORDERS_PATH)
}

export async function gotoOrderReceivedOrders(page: Page): Promise<void> {
  await navigate(page, ORDER_RECEIVED_ORDERS_PATH)
}

export async function gotoOrderStatisticsPrincipal(page: Page): Promise<void> {
  await navigate(page, ORDER_STATISTICS_PRINCIPAL_PATH)
}

export async function gotoOrderStatisticsContractor(page: Page): Promise<void> {
  await navigate(page, ORDER_STATISTICS_CONTRACTOR_PATH)
}

export async function gotoShipment(page: Page): Promise<void> {
  await navigate(page, SHIPMENT_PATH)
}

export async function gotoFleetMyFleet(page: Page): Promise<void> {
  await navigate(page, FLEET_MY_FLEET_PATH)
}

export async function gotoShrak(page: Page): Promise<void> {
  await navigate(page, SHRAK_PATH)
}

export async function gotoShrakSharedVehicles(page: Page): Promise<void> {
  await navigate(page, SHRAK_SHARED_VEHICLES_PATH)
}

export async function gotoShrakReceivedVehicles(page: Page): Promise<void> {
  await navigate(page, SHRAK_RECEIVED_VEHICLES_PATH)
}

export async function gotoVehicleManagement(page: Page): Promise<void> {
  await navigate(page, VEHICLE_MANAGEMENT_PATH)
}
