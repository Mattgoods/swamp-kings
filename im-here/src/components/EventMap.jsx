import React, { useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const EventMap = () => {
  const [markerPosition, setMarkerPosition] = useState(null);

  // Function to handle map clicks and set the marker position
  const handleMapClick = (event) => {
    setMarkerPosition({
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    });
  };

  // Function to reset the marker position to the default location
  const resetMarker = () => {
    setMarkerPosition(null);
  };

  const mapContainerStyle = {
    height: "400px",
    width: "800px"
  };

  const center = {
    lat: 37.7749, // Default latitude
    lng: -122.4194 // Default longitude
  };

  return (
    <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={10}
        onClick={handleMapClick}
      >
        {markerPosition && <Marker position={markerPosition} />}
      </GoogleMap>
      <button onClick={resetMarker} style={{ marginTop: '10px' }}>
        Reset Marker
      </button>
    </LoadScript>
  );
};

export default EventMap;
