import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Star, MapPin, Car } from 'lucide-react';
import { Link } from 'react-router-dom';

// Fix for default markers in react-leaflet
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerRetina from 'leaflet/dist/images/marker-icon-2x.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerRetina,
  shadowUrl: markerShadow,
});

interface ParkingSpot {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price: number;
  priceType: string;
  rating: number;
  availableSlots: number;
  totalSlots: number;
}

interface MapViewProps {
  spots: ParkingSpot[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  spots,
  center = [40.7589, -73.9851],
  zoom = 12,
  height = '500px',
  className = ''
}) => {
  const formatPrice = (price: number, type: string) => {
    return `$${price}/${type}`;
  };

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.latitude, spot.longitude]}
          >
            <Popup className="custom-popup">
              <div className="p-2 min-w-[250px]">
                <h3 className="font-semibold text-gray-900 mb-2">{spot.name}</h3>
                
                <div className="flex items-center space-x-1 text-gray-600 mb-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{spot.address}</span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{spot.rating}</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatPrice(spot.price, spot.priceType)}
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  <Car className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    {spot.availableSlots} / {spot.totalSlots} available
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/spot/${spot.id}`}
                    className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/book/${spot.id}`}
                    className="flex-1 border border-blue-600 text-blue-600 text-center py-2 px-3 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};