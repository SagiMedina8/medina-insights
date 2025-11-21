import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulated authentication
    if (email && password) {
      localStorage.setItem("medina_authenticated", "true");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 tracking-tighter">MEDINA</h1>
          <p className="text-sm tracking-wider uppercase text-muted-foreground">
            Audio Insight Platform
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="brutalist-input"
              placeholder="your.email@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="brutalist-input"
              placeholder="••••••••"
              required
            />
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full brutalist-button"
          >
            LOGIN
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Secured by Azure AD B2C
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
