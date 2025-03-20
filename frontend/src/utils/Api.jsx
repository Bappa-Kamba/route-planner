const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;

export const createTrip = async (tripData) => {
  const response = await fetch(`${API_BASE_URL}/trip/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tripData),
  });

  if (!response.ok) {
    throw new Error("Failed to create trip");
  }

  console.log("Trip created successfully:", tripData);
  return await response.json();
};
