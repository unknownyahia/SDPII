import * as Location from 'expo-location';

export async function requestForegroundLocationPermission() {
  return Location.requestForegroundPermissionsAsync();
}

export async function getCurrentCoordinates() {
  const location = await Location.getCurrentPositionAsync({});

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

export async function getLocationDisplayName(lat: number, lng: number) {
  try {
    const result = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });

    if (result[0]) {
      const { city, region, country } = result[0];
      return [city, region, country].filter(Boolean).join(', ');
    }
  } catch (error) {
    console.log('Reverse geocode error:', error);
  }

  return '';
}
