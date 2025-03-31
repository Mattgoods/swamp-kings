import React, { useState, useEffect } from 'react';
import { geolocated } from 'react-geolocated';
import PropTypes from 'prop-types';
import './MapInput.css';

const MapInput = ({ onLocationSelected, coords }) => {
  const [isLoadingMaps, setIsLoadingMaps] = useState(true);
  const [map, setMap] = useState(null);
  const [address, setAddress] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isValidLocation, setIsValidLocation] = useState(false);

  // Validate Google Maps API key
  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      setValidationError('Google Maps API key is missing');
      setIsLoadingMaps(false);
      return;
    }
  }, []);

  useEffect(() => {
    let timeoutId;
    let script;
    let maxAttempts = 50; // 5 seconds maximum wait
    let attempts = 0;
    setValidationError('');

    const handleError = (error) => {
      clearTimeout(timeoutId);
      setIsLoadingMaps(false);
      setValidationError('Failed to load Google Maps. Please refresh the page.');
      console.error('Failed to load Google Maps API:', error);
      if (script) script.remove();
    };

    const checkGoogleMapsLoaded = () => {
      if (window.google?.maps?.places) {
        setIsLoadingMaps(false);
        try {
          initializeMap();
        } catch (error) {
          handleError(error);
        }
      } else if (attempts < maxAttempts) {
        attempts++;
        timeoutId = setTimeout(checkGoogleMapsLoaded, 100);
      } else {
        handleError(new Error('Timeout loading Google Maps'));
      }
    };

    if (!document.querySelector('#google-maps-script')) {
      script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onerror = (error) => handleError(error);
      document.head.appendChild(script);
    }

    window.gm_authFailure = () => handleError(new Error('Google Maps authentication failed'));
    checkGoogleMapsLoaded();
    
    const clearGeolocation = getApproximateLocation();
    return () => {
      clearTimeout(timeoutId);
      clearGeolocation();
      if (script) script.remove();
    };
  }, []);

  // Get and watch user's approximate location
  const handleGeolocationClick = () => {
    if (!coords) {
      setValidationError('Unable to get current location - please enable location services');
      return;
    }
    
    const geocoder = new window.google.maps.Geocoder();
    const location = { lat: coords.latitude, lng: coords.longitude };
    geocoder.geocode({ location }, (results, status) => {
      if (status === 'OK' && results[0]) {
        setAddress(results[0].formatted_address);
        onLocationSelected(results[0].formatted_address, {
          latitude: coords.latitude,
          longitude: coords.longitude
        });
        setIsValidLocation(true);
      } else {
        setValidationError('Could not determine address for current location');
        setIsValidLocation(false);
      }
    });
  };

  const getApproximateLocation = () => {
    if (!navigator.geolocation) {
      setValidationError('Geolocation is not supported by your browser');
      return () => {};
    }
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        // Update map center if map exists
        if (map) {
          map.setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
      },
      { 
        maximumAge: 10000, 
        timeout: 5000,
        enableHighAccuracy: true 
      }
    );

    // Return cleanup function to clear watch
    return () => navigator.geolocation.clearWatch(watchId);
  };

  const validateUSAddress = (place) => {
    if (!place.address_components) return false;
    return place.address_components.some(component => 
      component.types.includes('country') && component.short_name === 'US'
    );
  };

  const initializeMap = () => {
    const defaultLocation = coords ? 
      { lat: coords.latitude, lng: coords.longitude } : 
      { lat: 39.8283, lng: -98.5795 };
    
    const mapElement = document.getElementById('location-map');
    if (!mapElement) return;

    const newMap = new window.google.maps.Map(mapElement, {
      center: defaultLocation,
      zoom: 14,  // Start with closer zoom when we have location
      mapTypeControl: false,
      streetViewControl: false
    });
    setMap(newMap);  // Set map state immediately so geolocation can use it

    const input = document.getElementById('location-input');
    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['address'],
      componentRestrictions: { country: 'US' }
    });

    let marker = null;

    autocomplete.bindTo('bounds', newMap);
    autocomplete.addListener('place_changed', () => {
      try {
        const place = autocomplete.getPlace();
        
        if (!place.geometry) {
          setValidationError('Please select a valid address from the suggestions');
          setIsValidLocation(false);
          return;
        }

        if (!validateUSAddress(place)) {
          setValidationError('Only US addresses are currently supported');
          setIsValidLocation(false);
          return;
        }

        // Update map view
        if (place.geometry.viewport) {
          newMap.fitBounds(place.geometry.viewport);
        } else {
          newMap.setCenter(place.geometry.location);
          newMap.setZoom(17);
        }

        // Update or create marker
        if (marker) {
          marker.setMap(null);
        }
        marker = new window.google.maps.Marker({
          map: newMap,
          position: place.geometry.location,
          animation: window.google.maps.Animation.DROP
        });

        // Update input and callback with location data
        setValidationError('');
        setIsValidLocation(true);
        setAddress(place.formatted_address);
        onLocationSelected(place.formatted_address, {
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        });
      } catch (error) {
        console.error('Error handling place selection:', error);
        setValidationError('Error selecting location. Please try again.');
      }
    });
  };

  return (
    <div className="map-input-container">
      <div className="input-group">
        <div className="input-wrapper">
          <input
            id="location-input"
            type="text"
            className={`form-control ${validationError ? 'error' : ''} ${isValidLocation ? 'valid' : ''}`}
            placeholder={isLoadingMaps ? "Initializing map..." : "Enter event address"}
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setIsValidLocation(false);
              setValidationError('');
            }}
            disabled={isLoadingMaps}
            aria-label="Event location address"
          />
          {isLoadingMaps && (
            <div className="loading-spinner"></div>
          )}
        </div>
        <button
          type="button"
          className="geolocation-btn"
          onClick={handleGeolocationClick}
          disabled={!coords || isLoadingMaps}
          aria-label="Use current location"
        >
          📍
        </button>
      </div>

      {validationError && (
        <div className="validation-error" role="alert">
          {validationError}
        </div>
      )}
      
      <div className="map-container">
        <div 
          id="location-map" 
          className={`map-view ${isValidLocation ? 'valid' : ''}`}
        ></div>
        {!isLoadingMaps && (
          <div className="map-overlay" aria-hidden="true">
            {isValidLocation ? '✓ Valid Location' : 'Select a location'}
          </div>
        )}
      </div>


    </div>
  );
};

MapInput.propTypes = {
  onLocationSelected: PropTypes.func.isRequired,
  coords: PropTypes.shape({
    latitude: PropTypes.number,
    longitude: PropTypes.number
  })
};

export default geolocated({
  positionOptions: {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 5000
  },
  userDecisionTimeout: 5000
})(MapInput);
