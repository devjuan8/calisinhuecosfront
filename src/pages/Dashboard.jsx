import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { usersAPI, reportsAPI } from '../services/api';
import { showSuccess, showError, showConfirm, showPrompt } from '../utils/swal';
import emptyDashboard from '../assets/emptyDashboard.png';
import successIllustration from '../assets/successIllustration.png';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isAdmin, isAdminOnly } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [repairers, setRepairers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRepairer, setShowCreateRepairer] = useState(false);
  const [newRepairer, setNewRepairer] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!isAdmin()) {
      navigate('/');
      return;
    }

    loadDashboard();
    if (isAdminOnly()) {
      loadRepairers();
    }
  }, [user, isAdmin, isAdminOnly, navigate]);

  const loadDashboard = async () => {
    try {
      const response = await usersAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRepairers = async () => {
    try {
      const response = await usersAPI.getRepairers();
      setRepairers(response.data);
    } catch (error) {
      console.error('Error cargando reparadores:', error);
    }
  };

  const handleCreateRepairer = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.createRepairer(newRepairer);
      await showSuccess('Reparador creado exitosamente', 'Éxito');
      setNewRepairer({ name: '', email: '', password: '', phone: '', address: '' });
      setShowCreateRepairer(false);
      loadRepairers();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al crear reparador', 'Error');
    }
  };

  const handleAssignReport = async (reportId, assignedToId = null) => {
    try {
      const assignTo = assignedToId || user.id;
      await reportsAPI.assign(reportId, { assignedTo: assignTo });
      loadDashboard();
      showSuccess('Reporte asignado exitosamente', 'Éxito');
    } catch (error) {
      showError(error.response?.data?.message || 'Error al asignar reporte', 'Error');
    }
  };

  const handleUpdateStatus = async (reportId, status) => {
    try {
      await reportsAPI.updateStatus(reportId, { status });
      loadDashboard();
      showSuccess('Estado actualizado exitosamente', 'Éxito');
    } catch (error) {
      showError(error.response?.data?.message || 'Error al actualizar estado', 'Error');
    }
  };

  const handleApproveReport = async (reportId) => {
    const result = await showConfirm(
      '¿Estás seguro de que quieres aprobar este reporte? Una vez aprobado, será visible públicamente.',
      'Aprobar Reporte'
    );
    
    if (!result.isConfirmed) {
      return;
    }
    
    try {
      await reportsAPI.approve(reportId);
      loadDashboard();
      showSuccess('Reporte aprobado exitosamente', 'Éxito');
    } catch (error) {
      showError(error.response?.data?.message || 'Error al aprobar reporte', 'Error');
    }
  };

  const handleRejectReport = async (reportId) => {
    const result = await showPrompt(
      'Ingresa la razón del rechazo (opcional):',
      'Rechazar Reporte',
      'Ej: Reporte duplicado, información incorrecta...'
    );
    
    if (!result.isConfirmed) {
      return;
    }
    
    const confirmResult = await showConfirm(
      '¿Estás seguro de que quieres rechazar este reporte?',
      'Confirmar Rechazo'
    );
    
    if (!confirmResult.isConfirmed) {
      return;
    }
    
    try {
      await reportsAPI.reject(reportId, result.value || '');
      loadDashboard();
      showSuccess('Reporte rechazado exitosamente', 'Éxito');
    } catch (error) {
      showError(error.response?.data?.message || 'Error al rechazar reporte', 'Error');
    }
  };

  if (loading) {
    return <div className="container">Cargando dashboard...</div>;
  }

  if (!dashboardData) {
    return <div className="container">Error al cargar el dashboard</div>;
  }

  const getStatusLabel = (status) => {
    const labels = {
      reported: 'Reportado',
      fundraising: 'Recaudando',
      funded: 'Listo',
      in_progress: 'En Reparación',
      completed: 'Reparado',
    };
    return labels[status] || status;
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1>Dashboard - {user.role === 'repairer' ? 'Reparador' : 'Administrador'}</h1>
          {isAdminOnly() && (
            <button
              onClick={() => setShowCreateRepairer(!showCreateRepairer)}
              className="btn btn-primary"
            >
              {showCreateRepairer ? 'Cancelar' : '+ Crear Reparador'}
            </button>
          )}
        </div>

        {isAdminOnly() && showCreateRepairer && (
          <div className="create-repairer-form">
            <h3>Crear Nuevo Reparador</h3>
            <form onSubmit={handleCreateRepairer}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre Completo *</label>
                  <input
                    type="text"
                    value={newRepairer.name}
                    onChange={(e) => setNewRepairer({ ...newRepairer, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newRepairer.email}
                    onChange={(e) => setNewRepairer({ ...newRepairer, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Contraseña *</label>
                  <input
                    type="password"
                    value={newRepairer.password}
                    onChange={(e) => setNewRepairer({ ...newRepairer, password: e.target.value })}
                    required
                    minLength="6"
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    value={newRepairer.phone}
                    onChange={(e) => setNewRepairer({ ...newRepairer, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input
                  type="text"
                  value={newRepairer.address}
                  onChange={(e) => setNewRepairer({ ...newRepairer, address: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-success">
                Crear Reparador
              </button>
            </form>
          </div>
        )}

        {isAdminOnly() && repairers.length > 0 && (
          <div className="dashboard-section">
            <h2>Reparadores ({repairers.length})</h2>
            <div className="repairers-list">
              {repairers.map((repairer) => (
                <div key={repairer._id} className="repairer-card">
                  <div>
                    <h4>{repairer.name}</h4>
                    <p>{repairer.email}</p>
                    {repairer.phone && <p>📞 {repairer.phone}</p>}
                  </div>
                  <div className="repairer-stats">
                    <span>Asignados: {repairer.assignedReports}</span>
                    <span>Completados: {repairer.completedReports}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total Reportes</h3>
            <div className="stat-number">{dashboardData.statistics.totalReports}</div>
          </div>
          <div className="stat-card">
            <h3>Total Donado</h3>
            <div className="stat-number">
              ${dashboardData.statistics.totalDonated.toLocaleString()}
            </div>
          </div>
          <div className="stat-card">
            <h3>Reportes Asignados</h3>
            <div className="stat-number">{dashboardData.assignedReports.length}</div>
          </div>
          <div className="stat-card">
            <h3>Listos para Reparar</h3>
            <div className="stat-number">{dashboardData.readyToRepair.length}</div>
          </div>
          {isAdminOnly() && (
            <div className="stat-card stat-card-warning">
              <h3>Pendientes de Aprobación</h3>
              <div className="stat-number">{dashboardData.pendingReports?.length || 0}</div>
            </div>
          )}
        </div>

        <div className="dashboard-content">
          {isAdminOnly() && dashboardData.pendingReports && dashboardData.pendingReports.length === 0 && (
            <div className="dashboard-section">
              <div className="empty-state">
                <img src={emptyDashboard} alt="Todo al día" className="empty-illustration" />
                <h3>¡Todo está al día!</h3>
                <p>No hay reportes pendientes de aprobación</p>
              </div>
            </div>
          )}

          {isAdminOnly() && dashboardData.pendingReports && dashboardData.pendingReports.length > 0 && (
            <div className="dashboard-section dashboard-section-pending">
              <h2>⚠️ Reportes Pendientes de Aprobación ({dashboardData.pendingReports.length})</h2>
              <div className="reports-list">
                {dashboardData.pendingReports.map((report) => (
                  <div key={report._id} className="report-card report-card-pending">
                    <div className="report-card-content">
                      <div className="report-main-info">
                        <div className="report-header">
                          <h3>{report.title}</h3>
                          <span className="status-badge status-pending">Pendiente</span>
                        </div>
                        <p className="report-location">📍 {report.location.address}</p>
                        <p className="report-description">{report.description}</p>
                        <div className="report-info">
                          <span>👤 Reportado por: {report.reportedBy?.name || 'Usuario'}</span>
                          <span>📅 {new Date(report.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="report-actions">
                          <button
                            onClick={() => handleApproveReport(report._id)}
                            className="btn btn-success"
                          >
                            ✅ Aprobar
                          </button>
                          <button
                            onClick={() => handleRejectReport(report._id)}
                            className="btn btn-danger"
                          >
                            ❌ Rechazar
                          </button>
                          <Link to={`/reports/${report._id}`} className="btn btn-secondary">
                            Ver Detalles
                          </Link>
                        </div>
                      </div>
                      {report.images && report.images.length > 0 && (
                        <div className="report-images-sidebar">
                          {report.images.slice(0, 3).map((img, idx) => (
                            <img 
                              key={idx} 
                              src={img} 
                              alt={`Reporte ${idx + 1}`}
                              className="report-sidebar-image"
                            />
                          ))}
                          {report.images.length > 3 && (
                            <div className="report-images-more">
                              +{report.images.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="dashboard-section">
            <h2>Reportes Listos para Reparar</h2>
            {dashboardData.readyToRepair.length === 0 ? (
              <div className="empty-state">
                <img src={emptyDashboard} alt="No hay reportes" className="empty-illustration" />
                <h3>No hay reportes listos para reparar</h3>
                <p>Los reportes aparecerán aquí una vez estén financiados</p>
              </div>
            ) : (
              <div className="reports-list">
                {dashboardData.readyToRepair.map((report) => (
                  <div key={report._id} className="report-card">
                    <div className="report-header">
                      <h3>{report.title}</h3>
                      <span className="status-badge status-funded">
                        {getStatusLabel(report.status)}
                      </span>
                    </div>
                    <p className="report-location">📍 {report.location.address}</p>
                    <div className="report-info">
                      <span>💰 ${report.totalDonated?.toLocaleString() || 0}</span>
                      <span>👆 {report.votesCount} votos</span>
                      <span>⭐ Prioridad: {report.priority}</span>
                    </div>
                    <div className="report-actions">
                      {isAdminOnly() && repairers.length > 0 ? (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignReport(report._id, e.target.value);
                            }
                          }}
                          className="form-select"
                          defaultValue=""
                        >
                          <option value="">Asignar a...</option>
                          {repairers.map((repairer) => (
                            <option key={repairer._id} value={repairer._id}>
                              {repairer.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => handleAssignReport(report._id)}
                          className="btn btn-primary"
                        >
                          Asignar a Mí
                        </button>
                      )}
                      <Link to={`/reports/${report._id}`} className="btn btn-secondary">
                        Ver Detalles
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-section">
            <h2>Mis Reportes Asignados</h2>
            {dashboardData.assignedReports.length === 0 ? (
              <div className="empty-state">
                <img src={emptyDashboard} alt="No hay reportes asignados" className="empty-illustration" />
                <h3>No tienes reportes asignados</h3>
                <p>Los reportes que te asignen aparecerán aquí</p>
              </div>
            ) : (
              <div className="reports-list">
                {dashboardData.assignedReports.map((report) => (
                  <div key={report._id} className="report-card">
                    <div className="report-header">
                      <h3>{report.title}</h3>
                      <span className={`status-badge status-${report.status}`}>
                        {getStatusLabel(report.status)}
                      </span>
                    </div>
                    <p className="report-location">📍 {report.location.address}</p>
                    <div className="report-info">
                      <span>💰 ${report.totalDonated?.toLocaleString() || 0}</span>
                      <span>👆 {report.votesCount} votos</span>
                    </div>
                    <div className="report-actions">
                      {report.status === 'funded' && (
                        <button
                          onClick={() => handleUpdateStatus(report._id, 'in_progress')}
                          className="btn btn-primary"
                        >
                          Marcar en Reparación
                        </button>
                      )}
                      {report.status === 'in_progress' && (
                        <button
                          onClick={() => handleUpdateStatus(report._id, 'completed')}
                          className="btn btn-success"
                        >
                          Marcar como Completado
                        </button>
                      )}
                      <Link to={`/reports/${report._id}`} className="btn btn-secondary">
                        Ver Detalles
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-section">
            <h2>Estadísticas por Estado</h2>
            <div className="status-stats">
              {dashboardData.statistics.reportsByStatus.map((stat) => (
                <div key={stat._id} className="status-stat-item">
                  <span className="status-label">{getStatusLabel(stat._id)}</span>
                  <span className="status-count">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

