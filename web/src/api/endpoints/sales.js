import client from '../client';
export const truckSale    = (data)      => client.post('/sales/truck', data);
export const shopSale     = (data)      => client.post('/sales/shop', data);
export const getLiveStock = (sessionId) => client.get(`/sales/live-stock/${sessionId}`);
export const getSalesHistory = (params) => client.get('/sales/history', { params });
