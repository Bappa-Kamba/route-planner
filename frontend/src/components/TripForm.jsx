import React, { useState } from "react";
import { createTrip } from "../utils/Api";
import LocationSearch from "./LocationSearch";
import TripMap from "./TripMap";
import { MapIcon, TruckIcon, ClockIcon, ArrowRightIcon, MapPinIcon } from "lucide-react";

const TripForm = () => {
  const [formData, setFormData] = useState({
    current_location: "",
    pickup_location: "",
    dropoff_location: "",
    cycle_hours: ""
  });

  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(1);

  // Enhanced progress steps with labels
  const steps = [
    { number: 1, label: "Route Planning" },
    { number: 2, label: "Schedule Details" },
    { number: 3, label: "Review & Export" }
  ];

  const handleLocationSelect = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTripData(null);

    try {
      const data = await createTrip(formData);
      setTripData(data);
      setActiveStep(3);
    } catch (err) {
      setError("Failed to process the trip. Please try again.");
      console.error("Error creating trip:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 p-4 text-white">
            <div className="flex items-center space-x-3">
              <TruckIcon className="h-6 w-6" />
              <h1 className="text-2xl font-bold tracking-tight">Route Planner Pro</h1>
            </div>
            <p className="mt-1 text-blue-100 font-light text-sm">Plan your journey with optimal stops and efficient routing</p>
          </div>

          {/* Enhanced Progress Steps */}
          <div className="px-6 pt-4">
            <div className="flex flex-col items-center mb-6">
              <div className="w-full flex items-center relative">
                {steps.map((step, index) => (
                  <React.Fragment key={step.number}>
                    <div className="w-full flex flex-col items-center z-10">
                      <div className={`flex items-center justify-center rounded-full h-8 w-8 
                        ${activeStep >= step.number ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {step.number}
                      </div>
                      <span className="mt-2 text-xs font-medium text-gray-600 text-center">
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`h-1 flex-1 mx-2 absolute top-4 
                        ${activeStep > index ? 'bg-blue-600' : 'bg-gray-200'}
                        left-${(index + 1) * 25}% w-1/1`}></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Error Message */}
            {error && (
              <div className="mx-4 my-4 rounded-md bg-red-50 p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-4 w-4 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                {/* Current Location */}
                <div className="col-span-2 md:col-span-1 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Location
                    <span className="text-gray-500 text-xs ml-1">(Nearest major city)</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <div className="bg-blue-100 rounded-full p-1">
                        <MapPinIcon className="h-4 w-4 text-blue-400" />
                      </div>
                    </div>
                    <LocationSearch 
                      onSelect={(value) => handleLocationSelect("current_location", value)}
                      placeholder="Enter your current location"
                      className="block w-full pl-10 pr-12 py-2 text-sm border border-gray-300 rounded-lg 
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ring-offset-1"
                    />
                  </div>
                </div>

                {/* Enhanced Cycle Hours Input */}
                <div className="col-span-1 relative">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Current Cycle Used (Hours)
                    <p className="text-xs text-gray-500 font-normal mt-1">
                      Total driving hours since last rest period
                    </p>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="cycle_hours"
                      value={formData.cycle_hours}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full pl-10 py-2 text-sm border border-gray-300 rounded-lg 
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ring-offset-1"
                      min="0"
                      step="0.25"
                    />
                  </div>
                </div>

                {/* Pickup Location */}
                <div className="col-span-1 relative">
                  <label className="text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <div className="bg-orange-100 rounded-full p-1">
                        <MapPinIcon className="h-4 w-4 text-orange-400" />
                      </div>
                    </div>
                    <LocationSearch 
                      label="" 
                      onSelect={(value) => handleLocationSelect("pickup_location", value)}
                      placeholder="Enter pickup location"
                      className="block w-full pl-10 pr-12 py-2 text-sm border border-gray-300 rounded-lg 
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ring-offset-1"
                    />
                  </div>
                </div>

                {/* Dropoff Location */}
                <div className="col-span-1 relative">
                  <label className="text-sm font-medium text-gray-700 mb-1">Dropoff Location</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <div className="bg-green-100 rounded-full p-1">
                        <MapPinIcon className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                    <LocationSearch 
                      label="" 
                      onSelect={(value) => handleLocationSelect("dropoff_location", value)}
                      placeholder="Enter dropoff location"
                      className="block w-full pl-10 pr-12 py-2 text-sm border border-gray-300 rounded-lg 
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ring-offset-1"
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Calculate Route Button */}
              <div className="mt-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto flex items-center justify-center px-6 py-3 
                    border border-transparent rounded-lg shadow-sm text-base font-medium text-white 
                    bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
                    transition-all duration-150 transform hover:scale-105 focus:outline-none focus:ring-2 
                    focus:ring-blue-500 focus:ring-offset-2"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Spinner />
                      Processing Route...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      Calculate Optimal Route
                      <ArrowRightIcon className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-all" />
                    </div>
                  )}
                </button>
              </div>
            </form>

            {/* Consolidated Trip Details */}
            {tripData && (
              <TripMap 
                tripData={tripData} 
                className="mt-6 space-y-5"
              />
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-4 text-center text-gray-400 text-xs">
          <p>&copy; {new Date().getFullYear()} Route Planner Pro. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

// Custom Spinner Component
const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
    </path>
  </svg>
);
export default TripForm;
