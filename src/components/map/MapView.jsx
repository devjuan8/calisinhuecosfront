import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { reportsAPI } from '../../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './MapView.css';

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapView = () => {
  const [reports, setReports] = useState([]);
  const [center, setCenter] = useState([3.4516, -76.5320]); // Cali por defecto

  useEffect(() => {
    loadReports();
    
    // Obtener ubicación del usuario si está disponible
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          console.log('No se pudo obtener la ubicación');
        }
      );
    }
  }, []);

  const loadReports = async () => {
    try {
      const response = await reportsAPI.getForMap();
      setReports(response.data);
    } catch (error) {
      console.error('Error cargando reportes para el mapa:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      reported: '#ffc107',
      fundraising: '#17a2b8',
      funded: '#28a745',
      in_progress: '#007bff',
      completed: '#6c757d',
    };
    return colors[status] || '#666';
  };

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((report) => (
          <Marker
            key={report._id}
            position={[report.location.coordinates.lat, report.location.coordinates.lng]}
          >
            <Popup>
              <div className="map-popup">
                <h4>{report.title}</h4>
                <p>{report.location.address}</p>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(report.status) }}
                >
                  {report.status}
                </span>
                <p>Votos: {report.votesCount}</p>
                <p>Donado: ${report.totalDonated?.toLocaleString() || 0}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;

