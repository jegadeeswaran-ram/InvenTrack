import client from '../client';
export const getTruckSalesReport   = (p) => client.get('/reports/truck-sales', { params: p });
export const getBranchSalesReport  = (p) => client.get('/reports/branch-sales', { params: p });
export const getInventoryReport    = (p) => client.get('/reports/inventory', { params: p });
export const getPurchaseSalesList  = (p) => client.get('/reports/purchase-sales', { params: p });
