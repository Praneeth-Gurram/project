/**
 * RoutingService & FleetSimulationService
 * Unified Fleet Engine powering both Live Fleet Tracking page and Executive Overview map.
 * Provides road polyline calculation, strict ocean rejection, and single synchronized simulation state.
 */

window.RoutingService = (function() {
    const routeCache = {};
    let directionsService = null;

    function initDirectionsService() {
        if (!directionsService && window.google && window.google.maps && window.google.maps.DirectionsService) {
            directionsService = new window.google.maps.DirectionsService();
        }
        return directionsService;
    }

    /**
     * Strict Data Validation for Geographic Coordinates
     * Rejects invalid range (-90..90, -180..180), null, NaN, 0/0, and Ocean coordinates.
     */
    function isValidCoordinate(lat, lng) {
        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return false;
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
        if (lat === 0 && lng === 0) return false; // 0/0 Null Island rejection

        // Ocean & Arctic Coordinate Protection:
        // 1. Southern Ocean / Antarctica (lat < -50)
        if (lat < -50) return false;
        // 2. High Arctic Ocean (lat > 75)
        if (lat > 75) return false;
        // 3. Central Pacific Ocean box (lat -20 to 35, lng -180 to -125)
        if (lat > -20 && lat < 35 && lng < -125 && lng > -180) return false;
        // 4. Central Atlantic Ocean box (lat -30 to 45, lng -45 to -20)
        if (lat > -30 && lat < 45 && lng > -45 && lng < -20) return false;
        // 5. Indian Ocean box (lat -45 to 0, lng 50 to 100)
        if (lat > -45 && lat < 0 && lng > 50 && lng < 100) return false;

        return true;
    }

    /**
     * Validates dataset record and logs a warning if coordinates are invalid or ocean points
     */
    function validateAndLogCoordinate(record) {
        if (!record) return false;
        const lat = parseFloat(record.Latitude);
        const lng = parseFloat(record.Longitude);
        const valid = isValidCoordinate(lat, lng);
        if (!valid) {
            console.warn(`[Ocean Protection / Coordinate Validation] Skipped invalid/ocean GPS record for Asset '${record.Asset_ID || 'Unknown'}': (${record.Latitude}, ${record.Longitude})`);
        }
        return valid;
    }

    /**
     * Calculates distance between two points (in kilometers)
     */
    function haversineDistance(p1, p2) {
        const R = 6371; // Earth radius km
        const dLat = (p2.lat - p1.lat) * Math.PI / 180;
        const dLng = (p2.lng - p1.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Marker Clustering helper
     */
    function clusterLocations(items, maxDistanceKm = 120) {
        const clusters = [];
        const visited = new Set();

        items.forEach((item, i) => {
            if (visited.has(i)) return;
            visited.add(i);

            const cluster = {
                center: { lat: item.lat, lng: item.lng },
                items: [item]
            };

            items.forEach((other, j) => {
                if (i === j || visited.has(j)) return;
                const dist = haversineDistance({ lat: item.lat, lng: item.lng }, { lat: other.lat, lng: other.lng });
                if (dist <= maxDistanceKm) {
                    visited.add(j);
                    cluster.items.push(other);
                }
            });

            // Calculate center of cluster
            const avgLat = cluster.items.reduce((s, it) => s + it.lat, 0) / cluster.items.length;
            const avgLng = cluster.items.reduce((s, it) => s + it.lng, 0) / cluster.items.length;
            cluster.center = { lat: parseFloat(avgLat.toFixed(4)), lng: parseFloat(avgLng.toFixed(4)) };

            clusters.push(cluster);
        });

        return clusters;
    }

    /**
     * Positions vehicle marker strictly along calculated road polyline segments
     * Polyline -> Progress -> Current Point on Polyline -> Vehicle Marker
     */
    function interpolateRoadPosition(waypoints, progress) {
        if (!waypoints || waypoints.length === 0) return null;
        if (waypoints.length === 1) return waypoints[0];

        const t = Math.min(Math.max(progress, 0), 1);
        const numSegments = waypoints.length - 1;
        const scaledT = t * numSegments;
        const segIdx = Math.min(Math.floor(scaledT), numSegments - 1);
        const segT = scaledT - segIdx;

        const p1 = waypoints[segIdx];
        const p2 = waypoints[segIdx + 1];

        const lat = p1.lat + (p2.lat - p1.lat) * segT;
        const lng = p1.lng + (p2.lng - p1.lng) * segT;
        return { lat: parseFloat(lat.toFixed(4)), lng: parseFloat(lng.toFixed(4)) };
    }

    /**
     * Fetch road route between origin and destination using Directions API or Road Corridors
     */
    function fetchRoute(routeConfig, callback) {
        const cacheKey = `${routeConfig.origin}_${routeConfig.destination}`;
        if (routeCache[cacheKey]) {
            callback({ status: 'OK', waypoints: routeCache[cacheKey], source: 'CACHE' });
            return;
        }

        const ds = initDirectionsService();
        if (ds && window.google) {
            ds.route({
                origin: routeConfig.origin,
                destination: routeConfig.destination,
                travelMode: window.google.maps.TravelMode.DRIVING
            }, (result, status) => {
                if (status === 'OK' && result.routes && result.routes[0]) {
                    const path = result.routes[0].overview_path.map(pt => ({
                        lat: parseFloat(pt.lat().toFixed(4)),
                        lng: parseFloat(pt.lng().toFixed(4))
                    }));
                    routeCache[cacheKey] = path;
                    callback({ status: 'OK', waypoints: path, source: 'GOOGLE_DIRECTIONS' });
                    return;
                }
                // Fallback to configured high-density road waypoints if API returns error or quota limit
                callback({
                    status: 'FALLBACK',
                    waypoints: routeConfig.waypoints,
                    source: 'FALLBACK_ROAD_SIMULATION',
                    notice: 'Simulation Mode — Route generated from configured origin/destination'
                });
            });
        } else {
            callback({
                status: 'FALLBACK',
                waypoints: routeConfig.waypoints,
                source: 'FALLBACK_ROAD_SIMULATION',
                notice: 'Simulation Mode — Route generated from configured origin/destination'
            });
        }
    }

    return {
        isValidCoordinate,
        validateAndLogCoordinate,
        haversineDistance,
        clusterLocations,
        interpolateRoadPosition,
        fetchRoute
    };
})();

/**
 * Singleton Live Fleet Tracking Engine & Shared Simulation Service
 * Powers both /overview and /live-fleet tabs from the same simulation state.
 */
window.FleetService = (function() {
    const MULTI_COUNTRY_ROUTES = [
        {
            routeId: "ROUTE-IND-101",
            country: "India",
            vehicleId: "Truck_1",
            vehicleType: "Truck",
            driver: "Rajesh Kumar",
            origin: "Bengaluru",
            destination: "Hyderabad",
            originCity: "Bengaluru",
            destinationCity: "Hyderabad",
            totalDistanceKm: 570,
            highway: "NH44",
            waypoints: [
                { lat: 12.9716, lng: 77.5946 },
                { lat: 13.3409, lng: 77.1010 },
                { lat: 14.2251, lng: 77.5946 },
                { lat: 15.8281, lng: 78.0373 },
                { lat: 17.3850, lng: 78.4867 }
            ]
        },
        {
            routeId: "ROUTE-IND-102",
            country: "India",
            vehicleId: "Truck_2",
            vehicleType: "Heavy Truck",
            driver: "Suresh Patel",
            origin: "Mumbai",
            destination: "Pune",
            originCity: "Mumbai",
            destinationCity: "Pune",
            totalDistanceKm: 150,
            highway: "Mumbai-Pune Expressway",
            waypoints: [
                { lat: 19.0760, lng: 72.8777 },
                { lat: 19.0330, lng: 73.0297 },
                { lat: 18.7547, lng: 73.4062 },
                { lat: 18.5204, lng: 73.8567 }
            ]
        },
        {
            routeId: "ROUTE-IND-103",
            country: "India",
            vehicleId: "Truck_3",
            vehicleType: "Container Truck",
            driver: "Anil Sharma",
            origin: "Delhi",
            destination: "Jaipur",
            originCity: "Delhi",
            destinationCity: "Jaipur",
            totalDistanceKm: 280,
            highway: "NH48",
            waypoints: [
                { lat: 28.6139, lng: 77.2090 },
                { lat: 28.4595, lng: 77.0266 },
                { lat: 28.1487, lng: 76.8142 },
                { lat: 27.6094, lng: 76.1558 },
                { lat: 26.9124, lng: 75.7873 }
            ]
        },
        {
            routeId: "ROUTE-IND-104",
            country: "India",
            vehicleId: "Truck_4",
            vehicleType: "Tanker",
            driver: "Mohan Das",
            origin: "Chennai",
            destination: "Bengaluru",
            originCity: "Chennai",
            destinationCity: "Bengaluru",
            totalDistanceKm: 350,
            highway: "NH48",
            waypoints: [
                { lat: 13.0827, lng: 80.2707 },
                { lat: 12.9165, lng: 79.1325 },
                { lat: 12.5266, lng: 78.5678 },
                { lat: 12.7409, lng: 77.8253 },
                { lat: 12.9716, lng: 77.5946 }
            ]
        },
        {
            routeId: "ROUTE-IND-105",
            country: "India",
            vehicleId: "Truck_5",
            vehicleType: "Truck",
            driver: "Arjun Menon",
            origin: "Kolkata",
            destination: "Bhubaneswar",
            originCity: "Kolkata",
            destinationCity: "Bhubaneswar",
            totalDistanceKm: 440,
            highway: "NH16",
            waypoints: [
                { lat: 22.5726, lng: 88.3639 },
                { lat: 22.3460, lng: 87.2320 },
                { lat: 21.4934, lng: 86.9135 },
                { lat: 20.4625, lng: 85.8828 },
                { lat: 20.2961, lng: 85.8245 }
            ]
        },
        {
            routeId: "ROUTE-USA-201",
            country: "USA",
            vehicleId: "Truck_6",
            vehicleType: "Semi Truck",
            driver: "John Miller",
            origin: "New York",
            destination: "Washington DC",
            originCity: "New York",
            destinationCity: "Washington DC",
            totalDistanceKm: 360,
            highway: "I-95 S",
            waypoints: [
                { lat: 40.7128, lng: -74.0060 },
                { lat: 40.2206, lng: -74.7597 },
                { lat: 39.9526, lng: -75.1652 },
                { lat: 39.2904, lng: -76.6122 },
                { lat: 38.9072, lng: -77.0369 }
            ]
        },
        {
            routeId: "ROUTE-USA-202",
            country: "USA",
            vehicleId: "Truck_7",
            vehicleType: "Cargo Truck",
            driver: "David Evans",
            origin: "Los Angeles",
            destination: "San Diego",
            originCity: "Los Angeles",
            destinationCity: "San Diego",
            totalDistanceKm: 190,
            highway: "I-5 S",
            waypoints: [
                { lat: 34.0522, lng: -118.2437 },
                { lat: 33.7456, lng: -117.8678 },
                { lat: 33.1959, lng: -117.3795 },
                { lat: 32.7157, lng: -117.1611 }
            ]
        },
        {
            routeId: "ROUTE-UK-301",
            country: "UK",
            vehicleId: "Truck_8",
            vehicleType: "Lorry",
            driver: "Oliver Smith",
            origin: "London",
            destination: "Manchester",
            originCity: "London",
            destinationCity: "Manchester",
            totalDistanceKm: 330,
            highway: "M1 / M6",
            waypoints: [
                { lat: 51.5074, lng: -0.1278 },
                { lat: 52.0406, lng: -0.7594 },
                { lat: 52.4862, lng: -1.8904 },
                { lat: 53.0027, lng: -2.1794 },
                { lat: 53.4808, lng: -2.2426 }
            ]
        },
        {
            routeId: "ROUTE-UAE-401",
            country: "UAE",
            vehicleId: "Truck_9",
            vehicleType: "Hauler",
            driver: "Tariq Al-Maktoum",
            origin: "Dubai",
            destination: "Abu Dhabi",
            originCity: "Dubai",
            destinationCity: "Abu Dhabi",
            totalDistanceKm: 140,
            highway: "Sheikh Zayed Rd (E11)",
            waypoints: [
                { lat: 25.2048, lng: 55.2708 },
                { lat: 24.9857, lng: 55.0273 },
                { lat: 24.7500, lng: 54.7500 },
                { lat: 24.4539, lng: 54.3773 }
            ]
        },
        {
            routeId: "ROUTE-SEA-501",
            country: "Singapore/Malaysia",
            vehicleId: "Truck_10",
            vehicleType: "Freight Truck",
            driver: "Wei Chen",
            origin: "Singapore",
            destination: "Kuala Lumpur",
            originCity: "Singapore",
            destinationCity: "Kuala Lumpur",
            totalDistanceKm: 350,
            highway: "Asian Highway 2 (AH2)",
            waypoints: [
                { lat: 1.3521, lng: 103.8198 },
                { lat: 1.4927, lng: 103.7414 },
                { lat: 2.1896, lng: 102.2501 },
                { lat: 2.7258, lng: 101.9424 },
                { lat: 3.1390, lng: 101.6869 }
            ]
        }
    ];

    // Single shared simulation state
    const routeProgressMap = {};
    MULTI_COUNTRY_ROUTES.forEach((r, i) => {
        routeProgressMap[r.vehicleId] = (i * 0.08) % 0.85;
    });

    const dynamicWaypointsMap = {};
    let isLiveMovement = true;
    let simTimer = null;
    const subscribers = new Set();

    function notifySubscribers() {
        subscribers.forEach(cb => {
            try { cb({ routeProgressMap: { ...routeProgressMap }, isLiveMovement }); } catch(e) {}
        });
        window.dispatchEvent(new CustomEvent('fleetSimulationUpdate', {
            detail: { routeProgressMap: { ...routeProgressMap }, isLiveMovement }
        }));
    }

    function startSimulation() {
        if (simTimer) clearInterval(simTimer);
        simTimer = setInterval(() => {
            if (!isLiveMovement) return;
            MULTI_COUNTRY_ROUTES.forEach((r, i) => {
                const step = 0.007 + (i % 3) * 0.002;
                routeProgressMap[r.vehicleId] = ((routeProgressMap[r.vehicleId] || 0) + step) % 1.0;
            });
            notifySubscribers();
        }, 3000);
    }

    function setLiveMovement(enabled) {
        isLiveMovement = Boolean(enabled);
        notifySubscribers();
    }

    function isMovementActive() {
        return isLiveMovement;
    }

    function subscribe(callback) {
        subscribers.add(callback);
        return () => subscribers.delete(callback);
    }

    function getProgressMap() {
        return { ...routeProgressMap };
    }

    function getDynamicWaypoints() {
        return { ...dynamicWaypointsMap };
    }

    function fetchAllRoutes() {
        if (!window.RoutingService) return;
        MULTI_COUNTRY_ROUTES.forEach(route => {
            window.RoutingService.fetchRoute({
                origin: route.origin,
                destination: route.destination,
                waypoints: route.waypoints
            }, (res) => {
                if (res && res.waypoints) {
                    dynamicWaypointsMap[route.vehicleId] = res.waypoints;
                }
            });
        });
    }

    function getFleetVehicles(datasetRecords, filterOptions = {}) {
        const sOpts = ['In Transit', 'In Transit', 'In Transit', 'Delayed', 'In Transit'];
        const tOpts = ['Clear', 'Moderate', 'Heavy', 'Clear', 'Moderate'];
        const wOpts = ['Clear', 'Partly Cloudy', 'Rainy', 'Clear', 'Clear'];

        const records = Array.isArray(datasetRecords) ? datasetRecords : [];

        const allVehicles = MULTI_COUNTRY_ROUTES.map((route, i) => {
            const prog = routeProgressMap[route.vehicleId] || 0;
            const activeWaypoints = dynamicWaypointsMap[route.vehicleId] || route.waypoints;

            const coords = (window.RoutingService && window.RoutingService.interpolateRoadPosition)
                ? window.RoutingService.interpolateRoadPosition(activeWaypoints, prog)
                : activeWaypoints[0];

            const datasetMatch = records.find(r => r.Asset_ID === route.vehicleId);

            if (datasetMatch && window.RoutingService && window.RoutingService.validateAndLogCoordinate) {
                window.RoutingService.validateAndLogCoordinate(datasetMatch);
            }

            if (!coords || (window.RoutingService && !window.RoutingService.isValidCoordinate(coords.lat, coords.lng))) {
                return null;
            }

            const status = datasetMatch && datasetMatch.Shipment_Status ? datasetMatch.Shipment_Status : sOpts[i % sOpts.length];
            const traffic = datasetMatch && datasetMatch.Traffic_Status ? datasetMatch.Traffic_Status : tOpts[i % tOpts.length];
            const weather = datasetMatch && datasetMatch.Logistics_Delay_Reason === 'Weather' ? 'Rainy' : wOpts[i % wOpts.length];

            const remainingKm = Math.round(route.totalDistanceKm * (1 - prog));
            const speedKmh = 50 + (i % 3) * 12;
            const etaH = Math.floor(remainingKm / speedKmh);
            const etaM = Math.round(((remainingKm / speedKmh) - etaH) * 60);
            const etaStr = remainingKm === 0 ? 'Arrived' : (etaH > 0 ? `${etaH}h ${etaM}m` : `${etaM}m`);

            let markerColor = '#4ade80';
            let statusCategory = 'Normal';
            if (status === 'Delayed') { markerColor = '#f87171'; statusCategory = 'Delayed'; }
            else if (traffic === 'Heavy' || traffic === 'Detour') { markerColor = '#fbbf24'; statusCategory = 'Attention'; }
            else if (status === 'Delivered') { markerColor = '#94a3b8'; statusCategory = 'Delivered'; }

            return {
                vehicleId: route.vehicleId,
                routeId: route.routeId,
                country: route.country,
                vehicleType: route.vehicleType,
                driver: route.driver,
                origin: route.origin,
                destination: route.destination,
                originCity: route.originCity,
                destinationCity: route.destinationCity,
                totalDistanceKm: route.totalDistanceKm,
                remainingDistance: remainingKm,
                highway: route.highway,
                waypoints: activeWaypoints,
                lat: coords.lat,
                lng: coords.lng,
                progress: prog,
                status,
                statusCategory,
                speed: speedKmh,
                eta: etaStr,
                weather,
                traffic,
                markerColor,
                lastUpdated: new Date().toLocaleTimeString('en-IN'),
                hasValidCoords: true,
                isSimulated: true,
                waitTime: datasetMatch && datasetMatch.Waiting_Time ? datasetMatch.Waiting_Time : (status === 'Delayed' ? 35 : 5),
                utilization: datasetMatch && datasetMatch.Asset_Utilization ? datasetMatch.Asset_Utilization : 82.5,
                cluster: datasetMatch && datasetMatch.Geo_Cluster ? datasetMatch.Geo_Cluster : `Zone ${['North', 'South', 'East', 'West', 'Central'][i % 5]}`,
                delayReason: datasetMatch && datasetMatch.Logistics_Delay_Reason ? datasetMatch.Logistics_Delay_Reason : null
            };
        }).filter(Boolean);

        // Filter vehicles
        const {
            country = 'all',
            status = 'all',
            traffic = 'all',
            weather = 'all',
            vehicleType = 'all',
            searchQuery = '',
            region = 'all',
            warehouse = 'all',
            vehicle = 'all'
        } = filterOptions;

        return allVehicles.filter(v => {
            if (country !== 'all' && v.country !== country) return false;
            if (status !== 'all' && v.status !== status) return false;
            if (traffic !== 'all' && v.traffic !== traffic) return false;
            if (weather !== 'all' && v.weather !== weather) return false;
            if (vehicleType !== 'all' && v.vehicleType !== vehicleType) return false;
            if (vehicle !== 'all' && v.vehicleId !== vehicle) return false;

            if (region !== 'all') {
                const regMap = {
                    'North America': ['USA', 'Canada', 'Mexico'],
                    'Europe': ['UK', 'Germany', 'France'],
                    'Asia Pacific': ['India', 'UAE', 'Singapore/Malaysia', 'Australia', 'Japan', 'China'],
                    'Latin America': ['Brazil', 'Argentina', 'Chile']
                };
                const allowed = regMap[region] || [];
                if (allowed.length > 0 && !allowed.includes(v.country)) return false;
            }

            if (searchQuery && searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase();
                const matchId = v.vehicleId.toLowerCase().includes(q);
                const matchRoute = v.routeId.toLowerCase().includes(q);
                const matchOrigin = v.originCity.toLowerCase().includes(q);
                const matchDest = v.destinationCity.toLowerCase().includes(q);
                const matchDriver = v.driver.toLowerCase().includes(q);
                return matchId || matchRoute || matchOrigin || matchDest || matchDriver;
            }
            return true;
        });
    }

    function getAlerts(filteredVehicles) {
        if (!filteredVehicles || filteredVehicles.length === 0) return [];
        const list = [];
        filteredVehicles.forEach(v => {
            if (!v || !v.vehicleId) return;
            const rStr = `${v.originCity} → ${v.destinationCity}`;
            if (v.status === 'Delayed') {
                list.push({
                    vehicleId: v.vehicleId, type: "DELAY", route: rStr, originCity: v.originCity, destinationCity: v.destinationCity,
                    message: `Delay detected on ${rStr} (${v.highway})`, recommendation: "Reroute via alternate highway corridor."
                });
            } else if (v.traffic === 'Heavy' || v.traffic === 'Detour') {
                list.push({
                    vehicleId: v.vehicleId, type: "TRAFFIC", route: rStr, originCity: v.originCity, destinationCity: v.destinationCity,
                    message: `Heavy traffic: ${rStr}`, recommendation: "Review bypass routing options."
                });
            } else if (v.weather === 'Rainy' || v.weather === 'Storm') {
                list.push({
                    vehicleId: v.vehicleId, type: "WEATHER", route: rStr, originCity: v.originCity, destinationCity: v.destinationCity,
                    message: `Heavy rainfall on ${rStr}`, recommendation: "Reduce fleet speed and maintain safety distance."
                });
            } else if (v.waitTime >= 30) {
                list.push({
                    vehicleId: v.vehicleId, type: "CRITICAL", route: rStr, originCity: v.originCity, destinationCity: v.destinationCity,
                    message: `Extended depot wait time (${v.waitTime} min) at ${v.originCity}`, recommendation: "Prioritize dispatch clearance."
                });
            }
        });
        return list.slice(0, 6);
    }

    // Auto-init simulation
    startSimulation();
    if (typeof window !== 'undefined') {
        window.addEventListener('load', fetchAllRoutes);
    }

    return {
        routes: MULTI_COUNTRY_ROUTES,
        startSimulation,
        setLiveMovement,
        isMovementActive,
        subscribe,
        getProgressMap,
        getDynamicWaypoints,
        fetchAllRoutes,
        getFleetVehicles,
        getAlerts
    };
})();
