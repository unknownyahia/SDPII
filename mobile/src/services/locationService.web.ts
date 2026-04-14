type LocationPermissionResult = {
  status: 'granted' | 'denied';
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

type BrowserPermissions = {
  query: (descriptor: {
    name: 'geolocation';
  }) => Promise<{ state: 'granted' | 'denied' | 'prompt' }>;
};

type BrowserGeolocation = {
  getCurrentPosition: (
    success: (position: { coords: Coordinates }) => void,
    error?: (error?: { code?: number; message?: string }) => void,
    options?: {
      enableHighAccuracy?: boolean;
      timeout?: number;
      maximumAge?: number;
    }
  ) => void;
};

type BrowserNavigator = {
  geolocation?: BrowserGeolocation;
  permissions?: BrowserPermissions;
};

type BrowserLocation = {
  hostname?: string;
};

function getBrowserNavigator(): BrowserNavigator | undefined {
  return typeof window === 'undefined'
    ? undefined
    : (window.navigator as BrowserNavigator | undefined);
}

function getBrowserLocation(): BrowserLocation | undefined {
  return typeof window === 'undefined'
    ? undefined
    : (window.location as BrowserLocation | undefined);
}

function isSecureLocationContext() {
  if (typeof window === 'undefined') {
    return true;
  }

  if (window.isSecureContext) {
    return true;
  }

  const hostname = getBrowserLocation()?.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function getBrowserLocationUnavailableMessage() {
  if (!isSecureLocationContext()) {
    return 'Browser location requires HTTPS or http://localhost.';
  }

  return 'Browser geolocation is not available in this browser.';
}

export async function requestForegroundLocationPermission(): Promise<LocationPermissionResult> {
  const browserNavigator = getBrowserNavigator();
  if (!isSecureLocationContext() || !browserNavigator?.geolocation) {
    return { status: 'denied' };
  }

  if (!browserNavigator.permissions?.query) {
    return { status: 'granted' };
  }

  try {
    const permission = await browserNavigator.permissions.query({
      name: 'geolocation',
    });

    return {
      status: permission.state === 'denied' ? 'denied' : 'granted',
    };
  } catch {
    return { status: 'granted' };
  }
}

export async function getCurrentCoordinates(): Promise<Coordinates> {
  const browserNavigator = getBrowserNavigator();
  if (!isSecureLocationContext() || !browserNavigator?.geolocation) {
    throw new Error(getBrowserLocationUnavailableMessage());
  }

  return new Promise((resolve, reject) => {
    browserNavigator.geolocation?.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      error => {
        if (error?.code === 1) {
          reject(
            new Error(
              'Location access was blocked by the browser. Allow location access and try again.'
            )
          );
          return;
        }

        if (error?.code === 3) {
          reject(
            new Error(
              'The browser timed out while fetching your location. Try again with location services enabled.'
            )
          );
          return;
        }

        reject(
          new Error(
            error?.message || 'Unable to fetch your location from the browser.'
          )
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  });
}

export async function getLocationDisplayName(lat: number, lng: number) {
  return `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;
}
