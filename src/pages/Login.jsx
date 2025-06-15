// src/pages/Login.jsx
import { useState } from "react";
import { auth } from "../services/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
    <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
    <h2 className="text-3xl font-bold text-white mb-6 text-center">Login</h2>
    <form onSubmit={handleLogin} className="space-y-4">
    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
    <input
    type="email"
    placeholder="Email"
    className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    required
    />
    <input
    type="password"
    placeholder="Password"
    className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
    />
    <button
    type="submit"
    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200"
    >
    Login
    </button>
    </form>
    <div className="text-gray-400 text-sm mt-4 text-center">
    Forgot your password? <a href="#" className="text-blue-400 hover:underline">Reset it</a>
    </div>
    </div>
    </div>
  );

}

export default Login;

