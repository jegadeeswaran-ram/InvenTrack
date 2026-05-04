import client from '../client';
export const getBranchStock = (branchId) => client.get(`/stock/branch/${branchId}`);
export const getTruckStock  = (sessionId)=> client.get(`/stock/truck/${sessionId}`);
export const adjustStock    = (data)     => client.post('/stock/adjust', data);
