import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
 const [user, setUser] = useState(null);
 const [token, setToken] = useState(localStorage.getItem('token'));
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 if (token) {
 api.get('/auth/me')
 .then((res) => setUser(res.data))
 .catch(() => { logout(); })
 .finally(() => setLoading(false));
 } else {
 setLoading(false);
 }
 }, [token]);

 const login = async (email, password) => {
 const res = await api.post('/auth/login', { email, password });
 localStorage.setItem('token', res.data.token);
 localStorage.setItem('user', JSON.stringify(res.data.user));
 setToken(res.data.token);
 setUser(res.data.user);
 return res.data;
 };

 const register = async (data) => {
 const res = await api.post('/auth/register', data);
 localStorage.setItem('token', res.data.token);
 localStorage.setItem('user', JSON.stringify(res.data.user));
 setToken(res.data.token);
 setUser(res.data.user);
 return res.data;
 };

 const logout = () => {
 localStorage.removeItem('token');
 localStorage.removeItem('user');
 setToken(null);
 setUser(null);
 };

 return (
 <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
 {children}
 </AuthContext.Provider>
 );
}

export const useAuth = () => useContext(AuthContext);
