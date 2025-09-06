import { useState, useEffect } from 'react';
import { User, AuthState } from '../types/auth';
import { api, LoginRequest } from '../services/api';

const TOKEN_KEY = 'access_token';
const USER_KEY = 'auth_user';

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setAuth({
          user,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (error) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setAuth({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } else {
      setAuth({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  }, []);

  const login = async (username: string, password: string) => {
    setAuth(prev => ({ ...prev, isLoading: true }));

    try {
      const credentials: LoginRequest = { username, password };
      const response = await api.login(credentials);
      
      const user: User = {
        id: response.user.username,
        name: response.user.username,
        email: response.user.email || `${response.user.username}@company.com`,
        role: response.user.role as 'admin' | 'manager' | 'member'
      };

      localStorage.setItem(TOKEN_KEY, response.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setAuth({
        user,
        isAuthenticated: true,
        isLoading: false
      });

      return response;
    } catch (error) {
      setAuth(prev => ({ ...prev, isLoading: false }));
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('Kết nối bị timeout. Vui lòng kiểm tra mạng và thử lại.');
        } else if (error.message.includes('CORS')) {
          throw new Error('Lỗi kết nối server. Vui lòng liên hệ quản trị viên.');
        }
      }
      
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuth({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
  };

  return {
    ...auth,
    login,
    logout,
    getToken
  };
}