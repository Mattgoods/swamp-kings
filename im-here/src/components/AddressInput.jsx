import React, { useEffect, useState } from 'react';

const AddressInput = ({ defaultValue, onAddressSelected, required }) => {
  const [isLoadingMaps, setIsLoadingMaps] = useState(true);

  useEffect(() => {
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsLoadingMaps(false);
      } else {
        setTimeout(checkGoogleMapsLoaded, 100);
      }
    };
    checkGoogleMapsLoaded();
  }, []);

  return (
    <div className="location-input-wrapper">
      {isLoadingMaps ? (
        <div className="loading-wrapper">
          <input
            type="text"
            className="form-control"
            placeholder="Loading address search..."
            disabled
          />
          <div className="loading-spinner" style={{ 
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '20px'
          }}></div>
        </div>
      ) : (
        <input
          type="text"
          name="location"
          className="form-control"
          defaultValue={defaultValue}
          ref={(input) => {
            if (input && !input.hasAutocomplete && window.google) {
              try {
                const autocomplete = new window.google.maps.places.Autocomplete(input, {
                  types: ['address'],
                  componentRestrictions: { country: 'US' }
                });
                
                autocomplete.addListener('place_changed', () => {
                  const place = autocomplete.getPlace();
                  if (place.geometry) {
                    const address = place.formatted_address;
                    const coordinates = {
                      latitude: place.geometry.location.lat(),
                      longitude: place.geometry.location.lng()
                    };
                    onAddressSelected(address, coordinates);
                  }
                });
                
                input.hasAutocomplete = true;
              } catch (error) {
                console.error('Error initializing Places Autocomplete:', error);
                setIsLoadingMaps(true); // Retry loading if there's an error
              }
            }
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          required={required}
        />
      )}
      <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
        Start typing and select an address from the dropdown to ensure accuracy
      </small>
    </div>
  );
};

export default AddressInput;
