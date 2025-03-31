// Function to calculate distance between two points using Haversine formula
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Function to verify if user is within acceptable distance of group location
export const verifyLocation = async (groupCoordinates, maxDistance = 100) => {
  try {
    const position = await getCurrentPosition();
    const distance = calculateDistance(
      position.coords.latitude,
      position.coords.longitude,
      groupCoordinates.latitude,
      groupCoordinates.longitude
    );
    
    return {
      isWithinRange: distance <= maxDistance,
      distance,
      currentLocation: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }
    };
  } catch (error) {
    console.error('Error getting location:', error);
    throw new Error('Unable to verify location. Please enable location services and try again.');
  }
};

// Promise wrapper for geolocation API
const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  });
};

// Function to initialize Google Maps
export const initializeMap = (elementId, coordinates, zoom = 15) => {
  const map = new window.google.maps.Map(document.getElementById(elementId), {
    center: { 
      lat: coordinates.latitude, 
      lng: coordinates.longitude 
    },
    zoom: zoom,
    mapTypeControl: false,
    streetViewControl: false
  });

  // Add a marker for the location
  new window.google.maps.Marker({
    position: { 
      lat: coordinates.latitude, 
      lng: coordinates.longitude 
    },
    map: map,
    title: "Meeting Location"
  });

  return map;
};

// Function to show current location on map
export const showCurrentLocationOnMap = async (map) => {
  try {
    const position = await getCurrentPosition();
    const currentLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    // Add a marker for current location
    new window.google.maps.Marker({
      position: currentLocation,
      map: map,
      title: "Your Location",
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 2,
      }
    });

    // Center map on current location
    map.setCenter(currentLocation);
  } catch (error) {
    console.error('Error showing current location:', error);
    throw error;
  }
};
