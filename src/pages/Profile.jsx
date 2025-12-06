import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { usersAPI, donationsAPI } from '../services/api';
import { showSuccess, showError } from '../utils/swal';
import emptyReports from '../assets/emptyReports.png';
import emptyDonations from '../assets/emptyDonations.png';
import emptyProfile from '../assets/emptyProfile.png';
import './Profile.css';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadProfile();
    loadMyReports();
    loadMyDonations();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      const response = await usersAPI.getProfile();
      setProfile(response.data);
      setFormData({
        name: response.data.name,
        phone: response.data.phone || '',
        address: response.data.address || '',
      });
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyReports = async () => {
    try {
      const response = await usersAPI.getMyReports();
      setMyReports(response.data);
    } catch (error) {
      console.error('Error cargando mis reportes:', error);
    }
  };

  const loadMyDonations = async () => {
    try {
      const response = await donationsAPI.getMyDonations();
      setMyDonations(response.data);
    } catch (error) {
      console.error('Error cargando mis donaciones:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.updateProfile(formData);
      setEditing(false);
      loadProfile();
      showSuccess('Perfil actualizado exitosamente', 'Éxito');
    } catch (error) {
      showError(error.response?.data?.message || 'Error al actualizar perfil', 'Error');
    }
  };

  if (loading) {
    return <div className="container">Cargando perfil...</div>;
  }

  if (!profile) {
    return <div className="container">Error al cargar el perfil</div>;
  }

  return (
    <div className="profile-page">
      <div className="container">
        <h1>Mi Perfil</h1>

        <div className="profile-content">
          <div className="profile-card">
            <h2>Información Personal</h2>
            {!editing ? (
              <div className="profile-info">
                <div className="info-item">
                  <label>Nombre:</label>
                  <span>{profile.name}</span>
                </div>
                <div className="info-item">
                  <label>Email:</label>
                  <span>{profile.email}</span>
                </div>
                <div className="info-item">
                  <label>Teléfono:</label>
                  <span>{profile.phone || 'No especificado'}</span>
                </div>
                <div className="info-item">
                  <label>Dirección:</label>
                  <span>{profile.address || 'No especificada'}</span>
                </div>
                <div className="info-item">
                  <label>Rol:</label>
                  <span>
                    {profile.role === 'user' && 'Usuario'}
                    {profile.role === 'repairer' && 'Reparador'}
                    {profile.role === 'admin' && 'Administrador'}
                  </span>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="btn btn-primary"
                >
                  Editar Perfil
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>
                <div className="form-group">
                  <label>Dirección</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    autoComplete="street-address"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      loadProfile();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="profile-stats">
            <div className="stat-card">
              <h3>Mis Estadísticas</h3>
              <div className="stats-list">
                <div className="stat-item">
                  <span>Reportes Creados</span>
                  <span>{profile.reportsCount || 0}</span>
                </div>
                <div className="stat-item">
                  <span>Donaciones Realizadas</span>
                  <span>{profile.donationsCount || 0}</span>
                </div>
                <div className="stat-item">
                  <span>Total Donado</span>
                  <span>${(profile.totalDonated || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-sections">
          <div className="profile-section">
            <h2>Mis Reportes ({myReports.length})</h2>
            {myReports.length === 0 ? (
              <div className="empty-state">
                <img src={emptyReports} alt="No hay reportes" className="empty-illustration" />
                <h3>No has creado ningún reporte aún</h3>
                <p>Comienza a reportar huecos en tu barrio</p>
                <Link to="/create-report" className="btn btn-primary">
                  Crear Primer Reporte
                </Link>
              </div>
            ) : (
              <div className="reports-list">
                {myReports.map((report) => (
                  <div key={report._id} className="report-item">
                    <h3>{report.title}</h3>
                    <p className="report-location">📍 {report.location.address}</p>
                    <span className={`status-badge status-${report.status}`}>
                      {report.status}
                    </span>
                    <Link to={`/reports/${report._id}`} className="btn btn-secondary btn-sm">
                      Ver Detalles
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="profile-section">
            <h2>Mis Donaciones ({myDonations.length})</h2>
            {myDonations.length === 0 ? (
              <div className="empty-state">
                <img src={emptyDonations} alt="No hay donaciones" className="empty-illustration" />
                <h3>No has realizado ninguna donación aún</h3>
                <p>Ayuda a financiar la reparación de huecos en Cali</p>
                <Link to="/reports" className="btn btn-primary">
                  Ver Reportes que Necesitan Ayuda
                </Link>
              </div>
            ) : (
              <div className="donations-list">
                {myDonations.map((donation) => (
                  <div key={donation._id} className="donation-item">
                    <div>
                      <h4>{donation.report?.title || 'Reporte eliminado'}</h4>
                      <p className="donation-date">
                        {new Date(donation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="donation-amount">
                      ${donation.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

