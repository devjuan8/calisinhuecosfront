import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import emptyReports from '../assets/emptyReports.png';
import './Reports.css';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    neighborhood: '',
    sort: '-createdAt',
  });

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.neighborhood) params.neighborhood = filters.neighborhood;
      params.sort = filters.sort;

      const response = await reportsAPI.getAll(params);
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      reported: 'Reportado',
      fundraising: 'Recaudando',
      funded: 'Listo para Reparar',
      in_progress: 'En Reparación',
      completed: 'Reparado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  return (
    <div className="reports-page">
      <div className="container">
        <h1>Reportes de Huecos</h1>

        <div className="filters-section">
          <div className="filter-group">
            <label>Estado:</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">Todos</option>
              <option value="reported">Reportado</option>
              <option value="fundraising">Recaudando</option>
              <option value="funded">Listo para Reparar</option>
              <option value="in_progress">En Reparación</option>
              <option value="completed">Reparado</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Barrio:</label>
            <input
              type="text"
              name="neighborhood"
              value={filters.neighborhood}
              onChange={handleFilterChange}
              placeholder="Buscar por barrio..."
            />
          </div>

          <div className="filter-group">
            <label>Ordenar por:</label>
            <select name="sort" value={filters.sort} onChange={handleFilterChange}>
              <option value="-createdAt">Más Recientes</option>
              <option value="-priority">Mayor Prioridad</option>
              <option value="-votesCount">Más Votados</option>
              <option value="-totalDonated">Más Donados</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Cargando reportes...</div>
        ) : reports.length === 0 ? (
          <div className="no-reports">
            <img src={emptyReports} alt="No hay reportes" className="empty-illustration" />
            <h3>No se encontraron reportes</h3>
            <p>Sé el primero en reportar un hueco en tu barrio</p>
            <Link to="/create-report" className="btn btn-primary">
              Crear Primer Reporte
            </Link>
          </div>
        ) : (
          <div className="reports-list">
            {reports.map((report) => (
              <Link
                key={report._id}
                to={`/reports/${report._id}`}
                className="report-item-link"
              >
                <div className="report-item">
                  <div className="report-content-wrapper">
                    <div className="report-main-content">
                      <div className="report-header">
                        <h3>{report.title}</h3>
                        <span className={`status-badge status-${report.status}`}>
                          {getStatusLabel(report.status)}
                        </span>
                      </div>
                      <p className="report-location">📍 {report.location.address}</p>
                      <p className="report-description">{report.description}</p>
                      <div className="report-stats">
                        <span>👆 {report.votesCount} votos</span>
                        <span>💰 ${report.totalDonated?.toLocaleString() || 0} donado</span>
                        {report.estimatedCost > 0 && (
                          <span>🎯 Meta: ${report.estimatedCost.toLocaleString()}</span>
                        )}
                      </div>
                      <div className="report-footer">
                        <span>Reportado el {new Date(report.createdAt).toLocaleDateString()}</span>
                        {report.priority > 0 && (
                          <span className="priority-badge">Prioridad: {report.priority}</span>
                        )}
                      </div>
                    </div>
                    {report.images && report.images.length > 0 && (
                      <div className="report-image-side">
                        <img 
                          src={report.images[0]} 
                          alt={`Reporte ${report.title}`}
                          className="report-side-image"
                        />
                        {report.images.length > 1 && (
                          <div className="report-images-count">
                            +{report.images.length - 1}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;

