import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/dashboard";

    const handleSuccess = async (credentialResponse) => {
        console.log("Google Response:", credentialResponse);
        try {
            // Exchange ID Token for JWT from our Backend
            const data = await api.post('/auth/google', { idToken: credentialResponse.credential });

            // data should be { token: "...", user: { ... } }
            login(data.token, data.user);
            navigate(from, { replace: true });

        } catch (error) {
            console.error("Login Error:", error);
            alert("Login failed. Please try again.");
        }
    };

    const handleError = () => {
        console.log('Login Failed');
        alert("Google Login Failed");
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <div className="p-8 bg-slate-800 rounded-lg shadow-xl w-96 text-center border border-slate-700">
                <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                <p className="text-slate-400 mb-8">Sign in to access GMB SaaS</p>

                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={handleError}
                        theme="filled_black"
                        shape="pill"
                    />
                </div>

                <p className="mt-6 text-xs text-slate-500">
                    By signing in, you agree to our Terms of Service.
                </p>
            </div>
        </div>
    );
};

export default Login;

