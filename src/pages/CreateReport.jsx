import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { reportsAPI } from '../services/api';
import ilustracionReporte from '../assets/ilustracionReporte.png';
import { showSuccess, showError, showWarning } from '../utils/swal';
import './CreateReport.css';

const CreateReport = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    neighborhood: '',
    lat: '',
    lng: '',
    estimatedCost: '',
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalización no disponible en tu navegador');
      return;
    }

    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          lat: position.coords.latitude.toString(),
          lng: position.coords.longitude.toString(),
        });
      },
      () => {
        setLocationError('No se pudo obtener tu ubicación');
      }
    );
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + images.length > 5) {
      showError('Puedes subir máximo 5 imágenes', 'Límite de Imágenes');
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) { // 5MB máximo
        showError('Las imágenes no pueden ser mayores a 5MB', 'Imagen Muy Grande');
        return;
      }

      if (!file.type.startsWith('image/')) {
        showError('Solo se permiten archivos de imagen', 'Tipo de Archivo Inválido');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setImages((prev) => [...prev, base64String]);
        setImagePreviews((prev) => [...prev, base64String]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.lat || !formData.lng) {
      setError('Por favor obtén tu ubicación o ingresa las coordenadas manualmente');
      showWarning('Por favor obtén tu ubicación o ingresa las coordenadas manualmente', 'Ubicación Requerida');
      return;
    }

    setLoading(true);

    try {
      const reportData = {
        title: formData.title,
        description: formData.description,
        location: {
          address: formData.address,
          neighborhood: formData.neighborhood,
          coordinates: {
            lat: parseFloat(formData.lat),
            lng: parseFloat(formData.lng),
          },
        },
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : 0,
        images: images, // Imágenes en base64
      };

      const response = await reportsAPI.create(reportData);
      await showSuccess(
        'Tu reporte ha sido creado exitosamente y está pendiente de aprobación por un administrador. Una vez aprobado, será visible públicamente.',
        'Reporte Creado'
      );
      navigate('/');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al crear el reporte';
      setError(errorMessage);
      showError(errorMessage, 'Error al Crear Reporte');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="create-report-page">
      <div className="container">
        <div className="create-report-header">
          <div className="create-report-header-content">
            <h1>Reportar un Hueco</h1>
            <p>Ayuda a mejorar las calles de Cali reportando huecos en tu barrio</p>
          </div>
          <div className="create-report-header-image">
            <img src={ilustracionReporte} alt="Reportar hueco" />
          </div>
        </div>
        
        <div className="create-report-card">
          {error && <div className="alert alert-error">{error}</div>}
          {locationError && <div className="alert alert-info">{locationError}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Título del Reporte *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ej: Hueco grande en la calle principal"
                required
              />
            </div>

            <div className="form-group">
              <label>Descripción *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe el hueco, su tamaño, peligrosidad, etc."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Dirección *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Ej: Calle 5 #10-20"
                  required
                />
              </div>

              <div className="form-group">
                <label>Barrio *</label>
                <input
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  placeholder="Ej: San Fernando"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Ubicación (Coordenadas) *</label>
              <div className="location-inputs">
                <input
                  type="number"
                  step="any"
                  name="lat"
                  value={formData.lat}
                  onChange={handleChange}
                  placeholder="Latitud"
                  required
                />
                <input
                  type="number"
                  step="any"
                  name="lng"
                  value={formData.lng}
                  onChange={handleChange}
                  placeholder="Longitud"
                  required
                />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="btn btn-secondary"
                >
                  📍 Obtener Mi Ubicación
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Imágenes del Hueco (Opcional - Máximo 5)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="file-input"
                disabled={images.length >= 5}
              />
              <small>Puedes subir hasta 5 imágenes. Tamaño máximo: 5MB por imagen</small>
              
              {imagePreviews.length > 0 && (
                <div className="image-previews">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="remove-image-btn"
                        title="Eliminar imagen"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Costo Estimado (COP) - Opcional</label>
              <input
                type="number"
                name="estimatedCost"
                value={formData.estimatedCost}
                onChange={handleChange}
                placeholder="Ej: 500000"
                min="0"
              />
              <small>Si no lo sabes, déjalo en blanco y la comunidad puede ayudar a estimarlo</small>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creando reporte...' : 'Crear Reporte'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/reports')}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateReport;

