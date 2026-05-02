import client from '../client';
export const login   = (data) => client.post('/auth/login', data);
export const refresh = (data) => client.post('/auth/refresh', data);
export const logout  = (data) => client.post('/auth/logout', data);
