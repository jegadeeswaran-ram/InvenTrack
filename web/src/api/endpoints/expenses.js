import client from '../client';
export const getExpenses   = (params) => client.get('/expenses', { params });
export const createExpense = (data)   => client.post('/expenses', data);
export const updateExpense = (id, d)  => client.put(`/expenses/${id}`, d);
export const deleteExpense = (id)     => client.delete(`/expenses/${id}`);
