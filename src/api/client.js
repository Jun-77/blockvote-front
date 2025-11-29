// Route through Vercel function in production; Vite dev proxy handles local.
const API_BASE_URL = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json || json.success === false) {
    const message = (json && json.message) || '요청이 실패했습니다.';
    throw new Error(message);
  }
  return json.data !== undefined ? json.data : json; // 서버가 통일 포맷 사용
}

// 사용자 API
export const userAPI = {
  register: async (walletAddress, email = null) => {
    return request('/users/register', {
      method: 'POST',
      body: JSON.stringify({ walletAddress })
    });
  },

  getByWallet: async (walletAddress) => {
    return request(`/users/${walletAddress}`);
  },

  getOrganizations: async (walletAddress) => {
    return request(`/users/${walletAddress}/organizations`);
  }
};

// 기관 API
export const organizationAPI = {
  getMine: async () => {
    return request('/organizations/mine');
  },
  updateAdmin: async (id, adminAddress) => {
    return request(`/organizations/${id}/admin`, {
      method: 'PATCH',
      body: JSON.stringify({ adminAddress })
    });
  },
  register: async (name, businessNumber, adminAddress) => {
    return request('/organizations/register', {
      method: 'POST',
      body: JSON.stringify({ name, businessNumber, adminAddress })
    });
  },

  getAll: async () => {
    return request('/organizations');
  },

  getById: async (id) => {
    return request(`/organizations/${id}`);
  },

  getVotes: async (id) => {
    return request(`/organizations/${id}/votes`);
  },

  generateAuthCodes: async (id, count = 10, expiryDays = 30) => {
    return request(`/organizations/${id}/generate-codes`, {
      method: 'POST',
      body: JSON.stringify({ count, expiryDays })
    });
  },

  addCredit: async (id, amount) => {
    return request(`/organizations/${id}/credit`, {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }
};

// 투표 API
export const voteAPI = {
  create: async (voteData) => {
    return request('/votes', { method: 'POST', body: JSON.stringify(voteData) });
  },

  getAll: async () => {
    return request('/votes');
  },

  getAvailable: async (walletAddress) => {
    return request(`/votes/available/${walletAddress}`);
  },

  getById: async (id, walletAddress = null) => {
    const url = walletAddress
      ? `/votes/${id}?walletAddress=${walletAddress}`
      : `/votes/${id}`;
    return request(url);
  },

  submit: async (voteId, walletAddress, optionIndex, signature) => {
    return request(`/votes/${voteId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ walletAddress, optionIndex, signature })
    });
  },

  getResults: async (voteId) => {
    return request(`/votes/${voteId}/results`);
  }
};

// 인증 API
export const authAPI = {
  requestNonce: async (address) => {
    return request('/auth/nonce', { method: 'POST', body: JSON.stringify({ address }) });
  },
  verifySignature: async (address, signature, message) => {
    return request('/auth/verify-signature', { method: 'POST', body: JSON.stringify({ address, signature, message }) });
  },
  
  getStatus: async (walletAddress) => {
    return request(`/auth/status/${walletAddress}`);
  }
};
