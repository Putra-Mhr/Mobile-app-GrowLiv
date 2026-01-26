import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image as RNImage,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/lib/api';
import { PageBackground } from '@/components/PageBackground';
import { Product } from '@/types';
import useCart from '@/hooks/useCart';
import useWishlist from '@/hooks/useWishlist';
import { useNotification } from '@/context/NotificationContext';

export default function StoreProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const api = useApi();
    const { isInWishlist, toggleWishlist, isAddingToWishlist, isRemovingFromWishlist } = useWishlist();
    const { isAddingToCart, addToCart } = useCart();
    const { showToast } = useNotification();

    const { data: store, isLoading: storeLoading } = useQuery({
        queryKey: ['store', id],
        queryFn: async () => {
            const response = await api.get(`/stores/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    const { data: productsData, isLoading: productsLoading } = useQuery<Product[]>({
        queryKey: ['store-products', id],
        queryFn: async () => {
            const response = await api.get(`/products/by-store/${id}`);
            return response.data.products || response.data;
        },
        enabled: !!id,
    });

    const products = productsData || [];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleAddToCart = (productId: string, productName: string) => {
        addToCart(
            { productId, quantity: 1 },
            {
                onSuccess: () => {
                    showToast('success', 'Ditambahkan!', `${productName} masuk ke keranjang`);
                },
                onError: (error: any) => {
                    showToast('error', 'Gagal', error?.response?.data?.error || 'Tidak dapat menambahkan ke keranjang');
                },
            }
        );
    };

    if (storeLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#22C55E" />
            </View>
        );
    }

    if (!store) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 px-6">
                <Ionicons name="storefront-outline" size={64} color="#D1D5DB" />
                <Text className="text-gray-500 mt-4 text-lg">Toko tidak ditemukan</Text>
                <TouchableOpacity
                    className="mt-6 bg-green-500 px-6 py-3 rounded-xl"
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-semibold">Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: store?.name || 'Profil Toko',
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
                    showsVerticalScrollIndicator={false}
                >
                    {/* Store Header */}
                    <LinearGradient
                        colors={['#22C55E', '#16A34A']}
                        className="px-5 pt-4 pb-8"
                    >
                        <View className="flex-row items-center">
                            {store.imageUrl ? (
                                <Image
                                    source={store.imageUrl}
                                    style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#FFFFFF' }}
                                />
                            ) : (
                                <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center">
                                    <Ionicons name="storefront" size={40} color="#FFFFFF" />
                                </View>
                            )}
                            <View className="ml-4 flex-1">
                                <Text className="text-white text-2xl font-bold">{store.name}</Text>
                                <View className="flex-row items-center mt-1">
                                    <Ionicons name="location" size={14} color="#FFFFFF" />
                                    <Text className="text-white/80 text-sm ml-1">
                                        {store.pickupAddress?.city || 'Lokasi tidak tersedia'}
                                    </Text>
                                </View>
                                {store.isVerified && (
                                    <View className="flex-row items-center mt-2 bg-white/20 px-2 py-1 rounded-full self-start">
                                        <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                                        <Text className="text-white text-xs ml-1">Terverifikasi</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Store Stats */}
                    <View className="mx-5 -mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-row">
                        <View className="flex-1 items-center">
                            <Text className="text-2xl font-bold text-gray-800">
                                {store.totalProducts || products.length || 0}
                            </Text>
                            <Text className="text-gray-500 text-xs">Produk</Text>
                        </View>
                        <View className="w-px bg-gray-200" />
                        <View className="flex-1 items-center">
                            <Text className="text-2xl font-bold text-gray-800">
                                {store.totalSales || 0}
                            </Text>
                            <Text className="text-gray-500 text-xs">Terjual</Text>
                        </View>
                        <View className="w-px bg-gray-200" />
                        <View className="flex-1 items-center">
                            <View className="flex-row items-center">
                                <Ionicons name="star" size={16} color="#F59E0B" />
                                <Text className="text-2xl font-bold text-gray-800 ml-1">
                                    {store.rating?.toFixed(1) || '0.0'}
                                </Text>
                            </View>
                            <Text className="text-gray-500 text-xs">Rating</Text>
                        </View>
                    </View>

                    {/* Description */}
                    {store.description && (
                        <View className="mx-5 mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <Text className="text-gray-800 font-semibold mb-2">Tentang Toko</Text>
                            <Text className="text-gray-600 text-sm">{store.description}</Text>
                        </View>
                    )}

                    {/* Products Section */}
                    <View className="px-5 mt-6">
                        <Text className="text-gray-800 font-bold text-lg mb-3">
                            Produk dari Toko Ini ({products.length})
                        </Text>

                        {productsLoading ? (
                            <ActivityIndicator color="#22C55E" />
                        ) : products.length > 0 ? (
                            <View className="flex-row flex-wrap justify-between">
                                {products.map((product, index) => (
                                    <TouchableOpacity
                                        key={product._id}
                                        className={`w-[48%] rounded-2xl overflow-hidden mb-3 ${index % 2 === 0 ? "bg-yellow-100" : "bg-green-100"}`}
                                        activeOpacity={0.8}
                                        onPress={() => router.push(`/product/${product._id}` as any)}
                                    >
                                        <View className="relative">
                                            <RNImage
                                                source={{ uri: product.images[0] }}
                                                className="w-full h-[140px] bg-gray-100"
                                                resizeMode="cover"
                                            />

                                            {/* Wishlist Button */}
                                            <TouchableOpacity
                                                className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5"
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    toggleWishlist(product._id);
                                                }}
                                            >
                                                {isAddingToWishlist || isRemovingFromWishlist ? (
                                                    <ActivityIndicator size={14} color="#EF4444" />
                                                ) : (
                                                    <Ionicons
                                                        name={isInWishlist(product._id) ? "heart" : "heart-outline"}
                                                        size={18}
                                                        color={isInWishlist(product._id) ? "#EF4444" : "#9CA3AF"}
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        </View>

                                        {/* Product Info */}
                                        <View className="p-3">
                                            <Text className="text-gray-800 text-sm font-semibold" numberOfLines={2}>
                                                {product.name}
                                            </Text>

                                            <Text className="text-green-700 font-bold text-base mt-1">
                                                {formatCurrency(product.price)}
                                            </Text>

                                            {/* Stock info */}
                                            <View className="flex-row items-center mt-1">
                                                <View className={`w-2 h-2 rounded-full mr-1 ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <Text className="text-gray-500 text-xs">
                                                    {product.stock > 0 ? `Stok: ${product.stock}` : 'Habis'}
                                                </Text>
                                            </View>

                                            {/* Add to Cart Button */}
                                            <TouchableOpacity
                                                className="bg-green-500 rounded-xl py-2 mt-2 flex-row items-center justify-center"
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleAddToCart(product._id, product.name);
                                                }}
                                                disabled={product.stock <= 0 || isAddingToCart}
                                            >
                                                {isAddingToCart ? (
                                                    <ActivityIndicator size={16} color="#FFFFFF" />
                                                ) : (
                                                    <>
                                                        <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
                                                        <Text className="text-white text-xs font-semibold ml-1">
                                                            Tambah
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View className="items-center py-10">
                                <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
                                <Text className="text-gray-400 mt-2">Belum ada produk</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </>
    );
}
