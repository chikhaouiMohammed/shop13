import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';  // Import the CSS file
import { db } from '../../../../Data/firebase';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);  // Clear previous error messages

    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/admin');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('Admin not found');
      } else if (err.code === 'auth/wrong-password') {
        setError('Invalid password');
      } else {
        setError('Error logging in, please try again');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Admin Login</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
