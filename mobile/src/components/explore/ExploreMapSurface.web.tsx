import { latLngBounds } from 'leaflet';
import React from 'react';
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

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

type ExploreMapSurfaceProps = {
  posts: SpotPost[];
  events: PromotedEvent[];
  selectedResult: SelectedResult;
  browserLocation: BrowserCoordinates | null;
  onSelectPost: (post: SpotPost) => void;
  onSelectEvent: (event: PromotedEvent) => void;
  style?: StyleProp<ViewStyle>;
};

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
    color: selected ? '#B45309' : '#D97706',
    fillColor: selected ? '#F59E0B' : '#F59E0B',
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
  return (
    <View style={[styles.frame, style]}>
      <MapContainer
        center={[DEFAULT_EXPLORE_REGION.latitude, DEFAULT_EXPLORE_REGION.longitude]}
        zoom={11}
        scrollWheelZoom
        style={mapStyle}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
              color: colors.success,
              fillColor: colors.success,
              fillOpacity: 0.24,
              weight: 3,
            }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              Your browser location
            </Tooltip>
          </CircleMarker>
        ) : null}

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
    height: 500,
    overflow: 'hidden',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#DCEAF7',
  },
});
