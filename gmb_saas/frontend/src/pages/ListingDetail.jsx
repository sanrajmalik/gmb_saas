import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api'; // Changed import
import LocationSelect from '../components/LocationSelect';
import MapPicker from '../components/MapPicker';
import { Loader2, Plus, RefreshCw, Star, User, MapPin, Globe, Phone, Award } from 'lucide-react';

const ListingDetail = () => {
    const { id } = useParams();
    const [listing, setListing] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // overview, rank, reviews

    // Rank Tracker State
    const [keywords, setKeywords] = useState([]);
    const [newKeyword, setNewKeyword] = useState({ term: '', location: '' });
    const [locationMode, setLocationMode] = useState('city'); // 'city', 'map'
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [checkingRank, setCheckingRank] = useState(null);

    // Reviews State
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'reviews' && reviews.length === 0) {
            fetchReviews();
        }
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [listingData, keywordsData] = await Promise.all([
                api.get(`/listings/${id}`),
                api.get(`/listings/${id}/keywords`)
            ]);
            setListing(listingData);
            setKeywords(keywordsData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        setLoadingReviews(true);
        try {
            const data = await api.get(`/listings/${id}/reviews`);
            setReviews(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingReviews(false);
        }
    };

    const handleAddKeyword = async (e) => {
        e.preventDefault();
        if (!newKeyword.term || !newKeyword.location) return;
        try {
            await api.post(`/listings/${id}/keywords`, newKeyword);
            setNewKeyword({ term: '', location: '' });
            const data = await api.get(`/listings/${id}/keywords`);
            setKeywords(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCheckRank = async (keywordId) => {
        setCheckingRank(keywordId);
        try {
            await api.post(`/listings/keywords/${keywordId}/check-rank`);
            const data = await api.get(`/listings/${id}/keywords`);
            setKeywords(data);
        } catch (error) {
            console.error("Rank Check Failed", error);
        } finally {
            setCheckingRank(null);
        }
    };

    const calculateCompleteness = () => {
        if (!listing) return 0;
        let score = 0;
        if (listing.name) score += 20;
        if (listing.address) score += 20;
        if (listing.phoneNumber) score += 20;
        if (listing.websiteUrl) score += 20;
        if (listing.placeId) score += 20;
        return score;
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!listing) return <div className="p-8">Listing not found</div>;

    const completeness = calculateCompleteness();

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{listing.name}</h1>
                    <div className="flex items-center gap-2 text-gray-500">
                        <MapPin size={16} /> {listing.address || 'No address'}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                        <Award size={18} />
                        Profile Score: {completeness}%
                    </div>
                    <button
                        onClick={async () => {
                            if (confirm('Are you sure you want to delete this listing? This cannot be undone.')) {
                                try {
                                    await api.delete(`/listings/${id}`);
                                    window.location.href = '/dashboard';
                                } catch (e) {
                                    alert('Failed to delete listing');
                                }
                            }
                        }}
                        className="text-red-500 text-sm hover:underline"
                    >
                        Delete Listing
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b flex gap-6">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-3 font-medium ${activeTab === 'overview' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('rank')}
                    className={`pb-3 font-medium ${activeTab === 'rank' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                >
                    Rank Tracker
                </button>
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-3 font-medium ${activeTab === 'reviews' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                >
                    Reviews
                </button>
            </div>

            {/* Content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card p-6">
                        <h3 className="font-bold text-lg mb-4">Business Details</h3>
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <Globe className="text-gray-400" size={20} />
                                <span>{listing.websiteUrl ? <a href={listing.websiteUrl} target="_blank" className="text-blue-600 underline">{listing.websiteUrl}</a> : 'No Website'}</span>
                            </div>
                            <div className="flex gap-3">
                                <Phone className="text-gray-400" size={20} />
                                <span>{listing.phoneNumber || 'No Phone'}</span>
                            </div>
                            <div className="flex gap-3">
                                <MapPin className="text-gray-400" size={20} />
                                <span>{listing.address || 'No Address'}</span>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${listing.isClaimed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {listing.isClaimed ? 'Claimed' : 'Unclaimed'}
                                </span>
                                {listing.categories && (() => {
                                    try {
                                        const cats = JSON.parse(listing.categories);
                                        return (
                                            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold border border-blue-100">
                                                {cats.category}
                                            </span>
                                        );
                                    } catch (e) { return null; }
                                })()}
                            </div>
                        </div>
                    </div>

                    {listing.workHours && (
                        <div className="card p-6">
                            <h3 className="font-bold text-lg mb-4">Opening Hours</h3>
                            <div className="text-sm space-y-2">
                                {(() => {
                                    try {
                                        const hours = JSON.parse(listing.workHours);
                                        if (hours && hours.timetable) {
                                            return Object.entries(hours.timetable).map(([day, times]) => (
                                                <div key={day} className="flex justify-between border-b pb-1 last:border-0 capitalize">
                                                    <span className="font-medium text-gray-600">{day}</span>
                                                    <span>
                                                        {times ? times.map(t =>
                                                            `${t.open.hour}:${t.open.minute.toString().padStart(2, '0')} - ${t.close.hour}:${t.close.minute.toString().padStart(2, '0')}`
                                                        ).join(', ') : 'Closed'}
                                                    </span>
                                                </div>
                                            ));
                                        }
                                        return <div className="text-gray-500">No hours available</div>;
                                    } catch (e) { return <div className="text-gray-500">Invalid hours data</div>; }
                                })()}
                            </div>
                        </div>
                    )}

                    <div className="card p-6">
                        <h3 className="font-bold text-lg mb-4">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded text-center">
                                <div className="text-2xl font-bold text-gray-800">{keywords.length}</div>
                                <div className="text-sm text-gray-500">Tracked Keywords</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {keywords.filter(k => k.latestRank > 0 && k.latestRank <= 3).length}
                                </div>
                                <div className="text-sm text-gray-500">Top 3 Rankings</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'rank' && (
                <div className="flex flex-col gap-6">
                    <div className="card p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">Add Keyword to Track</h3>
                            <div className="flex bg-gray-100 p-1 rounded-lg text-sm">
                                <button
                                    onClick={() => setLocationMode('city')}
                                    className={`px-3 py-1 rounded-md transition ${locationMode === 'city' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    City Search
                                </button>
                                <button
                                    onClick={() => setLocationMode('map')}
                                    className={`px-3 py-1 rounded-md transition ${locationMode === 'map' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Map Coordinate
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleAddKeyword} className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Keyword</label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2"
                                    placeholder="e.g. Coffee Shop"
                                    value={newKeyword.term}
                                    onChange={e => setNewKeyword({ ...newKeyword, term: e.target.value })}
                                />
                            </div>
                            <div className="flex-1 relative">
                                <label className="block text-sm font-medium mb-1">Location</label>
                                {locationMode === 'city' ? (
                                    <LocationSelect
                                        value={newKeyword.location}
                                        onChange={(val) => setNewKeyword({ ...newKeyword, location: val })}
                                        placeholder="Search city (e.g. New York)"
                                    />
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="w-full border rounded p-2 bg-gray-50 text-gray-600"
                                            placeholder="Coordinates..."
                                            value={newKeyword.location}
                                            readOnly
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowMapPicker(true)}
                                            className="btn btn-secondary px-3"
                                            title="Pick from Map"
                                        >
                                            <MapPin size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button type="submit" className="btn btn-primary flex items-center gap-2">
                                <Plus size={18} /> Add
                            </button>
                        </form>
                    </div>

                    {showMapPicker && (
                        <MapPicker
                            initialLat={listing?.latitude || 40.7128}
                            initialLng={listing?.longitude || -74.0060}
                            onSelect={(coordStr) => {
                                setNewKeyword({ ...newKeyword, location: coordStr });
                                setShowMapPicker(false);
                            }}
                            onCancel={() => setShowMapPicker(false)}
                        />
                    )}

                    <div className="card p-0 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3 text-left font-medium text-gray-600">Keyword</th>
                                    <th className="p-3 text-left font-medium text-gray-600">Location</th>
                                    <th className="p-3 text-left font-medium text-gray-600">Current Rank</th>
                                    <th className="p-3 text-right font-medium text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {keywords.map(k => (
                                    <tr key={k.id}>
                                        <td className="p-3">{k.term}</td>
                                        <td className="p-3 text-gray-500 text-sm">{k.location}</td>
                                        <td className="p-3">
                                            {k.latestRank > 0 ? (
                                                <span className="text-green-600 font-bold">#{k.latestRank}</span>
                                            ) : (
                                                <span className="text-gray-400">--</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => handleCheckRank(k.id)}
                                                disabled={checkingRank === k.id}
                                                className="btn btn-outline border-blue-200 text-blue-600 hover:bg-blue-50 text-sm py-1 px-3 flex items-center gap-2"
                                            >
                                                {checkingRank === k.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                                Check
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Delete this keyword?')) {
                                                        await api.delete(`/listings/keywords/${k.id}`);
                                                        fetchData();
                                                    }
                                                }}
                                                className="btn btn-outline border-red-200 text-red-600 hover:bg-red-50 text-sm py-1 px-3"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'reviews' && (
                <div className="card p-6">
                    <h3 className="font-bold mb-4 flex justify-between items-center">
                        <span>Customer Reviews</span>
                        <button onClick={fetchReviews} className="text-sm text-blue-600 flex items-center gap-1">
                            <RefreshCw size={14} className={loadingReviews ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </h3>

                    {loadingReviews ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">No reviews found yet.</div>
                    ) : (
                        <div className="space-y-6">
                            {reviews.map((review, idx) => (
                                <div key={idx} className="border-b pb-6 last:border-0 last:pb-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            {review.profilePhotoUrl ? (
                                                <img src={review.profilePhotoUrl} alt="User" className="w-10 h-10 rounded-full" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <User size={20} className="text-gray-500" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-bold">{review.author}</div>
                                                <div className="text-xs text-gray-500">{review.date}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={16} fill={i < review.rating ? "currentColor" : "none"} stroke="currentColor" className={i < review.rating ? "" : "text-gray-300"} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-700 leading-relaxed mb-3">{review.text}</p>
                                    {review.response && (
                                        <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                                            <div className="text-xs font-bold text-gray-500 mb-1">Owner Response</div>
                                            <p className="text-sm text-gray-600">{review.response}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ListingDetail;
