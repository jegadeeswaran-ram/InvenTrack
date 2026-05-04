import client from '../client';
export const getProducts  = (params) => client.get('/products', { params });
export const getProduct   = (id)     => client.get(`/products/${id}`);
export const createProduct = (form)  => client.post('/products', form, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateProduct = (id, f) => client.put(`/products/${id}`, f, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteProduct = (id)    => client.delete(`/products/${id}`);
export const getLowStock   = (p)     => client.get('/products/low-stock', { params: p });
