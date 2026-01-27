import { useState, useEffect } from 'react';
import api from '../services/api'; // Changed import
import { Loader2, Plus, ArrowUp, ArrowDown, Minus, Filter } from 'lucide-react';

const RankTracking = () => {
    const [listings, setListings] = useState([]);
    const [selectedListing, setSelectedListing] = useState('');
    const [keywords, setKeywords] = useState([]);
    const [loading, setLoading] = useState(false);

    // Grouping
    const [groups, setGroups] = useState(['General', 'Brand', 'Competitor']);
    const [activeGroup, setActiveGroup] = useState('All');

    // New Keyword
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newKeyword, setNewKeyword] = useState({ term: '', location: '', group: 'General' });

    useEffect(() => {
        api.get('/listings').then(data => {
            setListings(data);
            if (data.length > 0) setSelectedListing(data[0].id);
        });
    }, []);

    useEffect(() => {
        if (!selectedListing) return;
        setLoading(true);
        api.get(`/listings/${selectedListing}/keywords`)
            .then(data => setKeywords(data))
            .finally(() => setLoading(false));
    }, [selectedListing]);

    const handleAddKeyword = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/listings/${selectedListing}/keywords`, newKeyword);
            // Refresh
            const data = await api.get(`/listings/${selectedListing}/keywords`);
            setKeywords(data);
            setIsAddOpen(false);
            setNewKeyword({ term: '', location: '', group: 'General' });
        } catch (err) {
            console.error(err);
        }
    };

    const handleCheckRank = async (keywordId) => {
        try {
            await api.post(`/listings/keywords/${keywordId}/check-rank`);
            // Refresh single item logic or all... for simplicity all
            const data = await api.get(`/listings/${selectedListing}/keywords`);
            setKeywords(data);
        } catch (err) {
            console.error(err);
        }
    };

    const filteredKeywords = activeGroup === 'All'
        ? keywords
        : keywords.filter(k => (k.group || 'General') === activeGroup);

    return (

        <div>
            <div className="flex justify-between items-center mb-6">
                <h1>Rank Tracking</h1>
                <div style={{ width: '300px' }}>
                    <select
                        value={selectedListing}
                        onChange={e => setSelectedListing(e.target.value)}
                    >
                        {listings.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Group Tabs */}
            <div className="tab-group">
                <button
                    onClick={() => setActiveGroup('All')}
                    className={`tab-btn ${activeGroup === 'All' ? 'active' : ''}`}
                >
                    All Keywords
                </button>
                {groups.map(g => (
                    <button
                        key={g}
                        onClick={() => setActiveGroup(g)}
                        className={`tab-btn ${activeGroup === g ? 'active' : ''}`}
                    >
                        {g}
                    </button>
                ))}
            </div>

            <div className="card">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="flex items-center gap-2">
                        <Filter size={20} className="text-gray-500" />
                        Tracking <span className="text-primary">{filteredKeywords.length}</span> Keywords
                    </h3>
                    <button onClick={() => setIsAddOpen(true)} className="btn btn-primary btn-sm">
                        <Plus size={16} /> Add Keyword
                    </button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Keyword</th>
                            <th>Location</th>
                            <th>Group</th>
                            <th>Latest Rank</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan="5"><div className="flex justify-center p-6"><Loader2 className="animate-spin" /></div></td></tr>}
                        {!loading && filteredKeywords.map(k => (
                            <tr key={k.id}>
                                <td style={{ fontWeight: 500 }}>{k.term}</td>
                                <td className="text-gray-500">{k.location}</td>
                                <td>
                                    <span className="badge badge-gray">{k.group || 'General'}</span>
                                </td>
                                <td>
                                    {k.latestRank > 0 ? (
                                        <div className={`badge ${k.latestRank <= 3 ? 'badge-success' : k.latestRank <= 10 ? 'badge-warning' : 'badge-danger'}`}>
                                            #{k.latestRank}
                                        </div>
                                    ) : (
                                        <span className="text-gray-500">-</span>
                                    )}
                                </td>
                                <td className="text-right">
                                    <button onClick={() => handleCheckRank(k.id)} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                                        Check
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!loading && filteredKeywords.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center p-6 text-gray-500">
                                    No keywords found in this group.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isAddOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Add Keyword</h3>
                            <button onClick={() => setIsAddOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
                        </div>
                        <form onSubmit={handleAddKeyword}>
                            <div className="modal-body">
                                <div className="mb-4">
                                    <label>Term</label>
                                    <input value={newKeyword.term} onChange={e => setNewKeyword({ ...newKeyword, term: e.target.value })} required placeholder="e.g. Pizza Delivery" />
                                </div>
                                <div className="mb-4">
                                    <label>Location</label>
                                    <input value={newKeyword.location} onChange={e => setNewKeyword({ ...newKeyword, location: e.target.value })} required placeholder="e.g. Chicago, IL" />
                                </div>
                                <div className="mb-4">
                                    <label>Group</label>
                                    <select
                                        value={newKeyword.group}
                                        onChange={e => setNewKeyword({ ...newKeyword, group: e.target.value })}
                                    >
                                        {groups.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsAddOpen(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Keyword</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RankTracking;
