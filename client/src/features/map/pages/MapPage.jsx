import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { X, Info, Calendar } from 'lucide-react';
import { useAppData } from '@/app/providers/AppDataContext';
import { displayStatus, hasMatchScore, isHalfTime, formatMatchMinute, scoreText } from '@/features/matches/utils/matchStatus';
import { teamName } from '@/features/matches/utils/matchFormatters';
import { formatDate, formatTime } from '@/lib/date/index';
import { VENUES, COUNTRY_FLAG, weatherIcon } from '../venueData';

const COUNTRY_NAME = { USA: 'United States', CAN: 'Canada', MEX: 'Mexico' };


// ─── Pulse keyframes (injected once) ────────────────────────────────────────

function ensurePulseKeyframes() {
  if (document.getElementById('map-pin-kf')) return;
  const s = document.createElement('style');
  s.id = 'map-pin-kf';
  s.textContent = `
    @keyframes map-pin-pulse {
      0%   { transform: scale(1);   opacity: 0.6; }
      100% { transform: scale(2.6); opacity: 0;   }
    }
  `;
  document.head.appendChild(s);
}

// ─── Venue state from matches ────────────────────────────────────────────────

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth()    &&
    d.getDate()     === now.getDate()
  );
}

function getVenueState(matches) {
  if (!matches?.length) return 'default';
  const statuses = matches.map(displayStatus);
  if (statuses.includes('LIVE')) return 'live';
  // Amber highlight for any venue with a match today (pre-game or already finished)
  if (matches.some((m) => isToday(m.date))) return 'today';
  if (statuses.every((s) => s === 'FINISHED')) return 'finished';
  return 'upcoming';
}

// state → { bg, pulseColor, pulseDuration }
const STATE_STYLE = {
  live:     { bg: '#dc2626', pulseColor: 'rgba(220,38,38,0.28)',   pulseDuration: '1.1s' },
  today:    { bg: '#d97706', pulseColor: 'rgba(217,119,6,0.28)',   pulseDuration: '1.6s' },
  upcoming: { bg: '#111827', pulseColor: 'rgba(15,42,74,0.22)',    pulseDuration: '1.8s' },
  finished: { bg: '#94a3b8', pulseColor: 'rgba(148,163,184,0.2)',  pulseDuration: '1.8s' },
  default:  { bg: '#374151', pulseColor: 'rgba(55,65,81,0.2)',     pulseDuration: '1.8s' },
};

// ─── Marker icon ────────────────────────────────────────────────────────────

function makeMarkerIcon(pin, selected, venueState = 'default') {
  ensurePulseKeyframes();
  const { bg, pulseColor, pulseDuration } = STATE_STYLE[venueState] ?? STATE_STYLE.default;
  const shouldPulse = selected || venueState === 'live';
  const size = selected ? 46 : 38;
  const half = size / 2;
  const fontSize = pin.length > 2 ? 9 : pin.length > 1 ? 11 : 13;
  const pulse = shouldPulse
    ? `<div style="position:absolute;inset:-10px;border-radius:50%;
        background:${pulseColor};pointer-events:none;
        animation:map-pin-pulse ${pulseDuration} ease-out infinite;"></div>`
    : '';
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [half, half],
    html: `<div style="position:relative;width:${size}px;height:${size}px;overflow:visible;">
      ${pulse}
      <div style="
        position:absolute;inset:0;border-radius:50%;
        background:${bg};border:2.5px solid rgba(255,255,255,0.9);
        box-shadow:0 2px 14px rgba(0,0,0,0.32),0 0 0 1px rgba(255,255,255,0.15);
        display:flex;align-items:center;justify-content:center;
        font-size:${fontSize}px;font-weight:800;color:white;letter-spacing:-0.5px;
        cursor:pointer;font-family:system-ui,sans-serif;
      ">${pin}</div>
    </div>`,
  });
}

// ─── Fly to selected venue ───────────────────────────────────────────────────

function FlyToVenue({ venue }) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (venue && venue.apiName !== prev.current) {
      prev.current = venue.apiName;
      map.flyTo([venue.lat, venue.lng], 11, { duration: 0.9 });
    }
  }, [venue, map]);
  return null;
}

// ─── Weather hook ────────────────────────────────────────────────────────────

function useWeather(venue) {
  const [weather, setWeather] = useState(null);
  useEffect(() => {
    if (!venue) return;
    setWeather(null);
    let cancelled = false;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${venue.lat}&longitude=${venue.lng}&current=temperature_2m,weather_code&temperature_unit=celsius&timezone=auto`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const temp = Math.round(d.current?.temperature_2m ?? 0);
        const tempF = Math.round((temp * 9) / 5 + 32);
        const code = d.current?.weather_code ?? 0;
        setWeather({ temp, tempF, icon: weatherIcon(code) });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [venue]);
  return weather;
}

// ─── Local clock hook ────────────────────────────────────────────────────────

function useLocalTime(timezone) {
  const [time, setTime] = useState('');
  useEffect(() => {
    if (!timezone) return;
    const tick = () => {
      setTime(
        new Intl.DateTimeFormat('en-GB', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date()),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timezone]);
  return time;
}

// ─── Status badge ────────────────────────────────────────────────────────────

function matchStatusBadge(match) {
  const s = displayStatus(match);
  if (s === 'LIVE') {
    if (isHalfTime(match)) {
      return { text: 'Half Time', cls: 'bg-amber-100/80 text-amber-700', pulse: false };
    }
    const min = formatMatchMinute(match.minute);
    return { text: min ? `Live · ${min}` : 'Live', cls: 'bg-red-100/80 text-red-700', pulse: true };
  }
  if (s === 'FINISHED') return { text: 'Full Time', cls: 'bg-slate-100 text-slate-500', pulse: false };
  if (s?.startsWith('STATUS_') || s === 'SUSPENDED')
    return { text: 'Delayed', cls: 'bg-amber-100/80 text-amber-700', pulse: false };
  return { text: 'Upcoming', cls: 'bg-blue-50 text-blue-600', pulse: false };
}

// ─── Info stat cell ──────────────────────────────────────────────────────────

function StatCell({ label, value, wide }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.13em] text-slate-400">{label}</p>
      <p className={`font-black leading-tight text-slate-900 ${wide ? 'text-sm' : 'text-base'}`}>{value}</p>
    </div>
  );
}

// ─── Venue popup card ────────────────────────────────────────────────────────

function VenueCard({ venue, matches, onClose }) {
  const [tab, setTab] = useState('info');
  const weather = useWeather(venue);
  const localTime = useLocalTime(venue.timezone);
  const flag = COUNTRY_FLAG[venue.country] ?? '';
  const countryName = COUNTRY_NAME[venue.country] ?? venue.country;

  const sorted = useMemo(
    () => [...matches].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [matches],
  );

  return (
    <div
      className="absolute left-4 top-4 z-[1000] w-80 overflow-hidden rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.65)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div className="px-5 pb-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-extrabold leading-snug text-slate-900">{venue.name}</h2>
          <div className="shrink-0 flex flex-col items-end gap-0.5 text-right">
            {weather ? (
              <span className="text-sm text-slate-600">
                {weather.icon} {weather.temp}°C / {weather.tempF}°F
              </span>
            ) : (
              <span className="text-xs text-slate-300">Loading…</span>
            )}
            {localTime && (
              <span className="font-mono text-[11px] tabular-nums text-slate-400">{localTime}</span>
            )}
          </div>
        </div>
        <p className="mt-1 text-[11px] font-medium tracking-wide text-slate-400">
          {flag} {venue.city}, {venue.state} · {countryName}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-end gap-0.5 border-b border-slate-200/60 px-5">
        {[
          { id: 'info', label: 'Info', icon: Info },
          { id: 'schedule', label: 'Schedule', icon: Calendar },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 border-b-2 px-2 pb-2.5 pt-1 text-xs font-semibold transition-all duration-150 ${
              tab === id
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={onClose}
          className="mb-1.5 grid h-6 w-6 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-slate-200/60 hover:text-slate-600"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tab content */}
      <div
        className="max-h-72 overflow-y-auto"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(148,163,184,0.5) transparent',
        }}
      >
        {/* Webkit scrollbar */}
        <style>{`
          .venue-scroll::-webkit-scrollbar { width: 4px; }
          .venue-scroll::-webkit-scrollbar-track { background: transparent; }
          .venue-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.45); border-radius: 9999px; }
        `}</style>

        {tab === 'info' && (
          <div className="venue-scroll grid grid-cols-2 gap-x-6 gap-y-5 px-5 py-5">
            <StatCell label="Capacity" value={venue.capacity.toLocaleString()} />
            <StatCell label="Surface"  value={venue.surface} />
            <StatCell label="Built"    value={venue.built} />
            <StatCell label="Roof"     value={venue.roof} />
            <StatCell label="Home Club(s)" value={venue.homeClub} wide />
          </div>
        )}

        {tab === 'schedule' && (
          <div className="venue-scroll divide-y divide-slate-100/80">
            {sorted.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No matches scheduled here.</p>
            ) : (
              sorted.map((match) => {
                const badge = matchStatusBadge(match);
                const score = hasMatchScore(match) ? scoreText(match) : null;
                const home = teamName(match.home) || match.home?.abbreviation || '?';
                const away = teamName(match.away) || match.away?.abbreviation || '?';

                return (
                  <div key={match.id} className="px-4 py-3">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-medium text-slate-400">
                        {formatDate(match.date)} · {formatTime(match.date)}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${badge.cls}`}>
                        {badge.pulse && (
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
                        )}
                        {badge.text}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          {match.home?.flagUrl && (
                            <img src={match.home.flagUrl} alt="" className="h-3.5 w-5 shrink-0 rounded-sm border border-slate-100 object-cover" />
                          )}
                          <span className="truncate text-xs font-semibold text-slate-800">{home}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {match.away?.flagUrl && (
                            <img src={match.away.flagUrl} alt="" className="h-3.5 w-5 shrink-0 rounded-sm border border-slate-100 object-cover" />
                          )}
                          <span className="truncate text-xs font-semibold text-slate-800">{away}</span>
                        </div>
                      </div>
                      {score ? (
                        <span className="shrink-0 text-base font-black tabular-nums text-slate-900">{score}</span>
                      ) : (
                        <span className="shrink-0 text-xs font-bold text-slate-300">vs</span>
                      )}
                    </div>
                    {match.group && (
                      <p className="mt-1 text-[9px] text-slate-400">{match.group}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Mobile close strip */}
      <button
        type="button"
        onClick={onClose}
        className="flex w-full items-center justify-center gap-2 border-t border-slate-100 py-3 text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 sm:hidden"
      >
        <X className="h-4 w-4" aria-hidden="true" />
        Close
      </button>
    </div>
  );
}

// ─── Single venue marker (memoized to keep event handlers stable) ────────────

function VenueMarker({ venue, selected, venueState, onSelect }) {
  const icon = useMemo(
    () => makeMarkerIcon(venue.pin, selected, venueState),
    [venue.pin, selected, venueState],
  );
  const eventHandlers = useMemo(
    () => ({ click: () => onSelect(venue) }),
    [venue, onSelect],
  );
  return (
    <Marker
      position={[venue.lat, venue.lng]}
      icon={icon}
      eventHandlers={eventHandlers}
    />
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function MapPage() {
  const { fixtures } = useAppData();
  const [selectedVenue, setSelectedVenue] = useState(null);

  const matchesByVenue = useMemo(() => {
    const map = {};
    fixtures.forEach((m) => {
      if (m.stadium) {
        if (!map[m.stadium]) map[m.stadium] = [];
        map[m.stadium].push(m);
      }
    });
    return map;
  }, [fixtures]);

  const handleSelect = useCallback((venue) => {
    setSelectedVenue((prev) => (prev?.apiName === venue.apiName ? null : venue));
  }, []);

  return (
    <div className="relative" style={{ height: 'calc(100vh - 65px)' }}>
      <MapContainer
        center={[38, -95]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {selectedVenue && <FlyToVenue venue={selectedVenue} />}

        {VENUES.map((venue) => (
          <VenueMarker
            key={venue.apiName}
            venue={venue}
            selected={selectedVenue?.apiName === venue.apiName}
            venueState={getVenueState(matchesByVenue[venue.apiName])}
            onSelect={handleSelect}
          />
        ))}
      </MapContainer>

      {/* Tap-outside backdrop — covers the map behind the card on mobile */}
      {selectedVenue && (
        <div
          className="absolute inset-0 z-[999] sm:hidden"
          onClick={() => setSelectedVenue(null)}
          aria-hidden="true"
        />
      )}

      {selectedVenue && (
        <VenueCard
          venue={selectedVenue}
          matches={matchesByVenue[selectedVenue.apiName] ?? []}
          onClose={() => setSelectedVenue(null)}
        />
      )}

      {/* Top-right badge — hidden on mobile to avoid conflicting with the venue card */}
      <div
        className="absolute right-4 top-4 z-[1000] hidden rounded-xl px-4 py-2.5 sm:block"
        style={{
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.09), 0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-500">FIFA World Cup 2026</p>
        <p className="text-sm font-bold text-slate-900">16 venues · 🇺🇸 🇨🇦 🇲🇽</p>
      </div>

      {/* Legend — bottom-right */}
      <div
        className="absolute bottom-6 right-4 z-[1000] rounded-xl px-3.5 py-3"
        style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.65)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.09), 0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400">Legend</p>
        <div className="space-y-1.5">
          {[
            { color: '#dc2626', label: 'Live now',      pulse: true  },
            { color: '#d97706', label: 'Match today',   pulse: false },
            { color: '#111827', label: 'Upcoming',      pulse: false },
            { color: '#94a3b8', label: 'Finished',      pulse: false },
          ].map(({ color, label, pulse }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
                {pulse && (
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                    style={{ background: color }}
                  />
                )}
                <span className="relative inline-flex h-3 w-3 rounded-full" style={{ background: color }} />
              </span>
              <span className="text-[11px] font-medium text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
