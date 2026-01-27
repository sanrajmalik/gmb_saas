import { useState, useEffect } from 'react';
import api from '../services/api'; // Changed import
import { Loader2, TrendingUp, Trophy } from 'lucide-react';

const CompetitorAnalysis = () => {
    const [listings, setListings] = useState([]);
    const [selectedListing, setSelectedListing] = useState('');
    const [analysis, setAnalysis] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/listings').then(data => {
            setListings(data);
            if (data.length > 0) {
                setSelectedListing(data[0].id);
            }
        });
    }, []);

    useEffect(() => {
        if (!selectedListing) return;
        setLoading(true);
        api.get(`/listings/${selectedListing}/competitors`)
            .then(data => setAnalysis(data))
            .finally(() => setLoading(false));
    }, [selectedListing]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Competitor Intelligence</h1>
                <select
                    value={selectedListing}
                    onChange={e => setSelectedListing(e.target.value)}
                    className="border rounded p-2"
                >
                    {listings.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : analysis.length === 0 ? (
                <div className="card p-8 text-center text-gray-500">
                    No competitor data found. Run a rank check first to capture SERP results.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '2rem' }}>
                    {analysis.map((item, idx) => (
                        <div key={idx} className="card">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <TrendingUp size={18} className="text-primary" /> Keyword: "{item.keyword}"
                            </h3>

                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f9fafb', fontSize: '0.875rem', textAlign: 'left' }}>
                                        <th style={{ padding: '0.75rem' }}>Rank</th>
                                        <th style={{ padding: '0.75rem' }}>Competitor Name</th>
                                        <th style={{ padding: '0.75rem' }}>Avg Rank</th>
                                        <th style={{ padding: '0.75rem' }}>Frequency</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {item.topCompetitors.map((comp, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                {i < 3 ? <Trophy size={16} color={i === 0 ? '#eab308' : i === 1 ? '#94a3b8' : '#b45309'} /> : `#${i + 1}`}
                                            </td>
                                            <td style={{ padding: '0.75rem', fontWeight: '500' }}>{comp.name}</td>
                                            <td style={{ padding: '0.75rem' }}>{comp.averageRank.toFixed(1)}</td>
                                            <td style={{ padding: '0.75rem' }}>{comp.appearanceCount} times</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CompetitorAnalysis;
