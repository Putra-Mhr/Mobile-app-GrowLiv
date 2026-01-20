import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function LocationPicker({ initialLocation, onLocationSelect, onClose }) {
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [location, setLocation] = useState(
        initialLocation || { lat: -6.2088, lng: 106.8456 }
    );

    useEffect(() => {
        if (!mapRef.current) {
            // Initialize map
            const map = L.map('map').setView([location.lat, location.lng], 13);

            // Add OpenStreetMap tiles (free!)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(map);

            // Add marker
            const marker = L.marker([location.lat, location.lng], {
                draggable: true,
            }).addTo(map);

            // Update location when marker is dragged
            marker.on('dragend', function (e) {
                const pos = e.target.getLatLng();
                setLocation({ lat: pos.lat, lng: pos.lng });
            });

            // Click on map to move marker
            map.on('click', function (e) {
                marker.setLatLng(e.latlng);
                setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
            });

            mapRef.current = map;
            markerRef.current = marker;
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    const handleConfirm = () => {
        onLocationSelect(location);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold">📍 Pilih Lokasi Produk</h3>
                            <p className="text-sm opacity-90 mt-1">
                                Klik atau drag marker untuk memilih lokasi
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="btn btn-sm btn-circle btn-ghost text-white hover:bg-white/20"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Coordinates Display */}
                <div className="bg-blue-50 p-3 border-b border-blue-100">
                    <div className="flex gap-4 text-sm">
                        <div>
                            <span className="font-semibold text-blue-900">Latitude:</span>
                            <span className="ml-2 font-mono text-blue-700">
                                {location.lat.toFixed(6)}
                            </span>
                        </div>
                        <div>
                            <span className="font-semibold text-blue-900">Longitude:</span>
                            <span className="ml-2 font-mono text-blue-700">
                                {location.lng.toFixed(6)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Map Container */}
                <div id="map" style={{ height: '400px', width: '100%' }}></div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                        💡 Tip: Drag marker atau klik di map untuk memilih lokasi
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="btn btn-ghost">
                            Batal
                        </button>
                        <button onClick={handleConfirm} className="btn btn-primary">
                            ✓ Konfirmasi Lokasi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
