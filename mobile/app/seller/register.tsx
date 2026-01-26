import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useApi } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { SimpleMapPicker } from '@/components/SimpleMapPicker';
import * as ImagePicker from 'expo-image-picker';
import { PageBackground } from '@/components/PageBackground';

interface StoreFormData {
    name: string;
    description: string;
    pickupAddress: {
        street: string;
        city: string;
        coordinates: {
            latitude: number;
            longitude: number;
        };
    };
    imageBase64: string | null;
}

export default function SellerRegisterScreen() {
    const api = useApi();
    const { showToast } = useNotification();

    const [formData, setFormData] = useState<StoreFormData>({
        name: '',
        description: '',
        pickupAddress: {
            street: '',
            city: '',
            coordinates: {
                latitude: 0,
                longitude: 0,
            },
        },
        imageBase64: null,
    });

    const [logoUri, setLogoUri] = useState<string | null>(null);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [hasCoordinates, setHasCoordinates] = useState(false);

    const registerMutation = useMutation({
        mutationFn: async (data: StoreFormData) => {
            const response = await api.post('/stores/register', data);
            return response.data;
        },
        onSuccess: () => {
            showToast('success', 'Selamat! Toko Anda berhasil didaftarkan 🎉');
            router.replace('/(seller)/dashboard');
        },
        onError: (error: any) => {
            showToast('error', error.response?.data?.message || 'Gagal mendaftarkan toko');
        },
    });

    const pickLogo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0]) {
            setLogoUri(result.assets[0].uri);
            setFormData(prev => ({
                ...prev,
                imageBase64: `data:image/jpeg;base64,${result.assets[0].base64}`,
            }));
        }
    };

    const handleLocationSelect = (coords: { latitude: number; longitude: number }) => {
        setFormData(prev => ({
            ...prev,
            pickupAddress: {
                ...prev.pickupAddress,
                coordinates: coords,
            },
        }));
        setHasCoordinates(true);
        setShowMapPicker(false);
    };

    const handleSubmit = () => {
        // Validation
        if (!formData.name.trim()) {
            showToast('error', 'Nama toko wajib diisi');
            return;
        }
        if (!formData.pickupAddress.street.trim()) {
            showToast('error', 'Alamat pickup wajib diisi');
            return;
        }
        if (!formData.pickupAddress.city.trim()) {
            showToast('error', 'Kota wajib diisi');
            return;
        }
        if (!hasCoordinates) {
            showToast('error', 'Pilih lokasi pickup di peta');
            return;
        }

        registerMutation.mutate(formData);
    };

    const isFormValid =
        formData.name.trim() &&
        formData.pickupAddress.street.trim() &&
        formData.pickupAddress.city.trim() &&
        hasCoordinates;

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Buka Toko Online',
                    headerStyle: { backgroundColor: '#22C55E' },
                    headerTintColor: '#FFFFFF',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />

            <View className="flex-1">
                <PageBackground />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <ScrollView
                        className="flex-1"
                        contentContainerStyle={{ paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header Banner */}
                        <LinearGradient
                            colors={['#22C55E', '#16A34A']}
                            className="px-5 py-6"
                        >
                            <View className="flex-row items-center">
                                <View className="bg-white/20 p-3 rounded-2xl mr-4">
                                    <Ionicons name="storefront" size={32} color="#FFFFFF" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white text-xl font-bold">Mulai Berjualan</Text>
                                    <Text className="text-white/80 text-sm">Jual produk Anda ke ribuan pelanggan</Text>
                                </View>
                            </View>
                        </LinearGradient>

                        <View className="p-5">
                            {/* Store Logo */}
                            <View className="items-center mb-6">
                                <TouchableOpacity onPress={pickLogo} activeOpacity={0.8}>
                                    <View className="w-28 h-28 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 items-center justify-center overflow-hidden">
                                        {logoUri ? (
                                            <Image source={logoUri} style={{ width: 112, height: 112 }} />
                                        ) : (
                                            <View className="items-center">
                                                <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
                                                <Text className="text-gray-400 text-xs mt-1">Logo Toko</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                                <Text className="text-gray-500 text-xs mt-2">Tap untuk upload logo (opsional)</Text>
                            </View>

                            {/* Store Name */}
                            <View className="mb-4">
                                <Text className="text-gray-700 font-semibold mb-2">Nama Toko *</Text>
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                                    placeholder="Contoh: Toko Sayur Segar"
                                    value={formData.name}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                                />
                            </View>

                            {/* Description */}
                            <View className="mb-4">
                                <Text className="text-gray-700 font-semibold mb-2">Deskripsi Toko</Text>
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                                    placeholder="Ceritakan tentang toko Anda..."
                                    value={formData.description}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    style={{ minHeight: 80 }}
                                />
                            </View>

                            {/* Pickup Address Section */}
                            <View className="bg-amber-50 rounded-2xl p-4 mb-4">
                                <View className="flex-row items-center mb-3">
                                    <Ionicons name="location" size={20} color="#D97706" />
                                    <Text className="text-amber-800 font-bold ml-2">Alamat Pickup</Text>
                                </View>
                                <Text className="text-amber-700 text-xs mb-4">
                                    Alamat ini akan digunakan sebagai lokasi pengambilan untuk semua produk Anda.
                                </Text>

                                {/* Street Address */}
                                <View className="mb-3">
                                    <Text className="text-gray-700 font-medium mb-1 text-sm">Alamat Lengkap *</Text>
                                    <TextInput
                                        className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                                        placeholder="Jl. Contoh No. 123"
                                        value={formData.pickupAddress.street}
                                        onChangeText={(text) => setFormData(prev => ({
                                            ...prev,
                                            pickupAddress: { ...prev.pickupAddress, street: text }
                                        }))}
                                    />
                                </View>

                                {/* City */}
                                <View className="mb-4">
                                    <Text className="text-gray-700 font-medium mb-1 text-sm">Kota *</Text>
                                    <TextInput
                                        className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                                        placeholder="Jakarta"
                                        value={formData.pickupAddress.city}
                                        onChangeText={(text) => setFormData(prev => ({
                                            ...prev,
                                            pickupAddress: { ...prev.pickupAddress, city: text }
                                        }))}
                                    />
                                </View>

                                {/* Map Picker Button */}
                                <TouchableOpacity
                                    className={`flex-row items-center justify-center py-3 rounded-xl ${hasCoordinates ? 'bg-green-100 border border-green-300' : 'bg-white border border-gray-200'
                                        }`}
                                    onPress={() => setShowMapPicker(true)}
                                >
                                    <Ionicons
                                        name={hasCoordinates ? 'checkmark-circle' : 'map-outline'}
                                        size={20}
                                        color={hasCoordinates ? '#16A34A' : '#6B7280'}
                                    />
                                    <Text className={`ml-2 font-medium ${hasCoordinates ? 'text-green-700' : 'text-gray-600'}`}>
                                        {hasCoordinates ? 'Lokasi Dipilih ✓' : 'Pilih Lokasi di Peta *'}
                                    </Text>
                                </TouchableOpacity>

                                {hasCoordinates && (
                                    <Text className="text-gray-500 text-xs mt-2 text-center">
                                        {formData.pickupAddress.coordinates.latitude.toFixed(6)}, {formData.pickupAddress.coordinates.longitude.toFixed(6)}
                                    </Text>
                                )}
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={!isFormValid || registerMutation.isPending}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={isFormValid ? ['#22C55E', '#16A34A'] : ['#D1D5DB', '#9CA3AF']}
                                    className="py-4 rounded-2xl flex-row items-center justify-center"
                                >
                                    {registerMutation.isPending ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Ionicons name="rocket" size={20} color="#FFFFFF" />
                                            <Text className="text-white font-bold text-lg ml-2">Daftarkan Toko</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>

            {/* Map Picker Modal */}
            <Modal visible={showMapPicker} animationType="slide">
                <SimpleMapPicker
                    initialCoordinates={
                        hasCoordinates
                            ? formData.pickupAddress.coordinates
                            : undefined
                    }
                    onLocationSelect={handleLocationSelect}
                    onCancel={() => setShowMapPicker(false)}
                />
            </Modal>
        </>
    );
}
