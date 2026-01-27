import { useState } from 'react';
import api from '../services/api'; // Changed import
import { Search, MapPin, Star, Plus, Loader2, Check } from 'lucide-react';

const AddListingWizard = ({ onComplete, onClose }) => {
    const [step, setStep] = useState(1); // 1: Search, 2: Confirm
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedListing, setSelectedListing] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query || !location) {
            alert('Please enter both Business Name and Location.');
            return;
        }
        setLoading(true);
        try {
            let url = `/listings/search?query=${encodeURIComponent(query)}`;
            if (location) url += `&location=${encodeURIComponent(location)}`;

            const data = await api.get(url); // api.get returns data directly
            setResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (listing) => {
        setSelectedListing(listing);
        setStep(2);
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await api.post('/listings', { ...selectedListing, clientCreatedAt: new Date().toISOString() });
            onComplete();
        } catch (err) {
            console.error("Failed to add listing", err);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Add New Listing</h2>
                        <p className="text-sm text-gray-500">Step {step}: {step === 1 ? 'Search Business' : 'Confirm Details'}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {step === 1 && (
                        <>
                            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Business Name (e.g. 'Coffee Shop')"
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="w-1/3 relative">
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="City/Area (e.g. Chicago)"
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if ('geolocation' in navigator) {
                                                navigator.geolocation.getCurrentPosition(pos => {
                                                    const { latitude, longitude } = pos.coords;
                                                    setLocation(`@${latitude},${longitude},14z`);
                                                }, err => console.error(err));
                                            }
                                        }}
                                        className="absolute right-2 top-2 text-gray-400 hover:text-blue-600"
                                        title="Use Current Location"
                                    >
                                        <MapPin size={20} />
                                    </button>
                                </div>
                                <button disabled={loading} type="submit" className="btn btn-primary px-6">
                                    {loading ? <Loader2 className="animate-spin" /> : 'Search'}
                                </button>
                            </form>

                            <div className="space-y-3">
                                {results.map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleSelect(item)}
                                        className="border rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition flex gap-4 group"
                                    >
                                        <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                            {item.thumbnailUrl ? (
                                                <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <MapPin size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{item.name}</h3>
                                            <p className="text-sm text-gray-500 mb-1">{item.address}</p>
                                            <div className="flex items-center gap-3 text-xs text-gray-600">
                                                <span className="flex items-center gap-1 text-yellow-600 font-medium">
                                                    <Star size={12} fill="currentColor" /> {item.rating} ({item.reviewCount})
                                                </span>
                                                {item.websiteUrl && <span>Website Available</span>}
                                            </div>
                                        </div>
                                        <div className="self-center">
                                            <button className="btn btn-secondary text-sm">Select</button>
                                        </div>
                                    </div>
                                ))}
                                {results.length === 0 && !loading && query && (
                                    <div className="text-center text-gray-500 py-8">
                                        No results found. Try a different query.
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {step === 2 && selectedListing && (
                        <div className="text-center">
                            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg">
                                {selectedListing.thumbnailUrl ? (
                                    <img src={selectedListing.thumbnailUrl} alt={selectedListing.name} className="w-full h-full object-cover" />
                                ) : (
                                    <MapPin size={40} className="m-auto mt-6 text-gray-400" />
                                )}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedListing.name}</h3>
                            <p className="text-gray-500 mb-6">{selectedListing.address}</p>

                            <div className="grid grid-cols-2 gap-4 text-left max-w-sm mx-auto bg-gray-50 p-4 rounded-lg border mb-8">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Rating</p>
                                    <p className="font-medium">{selectedListing.rating} ({selectedListing.reviewCount} reviews)</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Location</p>
                                    <p className="font-medium">{selectedListing.latitude.toFixed(4)}, {selectedListing.longitude.toFixed(4)}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-400 uppercase font-bold">Place ID</p>
                                    <p className="font-mono text-xs truncate bg-white p-1 rounded border">{selectedListing.placeId}</p>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-center">
                                <button onClick={() => setStep(1)} className="btn btn-secondary">
                                    Back to Search
                                </button>
                                <button onClick={handleConfirm} disabled={loading} className="btn btn-primary flex items-center gap-2">
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                                    Confirm & Add Listing
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default AddListingWizard;
