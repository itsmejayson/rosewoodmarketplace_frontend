import api from './axios';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadProfileImage: (file) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/users/profile/image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  changePassword: (data) => api.put('/users/change-password', data),
  // Admin
  adminStats: () => api.get('/users/admin/stats'),
  onlineUsers: () => api.get('/users/admin/online'),
  pendingSellers: () => api.get('/users/admin/pending-sellers'),
  approveSeller: (id, approve) => api.patch(`/users/admin/approve/${id}`, { approve }),
  listUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  toggleActive: (id) => api.patch(`/users/${id}/toggle-active`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productAPI = {
  list: (params) => api.get('/products', { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  getCategories: () => api.get('/products/categories'),
  getById: (id) => api.get(`/products/seller/product/${id}`),
  myProducts: (params) => api.get('/products/seller/my-products', { params }),
  stats: () => api.get('/products/seller/stats'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  uploadImages: (id, files) => {
    const form = new FormData();
    files.forEach((f) => form.append('images', f));
    return api.post(`/products/${id}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deleteImage: (id, imageId) => api.delete(`/products/${id}/images/${imageId}`),
};

// ── Cart ──────────────────────────────────────────────────────────────────────
export const cartAPI = {
  get: () => api.get('/cart'),
  addItem: (data) => api.post('/cart/items', data),
  updateItem: (productId, data) => api.put(`/cart/items/${productId}`, data),
  removeItem: (productId, itemId) => itemId
    ? api.delete(`/cart/items/${productId}`, { data: { itemId } })
    : api.delete(`/cart/items/${productId}`),
  clear: () => api.delete('/cart'),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const orderAPI = {
  checkout: (data) => api.post('/orders/checkout', data),
  submitReceipt: (orderId, file) => {
    const form = new FormData();
    form.append('receipt', file);
    return api.post(`/orders/${orderId}/receipt`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  myOrders: (params) => api.get('/orders/my-orders', { params }),
  getOrder: (id) => api.get(`/orders/my-orders/${id}`),
  // Seller
  sellerOrders: (params) => api.get('/orders/seller-orders', { params }),
  getSellerOrder: (id) => api.get(`/orders/seller-orders/${id}`),
  approvePayment: (orderId, data) => api.post(`/orders/${orderId}/approve-payment`, data),
  confirmCash: (orderId) => api.post(`/orders/${orderId}/confirm-cash`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  cancelOrder: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
  confirmOrder: (id, data) => api.post(`/orders/${id}/confirm`, data),
  setDeliveryFee: (id, fee) => api.post(`/orders/${id}/delivery-fee`, { fee }),
  payDeliveryFee: (id) => api.post(`/orders/${id}/pay-delivery-fee`),
};

// ── Stores ────────────────────────────────────────────────────────────────────
export const storeAPI = {
  list: (params) => api.get('/stores', { params }),
  get: (sellerId) => api.get(`/stores/${sellerId}`),
};

// ── Transactions ──────────────────────────────────────────────────────────────
export const transactionAPI = {
  allTransactions: (params) => api.get('/transactions/admin/all', { params }),
  buyerTransactions: (params) => api.get('/transactions/buyer', { params }),
  sellerTransactions: (params) => api.get('/transactions/seller', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  salesReport: (params) => api.get('/transactions/seller/report', { params }),
};

// ── Messages ──────────────────────────────────────────────────────────────────
export const messageAPI = {
  getMessages: (transactionId) => api.get(`/messages/${transactionId}`),
  sendMessage: (transactionId, content, imageFile) => {
    const form = new FormData();
    if (content) form.append('content', content);
    if (imageFile) form.append('image', imageFile);
    return api.post(`/messages/${transactionId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getUnreadCount: () => api.get('/messages/unread-count'),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationAPI = {
  list: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// ── Favorites ─────────────────────────────────────────────────────────────────
export const favoriteAPI = {
  list: () => api.get('/favorites'),
  toggle: (productId) => api.post(`/favorites/${productId}`),
  check: (productId) => api.get(`/favorites/check/${productId}`),
};

// ── Addresses ─────────────────────────────────────────────────────────────────
export const addressAPI = {
  list: () => api.get('/addresses'),
  create: (data) => api.post('/addresses', data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  delete: (id) => api.delete(`/addresses/${id}`),
  setDefault: (id) => api.patch(`/addresses/${id}/default`),
};

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewAPI = {
  create: (data) => api.post('/reviews', data),
  forProduct: (productId) => api.get(`/reviews/product/${productId}`),
  my: () => api.get('/reviews/my'),
  seller: () => api.get('/reviews/seller'),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// ── Refunds ───────────────────────────────────────────────────────────────────
export const refundAPI = {
  request: (orderId, data) => api.post(`/refunds/request/${orderId}`, data),
  process: (orderId, data) => api.patch(`/refunds/${orderId}/process`, data),
  my: () => api.get('/refunds/my'),
  seller: () => api.get('/refunds/seller'),
};


// ── Store settings ────────────────────────────────────────────────────────────
export const storeSettingsAPI = {
  update: (data) => api.put('/stores/settings', data),
};
