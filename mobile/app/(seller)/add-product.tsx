import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import * as ImagePicker from 'expo-image-picker';
import { PageBackground } from '@/components/PageBackground';

const CATEGORIES = ['Dairy', 'Vegetable', 'Fruit', 'Other Products from Farmer'];

interface ProductFormData {
    name: string;
    description: string;
    price: string;
    stock: string;
    category: string;
    images: string[]; // Base64 images
}

export default function AddProductScreen() {
    const api = useApi();
    const queryClient = useQueryClient();
    const { showToast } = useNotification();

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        images: [],
    });
    const [imageUris, setImageUris] = useState<string[]>([]);

    // Reset form function
    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            stock: '',
            category: '',
            images: [],
        });
        setImageUris([]);
    };

    const createMutation = useMutation({
        mutationFn: async (data: ProductFormData) => {
            const response = await api.post('/seller/products', {
                ...data,
                price: Number(data.price),
                stock: Number(data.stock),
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seller-products'] });
            queryClient.invalidateQueries({ queryKey: ['seller-dashboard'] });
            showToast('success', 'Produk berhasil ditambahkan! 🎉');
            resetForm(); // Reset form after success
            router.back();
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || error.message || 'Gagal menambahkan produk';
            // Handle entity too large error
            if (error.response?.status === 413 || message.includes('too large')) {
                showToast('error', 'Ukuran gambar terlalu besar. Coba gunakan gambar yang lebih kecil.');
            } else {
                showToast('error', message);
            }
        },
    });

    const pickImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.4, // Reduced quality to prevent entity too large
            base64: true,
        });

        if (!result.canceled && result.assets.length > 0) {
            const newUris = result.assets.map((asset: ImagePicker.ImagePickerAsset) => asset.uri);
            const newBase64 = result.assets
                .filter((asset: ImagePicker.ImagePickerAsset) => asset.base64)
                .map((asset: ImagePicker.ImagePickerAsset) => `data:image/jpeg;base64,${asset.base64}`);

            setImageUris(prev => [...prev, ...newUris].slice(0, 5));
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...newBase64].slice(0, 5),
            }));
        }
    };

    const removeImage = (index: number) => {
        setImageUris(prev => prev.filter((_, i) => i !== index));
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = () => {
        if (!formData.name.trim()) {
            showToast('error', 'Nama produk wajib diisi');
            return;
        }
        if (!formData.description.trim()) {
            showToast('error', 'Deskripsi wajib diisi');
            return;
        }
        if (!formData.price || Number(formData.price) <= 0) {
            showToast('error', 'Harga harus lebih dari 0');
            return;
        }
        if (!formData.category) {
            showToast('error', 'Pilih kategori produk');
            return;
        }
        if (formData.images.length === 0) {
            showToast('error', 'Tambahkan minimal 1 foto produk');
            return;
        }

        createMutation.mutate(formData);
    };

    const isFormValid =
        formData.name.trim() &&
        formData.description.trim() &&
        formData.price &&
        Number(formData.price) > 0 &&
        formData.category &&
        formData.images.length > 0;

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Tambah Produk',
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
                        <View className="p-5">
                            {/* Images Section */}
                            <View className="mb-4">
                                <Text className="text-gray-700 font-semibold mb-2">Foto Produk *</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View className="flex-row gap-3">
                                        {imageUris.map((uri, index) => (
                                            <View key={index} className="relative">
                                                <Image
                                                    source={uri}
                                                    style={{ width: 100, height: 100, borderRadius: 12 }}
                                                    contentFit="cover"
                                                />
                                                <TouchableOpacity
                                                    className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                                                    onPress={() => removeImage(index)}
                                                >
                                                    <Ionicons name="close" size={14} color="#FFFFFF" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}

                                        {imageUris.length < 5 && (
                                            <TouchableOpacity
                                                className="w-[100px] h-[100px] bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center"
                                                onPress={pickImages}
                                            >
                                                <Ionicons name="camera-outline" size={28} color="#9CA3AF" />
                                                <Text className="text-gray-400 text-xs mt-1">Tambah</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </ScrollView>
                                <Text className="text-gray-400 text-xs mt-2">Maksimal 5 foto</Text>
                            </View>

                            {/* Product Name */}
                            <View className="mb-4">
                                <Text className="text-gray-700 font-semibold mb-2">Nama Produk *</Text>
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                                    placeholder="Contoh: Tomat Merah Segar"
                                    value={formData.name}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                                />
                            </View>

                            {/* Description */}
                            <View className="mb-4">
                                <Text className="text-gray-700 font-semibold mb-2">Deskripsi *</Text>
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                                    placeholder="Jelaskan produk Anda..."
                                    value={formData.description}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                    style={{ minHeight: 100 }}
                                />
                            </View>

                            {/* Price & Stock Row */}
                            <View className="flex-row gap-3 mb-4">
                                <View className="flex-1">
                                    <Text className="text-gray-700 font-semibold mb-2">Harga (Rp) *</Text>
                                    <TextInput
                                        className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                                        placeholder="10000"
                                        value={formData.price}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, price: text.replace(/[^0-9]/g, '') }))}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-700 font-semibold mb-2">Stok</Text>
                                    <TextInput
                                        className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                                        placeholder="0"
                                        value={formData.stock}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, stock: text.replace(/[^0-9]/g, '') }))}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            {/* Category */}
                            <View className="mb-6">
                                <Text className="text-gray-700 font-semibold mb-2">Kategori *</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {CATEGORIES.map((cat) => (
                                        <TouchableOpacity
                                            key={cat}
                                            className={`px-4 py-2 rounded-full border ${formData.category === cat
                                                ? 'bg-green-500 border-green-500'
                                                : 'bg-white border-gray-200'
                                                }`}
                                            onPress={() => setFormData(prev => ({ ...prev, category: cat }))}
                                        >
                                            <Text
                                                className={`font-medium ${formData.category === cat ? 'text-white' : 'text-gray-600'
                                                    }`}
                                            >
                                                {cat}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Info Box */}
                            <View className="bg-blue-50 rounded-xl p-4 mb-6 flex-row">
                                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                                <Text className="text-blue-700 text-sm ml-2 flex-1">
                                    Lokasi produk akan otomatis diambil dari alamat pickup toko Anda.
                                </Text>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={!isFormValid || createMutation.isPending}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={isFormValid ? ['#22C55E', '#16A34A'] : ['#D1D5DB', '#9CA3AF']}
                                    className="py-4 rounded-2xl flex-row items-center justify-center"
                                >
                                    {createMutation.isPending ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                                            <Text className="text-white font-bold text-lg ml-2">Tambah Produk</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </>
    );
}
