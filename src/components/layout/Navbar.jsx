import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import logoPrincipal from '../../assets/logoPrincipal.png';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            <img src={logoPrincipal} alt="Cali Sin Huecos" className="navbar-logo" />
          </Link>
          
          <button className="navbar-toggle" onClick={toggleMenu} aria-label="Toggle menu">
            {menuOpen ? '✕' : '☰'}
          </button>
          
          <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
            <Link to="/reports" className="navbar-link" onClick={closeMenu}>
              Reportes
            </Link>
            
            {user ? (
              <>
                <Link to="/create-report" className="navbar-link" onClick={closeMenu}>
                  Reportar Hueco
                </Link>
                {(user.role === 'admin' || user.role === 'repairer') && (
                  <Link to="/dashboard" className="navbar-link" onClick={closeMenu}>
                    Dashboard
                  </Link>
                )}
                <Link to="/profile" className="navbar-link" onClick={closeMenu}>
                  Mi Perfil
                </Link>
                <button onClick={handleLogout} className="btn btn-secondary">
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="navbar-link" onClick={closeMenu}>
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="btn btn-primary" onClick={closeMenu}>
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

