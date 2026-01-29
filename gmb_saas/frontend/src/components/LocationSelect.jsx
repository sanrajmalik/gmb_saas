import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { MapPin, Loader2 } from 'lucide-react';

const LocationSelect = ({ value, onChange, placeholder = "Search for a city..." }) => {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = async (val) => {
        setQuery(val);
        if (val.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            // New endpoint: /api/listings/locations?q=...
            const data = await api.get(`/listings/locations?q=${encodeURIComponent(val)}`);
            setSuggestions(data || []);
            setShowSuggestions(true);
        } catch (error) {
            console.error("Location fetch failed", error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item) => {
        setQuery(item.name);
        onChange(item.name); // Return the name string
        setShowSuggestions(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <input
                    type="text"
                    className="w-full border rounded p-2 pl-10"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                />
                <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
                {loading && (
                    <div className="absolute right-3 top-2.5">
                        <Loader2 className="animate-spin text-gray-400" size={18} />
                    </div>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border rounded-b-lg shadow-xl max-h-60 overflow-y-auto mt-1 left-0">
                    {suggestions.map((item) => (
                        <li
                            key={item.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-0"
                            onClick={() => handleSelect(item)}
                        >
                            <div className="font-medium">{item.name}</div>
                            {item.type && <div className="text-xs text-gray-400 capitalize">{item.type}</div>}
                        </li>
                    ))}
                </ul>
            )}

            {showSuggestions && !loading && suggestions.length === 0 && query.length >= 3 && (
                <div className="absolute z-50 w-full bg-white border rounded-b-lg shadow-xl p-3 text-sm text-gray-500 mt-1">
                    No results found.
                </div>
            )}
        </div>
    );
};

export default LocationSelect;
