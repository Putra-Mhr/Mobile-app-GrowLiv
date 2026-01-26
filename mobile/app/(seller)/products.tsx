import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/lib/api';
import { router } from 'expo-router';
import { useNotification } from '@/context/NotificationContext';
import { PageBackground } from '@/components/PageBackground';

interface Product {
    _id: string;
    name: string;
    price: number;
    stock: number;
    category: string;
    images: string[];
}

export default function SellerProducts() {
    const api = useApi();
    const queryClient = useQueryClient();
    const { showToast, showConfirmation } = useNotification();

    const { data: products, isLoading, refetch, isRefetching } = useQuery<Product[]>({
        queryKey: ['seller-products'],
        queryFn: async () => {
            const response = await api.get('/seller/products');
            return response.data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (productId: string) => {
            await api.delete(`/seller/products/${productId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seller-products'] });
            showToast('success', 'Produk berhasil dihapus');
        },
        onError: () => {
            showToast('error', 'Gagal menghapus produk');
        },
    });

    const handleDelete = (productId: string, productName: string) => {
        showConfirmation({
            title: 'Hapus Produk',
            message: `Apakah Anda yakin ingin menghapus "${productName}"?`,
            type: 'danger',
            confirmText: 'Hapus',
            cancelText: 'Batal',
            onConfirm: () => deleteMutation.mutate(productId),
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const renderProduct = ({ item }: { item: Product }) => (
        <View className="bg-white rounded-2xl p-4 mb-3 mx-5 shadow-sm border border-gray-100">
            <View className="flex-row">
                <Image
                    source={item.images[0]}
                    style={{ width: 80, height: 80, borderRadius: 12 }}
                    contentFit="cover"
                />
                <View className="flex-1 ml-4">
                    <Text className="text-gray-800 font-semibold text-base" numberOfLines={2}>
                        {item.name}
                    </Text>
                    <Text className="text-green-600 font-bold mt-1">
                        {formatCurrency(item.price)}
                    </Text>
                    <View className="flex-row items-center mt-1">
                        <View className={`px-2 py-0.5 rounded-full ${item.stock > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                            <Text className={`text-xs font-medium ${item.stock > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                Stok: {item.stock}
                            </Text>
                        </View>
                        <Text className="text-gray-400 text-xs ml-2">{item.category}</Text>
                    </View>
                </View>
            </View>

            <View className="flex-row mt-3 gap-2">
                <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center bg-blue-50 py-2 rounded-xl"
                    onPress={() => router.push(`/(seller)/edit-product?id=${item._id}` as any)}
                >
                    <Ionicons name="pencil" size={16} color="#3B82F6" />
                    <Text className="text-blue-600 font-medium ml-1">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center bg-red-50 py-2 rounded-xl"
                    onPress={() => handleDelete(item._id, item.name)}
                >
                    <Ionicons name="trash" size={16} color="#EF4444" />
                    <Text className="text-red-600 font-medium ml-1">Hapus</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#22C55E" />
            </View>
        );
    }

    return (
        <View className="flex-1">
            <PageBackground />

            <FlatList
                data={products}
                keyExtractor={(item) => item._id}
                renderItem={renderProduct}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
                }
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
                        <Text className="text-gray-400 mt-4 text-lg">Belum ada produk</Text>
                        <Text className="text-gray-400 text-sm">Tambahkan produk pertama Anda!</Text>
                    </View>
                }
            />

            {/* FAB - Add Product */}
            <TouchableOpacity
                className="absolute right-5"
                style={{ bottom: Platform.OS === 'ios' ? 100 : 85 }}
                onPress={() => router.push('/(seller)/add-product')}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#22C55E', '#16A34A']}
                    className="w-14 h-14 rounded-full items-center justify-center shadow-lg"
                >
                    <Ionicons name="add" size={28} color="#FFFFFF" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}
