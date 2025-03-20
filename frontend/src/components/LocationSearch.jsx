/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import { MapIcon as MapPinIcon } from "lucide-react";

const MAPBOX_API_KEY = import.meta.env.VITE_APP_MAPBOX_API_KEY;

const LocationSearch = ({ label, onSelect, className, placeholder }) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setSuggestions([]);
        setIsFocused(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // Enhanced geocoding with proximity bias
  const searchLocations = async (searchText) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchText)}.json?` +
        new URLSearchParams({
          access_token: MAPBOX_API_KEY,
          autocomplete: true,
          types: 'place,postcode,address',
          proximity: 'ip', // Bias results to user's approximate location
          language: 'en',
          limit: 5
        })
      );
      
      const data = await response.json();
      return data.features.sort((a, b) => 
        a.relevance > b.relevance ? -1 : 1
      );
    } catch (error) {
      console.error("Location search error:", error);
      return [];
    }
  };

  // Debounced search handler
  useEffect(() => {
    if (query.length < 3) return;
    
    const timeoutId = setTimeout(async () => {
      const locations = await searchLocations(query);
      setResults(locations);
      setIsOpen(true);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [query]);

  
  const handleSelect = (place) => {
    const { center, place_name } = place;
    setInputValue(place_name);
    setSuggestions([]); // Hide suggestions after selection
    onSelect(`${center[0]},${center[1]}`); // Send the place name for display
    // You can also send coordinates if needed: onSelect(`${center[0]},${center[1]}`);
  };
  
  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setQuery(e.target.value);
          setInputValue(e.target.value);
        }
      }
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full pl-10 pr-12 py-2 text-sm border border-gray-300 rounded-lg 
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ring-offset-1"
      />
      
      {isOpen && results.length > 0 && (
        <div className="absolute z-20 mt-2 w-full bg-white shadow-lg rounded-md 
          py-2 text-base ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto">
          {results.map((place) => (
            <button
              key={place.id}
              onClick={() => {
                handleSelect(place);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 
                transition-colors flex items-center"
            >
              <MapPinIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">{place.text_en}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {place.place_name}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
