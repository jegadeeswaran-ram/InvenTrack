import client from '../client';
export const createDispatch  = (data)      => client.post('/dispatch', data);
export const getTodayDispatch= (branchId)  => client.get(`/dispatch/today/${branchId}`);
export const getSession      = (sessionId) => client.get(`/dispatch/session/${sessionId}`);
export const getMySession    = ()          => client.get('/dispatch/my-session');
