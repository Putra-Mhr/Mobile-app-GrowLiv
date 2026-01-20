/**
 * Shipping Service - Free version with Haversine formula
 * No API calls needed - 100% free!
 */

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Calculate shipping cost based on distance
 * Formula: Base cost + (distance * per-km rate), capped at maximum
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} Shipping cost in IDR
 */
export function calculateShippingCost(distanceKm) {
    const BASE_COST = 5000; // Rp 5,000 base cost
    const PER_KM_RATE = 1500; // Rp 1,500 per km
    const MAX_COST = 50000; // Rp 50,000 maximum

    const cost = BASE_COST + distanceKm * PER_KM_RATE;

    return Math.min(Math.round(cost), MAX_COST);
}

/**
 * Calculate total shipping for cart items
 * Groups by unique product locations (vendors)
 * Each unique location = separate shipping charge
 * @param {Array} cartItems - Array of cart items with populated product data
 * @param {Object} deliveryCoordinates - {latitude, longitude} of delivery address
 * @returns {Object} {total: number, breakdown: Array}
 */
export function calculateCartShipping(cartItems, deliveryCoordinates) {
    if (!deliveryCoordinates?.latitude || !deliveryCoordinates?.longitude) {
        throw new Error("Delivery coordinates are required");
    }

    // Group items by unique product location (vendor)
    const locationGroups = new Map();

    for (const item of cartItems) {
        if (!item.product?.location?.latitude || !item.product?.location?.longitude) {
            throw new Error(`Product ${item.product?.name || "unknown"} is missing location data`);
        }

        const locationKey = `${item.product.location.latitude},${item.product.location.longitude}`;

        if (!locationGroups.has(locationKey)) {
            locationGroups.set(locationKey, {
                location: item.product.location,
                items: [],
            });
        }

        locationGroups.get(locationKey).items.push(item);
    }

    // Calculate shipping for each unique location
    let totalShipping = 0;
    const shippingBreakdown = [];

    for (const [locationKey, group] of locationGroups) {
        const distance = calculateDistance(
            group.location.latitude,
            group.location.longitude,
            deliveryCoordinates.latitude,
            deliveryCoordinates.longitude
        );

        const shippingCost = calculateShippingCost(distance);
        totalShipping += shippingCost;

        shippingBreakdown.push({
            location: group.location.address || "Unknown location",
            distance: parseFloat(distance.toFixed(1)),
            cost: shippingCost,
            itemCount: group.items.length,
        });
    }

    return {
        total: totalShipping,
        breakdown: shippingBreakdown,
    };
}
