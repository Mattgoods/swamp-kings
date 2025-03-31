import React, { useEffect, useRef, useState } from 'react';

// TODO: Replace with your actual Google Maps API key
const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY_HERE';

// TODO: Consider moving map config to a separate file
const defaultMapOptions = {
  center: { lat: 40.7128, lng: -74.006 }, // New York
  zoom: 10,
};

const MapWithMarker = () => {
  const mapRef = useRef(null);
  const googleMap = useRef(null);
  const markerRef = useRef(null);

  const [markerPosition, setMarkerPosition] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // TODO: Create a utility to dynamically load Google Maps script
  useEffect(() => {
    if (!window.google || !window.google.maps) {
      console.warn('Google Maps API not available.');
      // TODO: Optionally load script here
      return;
    }

    // Initialize map
    googleMap.current = new window.google.maps.Map(mapRef.current, defaultMapOptions);
    setMapLoaded(true);

    // Add click listener to map
    const listener = googleMap.current.addListener('click', (e) => {
      const position = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };

      if (markerRef.current) {
        markerRef.current.setPosition(position);
      } else {
        markerRef.current = new window.google.maps.Marker({
          position,
          map: googleMap.current,
          title: 'Selected Location',
          // TODO: Customize marker icon or animation
        });
      }

      setMarkerPosition(position);
      console.log('Marker placed at:', position);
    });

    // Cleanup
    return () => {
      if (listener) {
        window.google.maps.event.removeListener(listener);
      }
    };
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Interactive Map</h2>
      <p>
        Click anywhere on the map below to place a marker. This will update the selected
        coordinates, which can later be saved or used elsewhere in the app.
      </p>

      {/* TODO: Add loading state while map is initializing */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '500px',
          borderRadius: '8px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ccc',
        }}
      />

      {/* TODO: Replace console.log with real-time display of coordinates */}
      {markerPosition && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Selected Coordinates:</strong>
          <div>Latitude: {markerPosition.lat}</div>
          <div>Longitude: {markerPosition.lng}</div>
        </div>
      )}

      {/* TODO: Add reset marker button */}
      {/* TODO: Add button to save marker to backend */}
    </div>
  );
};

export default MapWithMarker;
