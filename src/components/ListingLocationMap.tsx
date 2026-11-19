import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDistance, formatFcfa, getCommuneCoords } from '../data/beninGeo';
import { LiquidityListing } from '../types';

export interface GeoCoords {
  lat: number;
  lng: number;
}

interface PickerMapProps {
  mode: 'picker';
  centerCoords: GeoCoords;
  pickedCoords: GeoCoords | null;
  onPickCoords: (coords: GeoCoords) => void;
  heightClass?: string;
}

interface DetailMapProps {
  mode: 'detail';
  listing: LiquidityListing;
  userCoords: GeoCoords | null;
  heightClass?: string;
}

interface NearbyMapProps {
  mode: 'nearby';
  userCoords: GeoCoords;
  radiusKm: number | null;
  listings: { listing: LiquidityListing; coords: GeoCoords; isExact: boolean; distanceKm: number }[];
  onSelectListing: (listing: LiquidityListing) => void;
  heightClass?: string;
}

type ListingLocationMapProps = PickerMapProps | DetailMapProps | NearbyMapProps;

export const ListingLocationMap: React.FC<ListingLocationMapProps> = (props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const onPickRef = useRef<((coords: GeoCoords) => void) | null>(null);
  const onSelectRef = useRef<((listing: LiquidityListing) => void) | null>(null);

  useEffect(() => {
    onPickRef.current = props.mode === 'picker' ? props.onPickCoords : null;
    onSelectRef.current = props.mode === 'nearby' ? props.onSelectListing : null;
  }, [props]);

  useEffect(() => {
    if (!containerRef.current) return;

    const initialCenter: [number, number] =
      props.mode === 'picker'
        ? [
            props.pickedCoords?.lat ?? props.centerCoords.lat,
            props.pickedCoords?.lng ?? props.centerCoords.lng,
          ]
        : props.mode === 'detail'
          ? props.listing.latitude !== undefined && props.listing.longitude !== undefined
            ? [props.listing.latitude, props.listing.longitude]
            : getCommuneCoords(props.listing.commune)
          : [props.userCoords.lat, props.userCoords.lng];

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: props.mode === 'nearby' ? 12 : 13,
      minZoom: 6,
      maxZoom: 17,
      scrollWheelZoom: props.mode === 'nearby',
      attributionControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = group;

    if (props.mode === 'picker') {
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onPickRef.current) {
          onPickRef.current({
            lat: Number(e.latlng.lat.toFixed(6)),
            lng: Number(e.latlng.lng.toFixed(6)),
          });
        }
      });
    }

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 120);

    return () => {
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // Only recreate Leaflet instance if mode changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode]);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (props.mode === 'picker') {
      const target = props.pickedCoords || props.centerCoords;
      if (props.pickedCoords) {
        L.circleMarker([props.pickedCoords.lat, props.pickedCoords.lng], {
          radius: 10,
          color: '#111111',
          weight: 2.5,
          fillColor: '#FFCB05',
          fillOpacity: 0.95,
        })
          .bindTooltip('Position choisie pour votre annonce', { direction: 'top' })
          .addTo(group);
      }
      map.setView([target.lat, target.lng], props.pickedCoords ? 14 : 12, { animate: true });
      return;
    }

    if (props.mode === 'detail') {
      const hasExact =
        props.listing.latitude !== undefined && props.listing.longitude !== undefined;
      const [lat, lng] = hasExact
        ? [props.listing.latitude as number, props.listing.longitude as number]
        : getCommuneCoords(props.listing.commune);

      const agentMarker = L.circleMarker([lat, lng], {
        radius: 10,
        color: '#111111',
        weight: 2.5,
        fillColor: '#FFCB05',
        fillOpacity: 0.95,
      }).bindTooltip(
        `${props.listing.authorName} · ${props.listing.quartier}${hasExact ? ' (Position GPS)' : ' (Zone commune)'}`,
        { direction: 'top', permanent: false },
      );
      agentMarker.addTo(group);

      if (props.userCoords) {
        const userMarker = L.circleMarker([props.userCoords.lat, props.userCoords.lng], {
          radius: 8,
          color: '#FFFFFF',
          weight: 2.5,
          fillColor: '#004F71',
          fillOpacity: 1,
        }).bindTooltip('Votre position actuelle', { direction: 'top' });
        userMarker.addTo(group);

        L.polyline(
          [
            [props.userCoords.lat, props.userCoords.lng],
            [lat, lng],
          ],
          {
            color: '#004F71',
            weight: 2.5,
            dashArray: '6 6',
            opacity: 0.85,
          },
        ).addTo(group);

        const bounds = L.latLngBounds([
          [props.userCoords.lat, props.userCoords.lng],
          [lat, lng],
        ]);
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });
      } else {
        map.setView([lat, lng], hasExact ? 14 : 12);
      }
      return;
    }

    if (props.mode === 'nearby') {
      const points: [number, number][] = [[props.userCoords.lat, props.userCoords.lng]];

      L.circleMarker([props.userCoords.lat, props.userCoords.lng], {
        radius: 9,
        color: '#FFFFFF',
        weight: 2.5,
        fillColor: '#004F71',
        fillOpacity: 1,
      })
        .bindTooltip('Votre position', { direction: 'top' })
        .addTo(group);

      if (props.radiusKm) {
        L.circle([props.userCoords.lat, props.userCoords.lng], {
          radius: props.radiusKm * 1000,
          color: '#004F71',
          weight: 1.5,
          fillColor: '#004F71',
          fillOpacity: 0.06,
        }).addTo(group);
      }

      props.listings.forEach(({ listing, coords, isExact, distanceKm }) => {
        points.push([coords.lat, coords.lng]);
        const marker = L.circleMarker([coords.lat, coords.lng], {
          radius: 9,
          color: '#111111',
          weight: 2,
          fillColor: listing.intent === 'offer' ? '#FFCB05' : '#FFFFFF',
          fillOpacity: 0.95,
        });

        marker.bindTooltip(
          `<div style="font-size:12px;line-height:1.4;color:#111111;">
            <strong>${formatFcfa(listing.amount)}</strong> · ${listing.intent === 'offer' ? 'Offre' : 'Besoin'}<br/>
            ${listing.authorName} (${listing.quartier})<br/>
            <span style="color:#004F71;font-weight:700;">À ${formatDistance(distanceKm)}${isExact ? '' : ' env.'}</span>
          </div>`,
          { direction: 'top' },
        );

        marker.on('click', () => {
          if (onSelectRef.current) onSelectRef.current(listing);
        });

        marker.addTo(group);
      });

      if (points.length > 1) {
        map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 14 });
      } else {
        map.setView([props.userCoords.lat, props.userCoords.lng], 12);
      }
    }
  }, [props]);

  return (
    <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-[#F7F8FA] isolate z-0">
      <div
        ref={containerRef}
        className={`w-full ${props.heightClass || 'h-52'}`}
        aria-label="Carte de localisation et distance"
      />
    </div>
  );
};
