import L, { divIcon, latLngBounds, type LatLngExpression } from 'leaflet';
import 'leaflet.heat';
import React from 'react';
import {
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
  ZoomControl,
} from 'react-leaflet';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { DEFAULT_EXPLORE_REGION } from '../../services/exploreService';
import { colors, radius } from '../../theme/designSystem';
import type { PromotedEvent } from '../../types/event';
import type { SpotPost } from '../../types/post';

type BrowserCoordinates = {
  latitude: number;
  longitude: number;
};

type SelectedResult =
  | { kind: 'post'; id: string }
  | { kind: 'event'; id: string }
  | null;

type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

type ExploreMapSurfaceProps = {
  posts: SpotPost[];
  events: PromotedEvent[];
  selectedResult: SelectedResult;
  browserLocation: BrowserCoordinates | null;
  onSelectPost: (post: SpotPost) => void;
  onSelectEvent: (event: PromotedEvent) => void;
  onViewportChange?: (bounds: MapBounds) => void;
  style?: StyleProp<ViewStyle>;
};

type HeatTuple = [number, number, number?];

const HEAT_GRADIENT = {
  0.12: '#5E6BFF',
  0.28: '#52D5FF',
  0.42: '#67F06B',
  0.6: '#F0F36A',
  0.8: '#FFAA5C',
  1.0: '#FF5E5E',
} as const;

function normalizeTimestamp(value: unknown): number | null {
  if (!value) return null;

  if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      const maybeDate = (value as { toDate?: () => Date }).toDate?.();
      if (!maybeDate) return null;
      const parsed = maybeDate.getTime();
      return Number.isFinite(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
}

function getPostHeatWeight(post: SpotPost): number {
  const now = Date.now();
  const createdAt = normalizeTimestamp(post.createdAt);
  const ageHours = createdAt ? Math.max(0, (now - createdAt) / (1000 * 60 * 60)) : 24;

  let weight = 0.52;

  if (post.category === 'event') weight += 0.08;
  if (post.category === 'sighting') weight += 0.04;
  if (post.category === 'weather') weight += 0.02;
  if (post.category === 'fishing') weight += 0.06;

  if (ageHours < 2) weight += 0.22;
  else if (ageHours < 6) weight += 0.14;
  else if (ageHours < 24) weight += 0.06;

  return Math.max(0.24, Math.min(1, weight));
}

function getEventHeatWeight(event: PromotedEvent): number {
  const now = Date.now();
  const startTime = normalizeTimestamp(event.startTime);
  const hoursUntilStart = startTime ? (startTime - now) / (1000 * 60 * 60) : 24;

  let weight = event.isPromoted ? 0.92 : 0.76;

  if (hoursUntilStart >= -6 && hoursUntilStart <= 24) weight += 0.08;
  if (hoursUntilStart >= -1 && hoursUntilStart <= 8) weight += 0.06;

  return Math.max(0.32, Math.min(1, weight));
}

function buildHeatPoints(posts: SpotPost[], events: PromotedEvent[]): HeatTuple[] {
  const postPoints = posts.map<HeatTuple>(post => [
    post.lat,
    post.lng,
    getPostHeatWeight(post),
  ]);

  const eventPoints = events
    .filter(event => event.status === 'active')
    .map<HeatTuple>(event => [event.lat, event.lng, getEventHeatWeight(event)]);

  return [...postPoints, ...eventPoints];
}

function createPointPinIcon(kind: 'post' | 'event', selected: boolean) {
  const size = selected ? 22 : 18;
  const pinColor = kind === 'event' ? '#FF7A4E' : '#FF4F9A';
  const border = selected ? '#FFFFFF' : 'rgba(255,255,255,0.94)';

  return divIcon({
    className: 'spots-heat-pin',
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:999px 999px 999px 0;
        transform: rotate(-45deg);
        background:${pinColor};
        border:2px solid ${border};
        box-shadow:0 6px 14px rgba(32, 27, 22, 0.22);
        position:relative;
      ">
        <div style="
          width:${Math.max(5, size - 10)}px;
          height:${Math.max(5, size - 10)}px;
          border-radius:999px;
          background:rgba(255,255,255,0.92);
          position:absolute;
          top:50%;
          left:50%;
          transform:translate(-50%, -50%) rotate(45deg);
        "></div>
      </div>
    `,
    iconAnchor: [size / 2, size],
    iconSize: [size, size],
  });
}

function HeatLayer({
  posts,
  events,
}: {
  posts: SpotPost[];
  events: PromotedEvent[];
}) {
  const map = useMap();
  const layerRef = React.useRef<any>(null);

  const heatPoints = React.useMemo(() => buildHeatPoints(posts, events), [posts, events]);

  React.useEffect(() => {
    const heatFactory = (L as any).heatLayer as
      | ((points: HeatTuple[], options?: Record<string, unknown>) => any)
      | undefined;

    if (!heatFactory) return;

    if (!layerRef.current) {
      layerRef.current = heatFactory(heatPoints, {
        minOpacity: 0.26,
        maxZoom: 16,
        max: 1,
        radius: 42,
        blur: 34,
        gradient: HEAT_GRADIENT,
      }).addTo(map);
    } else {
      layerRef.current.setLatLngs(heatPoints);
      layerRef.current.setOptions({
        minOpacity: 0.26,
        maxZoom: 16,
        max: 1,
        radius: 42,
        blur: 34,
        gradient: HEAT_GRADIENT,
      });
      layerRef.current.redraw?.();
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [heatPoints, map]);

  return null;
}

function ViewportReporter({
  onViewportChange,
}: {
  onViewportChange?: (bounds: MapBounds) => void;
}) {
  const map = useMapEvents({
    moveend() {
      if (!onViewportChange) return;
      const bounds = map.getBounds();
      onViewportChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    },
    zoomend() {
      if (!onViewportChange) return;
      const bounds = map.getBounds();
      onViewportChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    },
  });

  React.useEffect(() => {
    if (!onViewportChange) return;
    const bounds = map.getBounds();
    onViewportChange({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
  }, [map, onViewportChange]);

  return null;
}

function MapViewportController({
  posts,
  events,
  selectedResult,
  browserLocation,
}: Pick<
  ExploreMapSurfaceProps,
  'posts' | 'events' | 'selectedResult' | 'browserLocation'
>) {
  const map = useMap();
  const lastViewportKeyRef = React.useRef<string>('');

  React.useEffect(() => {
    const browserWindow = typeof window === 'undefined' ? undefined : window;

    const refreshMapLayout = () => {
      map.invalidateSize({
        animate: false,
        pan: false,
      });
    };

    const animationFrameId =
      typeof browserWindow?.requestAnimationFrame === 'function'
        ? browserWindow.requestAnimationFrame(refreshMapLayout)
        : null;

    const ResizeObserverCtor = browserWindow?.ResizeObserver;
    const resizeObserver = ResizeObserverCtor
      ? new ResizeObserverCtor(() => refreshMapLayout())
      : null;

    resizeObserver?.observe(map.getContainer());
    browserWindow?.addEventListener('resize', refreshMapLayout);

    return () => {
      if (animationFrameId !== null) {
        browserWindow?.cancelAnimationFrame(animationFrameId);
      }
      resizeObserver?.disconnect();
      browserWindow?.removeEventListener('resize', refreshMapLayout);
    };
  }, [map]);

  React.useEffect(() => {
    const selectedPost =
      selectedResult?.kind === 'post'
        ? posts.find(post => post.id === selectedResult.id) ?? null
        : null;
    const selectedEvent =
      selectedResult?.kind === 'event'
        ? events.find(event => event.id === selectedResult.id) ?? null
        : null;

    const selectedTarget = selectedPost ?? selectedEvent;

    if (selectedTarget) {
      const viewportKey = `selected:${selectedResult?.kind}:${selectedTarget.id}`;
      if (lastViewportKeyRef.current === viewportKey) return;

      lastViewportKeyRef.current = viewportKey;
      map.flyTo([selectedTarget.lat, selectedTarget.lng], Math.max(map.getZoom(), 13), {
        animate: true,
        duration: 0.42,
      });
      return;
    }

    const points: LatLngExpression[] = [
      ...posts.map(post => [post.lat, post.lng] as LatLngExpression),
      ...events.map(event => [event.lat, event.lng] as LatLngExpression),
    ];

    if (browserLocation) {
      points.push([browserLocation.latitude, browserLocation.longitude]);
    }

    if (points.length === 0) {
      const viewportKey = 'default-qatar';
      if (lastViewportKeyRef.current === viewportKey) return;

      lastViewportKeyRef.current = viewportKey;
      map.setView(
        [DEFAULT_EXPLORE_REGION.latitude, DEFAULT_EXPLORE_REGION.longitude],
        11
      );
      return;
    }

    if (points.length === 1) {
      const [lat, lng] = points[0] as [number, number];
      const viewportKey = `single:${lat.toFixed(4)}:${lng.toFixed(4)}`;
      if (lastViewportKeyRef.current === viewportKey) return;

      lastViewportKeyRef.current = viewportKey;
      map.setView([lat, lng], browserLocation ? 12 : 13);
      return;
    }

    const bounds = latLngBounds(points as [number, number][]);
    const viewportKey = [
      'bounds',
      bounds.getSouth().toFixed(3),
      bounds.getWest().toFixed(3),
      bounds.getNorth().toFixed(3),
      bounds.getEast().toFixed(3),
    ].join(':');

    if (lastViewportKeyRef.current === viewportKey) return;

    lastViewportKeyRef.current = viewportKey;
    map.fitBounds(bounds, {
      padding: [42, 42],
      maxZoom: 13,
      animate: true,
      duration: 0.42,
    });
  }, [browserLocation, events, map, posts, selectedResult]);

  return null;
}

export function ExploreMapSurface({
  posts,
  events,
  selectedResult,
  browserLocation,
  onSelectPost,
  onSelectEvent,
  onViewportChange,
  style,
}: ExploreMapSurfaceProps) {
  const { t } = useLocalization();

  return (
    <View style={[styles.frame, style]}>
      <MapContainer
        center={[DEFAULT_EXPLORE_REGION.latitude, DEFAULT_EXPLORE_REGION.longitude]}
        zoom={11}
        scrollWheelZoom
        zoomControl={false}
        style={mapStyle}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <ViewportReporter onViewportChange={onViewportChange} />

        <MapViewportController
          posts={posts}
          events={events}
          selectedResult={selectedResult}
          browserLocation={browserLocation}
        />

        <HeatLayer posts={posts} events={events} />

        {browserLocation ? (
          <CircleMarker
            center={[browserLocation.latitude, browserLocation.longitude]}
            radius={10}
            pathOptions={{
              color: colors.info,
              fillColor: colors.info,
              fillOpacity: 0.2,
              weight: 3,
            }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              {t('explore.yourLocation')}
            </Tooltip>
          </CircleMarker>
        ) : null}

        {posts.map(post => {
          const isSelected =
            selectedResult?.kind === 'post' && selectedResult.id === post.id;

          return (
            <Marker
              key={`post-${post.id}`}
              position={[post.lat, post.lng]}
              icon={createPointPinIcon('post', isSelected)}
              eventHandlers={{
                click: () => onSelectPost(post),
              }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                {post.locationName || post.text}
              </Tooltip>
            </Marker>
          );
        })}

        {events
          .filter(event => event.status === 'active')
          .map(event => {
            const isSelected =
              selectedResult?.kind === 'event' && selectedResult.id === event.id;

            return (
              <Marker
                key={`event-${event.id}`}
                position={[event.lat, event.lng]}
                icon={createPointPinIcon('event', isSelected)}
                eventHandlers={{
                  click: () => onSelectEvent(event),
                }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  {event.title}
                </Tooltip>
              </Marker>
            );
          })}
      </MapContainer>
    </View>
  );
}

const mapStyle = {
  height: '100%',
  width: '100%',
};

const styles = StyleSheet.create({
  frame: {
    height: '100%',
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
});
