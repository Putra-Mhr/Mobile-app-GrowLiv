import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { PageBackground } from '@/components/PageBackground';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';

export default function SellerSettingsScreen() {
    const api = useApi();
    const queryClient = useQueryClient();
    const { showToast } = useNotification();

    // Store form state
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editImageBase64, setEditImageBase64] = useState<string | null>(null);
    const [editImageUri, setEditImageUri] = useState<string | null>(null);

    // Address editing
    const [addressStreet, setAddressStreet] = useState('');
    const [addressCity, setAddressCity] = useState('');
    const [mapRegion, setMapRegion] = useState<Region>({
        latitude: -6.2088,
        longitude: 106.8456,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });

    const { data: store, isLoading } = useQuery({
        queryKey: ['my-store'],
        queryFn: async () => {
            const response = await api.get('/stores/my-store');
            return response.data;
        },
    });

    // Initialize form when store data loads
    useEffect(() => {
        if (store) {
            setEditName(store.name || '');
            setEditDescription(store.description || '');
            setAddressStreet(store.pickupAddress?.street || '');
            setAddressCity(store.pickupAddress?.city || '');
            if (store.pickupAddress?.coordinates) {
                setMapRegion({
                    latitude: store.pickupAddress.coordinates.latitude,
                    longitude: store.pickupAddress.coordinates.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
            }
        }
    }, [store]);

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.put('/stores/my-store', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-store'] });
            showToast('success', 'Profil toko berhasil diperbarui!');
            setShowEditModal(false);
            setShowAddressModal(false);
        },
        onError: (error: any) => {
            showToast('error', error.response?.data?.message || 'Gagal memperbarui profil');
        },
    });

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0]) {
            setEditImageUri(result.assets[0].uri);
            setEditImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const handleSaveProfile = () => {
        const data: any = {
            name: editName,
            description: editDescription,
        };
        if (editImageBase64) {
            data.imageBase64 = editImageBase64;
        }
        updateMutation.mutate(data);
    };

    const handleSaveAddress = () => {
        updateMutation.mutate({
            pickupAddress: {
                street: addressStreet,
                city: addressCity,
                coordinates: {
                    latitude: mapRegion.latitude,
                    longitude: mapRegion.longitude,
                },
            },
        });
    };

    const getCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showToast('error', 'Izin lokasi diperlukan');
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            setMapRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        } catch (error) {
            showToast('error', 'Gagal mendapatkan lokasi');
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#22C55E" />
            </View>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Pengaturan Toko',
                    headerStyle: { backgroundColor: '#22C55E' },
                    headerTintColor: '#FFFFFF',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />

            <View className="flex-1">
                <PageBackground />

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Store Info Card */}
                    <View className="mx-5 mt-5 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <View className="flex-row items-center mb-4">
                            {store?.imageUrl ? (
                                <Image
                                    source={store.imageUrl}
                                    style={{ width: 64, height: 64, borderRadius: 32 }}
                                />
                            ) : (
                                <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center">
                                    <Ionicons name="storefront" size={32} color="#16A34A" />
                                </View>
                            )}
                            <View className="ml-4 flex-1">
                                <Text className="text-gray-800 text-xl font-bold">
                                    {store?.name || 'Toko Anda'}
                                </Text>
                                <Text className="text-gray-500 text-sm">
                                    {store?.pickupAddress?.city || 'Alamat belum diatur'}
                                </Text>
                            </View>
                        </View>

                        {store?.isVerified ? (
                            <View className="flex-row items-center bg-green-50 px-3 py-2 rounded-lg">
                                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                                <Text className="text-green-700 text-sm ml-2">Toko Terverifikasi</Text>
                            </View>
                        ) : (
                            <View className="flex-row items-center bg-yellow-50 px-3 py-2 rounded-lg">
                                <Ionicons name="time" size={16} color="#D97706" />
                                <Text className="text-yellow-700 text-sm ml-2">Menunggu Verifikasi Admin</Text>
                            </View>
                        )}

                        {/* Revenue Info */}
                        <View className="flex-row mt-4 pt-4 border-t border-gray-100">
                            <View className="flex-1">
                                <Text className="text-gray-400 text-xs">Saldo Tertunda</Text>
                                <Text className="text-gray-800 font-bold">
                                    Rp {(store?.balance || 0).toLocaleString('id-ID')}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-400 text-xs">Total Pendapatan</Text>
                                <Text className="text-green-600 font-bold">
                                    Rp {(store?.totalRevenue || 0).toLocaleString('id-ID')}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Menu Items */}
                    <View className="mx-5 mt-4">
                        <TouchableOpacity
                            className="bg-white rounded-2xl p-4 mb-3 flex-row items-center justify-between shadow-sm border border-gray-100"
                            onPress={() => setShowEditModal(true)}
                        >
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center">
                                    <Ionicons name="create-outline" size={20} color="#3B82F6" />
                                </View>
                                <View className="ml-3">
                                    <Text className="text-gray-800 font-semibold">Edit Profil Toko</Text>
                                    <Text className="text-gray-400 text-xs">Ubah nama, deskripsi, logo</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-white rounded-2xl p-4 mb-3 flex-row items-center justify-between shadow-sm border border-gray-100"
                            onPress={() => setShowAddressModal(true)}
                        >
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 bg-amber-100 rounded-xl items-center justify-center">
                                    <Ionicons name="location-outline" size={20} color="#D97706" />
                                </View>
                                <View className="ml-3">
                                    <Text className="text-gray-800 font-semibold">Alamat Pickup</Text>
                                    <Text className="text-gray-400 text-xs">{store?.pickupAddress?.street || 'Atur lokasi pengambilan'}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>

            {/* Edit Profile Modal */}
            <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-gray-50">
                    <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
                        <TouchableOpacity onPress={() => setShowEditModal(false)}>
                            <Text className="text-blue-500">Batal</Text>
                        </TouchableOpacity>
                        <Text className="text-gray-800 font-bold text-lg">Edit Profil</Text>
                        <TouchableOpacity onPress={handleSaveProfile} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? (
                                <ActivityIndicator size="small" color="#22C55E" />
                            ) : (
                                <Text className="text-green-600 font-semibold">Simpan</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 p-5">
                        <TouchableOpacity className="items-center mb-6" onPress={pickImage}>
                            {editImageUri || store?.imageUrl ? (
                                <Image
                                    source={editImageUri || store?.imageUrl}
                                    style={{ width: 100, height: 100, borderRadius: 50 }}
                                />
                            ) : (
                                <View className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center">
                                    <Ionicons name="camera" size={32} color="#9CA3AF" />
                                </View>
                            )}
                            <Text className="text-blue-500 mt-2">Ubah Logo</Text>
                        </TouchableOpacity>

                        <Text className="text-gray-700 font-semibold mb-2">Nama Toko</Text>
                        <TextInput
                            className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4"
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Nama toko"
                        />

                        <Text className="text-gray-700 font-semibold mb-2">Deskripsi</Text>
                        <TextInput
                            className="bg-white border border-gray-200 rounded-xl px-4 py-3"
                            value={editDescription}
                            onChangeText={setEditDescription}
                            placeholder="Deskripsi toko"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            style={{ minHeight: 100 }}
                        />
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>

            {/* Edit Address Modal */}
            <Modal visible={showAddressModal} animationType="slide" presentationStyle="pageSheet">
                <View className="flex-1 bg-gray-50">
                    <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
                        <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                            <Text className="text-blue-500">Batal</Text>
                        </TouchableOpacity>
                        <Text className="text-gray-800 font-bold text-lg">Alamat Pickup</Text>
                        <TouchableOpacity onPress={handleSaveAddress} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? (
                                <ActivityIndicator size="small" color="#22C55E" />
                            ) : (
                                <Text className="text-green-600 font-semibold">Simpan</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View className="flex-1">
                        <MapView
                            provider={PROVIDER_GOOGLE}
                            style={{ flex: 1 }}
                            region={mapRegion}
                            onRegionChangeComplete={setMapRegion}
                        >
                            <Marker coordinate={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }} />
                        </MapView>

                        <TouchableOpacity
                            className="absolute top-4 right-4 bg-white p-3 rounded-full shadow"
                            onPress={getCurrentLocation}
                        >
                            <Ionicons name="locate" size={20} color="#22C55E" />
                        </TouchableOpacity>
                    </View>

                    <View className="p-5 bg-white border-t border-gray-200">
                        <TextInput
                            className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 mb-3"
                            value={addressStreet}
                            onChangeText={setAddressStreet}
                            placeholder="Alamat lengkap (jalan, nomor, dll)"
                        />
                        <TextInput
                            className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3"
                            value={addressCity}
                            onChangeText={setAddressCity}
                            placeholder="Kota"
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
}
