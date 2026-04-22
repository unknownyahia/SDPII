import { divIcon, latLngBounds } from 'leaflet';
import React from 'react';
import {
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  ZoomControl,
} from 'react-leaflet';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { calculateDistanceKm } from '../../services/discoveryService';
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

type ExploreAreaCluster = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
};

type ExploreMapSurfaceProps = {
  posts: SpotPost[];
  events: PromotedEvent[];
  selectedResult: SelectedResult;
  browserLocation: BrowserCoordinates | null;
  onSelectPost: (post: SpotPost) => void;
  onSelectEvent: (event: PromotedEvent) => void;
  style?: StyleProp<ViewStyle>;
};

const AREA_CLUSTERS: readonly ExploreAreaCluster[] = [
  {
    id: 'lusail',
    label: 'Lusail',
    latitude: 25.4347,
    longitude: 51.5152,
    radiusKm: 3.6,
  },
  {
    id: 'pearl',
    label: 'The Pearl',
    latitude: 25.3732,
    longitude: 51.5504,
    radiusKm: 2.7,
  },
  {
    id: 'west-bay',
    label: 'West Bay',
    latitude: 25.3261,
    longitude: 51.5318,
    radiusKm: 2.9,
  },
  {
    id: 'msheireb',
    label: 'Msheireb',
    latitude: 25.2869,
    longitude: 51.5219,
    radiusKm: 2.2,
  },
  {
    id: 'doha',
    label: 'Doha',
    latitude: 25.2854,
    longitude: 51.531,
    radiusKm: 3.9,
  },
  {
    id: 'education-city',
    label: 'Education City',
    latitude: 25.315,
    longitude: 51.4391,
    radiusKm: 3.7,
  },
  {
    id: 'aspire-zone',
    label: 'Aspire Zone',
    latitude: 25.2632,
    longitude: 51.4416,
    radiusKm: 3.2,
  },
] as const;

function createAreaClusterIcon(label: string, count: number, selected: boolean) {
  const labelBorder = selected ? colors.primary : colors.borderStrong;
  const labelText = selected ? colors.primaryPressed : colors.text;
  const bubbleBackground = selected ? colors.primaryPressed : '#FF725D';
  const bubbleShadow = selected ? '#D94B37' : '#F4B8AE';
  const bubbleContent =
    count > 0
      ? `
        <div style="
          min-width: 34px;
          height: 34px;
          border-radius: 999px;
          padding: 0 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${bubbleBackground};
          color: #FFFDFC;
          font-size: 16px;
          font-weight: 800;
          line-height: 1;
          border: 4px solid rgba(255, 252, 248, 0.96);
          box-shadow: 0 12px 22px rgba(42, 33, 25, 0.18), 0 0 0 1px ${bubbleShadow};
        ">${count}</div>
      `
      : `
        <div style="
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: ${bubbleBackground};
          border: 3px solid rgba(255, 252, 248, 0.96);
          box-shadow: 0 10px 20px rgba(42, 33, 25, 0.14);
        "></div>
      `;

  return divIcon({
    className: 'spots-area-cluster',
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        transform: translateY(-8px);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <div style="
          padding: 7px 12px;
          border-radius: 999px;
          border: 1px solid ${labelBorder};
          background: rgba(255, 252, 248, 0.96);
          color: ${labelText};
          font-size: 12px;
          line-height: 1;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 10px 18px rgba(42, 33, 25, 0.12);
        ">${label}</div>
        ${bubbleContent}
      </div>
    `,
    iconAnchor: [44, 72],
    iconSize: [88, 88],
  });
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
      ? new ResizeObserverCtor(() => {
          refreshMapLayout();
        })
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
      map.flyTo([selectedTarget.lat, selectedTarget.lng], Math.max(map.getZoom(), 13), {
        animate: true,
        duration: 0.45,
      });
      return;
    }

    const points: [number, number][] = [
      ...posts.map(post => [post.lat, post.lng] as [number, number]),
      ...events.map(event => [event.lat, event.lng] as [number, number]),
    ];

    if (browserLocation) {
      points.push([browserLocation.latitude, browserLocation.longitude]);
    }

    if (points.length === 0) {
      map.setView(
        [DEFAULT_EXPLORE_REGION.latitude, DEFAULT_EXPLORE_REGION.longitude],
        11
      );
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], browserLocation ? 12 : 13);
      return;
    }

    map.fitBounds(latLngBounds(points), {
      padding: [42, 42],
      maxZoom: 13,
      animate: true,
      duration: 0.45,
    });
  }, [browserLocation, events, map, posts, selectedResult]);

  return null;
}

function getPostMarkerStyle(selected: boolean) {
  return {
    color: selected ? colors.primaryPressed : colors.primary,
    fillColor: selected ? colors.primary : colors.primary,
    fillOpacity: selected ? 0.84 : 0.58,
    weight: selected ? 3 : 2,
  };
}

function getEventMarkerStyle(selected: boolean) {
  return {
    color: colors.warning,
    fillColor: colors.warning,
    fillOpacity: selected ? 0.84 : 0.6,
    weight: selected ? 3 : 2,
  };
}

export function ExploreMapSurface({
  posts,
  events,
  selectedResult,
  browserLocation,
  onSelectPost,
  onSelectEvent,
  style,
}: ExploreMapSurfaceProps) {
  const { t } = useLocalization();
  const areaClusters = React.useMemo(() => {
    const selectedTarget =
      selectedResult?.kind === 'post'
        ? posts.find(post => post.id === selectedResult.id) ?? null
        : selectedResult?.kind === 'event'
          ? events.find(event => event.id === selectedResult.id) ?? null
          : null;

    return AREA_CLUSTERS.map(cluster => {
      const count =
        posts.filter(post => {
          return (
            calculateDistanceKm(
              {
                latitude: cluster.latitude,
                longitude: cluster.longitude,
              },
              post
            ) <= cluster.radiusKm
          );
        }).length +
        events.filter(event => {
          return (
            calculateDistanceKm(
              {
                latitude: cluster.latitude,
                longitude: cluster.longitude,
              },
              event
            ) <= cluster.radiusKm
          );
        }).length;

      const selected =
        selectedTarget !== null &&
        calculateDistanceKm(
          {
            latitude: cluster.latitude,
            longitude: cluster.longitude,
          },
          selectedTarget
        ) <= cluster.radiusKm;

      return {
        ...cluster,
        count,
        selected,
      };
    });
  }, [events, posts, selectedResult]);

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
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <MapViewportController
          posts={posts}
          events={events}
          selectedResult={selectedResult}
          browserLocation={browserLocation}
        />

        {browserLocation ? (
          <CircleMarker
            center={[browserLocation.latitude, browserLocation.longitude]}
            radius={10}
            pathOptions={{
              color: colors.info,
              fillColor: colors.info,
              fillOpacity: 0.24,
              weight: 3,
            }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              {t('explore.yourLocation')}
            </Tooltip>
          </CircleMarker>
        ) : null}

        {areaClusters.map(cluster => (
          <Marker
            key={`area-${cluster.id}`}
            position={[cluster.latitude, cluster.longitude]}
            icon={createAreaClusterIcon(cluster.label, cluster.count, cluster.selected)}
            interactive={false}
          />
        ))}

        {posts.map(post => {
          const isSelected =
            selectedResult?.kind === 'post' && selectedResult.id === post.id;

          return (
            <CircleMarker
              key={`post-${post.id}`}
              center={[post.lat, post.lng]}
              radius={isSelected ? 11 : 8}
              pathOptions={getPostMarkerStyle(isSelected)}
              eventHandlers={{
                click: () => onSelectPost(post),
              }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                {post.locationName || post.text}
              </Tooltip>
            </CircleMarker>
          );
        })}

        {events.map(event => {
          const isSelected =
            selectedResult?.kind === 'event' && selectedResult.id === event.id;

          return (
            <CircleMarker
              key={`event-${event.id}`}
              center={[event.lat, event.lng]}
              radius={isSelected ? 12 : 9}
              pathOptions={getEventMarkerStyle(isSelected)}
              eventHandlers={{
                click: () => onSelectEvent(event),
              }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                {event.title}
              </Tooltip>
            </CircleMarker>
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
