import client from '../client';
export const submitClosing  = (data)   => client.post('/closing/submit', data);
export const getPending     = (params) => client.get('/closing/pending', { params });
export const getClosing     = (id)     => client.get(`/closing/${id}`);
export const approveClosing = (id, d)  => client.post(`/closing/approve/${id}`, d);
export const getStatus      = (sid)    => client.get(`/closing/status/${sid}`);
