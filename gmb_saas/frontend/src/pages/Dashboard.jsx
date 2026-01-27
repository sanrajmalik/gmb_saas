const Dashboard = () => {
    return (
        <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Overview</h1>
            <div className="card">
                <h2>Welcome to GMB SaaS</h2>
                <p style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>
                    Select a listing to get started or view overall performance.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                    <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Total Listings</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>3</div>
                    </div>
                    <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Avg Rating</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>4.8</div>
                    </div>
                    <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Total Reviews</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>128</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
