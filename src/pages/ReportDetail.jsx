import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { reportsAPI, donationsAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import MapView from '../components/map/MapView';
import { showSuccess, showError, showWarning } from '../utils/swal';
import successIllustration from '../assets/successIllustration.png';
import communityIllustration from '../assets/communityIllustration.png';
import emptyDonations from '../assets/emptyDonations.png';
import './ReportDetail.css';

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useContext(AuthContext);
  
  const [report, setReport] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [donating, setDonating] = useState(false);
  const [voting, setVoting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadReport();
    loadDonations();
  }, [id]);

  const loadReport = async () => {
    try {
      const response = await reportsAPI.getById(id);
      setReport(response.data);
    } catch (error) {
      console.error('Error cargando reporte:', error);
      if (error.response?.status === 403) {
        if (isAdmin && isAdmin()) {
          // Si es admin pero aún así recibió 403, puede ser un problema de token
          showError('No se pudo verificar tu sesión de administrador. Por favor, recarga la página.', 'Error de Autenticación');
        } else {
          showError('Este reporte está pendiente de aprobación y solo puede ser visto por administradores', 'Acceso Denegado');
        }
      } else if (error.response?.status === 404) {
        showError('El reporte solicitado no existe', 'Reporte no encontrado');
      } else {
        showError('Error al cargar el reporte. Por favor, intenta nuevamente.', 'Error');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDonations = async () => {
    try {
      const response = await donationsAPI.getByReport(id);
      setDonations(response.data);
    } catch (error) {
      console.error('Error cargando donaciones:', error);
    }
  };

  const handleVote = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setVoting(true);
    try {
      await reportsAPI.vote(id);
      loadReport();
      showSuccess('Voto registrado exitosamente', 'Éxito');
    } catch (error) {
      showError(error.response?.data?.message || 'Error al votar', 'Error');
    } finally {
      setVoting(false);
    }
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!donationAmount || parseFloat(donationAmount) < 1000) {
      showWarning('El monto mínimo es $1.000', 'Monto Inválido');
      return;
    }

    setDonating(true);
    try {
      await donationsAPI.create({
        reportId: id,
        amount: parseFloat(donationAmount),
        anonymous,
        message: donationMessage,
      });
      setDonationAmount('');
      setDonationMessage('');
      setAnonymous(false);
      loadReport();
      loadDonations();
      showSuccess('¡Donación realizada exitosamente!', 'Gracias por tu Donación');
    } catch (error) {
      showError(error.response?.data?.message || 'Error al realizar la donación', 'Error');
    } finally {
      setDonating(false);
    }
  };

  const hasVoted = user && report?.votes?.some(
    vote => vote.user.toString() === user.id
  );

  if (loading) {
    return <div className="container">Cargando...</div>;
  }

  if (!report) {
    return <div className="container">Reporte no encontrado</div>;
  }

  const progress = report.estimatedCost > 0
    ? Math.min(100, (report.totalDonated / report.estimatedCost) * 100)
    : 0;

  return (
    <div className="report-detail-page">
      <div className="container">
        <Link to="/reports" className="back-link">← Volver a Reportes</Link>

        <div className="report-detail-header">
          <div>
            <h1>{report.title}</h1>
            <p className="report-location">📍 {report.location.address}</p>
            <p className="report-neighborhood">🏘️ {report.location.neighborhood}</p>
          </div>
          <div className="report-actions">
            {!report.approved && (
              <span className="status-badge status-pending">
                ⏳ Pendiente de Aprobación
              </span>
            )}
            <span className={`status-badge status-${report.status}`}>
              {report.status === 'reported' && 'Reportado'}
              {report.status === 'fundraising' && 'Recaudando'}
              {report.status === 'funded' && 'Listo para Reparar'}
              {report.status === 'in_progress' && 'En Reparación'}
              {report.status === 'completed' && 'Reparado'}
            </span>
            {user && !hasVoted && report.approved && (
              <button
                onClick={handleVote}
                className="btn btn-primary"
                disabled={voting}
              >
                {voting ? 'Votando...' : '👆 Votar'}
              </button>
            )}
          </div>
        </div>

        {!report.approved && (
          <div className="alert alert-info" style={{ marginBottom: '20px' }}>
            ⏳ Este reporte está pendiente de aprobación por un administrador. 
            Una vez aprobado, será visible públicamente y podrá recibir votos y donaciones.
          </div>
        )}

        <div className="report-content">
          <div className="report-main">
            <div className="card">
              <h2>Descripción</h2>
              <p>{report.description}</p>
            </div>

            {report.images && report.images.length > 0 && (
              <div className="card">
                <h2>Imágenes ({report.images.length})</h2>
                <div className="report-images">
                  {report.images.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img} 
                      alt={`Reporte ${idx + 1}`}
                      onClick={() => setSelectedImage(img)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <h2>Ubicación</h2>
              <div style={{ height: '400px', marginTop: '20px' }}>
                <MapView />
              </div>
            </div>

            {report.completionImages && report.completionImages.length > 0 && (
              <div className="card">
                <h2>Imágenes de Reparación</h2>
                <div className="report-images">
                  {report.completionImages.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img} 
                      alt={`Reparación ${idx + 1}`}
                      onClick={() => setSelectedImage(img)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="report-sidebar">
            <div className="card">
              <h3>Financiación</h3>
              <div className="funding-stats">
                <div className="stat">
                  <span className="stat-label">Recaudado</span>
                  <span className="stat-value">${report.totalDonated?.toLocaleString() || 0}</span>
                </div>
                {report.estimatedCost > 0 && (
                  <>
                    <div className="stat">
                      <span className="stat-label">Meta</span>
                      <span className="stat-value">${report.estimatedCost.toLocaleString()}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      {progress.toFixed(1)}% completado
                    </div>
                  </>
                )}
              </div>

              {user && report.status !== 'completed' && report.approved && (
                <form onSubmit={handleDonate} className="donation-form">
                  <h4>Hacer una Donación</h4>
                  <div className="form-group">
                    <label>Monto (COP)</label>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="Ej: 10000"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mensaje (opcional)</label>
                    <textarea
                      value={donationMessage}
                      onChange={(e) => setDonationMessage(e.target.value)}
                      placeholder="Deja un mensaje de apoyo..."
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={anonymous}
                        onChange={(e) => setAnonymous(e.target.checked)}
                      />
                      Donación anónima
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={donating}
                  >
                    {donating ? 'Procesando...' : '💰 Donar'}
                  </button>
                </form>
              )}

              {!user && report.approved && (
                <div className="alert alert-info">
                  <Link to="/login">Inicia sesión</Link> para hacer una donación
                </div>
              )}
              
              {!report.approved && (
                <div className="alert alert-info">
                  ⏳ Este reporte está pendiente de aprobación. Las donaciones estarán disponibles una vez sea aprobado.
                </div>
              )}
            </div>

            <div className="card">
              <h3>Estadísticas</h3>
              <div className="stats-list">
                <div className="stat-item">
                  <span>👆 Votos</span>
                  <span>{report.votesCount}</span>
                </div>
                <div className="stat-item">
                  <span>💰 Donaciones</span>
                  <span>{donations.length}</span>
                </div>
                <div className="stat-item">
                  <span>⭐ Prioridad</span>
                  <span>{report.priority}</span>
                </div>
                <div className="stat-item">
                  <span>📅 Reportado</span>
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {report.status === 'completed' && (
              <div className="card success-card">
                <img src={successIllustration} alt="Reparación completada" className="success-illustration" />
                <h3>¡Reparación Completada!</h3>
                <p>Este hueco ha sido reparado exitosamente gracias a la comunidad.</p>
              </div>
            )}

            {donations.length > 0 ? (
              <div className="card">
                <h3>Últimas Donaciones</h3>
                <div className="donations-list">
                  {donations.slice(0, 5).map((donation) => (
                    <div key={donation._id} className="donation-item">
                      <div>
                        <strong>
                          {donation.anonymous ? 'Anónimo' : donation.donor?.name}
                        </strong>
                        {donation.message && (
                          <p className="donation-message">"{donation.message}"</p>
                        )}
                      </div>
                      <div className="donation-amount">
                        ${donation.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="empty-state">
                  <img src={emptyDonations} alt="No hay donaciones" className="empty-illustration" />
                  <h3>Aún no hay donaciones</h3>
                  <p>Sé el primero en ayudar a financiar esta reparación</p>
                </div>
              </div>
            )}

          </div>
        </div>

        {report.status !== 'completed' && (
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
                    Ver Más Reportes que Necesitan Ayuda
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Modal de previsualización de imagen */}
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="image-modal-close" 
              onClick={() => setSelectedImage(null)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <img src={selectedImage} alt="Vista previa" className="image-modal-img" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetail;

