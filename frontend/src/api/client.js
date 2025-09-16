const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

async function request(path, { method = "GET", data, token, headers = {} } = {}) {
  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (data !== undefined && data !== null) {
    config.body = JSON.stringify(data);
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, config);
  const text = await response.text();
  let payload;

  try {
    payload = text ? JSON.parse(text) : {};
  } catch (error) {
    payload = { message: text };
  }

  if (!response.ok) {
    const message = payload?.error || payload?.message || "Request failed";
    const err = new Error(message);
    err.status = response.status;
    err.details = payload;
    throw err;
  }

  return payload;
}

const apiClient = {
  request,
  get: (path, token, config = {}) => request(path, { ...config, method: "GET", token }),
  post: (path, data, token, config = {}) =>
    request(path, { ...config, method: "POST", data, token }),
  patch: (path, data, token, config = {}) =>
    request(path, { ...config, method: "PATCH", data, token }),
  del: (path, token, config = {}) => request(path, { ...config, method: "DELETE", token }),
};

export default apiClient;
