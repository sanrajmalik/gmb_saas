import { useState, useEffect } from 'react';
import api from '../services/api'; // Changed import
import { Plus, MapPin, ExternalLink, Loader2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddListingWizard from '../components/AddListingWizard';

const Listings = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    const fetchListings = async () => {
        try {
            const data = await api.get('/listings'); // api.get returns data directly
            setListings(data);
        } catch (error) {
            console.error("Failed to fetch listings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    const handleWizardComplete = () => {
        setIsWizardOpen(false);
        fetchListings();
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Listing Management</h1>
                <button onClick={() => setIsWizardOpen(true)} className="btn btn-primary flex items-center gap-2">
                    <Plus size={18} /> Add Listing
                </button>
            </div>

            {loading ? <Loader2 className="animate-spin mx-auto" /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map(l => (
                        <div key={l.id} className="card hover:shadow-lg transition">
                            <div className="h-32 bg-gray-100 mb-4 rounded-md overflow-hidden relative">
                                {l.thumbnailUrl ? (
                                    <img src={l.thumbnailUrl} alt={l.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400"><MapPin size={32} /></div>
                                )}
                                <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-md text-xs font-bold shadow flex items-center gap-1">
                                    <Star size={10} className="text-yellow-500 fill-current" /> {l.rating}
                                </div>
                            </div>

                            <h3 className="font-bold text-lg mb-1">{l.name}</h3>
                            <p className="text-gray-500 text-sm mb-3 truncate">{l.address}</p>

                            <div className="flex justify-between items-center mt-4">
                                <Link to={`/listings/${l.id}`} className="text-primary font-medium hover:underline">
                                    Manage Profile
                                </Link>
                                {l.websiteUrl && (
                                    <a href={l.websiteUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600">
                                        <ExternalLink size={16} />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isWizardOpen && (
                <AddListingWizard
                    onClose={() => setIsWizardOpen(false)}
                    onComplete={handleWizardComplete}
                />
            )}
        </div>
    );
};

export default Listings;
