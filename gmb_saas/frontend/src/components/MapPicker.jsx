import { useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin, Check } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet/Vite icon issue
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;


const LocationMarker = ({ position, setPosition }) => {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};

const MapPicker = ({ onSelect, onCancel, initialLat = 40.7128, initialLng = -74.0060 }) => {
    const [position, setPosition] = useState(null);
    const [zoom, setZoom] = useState(13);

    const handleConfirm = () => {
        if (position) {
            // Return format: @lat,lng,zoom
            // Note: DataForSEO format is "lat,lng,zoom" or "lat,lng,zoomz" often.
            // But our backend DataForSEO logic parses "lat,lng" from our service.
            // Service expects: "@lat,lng,zoom"
            // Wait, DataForSeoService.cs: var coords = location.TrimStart('@').Split(',');
            // if (coords.Length >= 2) taskObj["location_coordinate"] = $"{coords[0]},{coords[1]}";
            // It splits by ',' and expects lat,lng. It doesn't use zoom currently but let's pass it.
            // Updated service logic handles 3 parts if needed, but for now let's pass consistent format.
            const coordStr = `@${position.lat.toFixed(7)},${position.lng.toFixed(7)},${zoom}z`;
            onSelect(coordStr);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <MapPin size={20} /> Pick Location on Map
                    </h3>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">Close</button>
                </div>

                <div className="flex-1 relative">
                    <MapContainer
                        center={[initialLat, initialLng]}
                        zoom={zoom}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%" }}
                        whenReady={(map) => {
                            map.target.on('zoomend', () => {
                                setZoom(map.target.getZoom());
                            });
                        }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker position={position} setPosition={setPosition} />
                    </MapContainer>

                    {!position && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold z-[1000] border border-blue-200 text-blue-800">
                            Click on the map to select a point
                        </div>
                    )}
                </div>

                <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
                    <div className="mr-auto text-sm text-gray-600 self-center">
                        {position ? `Selected: ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}` : 'No location selected'}
                    </div>
                    <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
                    <button
                        onClick={handleConfirm}
                        disabled={!position}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Check size={18} /> Confirm Location
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MapPicker;
