import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface SimpleMapPickerProps {
    initialCoordinates?: {
        latitude: number;
        longitude: number;
    };
    onLocationSelect: (coords: { latitude: number; longitude: number }) => void;
    onCancel?: () => void;
}

export function SimpleMapPicker({
    initialCoordinates,
    onLocationSelect,
    onCancel,
}: SimpleMapPickerProps) {
    const [selectedLocation, setSelectedLocation] = useState(
        initialCoordinates || {
            latitude: -6.2088, // Jakarta default
            longitude: 106.8456,
        }
    );

    const handleMapPress = (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setSelectedLocation({ latitude, longitude });
    };

    const confirmLocation = () => {
        onLocationSelect(selectedLocation);
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                onPress={handleMapPress}
            >
                <Marker coordinate={selectedLocation} />
            </MapView>

            <View style={styles.infoBox}>
                <Text style={styles.infoText}>📍 Tap peta untuk pilih lokasi</Text>
                <Text style={styles.coordText}>
                    Lat: {selectedLocation.latitude.toFixed(6)}
                </Text>
                <Text style={styles.coordText}>
                    Lng: {selectedLocation.longitude.toFixed(6)}
                </Text>
            </View>

            <View style={styles.buttonContainer}>
                {onCancel && (
                    <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                        <Text style={styles.cancelText}>Batal</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.confirmButton, !onCancel && styles.confirmButtonFull]}
                    onPress={confirmLocation}
                >
                    <Text style={styles.confirmText}>✓ Konfirmasi Lokasi</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    infoBox: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    infoText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    coordText: {
        fontSize: 12,
        color: '#666',
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        flexDirection: 'row',
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#EF4444',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    confirmButton: {
        flex: 1,
        backgroundColor: '#22C55E',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    confirmButtonFull: {
        flex: undefined,
        width: '100%',
    },
    confirmText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
