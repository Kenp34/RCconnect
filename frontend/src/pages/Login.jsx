import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(form.email, form.password);
            navigate('/feed');
        } catch {
            setError('Email ou mot de passe incorrect');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow w-96 space-y-4">
                <h2 className="text-2xl font-bold text-center">EnterpriseConnect</h2>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <input type="email" placeholder="Email"
                    className="w-full border p-2 rounded"
                    onChange={e => setForm({ ...form, email: e.target.value })} />
                <input type="password" placeholder="Mot de passe"
                    className="w-full border p-2 rounded"
                    onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="submit"
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                    Se connecter
                </button>
            </form>
        </div>
    );
}