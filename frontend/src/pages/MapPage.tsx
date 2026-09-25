import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, MapPin, Filter, Navigation, Clock, ShieldAlert, FileVideo } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { searchService } from '../services/searchService';
import { caseService } from '../services/caseService';
import type { CandidateGroup, MissingPersonCase } from '../types';

// Fix Leaflet marker icon issue
const customCameraIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="background-color: #B85A1F; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-weight: bold; font-size: 11px;">🎥</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const customCaseIcon = L.divIcon({
  className: 'custom-case-marker',
  html: `<div style="background-color: #ef4444; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.4); font-weight: bold; font-size: 12px;">📍</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

export const MapPage: React.FC = () => {
  const [candidateGroups, setCandidateGroups] = useState<CandidateGroup[]>([]);
  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [loading, setLoading] = useState(true);

  // Default Map center (Central Transit Hub)
  const defaultCenter: [number, number] = [13.0827, 80.2707];

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const caseRes = await caseService.getCases();
        setCases(caseRes.items || []);

        const sessions = await searchService.getSearchSessions();
        if (sessions.length > 0) {
          const groups = await searchService.getCandidateGroups(sessions[0].id);
          setCandidateGroups(groups);
        }
      } catch (err) {
        console.warn('Map data load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMapData();
  }, []);

  // Extract map polyline route coordinates from candidate group sightings
  const getGroupSequencePolyline = (group: CandidateGroup): [number, number][] => {
    const coords: [number, number][] = [];
    group.sightings.forEach((s) => {
      if (s.latitude !== undefined && s.latitude !== null && s.longitude !== undefined && s.longitude !== null) {
        coords.push([s.latitude, s.longitude]);
      }
    });
    return coords;
  };

  return (
    <PageContainer>
      <PageHeader
        title="Investigation GIS & Movement Map"
        subtitle="Geographic visual mapping of CCTV camera feeds, candidate sightings, and potential movement sequences across locations."
      />

      <Card>
        <div className="h-[600px] w-full rounded-xl overflow-hidden border border-surface-700 relative">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Case Last Known Locations */}
            {cases.map((c) => (
              c.last_seen_lat && c.last_seen_lng ? (
                <Marker
                  key={c.id}
                  position={[c.last_seen_lat, c.last_seen_lng]}
                  icon={customCaseIcon}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <p className="font-bold text-red-600">Case: {c.case_id || c.reference_name}</p>
                      <p>Last Location: {c.last_seen_location}</p>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            ))}

            {/* Candidate Group Sightings and Polyline Movement Sequences */}
            {candidateGroups.map((group) => {
              const polyCoords = getGroupSequencePolyline(group);

              return (
                <React.Fragment key={group.id}>
                  {/* Connect camera sightings with subtle route line */}
                  {polyCoords.length > 1 && (
                    <Polyline
                      positions={polyCoords}
                      pathOptions={{ color: '#B85A1F', weight: 4, dashArray: '6, 8', opacity: 0.8 }}
                    />
                  )}

                  {/* Sightings Markers */}
                  {group.sightings.map((sighting, idx) => (
                    sighting.latitude && sighting.longitude ? (
                      <Marker
                        key={`${group.id}-${idx}`}
                        position={[sighting.latitude, sighting.longitude]}
                        icon={customCameraIcon}
                      >
                        <Popup>
                          <div className="p-2 text-xs space-y-2 max-w-xs">
                            <div className="flex items-center justify-between font-bold border-b pb-1">
                              <span>Sequence #{sighting.sequence_order}: {sighting.camera_name}</span>
                            </div>
                            {sighting.signed_crop_url && (
                              <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                                <img src={sighting.signed_crop_url} alt="Crop" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="text-[11px] space-y-0.5 font-mono">
                              <p>Visual Sim: <strong>{(sighting.visual_similarity * 100).toFixed(1)}%</strong></p>
                              <p>Timestamp: {sighting.first_seen_seconds}s</p>
                              <p>Evidence Score: <strong>{group.overall_score}/100</strong></p>
                            </div>
                            <p className="text-[10px] text-amber-600 italic">
                              Potential Movement Sequence — Human verification required.
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    ) : null
                  ))}
                </React.Fragment>
              );
            })}
          </MapContainer>

          {/* Map Overlay Badge */}
          <div className="absolute top-4 right-4 z-[1000] bg-surface-50/95 border border-surface-400 rounded-xl p-3 backdrop-blur-md text-xs text-surface-950 shadow-xl max-w-xs space-y-1">
            <div className="flex items-center gap-2 text-surface-950 font-extrabold">
              <Navigation className="w-4 h-4 text-brand-700" />
              <span>Movement Sequence Layer</span>
            </div>
            <p className="text-[11px] text-surface-800 font-medium leading-relaxed">
              Dashed line represents a <strong className="text-brand-700 font-bold">potential movement sequence</strong> derived from multi-camera timestamps and spatial distance.
            </p>
          </div>

          <div className="absolute bottom-4 left-4 z-[1000] bg-surface-50/95 border border-surface-400 rounded-lg px-3 py-1.5 backdrop-blur-md text-xs text-surface-950 shadow-lg flex items-center gap-2 font-bold">
            <Layers className="w-4 h-4 text-brand-700" />
            <span className="font-mono text-[11px] text-surface-950">FindSafe Multi-Camera GIS Layer Engine</span>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
};
