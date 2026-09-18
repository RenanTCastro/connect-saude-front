const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');

  if (!token) return false;

  const decoded = parseJwt(token);

  if (!decoded || !decoded.exp) {
    logout();
    return false;
  }

  const now = Math.floor(Date.now() / 1000);

  if (decoded.exp <= now) {
    logout();
    return false;
  }

  return true;
};

export const login = (token) => {
  localStorage.setItem("token", token);
};

export const logout = () => {
  localStorage.removeItem("token");
};