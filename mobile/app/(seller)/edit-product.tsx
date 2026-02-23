import React, { useState, useEffect } from 'react';
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
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    images: string[]; // Base64 images (new) or URLs (existing)
}

export default function EditProductScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
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
    // Track display URIs (for preview) separately from upload data
    const [imageUris, setImageUris] = useState<string[]>([]);
    // Track which images are existing URLs vs new base64
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [newBase64Images, setNewBase64Images] = useState<string[]>([]);

    // Fetch existing product data
    const { data: product, isLoading } = useQuery({
        queryKey: ['seller-product', id],
        queryFn: async () => {
            const response = await api.get(`/seller/products/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    // Populate form when product data loads
    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: String(product.price || ''),
                stock: String(product.stock || '0'),
                category: product.category || '',
                images: product.images || [],
            });
            setImageUris(product.images || []);
            setExistingImageUrls(product.images || []);
            setNewBase64Images([]);
        }
    }, [product]);

    const updateMutation = useMutation({
        mutationFn: async (data: ProductFormData) => {
            // Build the images array: keep existing URLs + add new base64
            const allImages = [...existingImageUrls, ...newBase64Images];
            const response = await api.put(`/seller/products/${id}`, {
                name: data.name,
                description: data.description,
                price: Number(data.price),
                stock: Number(data.stock),
                category: data.category,
                images: allImages,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seller-products'] });
            queryClient.invalidateQueries({ queryKey: ['seller-product', id] });
            queryClient.invalidateQueries({ queryKey: ['seller-dashboard'] });
            showToast('success', 'Produk berhasil diperbarui! ✅');
            router.back();
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || error.message || 'Gagal memperbarui produk';
            if (error.response?.status === 413 || message.includes('too large')) {
                showToast('error', 'Ukuran gambar terlalu besar. Coba gunakan gambar yang lebih kecil.');
            } else {
                showToast('error', message);
            }
        },
    });

    const pickImages = async () => {
        const totalImages = existingImageUrls.length + newBase64Images.length;
        const remaining = 5 - totalImages;
        if (remaining <= 0) {
            showToast('error', 'Maksimal 5 gambar');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: remaining,
            quality: 0.4,
            base64: true,
        });

        if (!result.canceled && result.assets.length > 0) {
            const newUris = result.assets.map((asset) => asset.uri);
            const newB64 = result.assets
                .filter((asset) => asset.base64)
                .map((asset) => `data:image/jpeg;base64,${asset.base64}`);

            setImageUris(prev => [...prev, ...newUris].slice(0, 5));
            setNewBase64Images(prev => [...prev, ...newB64].slice(0, 5 - existingImageUrls.length));
        }
    };

    const removeImage = (index: number) => {
        // Determine if this is an existing URL or a new image
        if (index < existingImageUrls.length) {
            // Remove from existing URLs
            const newExisting = existingImageUrls.filter((_, i) => i !== index);
            setExistingImageUrls(newExisting);
        } else {
            // Remove from new base64 images
            const newIndex = index - existingImageUrls.length;
            setNewBase64Images(prev => prev.filter((_, i) => i !== newIndex));
        }
        setImageUris(prev => prev.filter((_, i) => i !== index));
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
        const totalImages = existingImageUrls.length + newBase64Images.length;
        if (totalImages === 0) {
            showToast('error', 'Tambahkan minimal 1 foto produk');
            return;
        }

        updateMutation.mutate(formData);
    };

    const totalImages = existingImageUrls.length + newBase64Images.length;
    const isFormValid =
        formData.name.trim() &&
        formData.description.trim() &&
        formData.price &&
        Number(formData.price) > 0 &&
        formData.category &&
        totalImages > 0;

    if (isLoading) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        title: 'Edit Produk',
                        headerStyle: { backgroundColor: '#22C55E' },
                        headerTintColor: '#FFFFFF',
                        headerTitleStyle: { fontWeight: 'bold' },
                    }}
                />
                <View className="flex-1 items-center justify-center">
                    <PageBackground />
                    <ActivityIndicator size="large" color="#22C55E" />
                    <Text className="text-gray-500 mt-3">Memuat data produk...</Text>
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Edit Produk',
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
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-gray-700 font-semibold">Foto Produk *</Text>
                                    <View
                                        className={`px-2.5 py-1 rounded-full ${totalImages === 0
                                            ? 'bg-gray-100'
                                            : totalImages >= 5
                                                ? 'bg-amber-100'
                                                : 'bg-green-100'
                                            }`}
                                    >
                                        <Text
                                            className={`text-xs font-bold ${totalImages === 0
                                                ? 'text-gray-400'
                                                : totalImages >= 5
                                                    ? 'text-amber-600'
                                                    : 'text-green-600'
                                                }`}
                                        >
                                            {totalImages}/5 gambar
                                        </Text>
                                    </View>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View className="flex-row gap-3">
                                        {imageUris.map((uri, index) => (
                                            <View key={index} className="relative">
                                                <Image
                                                    source={uri}
                                                    style={{ width: 100, height: 100, borderRadius: 12 }}
                                                    contentFit="cover"
                                                />
                                                {/* Thumbnail badge on first image */}
                                                {index === 0 && (
                                                    <View className="absolute bottom-1 left-1 bg-green-500/90 px-1.5 py-0.5 rounded">
                                                        <Text className="text-white text-[10px] font-bold">Utama</Text>
                                                    </View>
                                                )}
                                                <TouchableOpacity
                                                    className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                                                    onPress={() => removeImage(index)}
                                                >
                                                    <Ionicons name="close" size={14} color="#FFFFFF" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}

                                        {totalImages < 5 && (
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
                                disabled={!isFormValid || updateMutation.isPending}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={isFormValid ? ['#22C55E', '#16A34A'] : ['#D1D5DB', '#9CA3AF']}
                                    className="py-4 rounded-2xl flex-row items-center justify-center"
                                >
                                    {updateMutation.isPending ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                            <Text className="text-white font-bold text-lg ml-2">Simpan Perubahan</Text>
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
