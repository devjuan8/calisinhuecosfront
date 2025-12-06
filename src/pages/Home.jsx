import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import MapView from '../components/map/MapView';
import heroImage from '../assets/hero.jpg';
import ilustracionReporte from '../assets/ilustracionReporte.png';
import iconReported from '../assets/iconReported.png';
import iconFundraising from '../assets/iconFundraising.png';
import iconReady from '../assets/iconReady.png';
import iconCompleted from '../assets/iconCompleted.png';
import communityIllustration from '../assets/communityIllustration.png';
import emptyReports from '../assets/emptyReports.png';
import './Home.css';

const Home = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    fundraising: 0,
    funded: 0,
    completed: 0,
  });

  useEffect(() => {
    loadReports();
    loadStats();
  }, []);

  const loadReports = async () => {
    try {
      const response = await reportsAPI.getAll({ limit: 6, sort: '-createdAt' });
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error cargando reportes:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await reportsAPI.getAll({ limit: 1000 });
      const allReports = response.data.reports;
      
      setStats({
        total: response.data.total,
        fundraising: allReports.filter(r => r.status === 'fundraising').length,
        funded: allReports.filter(r => r.status === 'funded').length,
        completed: allReports.filter(r => r.status === 'completed').length,
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  return (
    <div className="home">
      <section className="hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1>Cali Sin Huecos</h1>
            <p className="hero-subtitle">
              Reporta huecos en las calles de Cali y ayuda a financiar su reparación
            </p>
            <div className="hero-actions">
              <Link to="/create-report" className="btn btn-primary btn-large">
                Reportar un Hueco
              </Link>
              <Link to="/reports" className="btn btn-secondary btn-large">
                Ver Reportes
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="container">
          <h2>¿Cómo Funciona?</h2>
          <div className="how-it-works-content">
            <div className="how-it-works-image">
              <img src={ilustracionReporte} alt="Cómo reportar un hueco" />
            </div>
            <div className="how-it-works-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Reporta</h3>
                  <p>Encuentra un hueco en tu barrio y repórtalo con una foto y ubicación</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Prioriza</h3>
                  <p>Vota por los huecos que consideras más urgentes para reparar</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Financia</h3>
                  <p>Haz una donación para ayudar a financiar la reparación</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Repara</h3>
                  <p>Nuestros reparadores verificados trabajan en la solución</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <img src={iconReported} alt="Reportados" className="stat-icon" />
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Huecos Reportados</div>
            </div>
            <div className="stat-card">
              <img src={iconFundraising} alt="Recaudando" className="stat-icon" />
              <div className="stat-number">{stats.fundraising}</div>
              <div className="stat-label">Recaudando Fondos</div>
            </div>
            <div className="stat-card">
              <img src={iconReady} alt="Listos" className="stat-icon" />
              <div className="stat-number">{stats.funded}</div>
              <div className="stat-label">Listos para Reparar</div>
            </div>
            <div className="stat-card">
              <img src={iconCompleted} alt="Reparados" className="stat-icon" />
              <div className="stat-number">{stats.completed}</div>
              <div className="stat-label">Reparados</div>
            </div>
          </div>
        </div>
      </section>

      <section className="map-section">
        <div className="container">
          <h2>Mapa de Huecos Reportados</h2>
          <MapView />
        </div>
      </section>

      <section className="recent-reports">
        <div className="container">
          <h2>Reportes Recientes</h2>
          {reports.length === 0 ? (
            <div className="empty-reports">
              <img src={emptyReports} alt="No hay reportes" className="empty-illustration" />
              <h3>No hay reportes recientes</h3>
              <p>Sé el primero en reportar un hueco en tu barrio</p>
              <Link to="/create-report" className="btn btn-primary">
                Reportar un Hueco
              </Link>
            </div>
          ) : (
            <div className="reports-grid">
              {reports.map((report) => (
              <Link
                key={report._id}
                to={`/reports/${report._id}`}
                className="report-card-link"
              >
                <div className="report-card">
                  <div className="report-status-badge" data-status={report.status}>
                    {report.status === 'reported' && 'Reportado'}
                    {report.status === 'fundraising' && 'Recaudando'}
                    {report.status === 'funded' && 'Listo'}
                    {report.status === 'in_progress' && 'En Reparación'}
                    {report.status === 'completed' && 'Reparado'}
                  </div>
                  <h3>{report.title}</h3>
                  <p className="report-location">📍 {report.location.address}</p>
                  <p className="report-description">{report.description}</p>
                  <div className="report-footer">
                    <span>👆 {report.votesCount} votos</span>
                    <span>💰 ${report.totalDonated?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </Link>
              ))}
            </div>
          )}
          {reports.length > 0 && (
            <div className="text-center" style={{ marginTop: '30px' }}>
            <Link to="/reports" className="btn btn-primary">
              Ver Todos los Reportes
            </Link>
            </div>
          )}
        </div>
      </section>

      <section className="community-section">
        <div className="community-background">
          <img src={communityIllustration} alt="Comunidad" className="community-bg-image" />
          <div className="community-overlay"></div>
          <div className="community-content-overlay">
            <div className="container">
              <h2>Juntos Podemos Hacer la Diferencia</h2>
              <p>
                Cada donación cuenta. Únete a nuestra comunidad y ayuda a mejorar las calles de Cali.
                Tu contribución hace posible que los reparadores trabajen en solucionar los huecos reportados.
              </p>
              <Link to="/reports" className="btn btn-primary btn-large">
                Ver Reportes que Necesitan Ayuda
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

