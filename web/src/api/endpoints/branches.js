import client from '../client';
export const getBranches  = ()       => client.get('/branches');
export const createBranch = (data)   => client.post('/branches', data);
export const updateBranch = (id, d)  => client.put(`/branches/${id}`, d);
export const deleteBranch = (id)     => client.delete(`/branches/${id}`);
