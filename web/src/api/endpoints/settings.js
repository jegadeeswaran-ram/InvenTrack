import client from '../client';
export const getPermissions      = ()      => client.get('/settings/permissions');
export const getPermissionsByRole= (role)  => client.get(`/settings/permissions/${role}`);
export const updatePermissions   = (data)  => client.put('/settings/permissions', data);
export const getAuditLog         = (params)=> client.get('/settings/audit-log', { params });
export const getUsers            = (params)=> client.get('/users', { params });
export const createUser          = (data)  => client.post('/users', data);
export const updateUser          = (id, d) => client.put(`/users/${id}`, d);
export const deleteUser          = (id)    => client.delete(`/users/${id}`);
