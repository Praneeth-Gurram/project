const { useState, useEffect, useRef, useMemo, useCallback } = React;

// Lucide Icon Helper for React
const Icon = ({ name, color = "currentColor", size = 16, className = "" }) => {
    const iconName = name ? name.toLowerCase() : "alert-triangle";
    const iconObj = window.lucide && window.lucide.icons && window.lucide.icons[iconName];
    const svgContent = iconObj 
        ? iconObj.toSvg({ stroke: color, width: size, height: size, class: className })
        : `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y3="13"/><line x1="12" y1="17" x2="12.01" y3="17"/></svg>`;
    
    return (
        <span 
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle' }} 
            dangerouslySetInnerHTML={{ __html: svgContent }} 
        />
    );
};

// Alert Styles & Helpers
const getAlertIconName = (type) => {
    switch (type) {
        case 'DELAY': return 'clock';
        case 'CRITICAL': return 'alert-circle';
        case 'WEATHER': return 'cloud-rain';
        case 'TRAFFIC':
        default: return 'alert-triangle';
    }
};

const getAlertIconColor = (type) => {
    switch (type) {
        case 'DELAY': return '#f87171';
        case 'CRITICAL': return '#ef4444';
        case 'WEATHER': return '#38bdf8';
        case 'TRAFFIC':
        default: return '#fbbf24';
    }
};

const getAlertBadgeStyle = (type) => {
    switch (type) {
        case 'DELAY': return 'bg-red-500/20 text-red-300 border border-red-500/40';
        case 'CRITICAL': return 'bg-red-600/30 text-red-200 border border-red-600/50';
        case 'WEATHER': return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40';
        case 'TRAFFIC':
        default: return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
    }
};

const getAlertCardStyle = (type) => {
    switch (type) {
        case 'DELAY': return 'bg-red-950/20 border-red-500/30 text-red-200';
        case 'CRITICAL': return 'bg-red-950/35 border-red-600/40 text-red-100';
        case 'WEATHER': return 'bg-cyan-950/20 border-cyan-500/30 text-cyan-200';
        case 'TRAFFIC':
        default: return 'bg-amber-950/20 border-amber-500/30 text-amber-200';
    }
};

// Shared Custom Hook: useSharedFleetData
function useSharedFleetData(customFilters = {}) {
    const [masterData, setMasterData] = useState([]);
    const [globalFilteredData, setGlobalFilteredData] = useState(null);
    const [simTick, setSimTick] = useState(0);
    const [isLiveMovement, setIsLiveMovement] = useState(() => window.FleetService ? window.FleetService.isMovementActive() : true);

    useEffect(() => {
        const load = () => {
            if (window.masterDataset && window.masterDataset.length > 0) {
                setMasterData(window.masterDataset);
            }
        };
        load();

        if (!window.masterDataset || window.masterDataset.length === 0) {
            fetch('full_data.json')
                .then(r => r.json())
                .then(d => {
                    if (d && d.length > 0) {
                        window.masterDataset = d;
                        setMasterData(d);
                    }
                })
                .catch(() => {});
        }

        const onL = (e) => { if (e.detail && e.detail.length > 0) setMasterData(e.detail); };
        const onF = (e) => { if (e.detail && e.detail.filteredData) setGlobalFilteredData(e.detail.filteredData); };
        
        window.addEventListener('masterDatasetLoaded', onL);
        window.addEventListener('globalFilterChange', onF);
        window.addEventListener('globalFilterDataUpdated', onF);

        // Subscribe to shared simulation engine
        let unsubscribe = null;
        if (window.FleetService) {
            unsubscribe = window.FleetService.subscribe(({ isLiveMovement }) => {
                setSimTick(t => t + 1);
                setIsLiveMovement(isLiveMovement);
            });
        }

        const poll = setInterval(() => {
            if (window.masterDataset && window.masterDataset.length > 0 && masterData.length === 0) {
                setMasterData(window.masterDataset);
            }
        }, 500);

        return () => {
            window.removeEventListener('masterDatasetLoaded', onL);
            window.removeEventListener('globalFilterChange', onF);
            window.removeEventListener('globalFilterDataUpdated', onF);
            if (unsubscribe) unsubscribe();
            clearInterval(poll);
        };
    }, []);

    const activeDataset = useMemo(() => {
        return globalFilteredData !== null ? globalFilteredData : masterData;
    }, [globalFilteredData, masterData]);

    const vehicles = useMemo(() => {
        if (!window.FleetService) return [];
        return window.FleetService.getFleetVehicles(activeDataset, customFilters);
    }, [activeDataset, customFilters, simTick]);

    const alerts = useMemo(() => {
        if (!window.FleetService) return [];
        return window.FleetService.getAlerts(vehicles);
    }, [vehicles]);

    const toggleLiveMovement = useCallback(() => {
        if (window.FleetService) {
            const next = !window.FleetService.isMovementActive();
            window.FleetService.setLiveMovement(next);
            setIsLiveMovement(next);
        }
    }, []);

    return {
        masterData,
        activeDataset,
        vehicles,
        alerts,
        simTick,
        isLiveMovement,
        toggleLiveMovement
    };
}

// ============================================================
// REUSABLE GOOGLE MAP CANVAS COMPONENT
// ============================================================
const SharedFleetMap = ({
    vehicles,
    selectedVehicle,
    onSelectVehicle,
    showRoutes = true,
    clusteringEnabled = true,
    mapHeight = 420,
    tabIdentifier = "overview-section"
}) => {
    const mapContainerRef = useRef(null);
    const gmapRef = useRef(null);
    const markersRef = useRef({});
    const polylinesRef = useRef({});
    const openInfoWindowRef = useRef(null);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;
        const initMap = () => {
            if (gmapRef.current || !mapContainerRef.current) return;
            if (!window.google || !window.google.maps) {
                setTimeout(initMap, 300);
                return;
            }
            const gmap = new window.google.maps.Map(mapContainerRef.current, {
                center: { lat: 20.5937, lng: 78.9629 },
                zoom: 4,
                mapTypeId: 'roadmap',
                mapTypeControl: false,
                fullscreenControl: true,
                streetViewControl: false,
                zoomControl: true,
                styles: [
                    { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
                    { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
                    { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
                    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
                    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#243556' }] },
                    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
                    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c1829' }] },
                    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#1e3a5f' }] },
                    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#38bdf8' }, { weight: 1.5 }] },
                    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#60a5fa' }] },
                    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
                ]
            });
            gmapRef.current = gmap;
        };

        if (window.google && window.google.maps) initMap();
        else setTimeout(initMap, 500);

        const onTab = (e) => {
            if (e.detail && e.detail.targetId === tabIdentifier && gmapRef.current && window.google) {
                setTimeout(() => window.google.maps.event.trigger(gmapRef.current, 'resize'), 150);
            }
        };
        const onRes = () => {
            if (gmapRef.current && window.google) window.google.maps.event.trigger(gmapRef.current, 'resize');
        };

        window.addEventListener('resize', onRes);
        window.addEventListener('tabChange', onTab);
        return () => {
            window.removeEventListener('resize', onRes);
            window.removeEventListener('tabChange', onTab);
        };
    }, [tabIdentifier]);

    // Fit Bounds helper
    const fitAllBounds = useCallback(() => {
        const map = gmapRef.current;
        if (!map || !window.google) return;
        if (vehicles.length === 0) {
            map.setCenter({ lat: 20.5937, lng: 78.9629 });
            map.setZoom(4);
            return;
        }
        const bounds = new window.google.maps.LatLngBounds();
        let validCount = 0;
        vehicles.forEach(v => {
            if (window.RoutingService && window.RoutingService.isValidCoordinate(v.lat, v.lng)) {
                bounds.extend({ lat: v.lat, lng: v.lng });
                validCount++;
            }
        });
        if (validCount > 0 && !bounds.isEmpty()) {
            map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
            window.google.maps.event.addListenerOnce(map, 'idle', () => {
                if (map.getZoom() < 3) map.setZoom(3);
                if (map.getZoom() > 10) map.setZoom(10);
            });
        }
    }, [vehicles]);

    // Expose fitAllBounds globally if needed
    useEffect(() => {
        if (tabIdentifier === "overview-section") {
            window.overviewFitAllVehicles = fitAllBounds;
        }
    }, [fitAllBounds, tabIdentifier]);

    // Draw Polylines & Markers on Map with Clustering
    useEffect(() => {
        const map = gmapRef.current;
        if (!map || !window.google) return;

        // Clear existing markers
        Object.values(markersRef.current).forEach(m => m.setMap(null));
        markersRef.current = {};

        // Clear existing polylines
        Object.values(polylinesRef.current).forEach(p => p.setMap(null));
        polylinesRef.current = {};

        const currentZoom = map.getZoom() || 4;
        const shouldCluster = clusteringEnabled && currentZoom < 5 && vehicles.length > 5;

        if (shouldCluster && window.RoutingService && window.RoutingService.clusterLocations) {
            const clusters = window.RoutingService.clusterLocations(vehicles, 300);
            clusters.forEach((cls, idx) => {
                if (cls.items.length === 1) {
                    renderSingleVehicleMarker(cls.items[0], map);
                } else {
                    const clusterMarker = new window.google.maps.Marker({
                        position: cls.center, map,
                        title: `${cls.items.length} Vehicles Clustered`,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            fillColor: '#38bdf8', fillOpacity: 0.9,
                            strokeColor: '#ffffff', strokeWeight: 2, scale: 16
                        },
                        label: { text: String(cls.items.length), fontSize: '12px', color: '#0f172a', fontWeight: 'bold' }
                    });
                    clusterMarker.addListener('click', () => {
                        map.panTo(cls.center);
                        map.setZoom(currentZoom + 2);
                    });
                    markersRef.current[`cluster_${idx}`] = clusterMarker;
                }
            });
        } else {
            vehicles.forEach(v => renderSingleVehicleMarker(v, map));
        }

        function renderSingleVehicleMarker(v, map) {
            if (window.RoutingService && !window.RoutingService.isValidCoordinate(v.lat, v.lng)) return;
            const isSel = selectedVehicle && selectedVehicle.vehicleId === v.vehicleId;

            // Draw Road Route Polyline
            if (showRoutes || isSel) {
                const polylineColor = isSel ? '#38bdf8' : (v.status === 'Delayed' ? '#f87171' : v.traffic === 'Heavy' ? '#fbbf24' : '#4ade80');
                const strokeOpacity = isSel ? 1.0 : 0.7;
                const strokeWeight  = isSel ? 5 : 3;

                const polyline = new window.google.maps.Polyline({
                    path: v.waypoints,
                    geodesic: true,
                    strokeColor: polylineColor,
                    strokeOpacity: strokeOpacity,
                    strokeWeight: strokeWeight,
                    map: map,
                    zIndex: isSel ? 90 : 10
                });
                polylinesRef.current[v.vehicleId] = polyline;

                if (isSel && v.waypoints.length > 0) {
                    const originPt = v.waypoints[0];
                    const destPt   = v.waypoints[v.waypoints.length - 1];

                    const origMarker = new window.google.maps.Marker({
                        position: originPt, map, title: `Origin: ${v.originCity}`,
                        icon: { path: window.google.maps.SymbolPath.CIRCLE, fillColor: '#22c55e', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2, scale: 7 }
                    });
                    const destMarker = new window.google.maps.Marker({
                        position: destPt, map, title: `Destination: ${v.destinationCity}`,
                        icon: { path: window.google.maps.SymbolPath.CIRCLE, fillColor: '#ef4444', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2, scale: 7 }
                    });
                    markersRef.current[`${v.vehicleId}_orig`] = origMarker;
                    markersRef.current[`${v.vehicleId}_dest`] = destMarker;
                }
            }

            // Current Vehicle Marker (Placed strictly on road polyline)
            const iconChar = v.vehicleType === 'Van' ? 'V' : 'T';
            const tc = v.traffic === 'Heavy' ? '#f87171' : v.traffic === 'Moderate' ? '#fbbf24' : '#4ade80';
            const m = new window.google.maps.Marker({
                position: { lat: v.lat, lng: v.lng }, map,
                title: `${v.vehicleId} (${v.originCity} → ${v.destinationCity})`,
                zIndex: isSel ? 100 : 20,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: v.markerColor, fillOpacity: 0.95,
                    strokeColor: isSel ? '#38bdf8' : '#0f172a',
                    strokeWeight: isSel ? 3 : 2,
                    scale: isSel ? 14 : 10
                },
                label: { text: iconChar, fontSize: isSel ? '12px' : '10px', color: '#0f172a', fontWeight: 'bold' }
            });

            const infoHtml = `<div style="background:#0f172a;color:#e2e8f0;padding:12px;border-radius:10px;font-family:system-ui,sans-serif;min-width:240px;border:1px solid rgba(56,189,248,0.4)">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.1)">
                    <div>
                        <div style="font-weight:800;font-size:0.95rem;color:#38bdf8">${v.vehicleId}</div>
                        <span style="font-size:0.65rem;color:#fbbf24;font-weight:700">LIVE CORRIDOR</span>
                    </div>
                    <span style="font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:10px;background:${v.markerColor}20;color:${v.markerColor};border:1px solid ${v.markerColor}40">${v.status}</span>
                </div>
                <div style="font-size:0.75rem;line-height:1.7">
                    <div><span style="color:#94a3b8">Route:</span> <b style="color:#60a5fa">${v.originCity} → ${v.destinationCity} (${v.highway})</b></div>
                    <div><span style="color:#94a3b8">Driver:</span> <b>${v.driver}</b> | <span style="color:#94a3b8">Type:</span> <b>${v.vehicleType}</b></div>
                    <div><span style="color:#94a3b8">Speed:</span> <b>${v.speed} km/h</b> | <span style="color:#94a3b8">ETA:</span> <b style="color:#4ade80">${v.eta}</b></div>
                    <div><span style="color:#94a3b8">Traffic:</span> <span style="color:${tc}">${v.traffic}</span> | <span style="color:#94a3b8">Weather:</span> ${v.weather}</div>
                    <div style="margin-top:4px;font-size:0.68rem;color:#64748b">GPS: ${v.lat.toFixed(4)}, ${v.lng.toFixed(4)}</div>
                </div>
            </div>`;

            const iw = new window.google.maps.InfoWindow({ content: infoHtml });
            m.addListener('click', () => {
                if (openInfoWindowRef.current) openInfoWindowRef.current.close();
                iw.open(map, m);
                openInfoWindowRef.current = iw;
                onSelectVehicle(v);
                map.panTo({ lat: v.lat, lng: v.lng });
            });
            markersRef.current[v.vehicleId] = m;
        }

    }, [vehicles, selectedVehicle, showRoutes, clusteringEnabled]);

    return (
        <div style={{ position: 'relative', width: '100%', height: `${mapHeight}px` }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', borderRadius: '10px' }} />
            {vehicles.length === 0 && (
                <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.85)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                    color: '#94a3b8', borderRadius: '10px', backdropFilter: 'blur(4px)'
                }}>
                    <Icon name="truck" size={36} color="#64748b" className="mb-2" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>No vehicles available for the selected filters.</span>
                </div>
            )}
        </div>
    );
};

// ============================================================
// EXECUTIVE OVERVIEW LIVE FLEET TRACKING MODULE
// Unified component embedded inside the Executive Overview page
// ============================================================
const OverviewLiveFleetModule = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [showRoutes, setShowRoutes] = useState(true);
    const [clusteringEnabled, setClusteringEnabled] = useState(true);
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    const customFilters = useMemo(() => ({
        searchQuery
    }), [searchQuery]);

    const {
        vehicles,
        alerts,
        isLiveMovement,
        toggleLiveMovement
    } = useSharedFleetData(customFilters);

    const handleSelectVehicle = (v) => {
        setSelectedVehicle(v);
    };

    const handleFitAll = () => {
        if (typeof window.overviewFitAllVehicles === 'function') {
            window.overviewFitAllVehicles();
        }
    };

    // Live Metrics for the overview toolbar
    const metrics = useMemo(() => {
        const total = vehicles.length;
        const inTransit = vehicles.filter(v => v.status === 'In Transit').length;
        const delayed = vehicles.filter(v => v.status === 'Delayed').length;
        const critical = vehicles.filter(v => v.status === 'Delayed' || v.traffic === 'Heavy' || v.waitTime >= 30).length;
        return { total, inTransit, delayed, critical };
    }, [vehicles]);

    return (
        <section className="charts-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            
            {/* LEFT: INTERACTIVE LIVE FLEET MAP WITH CONTROLS */}
            <div className="glass-card" style={{ padding: '16px', overflow: 'hidden', position: 'relative', minHeight: '440px' }}>
                
                {/* TOOLBAR */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
                    
                    {/* Title Badge & Counts */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', padding: '4px 10px', borderRadius: '12px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isLiveMovement ? '#4ade80' : '#fbbf24', display: 'inline-block', boxShadow: isLiveMovement ? '0 0 8px #4ade80' : 'none' }}></span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#38bdf8' }}>Live Fleet Tracking</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '6px' }}><strong>{metrics.total}</strong> Vehicles</span>
                            <span style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '2px 6px', borderRadius: '6px' }}><strong>{metrics.inTransit}</strong> Active</span>
                            {metrics.delayed > 0 && (
                                <span style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', padding: '2px 6px', borderRadius: '6px' }}><strong>{metrics.delayed}</strong> Delayed</span>
                            )}
                        </div>
                    </div>

                    {/* Controls & Search */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {/* Search Input */}
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="text"
                                placeholder="Search vehicle, route, city..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="glass-input"
                                style={{ fontSize: '0.75rem', padding: '4px 26px 4px 8px', width: '180px', borderRadius: '6px' }}
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }}>
                                    ×
                                </button>
                            )}
                        </div>

                        {/* Live Movement Toggle */}
                        <button
                            onClick={toggleLiveMovement}
                            className="glass-btn"
                            style={{
                                fontSize: '0.72rem', padding: '4px 8px', borderRadius: '6px',
                                background: isLiveMovement ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                                color: isLiveMovement ? '#4ade80' : '#94a3b8',
                                borderColor: isLiveMovement ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'
                            }}
                            title="Toggle Live Simulation Movement">
                            <Icon name={isLiveMovement ? "play" : "pause"} size={12} className="mr-1" />
                            {isLiveMovement ? "Movement ON" : "Paused"}
                        </button>

                        {/* Routes Toggle */}
                        <button
                            onClick={() => setShowRoutes(r => !r)}
                            className="glass-btn"
                            style={{
                                fontSize: '0.72rem', padding: '4px 8px', borderRadius: '6px',
                                background: showRoutes ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)',
                                color: showRoutes ? '#38bdf8' : '#94a3b8',
                                borderColor: showRoutes ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.1)'
                            }}
                            title="Toggle Road Route Polylines">
                            <Icon name="navigation" size={12} className="mr-1" />
                            Routes
                        </button>

                        {/* Fit All Vehicles Button */}
                        <button
                            onClick={handleFitAll}
                            className="glass-btn"
                            style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: '6px', color: '#e2e8f0' }}
                            title="Fit Map to All Visible Vehicles">
                            <Icon name="maximize-2" size={12} className="mr-1" />
                            Fit All
                        </button>
                    </div>
                </div>

                {/* MAP CANVAS */}
                <SharedFleetMap
                    vehicles={vehicles}
                    selectedVehicle={selectedVehicle}
                    onSelectVehicle={handleSelectVehicle}
                    showRoutes={showRoutes}
                    clusteringEnabled={clusteringEnabled}
                    mapHeight={360}
                    tabIdentifier="overview-section"
                />

                {/* SELECTED VEHICLE MINI-DRAWER */}
                {selectedVehicle && (
                    <div style={{
                        marginTop: '10px', padding: '10px 14px', borderRadius: '8px',
                        background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(56,189,248,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${selectedVehicle.markerColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedVehicle.markerColor }}>
                                <Icon name="truck" size={18} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>
                                    {selectedVehicle.vehicleId} <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>({selectedVehicle.driver})</span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
                                    {selectedVehicle.originCity} → {selectedVehicle.destinationCity} ({selectedVehicle.highway})
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem' }}>
                            <div><span style={{ color: '#94a3b8' }}>Speed:</span> <b style={{ color: '#fff' }}>{selectedVehicle.speed} km/h</b></div>
                            <div><span style={{ color: '#94a3b8' }}>ETA:</span> <b style={{ color: '#4ade80' }}>{selectedVehicle.eta}</b></div>
                            <div><span style={{ color: '#94a3b8' }}>Traffic:</span> <b style={{ color: selectedVehicle.traffic === 'Heavy' ? '#f87171' : '#fbbf24' }}>{selectedVehicle.traffic}</b></div>
                            <div>
                                <span style={{
                                    fontSize: '0.7rem', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold',
                                    background: `${selectedVehicle.markerColor}20`, color: selectedVehicle.markerColor, border: `1px solid ${selectedVehicle.markerColor}40`
                                }}>
                                    {selectedVehicle.status}
                                </span>
                            </div>
                            <button 
                                onClick={() => setSelectedVehicle(null)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', marginLeft: '4px' }}>
                                ×
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT: SYNCHRONIZED ACTIVE ALERTS FEED */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '440px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '0.95rem' }}>
                        <Icon name="activity" size={16} color="#60a5fa" />
                        <span>Active Alerts</span>
                    </h3>
                    <span style={{ fontSize: '0.7rem', background: alerts.length > 0 ? 'rgba(248,113,113,0.15)' : 'rgba(74,222,128,0.15)', color: alerts.length > 0 ? '#f87171' : '#4ade80', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                        {alerts.length} Flagged
                    </span>
                </div>

                <div style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px' }}>
                    {alerts.length > 0 ? (
                        alerts.map((al, idx) => (
                            <div 
                                key={idx}
                                onClick={() => {
                                    const match = vehicles.find(v => v.vehicleId === al.vehicleId);
                                    if (match) handleSelectVehicle(match);
                                }}
                                className={`alert-item ${al.type === 'CRITICAL' || al.type === 'DELAY' ? 'critical' : ''}`}
                                style={{ cursor: 'pointer', padding: '8px 10px', borderRadius: '8px', fontSize: '0.78rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <strong style={{ color: '#38bdf8' }}>{al.vehicleId}</strong>
                                    <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold', color: getAlertIconColor(al.type) }}>
                                        {al.type}
                                    </span>
                                </div>
                                <div style={{ color: '#e2e8f0', marginBottom: '2px' }}>{al.message}</div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Rec: {al.recommendation}</div>
                            </div>
                        ))
                    ) : (
                        <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 20px', fontSize: '0.85rem' }}>
                            <Icon name="check-circle" size={24} color="#4ade80" className="mb-2" />
                            <div>All fleet corridors operational. No critical alerts.</div>
                        </div>
                    )}
                </div>
            </div>

        </section>
    );
};

// ============================================================
// DEDICATED LIVE FLEET TRACKING PAGE MODULE
// Fully featured multi-filter, search, and fleet directory module
// ============================================================
const LiveFleetTrackingModule = () => {
    const [selectedCountry, setSelectedCountry] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedTraffic, setSelectedTraffic] = useState("all");
    const [selectedWeather, setSelectedWeather] = useState("all");
    const [selectedVehicleType, setSelectedVehicleType] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchNotice, setSearchNotice] = useState("");
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [showRoutes, setShowRoutes] = useState(true);
    const [clusteringEnabled, setClusteringEnabled] = useState(true);

    const customFilters = useMemo(() => ({
        country: selectedCountry,
        status: selectedStatus,
        traffic: selectedTraffic,
        weather: selectedWeather,
        vehicleType: selectedVehicleType,
        searchQuery
    }), [selectedCountry, selectedStatus, selectedTraffic, selectedWeather, selectedVehicleType, searchQuery]);

    const {
        vehicles,
        alerts,
        simTick,
        isLiveMovement,
        toggleLiveMovement
    } = useSharedFleetData(customFilters);

    const handleSelectVehicle = (v) => {
        setSelectedVehicle(v);
    };

    const handleFitAll = () => {
        if (typeof window.trackingFitAllVehicles === 'function') {
            window.trackingFitAllVehicles();
        }
    };

    const statusMetrics = useMemo(() => {
        const total = vehicles.length;
        const inTransit = vehicles.filter(v => v.status === 'In Transit').length;
        const delivered = vehicles.filter(v => v.status === 'Delivered').length;
        const delayed = vehicles.filter(v => v.status === 'Delayed').length;
        const critical = vehicles.filter(v => v.status === 'Delayed' || v.traffic === 'Heavy' || v.waitTime >= 30).length;
        return { total, inTransit, delivered, delayed, critical, lastUpdated: new Date().toLocaleTimeString('en-IN') };
    }, [vehicles, simTick]);

    return (
        <div className="space-y-6 text-slate-100">

            {/* HEADER */}
            <div className="glass-card p-5 rounded-2xl border border-white/10 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                            <Icon name="truck" size={22} className="text-cyan-400" />
                            <span>LIVE FLEET ROUTING & SIMULATION</span>
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            <span>SIMULATION MODE — MULTI-COUNTRY</span>
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        Road-based routing across India, USA, UK, UAE & Singapore/Malaysia. Vehicles travel strictly on actual highway polylines.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <button 
                        onClick={toggleLiveMovement}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${isLiveMovement ? 'bg-green-500/20 text-green-300 border-green-500/40' : 'bg-slate-800 text-slate-400 border-white/10'}`}>
                        <Icon name={isLiveMovement ? "play" : "pause"} size={14} />
                        <span>Live Movement: {isLiveMovement ? 'ON' : 'PAUSED'}</span>
                    </button>
                    <button 
                        onClick={() => setShowRoutes(r => !r)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${showRoutes ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800 text-slate-400 border-white/10'}`}>
                        <Icon name="navigation" size={14} />
                        <span>Routes: {showRoutes ? 'VISIBLE' : 'HIDDEN'}</span>
                    </button>
                </div>
            </div>

            {/* METRICS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="glass-card p-3 rounded-xl border border-white/10 bg-slate-900/60">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Total Tracked</span>
                    <div className="text-2xl font-bold text-slate-100">{statusMetrics.total}</div>
                </div>
                <div className="glass-card p-3 rounded-xl border border-white/10 bg-slate-900/60">
                    <span className="text-xs text-green-400 font-semibold uppercase">In Transit</span>
                    <div className="text-2xl font-bold text-green-400">{statusMetrics.inTransit}</div>
                </div>
                <div className="glass-card p-3 rounded-xl border border-white/10 bg-slate-900/60">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Delivered</span>
                    <div className="text-2xl font-bold text-slate-300">{statusMetrics.delivered}</div>
                </div>
                <div className="glass-card p-3 rounded-xl border border-white/10 bg-slate-900/60">
                    <span className="text-xs text-red-400 font-semibold uppercase">Delayed</span>
                    <div className="text-2xl font-bold text-red-400">{statusMetrics.delayed}</div>
                </div>
                <div className="glass-card p-3 rounded-xl border border-white/10 bg-slate-900/60">
                    <span className="text-xs text-amber-400 font-semibold uppercase">Critical / Attention</span>
                    <div className="text-2xl font-bold text-amber-400">{statusMetrics.critical}</div>
                </div>
            </div>

            {/* FILTER TOOLBAR */}
            <div className="glass-card p-4 rounded-xl border border-white/10 bg-slate-900/60 flex flex-wrap items-center gap-3">
                <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Country</label>
                    <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} className="glass-input text-xs">
                        <option value="all">All Countries</option>
                        <option value="India">India</option>
                        <option value="USA">USA</option>
                        <option value="UK">UK</option>
                        <option value="UAE">UAE</option>
                        <option value="Singapore/Malaysia">Singapore / Malaysia</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Status</label>
                    <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="glass-input text-xs">
                        <option value="all">All Statuses</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Delayed">Delayed</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Traffic</label>
                    <select value={selectedTraffic} onChange={e => setSelectedTraffic(e.target.value)} className="glass-input text-xs">
                        <option value="all">All Traffic</option>
                        <option value="Clear">Clear</option>
                        <option value="Moderate">Moderate / Detour</option>
                        <option value="Heavy">Heavy</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Vehicle Type</label>
                    <select value={selectedVehicleType} onChange={e => setSelectedVehicleType(e.target.value)} className="glass-input text-xs">
                        <option value="all">All Types</option>
                        <option value="Truck">Truck</option>
                        <option value="Heavy Truck">Heavy Truck</option>
                        <option value="Container Truck">Container Truck</option>
                        <option value="Semi Truck">Semi Truck</option>
                        <option value="Tanker">Tanker</option>
                        <option value="Hauler">Hauler</option>
                        <option value="Freight Truck">Freight Truck</option>
                    </select>
                </div>
                <div className="flex-grow min-w-[200px]">
                    <label className="text-[10px] text-slate-400 block mb-1">Search Fleet</label>
                    <input 
                        type="text"
                        placeholder="Search vehicle, route, origin, dest..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="glass-input text-xs w-full"
                    />
                </div>
                <div className="self-end">
                    <button onClick={handleFitAll} className="glass-btn text-xs px-3 py-2 rounded-lg flex items-center gap-1.5">
                        <Icon name="maximize-2" size={14} />
                        <span>Fit All</span>
                    </button>
                </div>
            </div>

            {/* MAIN MAP & ALERTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 2 COLS: GOOGLE MAP CANVAS */}
                <div className="lg:col-span-2 glass-card p-4 rounded-2xl border border-white/10 bg-slate-900/60 relative">
                    <SharedFleetMap
                        vehicles={vehicles}
                        selectedVehicle={selectedVehicle}
                        onSelectVehicle={handleSelectVehicle}
                        showRoutes={showRoutes}
                        clusteringEnabled={clusteringEnabled}
                        mapHeight={500}
                        tabIdentifier="tracking-section"
                    />
                </div>

                {/* 1 COL: ALERTS & DIRECTORY */}
                <div className="space-y-4">
                    
                    {/* ALERTS */}
                    <div className="glass-card p-4 rounded-2xl border border-white/10 bg-slate-900/60">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <Icon name="activity" size={14} className="text-cyan-400" />
                                <span>Active Route Alerts</span>
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-red-500/20 text-red-300">
                                {alerts.length} Active
                            </span>
                        </div>
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {alerts.length > 0 ? (
                                alerts.map((al, i) => (
                                    <div key={i} onClick={() => {
                                        const found = vehicles.find(v => v.vehicleId === al.vehicleId);
                                        if (found) handleSelectVehicle(found);
                                    }} className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${getAlertCardStyle(al.type)}`}>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold">{al.vehicleId}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${getAlertBadgeStyle(al.type)}`}>
                                                {al.type}
                                            </span>
                                        </div>
                                        <p className="text-[11px] mt-1">{al.message}</p>
                                        <p className="text-[10px] text-cyan-300 mt-1">Rec: {al.recommendation}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-slate-400 p-4 text-center">No active route alerts</div>
                            )}
                        </div>
                    </div>

                    {/* FLEET DIRECTORY */}
                    <div className="glass-card p-4 rounded-2xl border border-white/10 bg-slate-900/60">
                        <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                            <Icon name="list" size={14} className="text-slate-300" />
                            <span>Fleet Asset Directory</span>
                        </h3>
                        <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                            {vehicles.map(v => (
                                <button key={v.vehicleId} onClick={() => handleSelectVehicle(v)}
                                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-all ${selectedVehicle && selectedVehicle.vehicleId === v.vehicleId ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'}`}>
                                    <div>
                                        <span className="font-semibold flex items-center gap-1.5">
                                            <Icon name="truck" size={14} className="text-slate-300" />
                                            <span>{v.vehicleId}</span>
                                        </span>
                                        <span className="block text-[10px] text-slate-400">{v.originCity} → {v.destinationCity} ({v.country})</span>
                                    </div>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ color: v.markerColor, backgroundColor: `${v.markerColor}20` }}>
                                        {v.status}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
};

// ============================================================
// MOUNTING
// Mount OverviewLiveFleetModule to Overview tab
// Mount LiveFleetTrackingModule to Dedicated Live Fleet tab
// ============================================================

if (document.getElementById('react-overview-fleet-root')) {
    ReactDOM.createRoot(document.getElementById('react-overview-fleet-root')).render(<OverviewLiveFleetModule />);
}

if (document.getElementById('react-tracking-root')) {
    ReactDOM.createRoot(document.getElementById('react-tracking-root')).render(<LiveFleetTrackingModule />);
}
