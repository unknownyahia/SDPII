import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';

type LocationPermissionResult = {
  status: 'granted' | 'denied';
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

export async function requestForegroundLocationPermission(): Promise<LocationPermissionResult> {
  if (Platform.OS === 'ios') {
    const status = await Geolocation.requestAuthorization('whenInUse');

    return {
      status: status === 'granted' ? 'granted' : 'denied',
    };
  }

  if (Platform.OS !== 'android') {
    return { status: 'granted' };
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );

  return {
    status:
      result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied',
  };
}

export async function getCurrentCoordinates(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(error?.message || 'Unable to fetch your location.'));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        forceRequestLocation: true,
        showLocationDialog: true,
      }
    );
  });
}

export async function getLocationDisplayName(lat: number, lng: number) {
  return `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;
}
