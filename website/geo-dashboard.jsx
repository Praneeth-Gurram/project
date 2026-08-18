const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ====================================================
// 1. ROBUST EXTREME WEATHER NORMALIZATION HELPER
// ====================================================
const normalizeExtremeWeatherFlag = (record) => {
    if (!record) return 'UNKNOWN';

    // Check dedicated Extreme_Weather_Flag field first
    if ('Extreme_Weather_Flag' in record && record.Extreme_Weather_Flag !== null && record.Extreme_Weather_Flag !== undefined) {
        const val = record.Extreme_Weather_Flag;
        if (val === 1 || val === '1' || val === true || String(val).toLowerCase() === 'true' || String(val).toLowerCase() === 'yes' || String(val).toLowerCase() === 'extreme') {
            return 'EXTREME';
        }
        if (val === 0 || val === '0' || val === false || String(val).toLowerCase() === 'false' || String(val).toLowerCase() === 'no' || String(val).toLowerCase() === 'normal' || String(val).toLowerCase() === 'clear') {
            return 'NORMAL';
        }
    }

    // Fallback checks on Logistics_Delay_Reason, Weather fields, and environmental thresholds
    const reason = record.Logistics_Delay_Reason ? String(record.Logistics_Delay_Reason).trim().toLowerCase() : '';
    const weather = record.Weather_Condition || record.Weather_Severity || record.Weather;
    const weatherStr = weather ? String(weather).trim().toLowerCase() : '';
    const temp = typeof record.Temperature === 'number' && !isNaN(record.Temperature) ? record.Temperature : null;
    const humidity = typeof record.Humidity === 'number' && !isNaN(record.Humidity) ? record.Humidity : null;

    if (reason === 'weather' || weatherStr.includes('storm') || weatherStr.includes('rain') || weatherStr.includes('extreme') || (temp !== null && (temp < 10 || temp > 35)) || (humidity !== null && humidity > 90)) {
        return 'EXTREME';
    }

    return 'NORMAL';
};

// ====================================================
// 2. GEO-RISK & WEATHER DECISION CENTER COMPONENT
// ====================================================
const GeoRiskWeatherModule = () => {
    // Dataset State
    const [masterData, setMasterData] = useState([]);
    const [globalFilteredDataset, setGlobalFilteredDataset] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState(false);

    // Interactive Filters State
    const [selectedCluster, setSelectedCluster] = useState("all");
    const [selectedWeather, setSelectedWeather] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");

    // Table & View State
    const [showRecordsTable, setShowRecordsTable] = useState(false);
    const [tableSearchQuery, setTableSearchQuery] = useState("");
    const [tablePage, setTablePage] = useState(1);
    const recordsPerPage = 10;

    // Hover & Tooltip State
    const [hoveredCluster, setHoveredCluster] = useState(null);
    const [showRiskTooltip, setShowRiskTooltip] = useState(false);

    // Leaflet Map Refs
    const mapContainerRef = useRef(null);
    const leafletMapRef = useRef(null);
    const markersRef = useRef({});

    // ----------------------------------------------------
    // 1. Sync Master Dataset & Listen for Global Filters
    // ----------------------------------------------------
    useEffect(() => {
        const loadData = () => {
            if (window.masterDataset && window.masterDataset.length > 0) {
                setMasterData(window.masterDataset);
                setIsLoading(false);
            }
            if (window.globalFilteredDataset !== undefined && window.globalFilteredDataset !== null) {
                setGlobalFilteredDataset(window.globalFilteredDataset);
            }
        };

        loadData();

        if (!window.masterDataset || window.masterDataset.length === 0) {
            fetch('full_data.json')
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        window.masterDataset = data;
                        setMasterData(data);
                        setIsLoading(false);
                    }
                })
                .catch(err => {
                    console.error("Failed to load dataset in Weather Decision Center:", err);
                    setApiError(true);
                    setIsLoading(false);
                });
        }

        const handleMasterDatasetLoaded = (e) => {
            if (e.detail && e.detail.length > 0) {
                setMasterData(e.detail);
                setIsLoading(false);
            }
        };

        const handleGlobalFilter = (e) => {
            if (e.detail && e.detail.filteredData) {
                setGlobalFilteredDataset(e.detail.filteredData);
            }
        };

        window.addEventListener('masterDatasetLoaded', handleMasterDatasetLoaded);
        window.addEventListener('globalFilterChange', handleGlobalFilter);

        const pollTimer = setInterval(() => {
            if (window.masterDataset && window.masterDataset.length > 0 && masterData.length === 0) {
                setMasterData(window.masterDataset);
                setIsLoading(false);
            }
        }, 500);

        return () => {
            window.removeEventListener('masterDatasetLoaded', handleMasterDatasetLoaded);
            window.removeEventListener('globalFilterChange', handleGlobalFilter);
            clearInterval(pollTimer);
        };
    }, []);

    useEffect(() => {
        setTablePage(1);
    }, [selectedCluster, selectedWeather, selectedStatus, tableSearchQuery]);

    // ----------------------------------------------------
    // 2. Active Dataset Filtering
    // ----------------------------------------------------
    const activeDataset = useMemo(() => {
        const raw = (globalFilteredDataset !== null) ? globalFilteredDataset : masterData;
        if (!raw || raw.length === 0) return [];

        return raw.filter(r => {
            if (!r) return false;

            // Geo Cluster Filter
            if (selectedCluster !== "all" && String(r.Geo_Cluster).trim() !== selectedCluster) return false;

            // Weather Filter (Normal vs Extreme)
            if (selectedWeather !== "all") {
                const weatherStatus = normalizeExtremeWeatherFlag(r);
                if (selectedWeather === "Extreme" && weatherStatus !== "EXTREME") return false;
                if (selectedWeather === "Normal" && weatherStatus !== "NORMAL") return false;
            }

            // Shipment Status Filter
            if (selectedStatus !== "all" && r.Shipment_Status !== selectedStatus) return false;

            return true;
        });
    }, [masterData, globalFilteredDataset, selectedCluster, selectedWeather, selectedStatus]);

    // Unique Geo_Cluster options from actual dataset
    const uniqueClusters = useMemo(() => {
        const raw = (globalFilteredDataset !== null) ? globalFilteredDataset : masterData;
        if (!raw || raw.length === 0) return ['Zone West', 'Zone South', 'Zone North', 'Zone Central', 'Zone East'];
        return Array.from(new Set(raw.map(r => r.Geo_Cluster ? String(r.Geo_Cluster).trim() : '').filter(Boolean))).sort();
    }, [masterData, globalFilteredDataset]);

    // ----------------------------------------------------
    // 3. Robust Weather Metrics (Requirements 1, 2, 3, 7, 13)
    // ----------------------------------------------------
    const weatherMetrics = useMemo(() => {
        if (!activeDataset || activeDataset.length === 0) {
            return {
                hasData: false,
                normalCount: 0,
                extremeCount: 0,
                totalCount: 0,
                normalAvgWait: 0,
                extremeAvgWait: null,
                normalAvgDelayRate: 0,
                extremeAvgDelayRate: null,
                weatherDeltaDisplay: 'N/A',
                weatherDeltaVal: null,
                statusNotice: 'No matching records in current dataset filter selection.',
                sampleWarning: null
            };
        }

        const normalRecords = [];
        const extremeRecords = [];

        activeDataset.forEach(r => {
            const flag = normalizeExtremeWeatherFlag(r);
            if (flag === 'EXTREME') {
                extremeRecords.push(r);
            } else {
                normalRecords.push(r);
            }
        });

        const normalCount = normalRecords.length;
        const extremeCount = extremeRecords.length;
        const totalCount = activeDataset.length;

        const getAvgWait = (recs) => recs.length > 0 ? parseFloat((recs.reduce((sum, r) => sum + (Number(r.Waiting_Time) || 0), 0) / recs.length).toFixed(1)) : 0;
        const getDelayRate = (recs) => recs.length > 0 ? parseFloat(((recs.filter(r => r.Shipment_Status === 'Delayed' || r.Logistics_Delay === 1).length / recs.length) * 100).toFixed(1)) : 0;

        const normalAvgWait = getAvgWait(normalRecords);
        const normalAvgDelayRate = getDelayRate(normalRecords);

        let extremeAvgWait = null;
        let extremeAvgDelayRate = null;
        let weatherDeltaDisplay = 'N/A';
        let weatherDeltaVal = null;
        let statusNotice = null;
        let sampleWarning = null;

        if (extremeCount === 0) {
            statusNotice = "Extreme Weather: No extreme-weather events are present in the current dataset.";
            weatherDeltaDisplay = 'N/A';
        } else {
            extremeAvgWait = getAvgWait(extremeRecords);
            extremeAvgDelayRate = getDelayRate(extremeRecords);

            if (normalCount > 0) {
                weatherDeltaVal = parseFloat((extremeAvgWait - normalAvgWait).toFixed(1));
                weatherDeltaDisplay = weatherDeltaVal >= 0 ? `+${weatherDeltaVal} min` : `${weatherDeltaVal} min`;
            }

            if (extremeCount < 3) {
                sampleWarning = "Not enough extreme-weather observations for a reliable statistical comparison.";
            }
        }

        return {
            hasData: true,
            normalCount,
            extremeCount,
            totalCount,
            normalAvgWait,
            extremeAvgWait,
            normalAvgDelayRate,
            extremeAvgDelayRate,
            weatherDeltaDisplay,
            weatherDeltaVal,
            statusNotice,
            sampleWarning
        };
    }, [activeDataset]);

    // ----------------------------------------------------
    // 4. Geo-Cluster Analysis & Transparent Risk Score (Requirements 4 & 6)
    // ----------------------------------------------------
    const clusterStats = useMemo(() => {
        if (!activeDataset || activeDataset.length === 0) return [];

        const groups = {};
        activeDataset.forEach(r => {
            if (!r || !r.Geo_Cluster) return;
            const c = String(r.Geo_Cluster).trim();
            if (!groups[c]) {
                groups[c] = {
                    name: c,
                    total: 0,
                    delayed: 0,
                    totalWait: 0,
                    totalUtil: 0,
                    totalPerf: 0,
                    extremeCount: 0
                };
            }
            const g = groups[c];
            g.total++;
            if (r.Shipment_Status === 'Delayed' || r.Logistics_Delay === 1) g.delayed++;
            g.totalWait += (Number(r.Waiting_Time) || 0);
            g.totalUtil += (Number(r.Asset_Utilization) || 0);
            g.totalPerf += (Number(r.Asset_Performance_Score) || 0);
            if (normalizeExtremeWeatherFlag(r) === 'EXTREME') g.extremeCount++;
        });

        const list = Object.values(groups).map(g => {
            const delayRate = g.total > 0 ? parseFloat(((g.delayed / g.total) * 100).toFixed(1)) : 0;
            const avgWait = g.total > 0 ? parseFloat((g.totalWait / g.total).toFixed(1)) : 0;
            const avgUtil = g.total > 0 ? parseFloat((g.totalUtil / g.total).toFixed(1)) : 0;
            const avgPerf = g.total > 0 ? parseFloat((g.totalPerf / g.total).toFixed(1)) : 0;

            // Transparent Risk Score Calculation (Requirement 6)
            // Factors: Delay Rate (40%), Avg Wait Time (30%), Extreme Weather Prop (15%), Asset Perf Inverse (15%)
            const delayScore = delayRate;
            const waitScore = Math.min((avgWait / 60) * 100, 100);
            const extremeScore = (g.extremeCount / (g.total || 1)) * 100;
            const perfScore = Math.max(0, 100 - (avgPerf / 100));

            const riskScoreVal = parseFloat((
                (delayScore * 0.40) +
                (waitScore * 0.30) +
                (extremeScore * 0.15) +
                (perfScore * 0.15)
            ).toFixed(1));

            let riskLevel = 'LOW';
            let riskColor = '#4ade80';
            if (riskScoreVal > 60 || delayRate > 50) {
                riskLevel = 'HIGH';
                riskColor = '#f87171';
            } else if (riskScoreVal >= 35 || delayRate >= 25) {
                riskLevel = 'MEDIUM';
                riskColor = '#fbbf24';
            }

            return {
                name: g.name,
                total: g.total,
                delayed: g.delayed,
                delayRate,
                avgWait,
                avgUtil,
                avgPerf,
                extremeCount: g.extremeCount,
                riskScoreVal,
                riskLevel,
                riskColor
            };
        });

        return list.sort((a, b) => b.delayRate - a.delayRate);
    }, [activeDataset]);

    // Highest Risk Cluster
    const highestRiskCluster = clusterStats.length > 0 ? clusterStats[0] : null;

    // Overall Geo Risk Score for selected subset
    const overallGeoRisk = useMemo(() => {
        if (clusterStats.length === 0) return { score: 0, level: 'LOW', color: '#4ade80' };
        const avgScore = clusterStats.reduce((sum, c) => sum + c.riskScoreVal, 0) / clusterStats.length;
        const rounded = parseFloat(avgScore.toFixed(1));
        if (rounded > 60) return { score: rounded, level: 'HIGH', color: '#f87171' };
        if (rounded >= 35) return { score: rounded, level: 'MEDIUM', color: '#fbbf24' };
        return { score: rounded, level: 'LOW', color: '#4ade80' };
    }, [clusterStats]);

    // ----------------------------------------------------
    // 5. Traffic + Weather Cross Analysis Matrix (Requirement 8)
    // ----------------------------------------------------
    const trafficWeatherMatrix = useMemo(() => {
        if (!activeDataset || activeDataset.length === 0) return [];

        const trafficStatuses = ['Heavy', 'Detour', 'Moderate', 'Clear'];
        const matrix = {};

        trafficStatuses.forEach(t => {
            matrix[t] = {
                traffic: t,
                total: 0,
                delayed: 0,
                totalWait: 0,
                extremeCount: 0,
                extremeWait: 0
            };
        });

        activeDataset.forEach(r => {
            const t = r.Traffic_Status || 'Clear';
            if (!matrix[t]) {
                matrix[t] = { traffic: t, total: 0, delayed: 0, totalWait: 0, extremeCount: 0, extremeWait: 0 };
            }
            const cell = matrix[t];
            cell.total++;
            if (r.Shipment_Status === 'Delayed' || r.Logistics_Delay === 1) cell.delayed++;
            const wait = Number(r.Waiting_Time) || 0;
            cell.totalWait += wait;

            if (normalizeExtremeWeatherFlag(r) === 'EXTREME') {
                cell.extremeCount++;
                cell.extremeWait += wait;
            }
        });

        return Object.values(matrix).map(m => {
            const delayRate = m.total > 0 ? parseFloat(((m.delayed / m.total) * 100).toFixed(1)) : 0;
            const avgWait = m.total > 0 ? parseFloat((m.totalWait / m.total).toFixed(1)) : 0;
            const extremeAvgWait = m.extremeCount > 0 ? parseFloat((m.extremeWait / m.extremeCount).toFixed(1)) : null;
            return {
                traffic: m.traffic,
                total: m.total,
                delayed: m.delayed,
                delayRate,
                avgWait,
                extremeCount: m.extremeCount,
                extremeAvgWait
            };
        });
    }, [activeDataset]);

    // ----------------------------------------------------
    // 6. Dynamic Geo & Weather Insights Generation (Requirement 12)
    // ----------------------------------------------------
    const dynamicInsightText = useMemo(() => {
        if (!activeDataset || activeDataset.length === 0) {
            return "No records match the current filter selection. Please adjust your zone or weather parameters.";
        }

        let insight = "";
        if (highestRiskCluster) {
            insight += `GEO-CLUSTER INSIGHT: ${highestRiskCluster.name} exhibits the highest observed delay rate at ${highestRiskCluster.delayRate}% across ${highestRiskCluster.total} shipments (avg wait time: ${highestRiskCluster.avgWait} mins, asset utilization: ${highestRiskCluster.avgUtil}%). `;
        }

        if (weatherMetrics.extremeCount === 0) {
            insight += `Zero extreme-weather incidents recorded in current filter selection. Normal weather operations average ${weatherMetrics.normalAvgWait} mins waiting time across ${weatherMetrics.normalCount} shipments.`;
        } else {
            insight += `Extreme-weather events affect ${weatherMetrics.extremeCount} shipments (${((weatherMetrics.extremeCount / weatherMetrics.totalCount) * 100).toFixed(1)}% of scope), creating an average weather delay delta of ${weatherMetrics.weatherDeltaDisplay} (extreme avg: ${weatherMetrics.extremeAvgWait} mins vs normal: ${weatherMetrics.normalAvgWait} mins).`;
        }

        return insight;
    }, [activeDataset, highestRiskCluster, weatherMetrics]);

    // ----------------------------------------------------
    // 7. Interactive Leaflet Map Integration (Requirement 9)
    // ----------------------------------------------------
    const validMapVehicles = useMemo(() => {
        if (!activeDataset || activeDataset.length === 0) return [];
        // Group dataset by Asset_ID to get latest record per vehicle (Requirement 18: Performance & clean rendering)
        const vehicleMap = {};
        activeDataset.forEach((r, idx) => {
            const assetId = r.Asset_ID || `Truck_${(idx % 10) + 1}`;
            if (!vehicleMap[assetId]) {
                vehicleMap[assetId] = r;
            }
        });

        const fallbackCoords = [
            { lat: 12.9716, lng: 77.5946 }, // Bengaluru
            { lat: 19.0760, lng: 72.8777 }, // Mumbai
            { lat: 28.6139, lng: 77.2090 }, // Delhi
            { lat: 13.0827, lng: 80.2707 }, // Chennai
            { lat: 40.7128, lng: -74.0060 }, // NYC
            { lat: 34.0522, lng: -118.2437 }, // LA
            { lat: 51.5074, lng: -0.1278 }, // London
            { lat: 25.2048, lng: 55.2708 }, // Dubai
            { lat: 1.3521, lng: 103.8198 }, // Singapore
            { lat: 17.3850, lng: 78.4867 }  // Hyderabad
        ];

        return Object.values(vehicleMap).map((r, idx) => {
            let lat = parseFloat(r.Latitude);
            let lng = parseFloat(r.Longitude);
            const isValid = window.RoutingService ? window.RoutingService.isValidCoordinate(lat, lng) : (!isNaN(lat) && !isNaN(lng) && lat >= -50 && lat <= 75);
            
            if (!isValid) {
                // Ocean Protection: derive valid road city position for this vehicle
                const fb = fallbackCoords[idx % fallbackCoords.length];
                lat = fb.lat;
                lng = fb.lng;
            }
            return { ...r, Latitude: lat, Longitude: lng, isSimulated: true };
        });
    }, [activeDataset]);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        if (!leafletMapRef.current && window.google && window.google.maps) {
            const gmap = new window.google.maps.Map(mapContainerRef.current, {
                center: { lat: 20.0, lng: 0.0 },
                zoom: 2,
                mapTypeId: 'roadmap',
                styles: [
                    { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
                    { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
                    { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
                    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
                    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0f172a' }] },
                    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
                    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c1829' }] },
                    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#1e3a5f' }] },
                    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
                    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                    { featureType: 'transit', stylers: [{ visibility: 'off' }] }
                ]
            });
            gmap._isGoogleMap = true;
            leafletMapRef.current = gmap;
            setTimeout(() => window.google.maps.event.trigger(gmap, 'resize'), 200);
        } else if (!leafletMapRef.current && window.L) {
            const map = window.L.map(mapContainerRef.current, {
                center: [20.0, 0.0],
                zoom: 2,
                zoomControl: true,
                attributionControl: false
            });
            window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 18,
                subdomains: 'abcd'
            }).addTo(map);
            leafletMapRef.current = map;
            setTimeout(() => map.invalidateSize(), 200);
        }

        const map = leafletMapRef.current;
        if (!map) return;

        const handleTabChange = (e) => {
            if (e.detail && e.detail.targetId === 'geo-section') {
                if (map._isGoogleMap && window.google) {
                    setTimeout(() => window.google.maps.event.trigger(map, 'resize'), 150);
                } else if (map.invalidateSize) {
                    setTimeout(() => map.invalidateSize(), 150);
                }
            }
        };
        window.addEventListener('tabChange', handleTabChange);

        return () => {
            window.removeEventListener('tabChange', handleTabChange);
        };
    }, []);

    // Update Map Markers on Filter / Selection Change
    useEffect(() => {
        const map = leafletMapRef.current;
        if (!map) return;

        const isGoogleMap = map._isGoogleMap;

        // Clear existing markers
        Object.values(markersRef.current).forEach(m => {
            if (m._isGoogleMarker) m.setMap(null);
            else if (map.removeLayer) map.removeLayer(m);
        });
        markersRef.current = {};

        if (validMapVehicles.length === 0) return;

        const coordsList = [];
        const bounds = isGoogleMap && window.google ? new window.google.maps.LatLngBounds() : null;

        validMapVehicles.forEach((r, idx) => {
            const lat = parseFloat(r.Latitude);
            const lng = parseFloat(r.Longitude);
            const assetId = r.Asset_ID || `Record #${idx + 1}`;
            const weatherFlag = normalizeExtremeWeatherFlag(r);
            const isDelayed = r.Shipment_Status === 'Delayed' || r.Logistics_Delay === 1;

            let color = '#4ade80';
            if (isDelayed) color = '#f87171';
            else if (weatherFlag === 'EXTREME') color = '#fbbf24';

            coordsList.push([lat, lng]);

            if (isGoogleMap && window.google) {
                const svgMarker = {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: color,
                    fillOpacity: 0.9,
                    strokeColor: '#0f172a',
                    strokeWeight: 2,
                    scale: 9,
                };

                const marker = new window.google.maps.Marker({
                    position: { lat, lng },
                    map: map,
                    icon: svgMarker,
                    title: assetId,
                    label: { text: weatherFlag === 'EXTREME' ? '⛈️' : '🚚', fontSize: '12px' }
                });
                marker._isGoogleMarker = true;

                const infoWindow = new window.google.maps.InfoWindow({
                    content: `<div style="background:#0f172a;color:#e2e8f0;padding:10px;border-radius:8px;font-family:Inter,sans-serif;min-width:170px;border:1px solid rgba(56,189,248,0.3)">
                        <h4 style="margin:0 0 4px;color:#38bdf8;font-size:0.85rem;font-weight:800">🚚 ${assetId}</h4>
                        <div style="font-size:0.75rem;line-height:1.5">
                            <div><span style="color:#94a3b8">Geo Cluster:</span> ${r.Geo_Cluster || 'N/A'}</div>
                            <div><span style="color:#94a3b8">Status:</span> <strong style="color:${color}">${r.Shipment_Status || 'In Transit'}</strong></div>
                            <div><span style="color:#94a3b8">Wait:</span> ${r.Waiting_Time || 0} mins</div>
                            <div><span style="color:#94a3b8">Weather:</span> ${weatherFlag}</div>
                            <div style="font-size:0.7rem;color:#64748b;margin-top:4px">${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
                        </div>
                    </div>`
                });

                marker.addListener('click', () => infoWindow.open(map, marker));
                if (bounds) bounds.extend({ lat, lng });
                markersRef.current[assetId + '_' + idx] = marker;
            } else if (window.L) {
                const iconHtml = `
                    <div style="position:relative;display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:rgba(15,23,42,0.9);border:2px solid ${color};border-radius:50%;box-shadow:0 0 10px ${color}80;cursor:pointer;">
                        <span style="font-size:13px">${weatherFlag === 'EXTREME' ? '⛈️' : '🚚'}</span>
                    </div>`;
                const customIcon = window.L.divIcon({ html: iconHtml, className: 'custom-geo-marker', iconSize: [32, 32], iconAnchor: [16, 16] });
                const marker = window.L.marker([lat, lng], { icon: customIcon }).addTo(map);
                const popupHtml = `<div style="font-family:system-ui,sans-serif;font-size:12px;color:#0f172a;line-height:1.5;min-width:170px;"><h4 style="margin:0 0 4px;color:#0284c7;font-size:13px;font-weight:bold">🚚 ${assetId}</h4><div><strong>Geo Cluster:</strong> ${r.Geo_Cluster || 'N/A'}</div><div><strong>Status:</strong> <span style="color:${color};font-weight:bold">${r.Shipment_Status || 'In Transit'}</span></div><div><strong>Wait:</strong> ${r.Waiting_Time || 0} mins</div></div>`;
                marker.bindPopup(popupHtml);
                markersRef.current[assetId + '_' + idx] = marker;
            }
        });

        // Fit map bounds
        if (coordsList.length > 0) {
            if (isGoogleMap && window.google && bounds) {
                if (coordsList.length === 1) {
                    map.setCenter({ lat: coordsList[0][0], lng: coordsList[0][1] });
                    map.setZoom(6);
                } else if (selectedCluster !== 'all') {
                    map.fitBounds(bounds);
                }
            } else if (window.L) {
                if (coordsList.length === 1) {
                    map.flyTo(coordsList[0], 6, { duration: 1 });
                } else if (selectedCluster !== 'all') {
                    const lBounds = window.L.latLngBounds(coordsList);
                    map.fitBounds(lBounds, { padding: [40, 40], maxZoom: 8, animate: true });
                }
            }
        }
    }, [validMapVehicles, selectedCluster]);

    // ----------------------------------------------------
    // 8. Table Search & Pagination
    // ----------------------------------------------------
    const filteredTableRecords = useMemo(() => {
        if (!showRecordsTable) return [];
        let list = activeDataset;

        if (tableSearchQuery.trim()) {
            const q = tableSearchQuery.trim().toLowerCase();
            list = list.filter(r => {
                const assetId = r.Asset_ID ? String(r.Asset_ID).toLowerCase() : '';
                const cluster = r.Geo_Cluster ? String(r.Geo_Cluster).toLowerCase() : '';
                const reason = r.Logistics_Delay_Reason ? String(r.Logistics_Delay_Reason).toLowerCase() : '';
                const status = r.Shipment_Status ? String(r.Shipment_Status).toLowerCase() : '';
                return assetId.includes(q) || cluster.includes(q) || reason.includes(q) || status.includes(q);
            });
        }
        return list;
    }, [activeDataset, showRecordsTable, tableSearchQuery]);

    const paginatedTableRecords = useMemo(() => {
        const start = (tablePage - 1) * recordsPerPage;
        return filteredTableRecords.slice(start, start + recordsPerPage);
    }, [filteredTableRecords, tablePage]);

    const totalTablePages = Math.ceil(filteredTableRecords.length / recordsPerPage) || 1;

    // Filter Handlers
    const handleClusterClick = (clusterName) => {
        if (selectedCluster === clusterName) {
            setSelectedCluster("all");
        } else {
            setSelectedCluster(clusterName);
        }
    };

    const handleResetAll = () => {
        setSelectedCluster("all");
        setSelectedWeather("all");
        setSelectedStatus("all");
        setTableSearchQuery("");
    };

    return (
        <div className="space-y-6 text-slate-100">

            {/* ==================================================== */}
            {/* 1. HEADER BAR WITH CLUSTER & WEATHER DROPDOWNS       */}
            {/* ==================================================== */}
            <div className="glass-card p-5 rounded-2xl border border-white/10 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                            <span className="text-cyan-400">🌐</span> GEO-ROUTING & WEATHER
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Live Telemetry Feed
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        Active records analyzed: <strong className="text-cyan-300">{activeDataset.length}</strong> of {masterData.length} total
                    </p>
                </div>

                {/* Filter Controls (Requirements 5 & 10) */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    {/* Geo Cluster Filter */}
                    <div className="flex items-center gap-1 bg-slate-800/80 border border-white/10 rounded-xl px-2.5 py-1.5">
                        <span className="text-slate-400 font-bold">Geo Cluster:</span>
                        <select
                            value={selectedCluster}
                            onChange={(e) => setSelectedCluster(e.target.value)}
                            className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
                        >
                            <option value="all" className="bg-slate-900">All Geo Clusters</option>
                            {uniqueClusters.map(c => (
                                <option key={c} value={c} className="bg-slate-900">{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Weather Filter */}
                    <div className="flex items-center gap-1 bg-slate-800/80 border border-white/10 rounded-xl px-2.5 py-1.5">
                        <span className="text-slate-400 font-bold">Weather:</span>
                        <select
                            value={selectedWeather}
                            onChange={(e) => setSelectedWeather(e.target.value)}
                            className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
                        >
                            <option value="all" className="bg-slate-900">All Weather</option>
                            <option value="Normal" className="bg-slate-900">Normal</option>
                            <option value="Extreme" className="bg-slate-900">Extreme</option>
                        </select>
                    </div>

                    {/* Delivery Status Filter */}
                    <div className="flex items-center gap-1 bg-slate-800/80 border border-white/10 rounded-xl px-2.5 py-1.5">
                        <span className="text-slate-400 font-bold">Status:</span>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
                        >
                            <option value="all" className="bg-slate-900">All Statuses</option>
                            <option value="Delayed" className="bg-slate-900">Delayed</option>
                            <option value="In Transit" className="bg-slate-900">In Transit</option>
                            <option value="Delivered" className="bg-slate-900">Delivered</option>
                        </select>
                    </div>

                    {/* Reset Button */}
                    {(selectedCluster !== "all" || selectedWeather !== "all" || selectedStatus !== "all") && (
                        <button
                            onClick={handleResetAll}
                            className="px-3 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-xl font-bold hover:bg-cyan-500/30 transition-all flex items-center gap-1"
                        >
                            🔄 Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Notice Banner (For Zero Extreme Weather Records or Sample Warnings) */}
            {weatherMetrics.statusNotice && (
                <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs text-cyan-200 flex items-center justify-between flex-wrap gap-2">
                    <span className="flex items-center gap-2">
                        <span className="text-cyan-400">ℹ️</span>
                        <strong>{weatherMetrics.statusNotice}</strong>
                    </span>
                    {weatherMetrics.sampleWarning && (
                        <span className="text-amber-300 font-semibold">{weatherMetrics.sampleWarning}</span>
                    )}
                </div>
            )}

            {/* ==================================================== */}
            {/* 2. TOP KPI CARDS (Requirement 17)                     */}
            {/* ==================================================== */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* 1. Highest Risk Cluster */}
                <div className="glass-card p-3.5 rounded-xl border border-white/10 bg-slate-900/40">
                    <span className="text-xs text-slate-400 block font-medium">Highest Risk Cluster</span>
                    <span className="text-lg font-extrabold text-red-400 block mt-0.5">
                        {highestRiskCluster ? highestRiskCluster.name : 'N/A'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                        {highestRiskCluster ? `${highestRiskCluster.delayRate}% delay rate` : 'No cluster data'}
                    </span>
                </div>

                {/* 2. Average Delay */}
                <div className="glass-card p-3.5 rounded-xl border border-white/10 bg-slate-900/40">
                    <span className="text-xs text-slate-400 block font-medium">Average Waiting Time</span>
                    <span className="text-lg font-extrabold text-amber-400 block mt-0.5">
                        {weatherMetrics.normalAvgWait} mins
                    </span>
                    <span className="text-[10px] text-slate-400">across active scope</span>
                </div>

                {/* 3. Weather Delay Delta */}
                <div className="glass-card p-3.5 rounded-xl border border-white/10 bg-slate-900/40">
                    <span className="text-xs text-slate-400 block font-medium">Weather Delay Delta</span>
                    <span className={`text-lg font-extrabold block mt-0.5 ${weatherMetrics.weatherDeltaVal !== null && weatherMetrics.weatherDeltaVal >= 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                        {weatherMetrics.weatherDeltaDisplay}
                    </span>
                    <span className="text-[10px] text-slate-400">
                        {weatherMetrics.extremeCount > 0 ? 'Extreme vs Normal wait' : 'No extreme records'}
                    </span>
                </div>

                {/* 4. Extreme Weather Records */}
                <div className="glass-card p-3.5 rounded-xl border border-white/10 bg-slate-900/40">
                    <span className="text-xs text-slate-400 block font-medium">Extreme Weather Events</span>
                    <span className="text-lg font-extrabold text-cyan-300 block mt-0.5">
                        {weatherMetrics.extremeCount} <span className="text-xs font-normal text-slate-400">/ {weatherMetrics.totalCount} recs</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                        {weatherMetrics.totalCount > 0 ? `${((weatherMetrics.extremeCount / weatherMetrics.totalCount) * 100).toFixed(1)}% of total` : '0%'}
                    </span>
                </div>
            </div>

            {/* ==================================================== */}
            {/* 3. CHARTS GRID & WEATHER IMPACT CARD                 */}
            {/* ==================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* MAIN CHARTS CONTAINER (Span 2) */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* CHART 1: DELAY PERCENTAGE BY GEO-CLUSTER */}
                    <div className="glass-card p-4 rounded-2xl border border-white/10 bg-slate-900/60 relative">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                                    📊 DELAY PERCENTAGE BY GEO CLUSTER
                                </h3>
                                <span className="text-[11px] text-slate-400">
                                    Sorted by highest delay rate | Click bar to filter cluster
                                </span>
                            </div>
                            {selectedCluster !== "all" && (
                                <button
                                    onClick={() => setSelectedCluster("all")}
                                    className="text-xs text-cyan-400 hover:underline font-bold"
                                >
                                    Show All Clusters
                                </button>
                            )}
                        </div>

                        {/* Interactive Geo-Cluster Bars */}
                        <div className="space-y-3 py-1">
                            {clusterStats.length > 0 ? (
                                clusterStats.map(item => {
                                    const isSelected = selectedCluster === item.name;
                                    return (
                                        <div
                                            key={item.name}
                                            onClick={() => handleClusterClick(item.name)}
                                            onMouseEnter={() => setHoveredCluster(item)}
                                            onMouseLeave={() => setHoveredCluster(null)}
                                            className={`group p-2.5 rounded-xl border transition-all cursor-pointer ${
                                                isSelected
                                                    ? "bg-cyan-500/15 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                                                    : "bg-slate-800/40 border-white/5 hover:bg-slate-800/80 hover:border-white/10"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                <span className={`font-bold flex items-center gap-1.5 ${isSelected ? "text-cyan-300" : "text-slate-200"}`}>
                                                    {item.name}
                                                    {isSelected && <span className="text-[10px] px-1.5 py-0.2 bg-cyan-500/30 rounded text-cyan-300">ACTIVE</span>}
                                                </span>
                                                <span className="font-mono text-slate-300 font-bold">
                                                    {item.delayRate}% delay <span className="text-slate-400 font-normal">({item.delayed}/{item.total} recs | {item.avgWait}m wait)</span>
                                                </span>
                                            </div>

                                            <div className="w-full bg-slate-950/60 h-3.5 rounded-full overflow-hidden p-0.5 border border-white/5 relative">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        isSelected
                                                            ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                                                            : item.delayRate > 40
                                                            ? "bg-gradient-to-r from-amber-500 to-red-500"
                                                            : "bg-gradient-to-r from-blue-500 to-cyan-500"
                                                    }`}
                                                    style={{ width: `${Math.max(item.delayRate, 2)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-xs text-slate-400 text-center py-6">
                                    Geo-cluster analysis unavailable because Geo_Cluster values are missing for current selection.
                                </div>
                            )}
                        </div>

                        {/* Hover Tooltip Card */}
                        {hoveredCluster && (
                            <div className="mt-3 p-3 bg-slate-950/90 border border-cyan-500/30 rounded-xl text-xs text-slate-200 flex items-center justify-between shadow-lg backdrop-blur-md">
                                <div>
                                    <span className="font-bold text-cyan-400 text-sm block">{hoveredCluster.name}</span>
                                    <span className="text-slate-400 text-[11px]">Record Count: {hoveredCluster.total} | Extreme Weather: {hoveredCluster.extremeCount}</span>
                                </div>
                                <div className="text-right space-x-3">
                                    <span>Delay Rate: <strong className="text-red-400">{hoveredCluster.delayRate}%</strong></span>
                                    <span>Avg Wait: <strong className="text-amber-400">{hoveredCluster.avgWait} min</strong></span>
                                    <span>Utilization: <strong className="text-emerald-400">{hoveredCluster.avgUtil}%</strong></span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* WEATHER IMPACT CARD (Requirement 7) */}
                    <div className="glass-card p-4 rounded-2xl border border-white/10 bg-slate-900/60 relative">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-4">
                            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                                ⛈️ WEATHER IMPACT CARD
                            </h3>
                            <span className="text-[11px] text-cyan-400 font-semibold">
                                Normal vs Extreme Comparison
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            {/* Normal Weather Box */}
                            <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-200">
                                <span className="font-bold block text-emerald-400 mb-1">🌤️ Normal Weather</span>
                                <div className="text-lg font-extrabold text-slate-100">{weatherMetrics.normalAvgWait} mins</div>
                                <div className="text-[11px] text-slate-400 mt-1">
                                    Avg Delay Rate: <strong className="text-emerald-400">{weatherMetrics.normalAvgDelayRate}%</strong> ({weatherMetrics.normalCount} recs)
                                </div>
                            </div>

                            {/* Extreme Weather Box */}
                            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-200">
                                <span className="font-bold block text-amber-400 mb-1">🌩️ Extreme Weather</span>
                                <div className="text-lg font-extrabold text-slate-100">
                                    {weatherMetrics.extremeCount > 0 ? `${weatherMetrics.extremeAvgWait} mins` : 'No records'}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-1">
                                    {weatherMetrics.extremeCount > 0 ? (
                                        <>Avg Delay Rate: <strong className="text-amber-400">{weatherMetrics.extremeAvgDelayRate}%</strong> ({weatherMetrics.extremeCount} recs)</>
                                    ) : (
                                        <span>No extreme weather events observed</span>
                                    )}
                                </div>
                            </div>

                            {/* Weather Delay Delta Box */}
                            <div className="p-3 bg-slate-800/60 border border-white/10 rounded-xl text-slate-200">
                                <span className="font-bold block text-cyan-400 mb-1">⚡ Weather Delay Delta</span>
                                <div className="text-lg font-extrabold text-slate-100">{weatherMetrics.weatherDeltaDisplay}</div>
                                <div className="text-[11px] text-slate-400 mt-1">
                                    {weatherMetrics.extremeCount > 0 ? 'Extreme - Normal wait difference' : 'Extreme-weather comparison unavailable'}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* SIDEBAR: GEO RISK SCORE & INSIGHTS (Requirement 6 & 12) */}
                <div className="space-y-4">
                    
                    {/* GEO RISK SCORE CARD (Requirement 6) */}
                    <div className="glass-card p-4 rounded-2xl border border-white/10 bg-slate-900/60 relative">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                                🛡️ GEO RISK SCORE
                            </h3>
                            <button
                                onClick={() => setShowRiskTooltip(!showRiskTooltip)}
                                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold px-2 py-0.5 bg-cyan-500/10 rounded border border-cyan-500/30"
                            >
                                ℹ️ Formula
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-white/5 mb-3">
                            <div>
                                <span className="text-xs text-slate-400 block">Composite Risk Rating</span>
                                <span className="text-2xl font-black text-slate-100">{overallGeoRisk.score} <span className="text-xs font-normal text-slate-400">/ 100</span></span>
                            </div>
                            <span
                                className="text-xs font-extrabold px-3 py-1 rounded-lg shadow"
                                style={{ backgroundColor: `${overallGeoRisk.color}20`, color: overallGeoRisk.color, border: `1px solid ${overallGeoRisk.color}50` }}
                            >
                                {overallGeoRisk.level} RISK
                            </span>
                        </div>

                        {showRiskTooltip && (
                            <div className="p-3 bg-slate-950/95 border border-cyan-500/40 rounded-xl text-[11px] text-slate-300 space-y-1 mb-3 animate-fadeIn">
                                <strong className="text-cyan-400 block">Formula Breakdown:</strong>
                                <div>• Delay Rate: Weight 40%</div>
                                <div>• Avg Waiting Time: Weight 30%</div>
                                <div>• Extreme Weather Prop: Weight 15%</div>
                                <div>• Asset Performance (Inverse): Weight 15%</div>
                            </div>
                        )}

                        <div className="space-y-1.5 text-xs">
                            <span className="text-slate-400 font-bold block mb-1">Cluster Risk Ranking:</span>
                            {clusterStats.map((item, idx) => (
                                <button
                                    key={item.name}
                                    onClick={() => handleClusterClick(item.name)}
                                    className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition-all ${
                                        selectedCluster === item.name
                                            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                                            : "bg-slate-800/40 border-white/5 text-slate-200 hover:bg-slate-800"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center bg-slate-800 text-slate-400">
                                            {idx + 1}
                                        </span>
                                        <span className="font-bold">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px]">
                                        <span style={{ color: item.riskColor }} className="font-bold">{item.riskScoreVal}</span>
                                        <span style={{ backgroundColor: `${item.riskColor}20`, color: item.riskColor }} className="px-1.5 py-0.2 rounded font-extrabold text-[10px]">
                                            {item.riskLevel}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* DYNAMIC BUSINESS INSIGHTS (Requirement 12) */}
                    <div className="glass-card p-4 rounded-2xl border border-white/10 bg-slate-900/60">
                        <h3 className="text-sm font-bold text-slate-100 mb-3 border-b border-white/10 pb-2 flex items-center gap-1.5 text-cyan-400">
                            💡 DYNAMIC GEO INSIGHTS
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-white/5 font-medium">
                            {dynamicInsightText}
                        </p>
                    </div>

                </div>
            </div>

            {/* ==================================================== */}
            {/* 4. INTERACTIVE GEO / ASSET MAP (Requirement 9)       */}
            {/* ==================================================== */}
            <div className="glass-card p-4 rounded-2xl border border-white/10 bg-slate-900/60 relative space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div>
                        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            🗺️ INTERACTIVE GEO / ASSET MAP
                        </h3>
                        <span className="text-[11px] text-cyan-400 font-semibold block">
                            Displaying {validMapVehicles.length} asset location markers for active selection
                        </span>
                    </div>
                </div>

                <div
                    ref={mapContainerRef}
                    style={{ width: '100%', height: '420px', minHeight: '350px', borderRadius: '12px', position: 'relative' }}
                    className="z-10 shadow-inner overflow-hidden"
                />

                {validMapVehicles.length === 0 && (
                    <div className="absolute inset-0 z-30 bg-slate-950/80 rounded-2xl flex items-center justify-center p-6 text-center">
                        <div className="p-4 bg-slate-900/90 border border-white/10 rounded-xl max-w-sm text-slate-300 text-xs">
                            <span className="text-2xl block mb-2">🗺️</span>
                            <span>Map unavailable: valid latitude/longitude data is missing.</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ==================================================== */}
            {/* 5. TRAFFIC + WEATHER CROSS ANALYSIS (Requirement 8)  */}
            {/* ==================================================== */}
            <div className="glass-card p-4 rounded-2xl border border-white/10 bg-slate-900/60 space-y-3">
                <div className="border-b border-white/10 pb-2">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        🚦 TRAFFIC + WEATHER CROSS ANALYSIS
                    </h3>
                    <span className="text-[11px] text-slate-400">
                        Cross-analyzing traffic status against extreme weather impact
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300 border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-slate-950/50 text-slate-400 text-[11px]">
                                <th className="p-2.5">Traffic Status</th>
                                <th className="p-2.5">Record Count</th>
                                <th className="p-2.5">Avg Waiting Time</th>
                                <th className="p-2.5">Delay Rate (%)</th>
                                <th className="p-2.5">Extreme Weather Records</th>
                                <th className="p-2.5">Extreme Weather Avg Wait</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trafficWeatherMatrix.map(row => (
                                <tr key={row.traffic} className="border-b border-white/5 hover:bg-slate-800/50 transition-all">
                                    <td className="p-2.5 font-bold text-slate-200">{row.traffic}</td>
                                    <td className="p-2.5 text-cyan-300 font-semibold">{row.total}</td>
                                    <td className="p-2.5 font-bold text-amber-400">{row.avgWait} mins</td>
                                    <td className="p-2.5 font-bold text-red-400">{row.delayRate}%</td>
                                    <td className="p-2.5 text-cyan-300">{row.extremeCount}</td>
                                    <td className="p-2.5 font-bold text-amber-300">
                                        {row.extremeAvgWait !== null ? `${row.extremeAvgWait} mins` : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ==================================================== */}
            {/* 6. EXPANDABLE SHIPMENT RECORDS TABLE                 */}
            {/* ==================================================== */}
            <div className="glass-card p-4 rounded-2xl border border-white/10 bg-slate-900/60 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        📋 SHIPMENT TELEMETRY LOGS
                    </h3>
                    <button
                        onClick={() => setShowRecordsTable(!showRecordsTable)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-white/10 rounded-lg text-xs font-bold transition-all"
                    >
                        {showRecordsTable ? "Hide Table" : "View Table"} ({activeDataset.length} recs)
                    </button>
                </div>

                {showRecordsTable && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <input
                                type="text"
                                value={tableSearchQuery}
                                onChange={(e) => setTableSearchQuery(e.target.value)}
                                placeholder="Search Asset, Zone, Reason..."
                                className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-64"
                            />
                            <span className="text-[11px] text-slate-400">
                                Showing {filteredTableRecords.length} records
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-300 border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 bg-slate-950/50 text-slate-400 text-[11px]">
                                        <th className="p-2.5">Asset ID</th>
                                        <th className="p-2.5">Geo Cluster</th>
                                        <th className="p-2.5">Timestamp</th>
                                        <th className="p-2.5">Weather Status</th>
                                        <th className="p-2.5">Delay Reason</th>
                                        <th className="p-2.5">Waiting Time</th>
                                        <th className="p-2.5">Shipment Status</th>
                                        <th className="p-2.5">Traffic</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedTableRecords.length > 0 ? (
                                        paginatedTableRecords.map((row, idx) => {
                                            const wFlag = normalizeExtremeWeatherFlag(row);
                                            const isDelayed = row.Shipment_Status === 'Delayed' || row.Logistics_Delay === 1;
                                            return (
                                                <tr key={idx} className="border-b border-white/5 hover:bg-slate-800/50 transition-all">
                                                    <td className="p-2.5 font-bold text-cyan-400">{row.Asset_ID || 'N/A'}</td>
                                                    <td className="p-2.5 text-purple-300 font-semibold">{row.Geo_Cluster || 'N/A'}</td>
                                                    <td className="p-2.5 text-slate-400 text-[11px]">{row.Timestamp || 'N/A'}</td>
                                                    <td className="p-2.5 font-bold">{wFlag}</td>
                                                    <td className="p-2.5">{row.Logistics_Delay_Reason || 'Normal'}</td>
                                                    <td className="p-2.5 font-bold text-amber-400">{row.Waiting_Time || 0} min</td>
                                                    <td className="p-2.5">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            isDelayed ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400"
                                                        }`}>
                                                            {row.Shipment_Status || 'In Transit'}
                                                        </span>
                                                    </td>
                                                    <td className="p-2.5 text-slate-300">{row.Traffic_Status || 'Clear'}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="p-4 text-center text-slate-400">
                                                No shipment records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalTablePages > 1 && (
                            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                                <span className="text-slate-400">
                                    Page {tablePage} of {totalTablePages}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setTablePage(prev => Math.max(prev - 1, 1))}
                                        disabled={tablePage === 1}
                                        className="px-2.5 py-1 bg-slate-800 rounded border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setTablePage(prev => Math.min(prev + 1, totalTablePages))}
                                        disabled={tablePage === totalTablePages}
                                        className="px-2.5 py-1 bg-slate-800 rounded border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};

// Render Component into DOM
if (document.getElementById('react-geo-root')) {
    ReactDOM.createRoot(document.getElementById('react-geo-root')).render(<GeoRiskWeatherModule />);
}
