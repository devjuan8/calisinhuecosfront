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
  const [processingImages, setProcessingImages] = useState(false);
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

  // Función para comprimir imagen
  const compressImage = (file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      // Timeout de 30 segundos para evitar que se cuelgue
      const timeout = setTimeout(() => {
        reject(new Error('Tiempo de espera agotado al procesar la imagen'));
      }, 30000);

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calcular nuevas dimensiones manteniendo aspect ratio
            if (width > height) {
              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
              }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Convertir a base64 con compresión
            canvas.toBlob(
              (blob) => {
                clearTimeout(timeout);
                if (!blob) {
                  reject(new Error('Error al comprimir la imagen'));
                  return;
                }
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => {
                  clearTimeout(timeout);
                  reject(new Error('Error al leer la imagen comprimida'));
                };
                reader.readAsDataURL(blob);
              },
              'image/jpeg',
              quality
            );
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        };
        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Error al cargar la imagen'));
        };
        img.src = e.target.result;
      };
      reader.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Error al leer el archivo'));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e) => {
    try {
      const files = Array.from(e.target.files);
      
      if (files.length === 0) return;
      
      if (files.length + images.length > 5) {
        showError('Puedes subir máximo 5 imágenes', 'Límite de Imágenes');
        e.target.value = '';
        return;
      }

      setProcessingImages(true);

      // Validar archivos primero
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) { // 10MB máximo antes de comprimir
          showError(`La imagen "${file.name}" es muy grande. Máximo 10MB`, 'Imagen Muy Grande');
          e.target.value = '';
          setProcessingImages(false);
          return;
        }

        if (!file.type.startsWith('image/')) {
          showError(`"${file.name}" no es una imagen válida`, 'Tipo de Archivo Inválido');
          e.target.value = '';
          setProcessingImages(false);
          return;
        }
      }

      // Detectar si es móvil para ajustar compresión
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const initialMaxSize = isMobile ? 1600 : 1920; // Menor resolución en móvil
      
      // Procesar imágenes con compresión
      const processedImages = [];
      const processedPreviews = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          // Primera compresión con calidad estándar
          const compressedBase64 = await compressImage(file, initialMaxSize, initialMaxSize, 0.75);
          
          // Verificar tamaño después de compresión (máximo 1.5MB por imagen comprimida)
          const base64Size = (compressedBase64.length * 3) / 4;
          if (base64Size > 1.5 * 1024 * 1024) {
            // Si aún es muy grande, comprimir más agresivamente
            const moreCompressed = await compressImage(file, 1200, 1200, 0.6);
            const moreCompressedSize = (moreCompressed.length * 3) / 4;
            
            if (moreCompressedSize > 1.5 * 1024 * 1024) {
              // Última compresión muy agresiva
              const finalCompressed = await compressImage(file, 800, 800, 0.5);
              processedImages.push(finalCompressed);
              processedPreviews.push(finalCompressed);
            } else {
              processedImages.push(moreCompressed);
              processedPreviews.push(moreCompressed);
            }
          } else {
            processedImages.push(compressedBase64);
            processedPreviews.push(compressedBase64);
          }
        } catch (error) {
          console.error('Error procesando imagen:', error);
          const errorMsg = error.message.includes('Tiempo') 
            ? `La imagen "${file.name}" es muy grande o compleja. Intenta con una imagen más pequeña.`
            : `Error al procesar "${file.name}". Intenta con otra imagen.`;
          showError(errorMsg, 'Error de Procesamiento');
        }
      }

      if (processedImages.length > 0) {
        setImages((prev) => [...prev, ...processedImages]);
        setImagePreviews((prev) => [...prev, ...processedPreviews]);
      }

      // Limpiar input para permitir seleccionar el mismo archivo de nuevo si es necesario
      e.target.value = '';
      setProcessingImages(false);
    } catch (error) {
      console.error('Error en handleImageChange:', error);
      showError('Error al procesar las imágenes. Intenta de nuevo.', 'Error');
      e.target.value = '';
      setProcessingImages(false);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones básicas
    if (!formData.title || !formData.description || !formData.address || !formData.neighborhood) {
      setError('Por favor completa todos los campos requeridos');
      showWarning('Por favor completa todos los campos requeridos', 'Campos Incompletos');
      return;
    }

    if (!formData.lat || !formData.lng) {
      setError('Por favor obtén tu ubicación o ingresa las coordenadas manualmente');
      showWarning('Por favor obtén tu ubicación o ingresa las coordenadas manualmente', 'Ubicación Requerida');
      return;
    }

    // Validar coordenadas
    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      setError('Las coordenadas deben ser números válidos');
      showError('Las coordenadas deben ser números válidos', 'Coordenadas Inválidas');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Las coordenadas están fuera de rango válido');
      showError('Las coordenadas están fuera de rango válido', 'Coordenadas Inválidas');
      return;
    }

    setLoading(true);

    try {
      const reportData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: {
          address: formData.address.trim(),
          neighborhood: formData.neighborhood.trim(),
          coordinates: {
            lat: lat,
            lng: lng,
          },
        },
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : 0,
        images: images, // Imágenes en base64 comprimidas
      };

      // Validar tamaño total del payload (máximo ~10MB)
      const payloadSize = JSON.stringify(reportData).length;
      if (payloadSize > 10 * 1024 * 1024) {
        setError('El reporte es muy grande. Intenta reducir el número o tamaño de las imágenes.');
        showError('El reporte es muy grande. Intenta reducir el número o tamaño de las imágenes.', 'Reporte Muy Grande');
        setLoading(false);
        return;
      }

      const response = await reportsAPI.create(reportData);
      
      await showSuccess(
        'Tu reporte ha sido creado exitosamente y está pendiente de aprobación por un administrador. Una vez aprobado, será visible públicamente.',
        'Reporte Creado'
      );
      
      // Limpiar formulario
      setFormData({
        title: '',
        description: '',
        address: '',
        neighborhood: '',
        lat: '',
        lng: '',
        estimatedCost: '',
      });
      setImages([]);
      setImagePreviews([]);
      
      navigate('/');
    } catch (err) {
      console.error('Error al crear reporte:', err);
      let errorMessage = 'Error al crear el reporte';
      
      if (err.response) {
        if (err.response.status === 413) {
          errorMessage = 'El reporte es muy grande. Intenta reducir el tamaño de las imágenes.';
        } else if (err.response.status === 400) {
          errorMessage = err.response.data?.message || 'Datos inválidos. Verifica la información ingresada.';
        } else if (err.response.status === 500) {
          errorMessage = 'Error del servidor. Por favor intenta más tarde.';
        } else {
          errorMessage = err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
      }
      
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
                capture="environment"
                onChange={handleImageChange}
                className="file-input"
                disabled={images.length >= 5 || loading || processingImages}
              />
              <small>
                {processingImages 
                  ? 'Procesando imágenes...' 
                  : `Puedes subir hasta 5 imágenes. Las imágenes se comprimen automáticamente para optimizar la carga. (${images.length}/5)`}
              </small>
              
              {processingImages && (
                <div style={{ marginTop: '10px', color: '#007bff', fontSize: '14px' }}>
                  ⏳ Comprimiendo imágenes, por favor espera...
                </div>
              )}
              
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
                        disabled={loading || processingImages}
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

