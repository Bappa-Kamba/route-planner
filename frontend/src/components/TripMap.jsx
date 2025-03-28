import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";
// import axios from "axios";
import { MapIcon, Droplet, Clock, Calendar } from "lucide-react";
import { ComplianceCard, CycleMeter } from "./ComplianceCard";

const MAPBOX_API_KEY = import.meta.env.VITE_APP_MAPBOX_API_KEY;
mapboxgl.accessToken = MAPBOX_API_KEY;

// Enhanced Map Legend Component
const MapLegend = () => (
  <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg z-10 
    border border-gray-200 text-sm">
    <h3 className="font-semibold mb-2">Map Legend</h3>
    <div className="space-y-2">
      <div className="flex items-center">
        <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
        <span>Start Location</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
        <span>Pickup Point</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
        <span>Drop-off Point</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
        <span>Fuel Stops</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
        <span>Rest Stops</span>
      </div>
    </div>
  </div>
);

const TripMap = ({ tripData }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  // In TripMap.jsx
  const addStopMarkers = (coordinates, label, color) => {
    if (!map.current || !coordinates) return;

    // Create marker element
    const el = document.createElement('div');
    el.className = 'marker cursor-pointer';
    el.innerHTML = `
      <div class="relative">
        <div class="w-5 h-5 bg-${color}-500 rounded-full border-2 border-white shadow-lg"></div>
      </div>
    `;

    // Create popup content
    // const stopLabel = `${icon ? `<img src="https://unpkg.com/@mapbox/maki@7.0.0/icons/${icon}.svg" 
    //                               class="w-6 h-6" alt="${icon}">` : ''}
    //                               ${}`;
    const popup = new mapboxgl.Popup({ offset: 25 }).setText(label);
      // .setHTML(`
      //   <div class="flex items-center gap-2">
      //     ${icon ? `<img src="https://unpkg.com/@mapbox/maki@7.0.0/icons/${icon}.svg" 
      //                 class="w-6 h-6" alt="${icon}">` : ''}
      //     <div>
      //       <p class="text-xs text-gray-600">${label}</p>
      //     </div>
      //   </div>
      // `);

    // Add marker to map
    new mapboxgl.Marker(el)
      .setLngLat(coordinates)
      .setPopup(popup)
      .addTo(map.current);
  };

  useEffect(() => {
    if (!mapContainer.current || !tripData || !tripData.trip) return;
    
    const {
      current_location = "",
      pickup_location = "",
      dropoff_location = "",
      route_geometry
    } = tripData.trip || {};
    console.log("TripMap: tripData", tripData);
    console.log("TripMap: current_location", current_location);
    console.log("TripMap: pickup_location", pickup_location);
    console.log("TripMap: dropoff_location", dropoff_location);

    if (!current_location || !pickup_location || !dropoff_location) {
      console.warn("TripMap: One or more location values are missing.", {
        current_location,
        pickup_location,
        dropoff_location
      });
      return;
    }

    const parseCoordinates = (location) => {
      if (!location || typeof location !== "string") return null;
      const parts = location.split(",").map(Number);
      return parts.length === 2 && parts.every((num) => !isNaN(num)) ? parts : null;
    };

    let coordinates = {
      start: parseCoordinates(current_location),
      pickup: parseCoordinates(pickup_location),
      dropoff: parseCoordinates(dropoff_location),
      fuelStops: [],
      restStops: []
    };

    // const geocodeLocation = async (address, type, index) => {
    //   try {
    //     const response = await axios.get(
    //       `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_API_KEY}`
    //     );
    //     const feature = response.data.features[0];
    //     if (feature) {
    //       return feature.center;
    //     }
    //   } catch (error) {
    //     console.error(`Geocoding error for ${type} ${index + 1}:`, error);
    //   }
    //   return null;
    // };

    const loadGeocodedStops = async () => {
      try {
        // Process fuel stops from backend data
        const fuelStops = tripData.stops?.fuel_stop_locations || [];
        const restStops = tripData.stops?.rest_stop_locations || [];

        // Convert string coordinates to arrays
        coordinates.fuelStops = fuelStops.map(stop => {
          const coords = stop.coords;
          return {
          ...stop,
          coords
        }});

        coordinates.restStops = restStops.map(stop => ({
          ...stop,
          coords: stop.coords
        }));

        console.log("Processed Fuel Stops:", coordinates.fuelStops);
        console.log("Processed Rest Stops:", coordinates.restStops);
        
        placeMarkers();
      } catch (error) {
        console.error("Error processing stops:", error);
      }
    };

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: coordinates.start || [0, 0],
        zoom: 6,
        maxHeight: '70vh'
      });

      // Larger controls
      map.current.addControl(new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true
      }), 'top-right');

      const directions = new MapboxDirections({
        accessToken: MAPBOX_API_KEY,
        unit: "metric",
        profile: "mapbox/driving",
        controls: { 
          instructions: true,
          profileSwitcher: false 
        }
      });

      // Style directions control
      directions.on('load', () => {
        const directionsContainer = document.querySelector('.mapbox-directions-component');
        if (directionsContainer) {
          directionsContainer.style.transform = 'scale(0.75)';
          directionsContainer.style.marginTop = '30px';
        }
      });

      map.current.addControl(directions, "top-left");
      directions.setOrigin(coordinates.start);
      directions.addWaypoint(0, coordinates.pickup);
      directions.setDestination(coordinates.dropoff);
    }

    const addMarker = (coord, label, color) => {
      if (Array.isArray(coord) && coord.length === 2 && coord.every(Number.isFinite)) {
        new mapboxgl.Marker({ color })
          .setLngLat(coord)
          .setPopup(new mapboxgl.Popup().setText(label))
          .addTo(map.current);
      } else {
        console.warn(`Invalid coordinates for: ${label}`, coord);
      }
    };

    // Update placeMarkers function
    const placeMarkers = () => {
      // Clear existing markers
      const markers = document.getElementsByClassName('mapboxgl-marker');
      while(markers.length > 0) {
        markers[0].remove();
      }

      // Add main markers
      addMarker(coordinates.start, "🚚 Start Location", "blue");
      addMarker(coordinates.pickup, "📦 Pickup Location", "orange");
      addMarker(coordinates.dropoff, "🏁 Drop-off Location", "green");

      // Add fuel stops
      coordinates.fuelStops.forEach((stop, index) => {
        if (stop.coords && stop.coords.length === 2) {
          addStopMarkers(
            stop.coords,
            `⛽ ${stop.name || `Fuel Stop ${index + 1}`}`,
            "yellow",
            stop.icon || 'fuel',
            stop.name || 'Fuel Station'
          );
        }
      });

      // Add rest stops
      coordinates.restStops.forEach((stop, index) => {
        if (stop.coords && stop.coords.length === 2) {
          addStopMarkers(
            stop.coords,
            `🛑 ${stop.name || `Rest Stop ${index + 1}`}`,
            "red",
            stop.icon || 'lodging',
            stop.name || 'Rest Area'
          );
        }
      });
    };

    loadGeocodedStops();
    
    if (route_geometry) {
      map.current.on("load", () => {
        if (!map.current.getSource("route")) {
          map.current.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: route_geometry
            }
          });

          map.current.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#2563eb", "line-width": 5 }
          });
        }
      });
    }
    // import("@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css");
  }, [tripData]);

  

  return (
    <div className="mt-6 space-y-6">
      {/* Map Container */}
      <div className="relative w-full h-[50vh] md:h-[70vh] rounded-xl 
              shadow-xl border-2 border-gray-200 bg-gray-50 
              overflow-hidden">
        <div ref={mapContainer} className="w-full h-full" />
        <MapLegend />
      </div>

      {/* Consolidated Trip Summary */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-0.5 bg-gradient-to-r from-primary to-blue-700"></div>
        <div className="p-6 space-y-6">
          <h3 className="text-xl font-medium text-gray-700 mb-6 flex items-center">
            <MapIcon className="h-5 w-5 mr-2 text-blue-600" />
            Trip Summary
          </h3>
          
          {/* Unified Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <SummaryCard 
              icon={<MapIcon className="h-5 w-5 mr-2 text-blue-600" />}
              title="Route Overview"
              items={[
                { label: "Total Distance", value: tripData.route_info?.distance },
                { label: "Estimated Duration", value: tripData.route_info?.duration }
              ]}
            />

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <CycleMeter remaining={tripData.trip?.cycle_hours_remaining} />
            </div>

            <ComplianceCard violations={tripData.trip?.violations || []} />
            
            <SummaryCard 
              icon={<Droplet className="h-5 w-5 mr-2 text-yellow-600" />}
              title="Fuel Stops"
              items={[
                { label: "Required Stops", value: tripData.stops?.fuel_stops || 0 },
                { label: "Next Stop Distance", value: tripData.stops?.next_fuel_distance }
              ]}
            />
            
            <SummaryCard 
              icon={<Clock className="h-5 w-5 mr-2 text-blue-600" />}
              title="Rest Schedule"
              items={[
                { label: "Mandatory Rest Periods", value: tripData.stops?.rest_stops || 0 },
                { label: "Next Rest Deadline", value: tripData.stops?.next_rest_deadline }
              ]}
            /> 

          </div>
              
          
          {/* Enhanced Log Output */}
          {tripData.logs?.length > 0 && (
            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Duty Logs
              </h4>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Date', 'Driving', 'On Duty', 'Off Duty', 'Sleeper'].map((header) => (
                        <th key={header} className="px-4 py-3 text-left text-xs font-medium 
                          text-gray-700 uppercase tracking-wider">
                          {header} Hours
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tripData.logs.map((log, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {new Date(log.date).toLocaleDateString()}
                        </td>
                        {[log.driving_hours, log.on_duty_hours, log.off_duty_hours, log.sleeper_hours].map((value, i) => (
                          <td key={i} className="px-4 py-3 text-sm text-gray-600">
                            {typeof value === 'number' ? value.toFixed(2) : value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable Summary Card Component
const SummaryCard = ({ icon, title, items }) => (
  <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200">
    <div className="flex items-center mb-3">
      {icon}
      <h4 className="text-base font-semibold text-gray-800">{title}</h4>
    </div>
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{item.label}</span>
          <span className="text-sm font-medium text-gray-900">
            {item.value || 'N/A'}
          </span>
        </div>
      ))}
    </div>
  </div>
);
export default TripMap;
