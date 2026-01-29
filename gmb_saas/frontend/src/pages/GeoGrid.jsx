import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import api from '../services/api'; // Changed import
import { Loader2, Play, Map } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Component to recenter map
const RecenterAutomatically = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng]);
    }, [lat, lng, map]);
    return null;
};

const GeoGrid = () => {
    const [scans, setScans] = useState([]);
    const [listings, setListings] = useState([]);
    const [selectedListing, setSelectedListing] = useState('');
    const [keywords, setKeywords] = useState([]);
    const [selectedKeyword, setSelectedKeyword] = useState('');
    const [settings, setSettings] = useState({ radius: 5, gridSize: 7 });  // radius in km
    const [loading, setLoading] = useState(false);
    const [gridData, setGridData] = useState(null);

    useEffect(() => {
        api.get('/listings').then(data => {
            setListings(data);
            if (data.length > 0) setSelectedListing(data[0].id);
        });
    }, []);

    useEffect(() => {
        if (!selectedListing) return;
        api.get(`/listings/${selectedListing}/keywords`).then(data => {
            setKeywords(data);
            if (data.length > 0) setSelectedKeyword(data[0].term);
        });
        loadScans();
    }, [selectedListing]);

    const loadScans = () => {
        api.get(`/listings/${selectedListing}/geogrid-scans`).then(data => {
            setScans(data);
        });
    };

    const handleRunScan = async () => {
        if (!selectedListing || !selectedKeyword) return;
        setLoading(true);
        setGridData(null);

        try {
            const listing = listings.find(l => l.id === selectedListing);
            if (!listing) return;

            const centerLat = listing.latitude || 28.6139; // Fallback
            const centerLng = listing.longitude || 77.2090;

            const data = await api.post('/listings/geogrid', {
                listingId: selectedListing,
                keyword: selectedKeyword,
                radiusKm: settings.radius,
                gridSize: settings.gridSize,
                centerLat: centerLat,
                centerLng: centerLng
            });

            // The simplified run returns dict { "lat,lng": rank }
            const points = Object.entries(data).map(([key, rank]) => {
                const [lat, lng] = key.split(',').map(Number);
                return { lat, lng, rank };
            });

            setGridData({
                center: [centerLat, centerLng],
                points
            });
            loadScans(); // Refresh history

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadScan = async (scanId) => {
        setLoading(true);
        try {
            const scan = await api.get(`/listings/geogrid-scans/${scanId}`);
            const points = scan.points.map(p => ({
                lat: p.latitude,
                lng: p.longitude,
                rank: p.rank,
                competitors: p.competitors || []
            }));

            // We need center, assume mean or first point if listing coords not available immediately (though we have listings state)
            // Ideally we use listing coords from the scan's listingId, but for now derive from points center or current listing selection
            const latSum = points.reduce((abc, p) => abc + p.lat, 0);
            const lngSum = points.reduce((abc, p) => abc + p.lng, 0);
            const center = points.length > 0 ? [latSum / points.length, lngSum / points.length] : [28.6139, 77.2090];

            setGridData({
                center,
                points
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getColor = (rank) => {
        if (rank > 0 && rank <= 3) return '#22c55e'; // Green
        if (rank > 3 && rank <= 10) return '#eab308'; // Yellow
        return '#ef4444'; // Red
    };

    const currentListing = listings.find(l => l.id === selectedListing);
    const centerPoint = gridData
        ? gridData.center
        : (currentListing ? [currentListing.latitude, currentListing.longitude] : [28.6139, 77.2090]);

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Geo Grid Scan</h1>
                <div className="flex gap-4">
                    <select
                        className="border rounded p-2"
                        value={selectedListing}
                        onChange={e => setSelectedListing(e.target.value)}
                    >
                        {listings.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="card p-4 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium mb-1">Keyword</label>
                    <select
                        className="border rounded w-full p-2"
                        value={selectedKeyword}
                        onChange={e => setSelectedKeyword(e.target.value)}
                    >
                        {keywords.length === 0 && <option>No keywords found</option>}
                        {keywords.map(k => <option key={k.id} value={k.term}>{k.term}</option>)}
                    </select>
                </div>

                <div className="w-[120px]">
                    <label className="block text-sm font-medium mb-1">Grid Size</label>
                    <select
                        className="border rounded w-full p-2"
                        value={settings.gridSize}
                        onChange={e => setSettings({ ...settings, gridSize: Number(e.target.value) })}
                    >
                        <option value="3">3x3</option>
                        <option value="5">5x5</option>
                        <option value="7">7x7</option>
                    </select>
                </div>

                <div className="w-[120px]">
                    <label className="block text-sm font-medium mb-1">Radius (km)</label>
                    <select
                        className="border rounded w-full p-2"
                        value={settings.radius}
                        onChange={e => setSettings({ ...settings, radius: Number(e.target.value) })}
                    >
                        <option value="1">1 km</option>
                        <option value="2">2 km</option>
                        <option value="5">5 km</option>
                        <option value="10">10 km</option>
                    </select>
                </div>

                <button
                    onClick={handleRunScan}
                    disabled={loading || !selectedKeyword}
                    className="btn btn-primary flex items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                    Run Scan
                </button>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Map Section */}
                <div style={{ flex: 2, border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
                    <MapContainer center={centerPoint} zoom={11} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        <RecenterAutomatically lat={centerPoint[0]} lng={centerPoint[1]} />

                        <Marker position={centerPoint}>
                            <Popup>Center</Popup>
                        </Marker>

                        {gridData && gridData.points.map((pt, idx) => (
                            <Circle
                                key={idx}
                                center={[pt.lat, pt.lng]}
                                radius={500}
                                pathOptions={{
                                    color: getColor(pt.rank),
                                    fillColor: getColor(pt.rank),
                                    fillOpacity: 0.7
                                }}
                            >
                                <Popup>
                                    <div className="text-center">
                                        <div className="font-bold mb-2">Rank: {pt.rank > 0 ? `#${pt.rank}` : '>20'}</div>
                                        {pt.competitors && pt.competitors.length > 0 && (
                                            <div className="text-left text-xs bg-gray-50 p-2 rounded max-h-[150px] overflow-y-auto border mt-2">
                                                <div className="font-semibold mb-1 text-gray-500 border-b pb-1">Top Competitors:</div>
                                                {pt.competitors.sort((a, b) => a.rank - b.rank).slice(0, 5).map(c => (
                                                    <div key={c.id} className="truncate py-0.5" title={c.name}>
                                                        <span className="font-mono text-gray-400 w-5 inline-block">#{c.rank}</span> {c.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Popup>
                            </Circle>
                        ))}
                    </MapContainer>
                </div>

                {/* History Sidebar */}
                <div className="flex-1 overflow-y-auto card p-0">
                    <div className="p-4 border-b bg-gray-50 font-bold">Scan History</div>
                    <div className="divide-y">
                        {scans.length === 0 && <div className="p-4 text-gray-500 text-center">No scans yet</div>}
                        {scans.map(scan => (
                            <div
                                key={scan.id}
                                onClick={() => handleLoadScan(scan.id)}
                                className="p-4 hover:bg-blue-50 cursor-pointer transition"
                            >
                                <div className="font-medium text-gray-800">{scan.keyword}</div>
                                <div className="text-sm text-gray-500 flex justify-between mt-1">
                                    <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
                                    <span>Avg Rank: <span className={scan.averageRank <= 3 ? 'text-green-600 font-bold' : 'text-gray-600'}>{scan.averageRank.toFixed(1)}</span></span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {scan.gridSize}x{scan.gridSize} • {scan.radiusKm}km
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeoGrid;
