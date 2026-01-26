import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    TextInput,
    Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/lib/api';
import { Stack } from 'expo-router';
import { useNotification } from '@/context/NotificationContext';
import { PageBackground } from '@/components/PageBackground';

interface Store {
    _id: string;
    name: string;
    description: string;
    imageUrl?: string;
    isVerified: boolean;
    isActive: boolean;
    balance: number;
    totalRevenue: number;
    totalProducts: number;
    totalSales: number;
    pickupAddress?: {
        street: string;
        city: string;
    };
    user?: {
        name: string;
        email: string;
        imageUrl?: string;
    };
    createdAt: string;
}

export default function AdminStoresScreen() {
    const api = useApi();
    const queryClient = useQueryClient();
    const { showToast, showConfirmation } = useNotification();

    const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all');
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const { data, isLoading, refetch, isRefetching } = useQuery<{ stores: Store[] }>({
        queryKey: ['admin-stores'],
        queryFn: async () => {
            const response = await api.get('/admin/stores');
            return response.data;
        },
    });

    const verifyMutation = useMutation({
        mutationFn: async ({ storeId, isVerified }: { storeId: string; isVerified: boolean }) => {
            const response = await api.patch(`/admin/stores/${storeId}/verify`, { isVerified });
            return response.data;
        },
        onSuccess: (_, { isVerified }) => {
            queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
            showToast('success', isVerified ? 'Toko berhasil diverifikasi!' : 'Verifikasi toko dicabut');
            setShowDetailModal(false);
        },
        onError: () => {
            showToast('error', 'Gagal memperbarui status toko');
        },
    });

    const handleVerify = (store: Store, verify: boolean) => {
        showConfirmation({
            title: verify ? 'Verifikasi Toko' : 'Cabut Verifikasi',
            message: verify
                ? `Apakah Anda yakin ingin memverifikasi "${store.name}"? Produk dari toko ini akan tampil di publik.`
                : `Apakah Anda yakin ingin mencabut verifikasi "${store.name}"? Produk tidak akan terlihat di publik.`,
            type: verify ? 'info' : 'warning',
            confirmText: verify ? 'Verifikasi' : 'Cabut',
            cancelText: 'Batal',
            onConfirm: () => verifyMutation.mutate({ storeId: store._id, isVerified: verify }),
        });
    };

    const stores = data?.stores || [];
    const filteredStores = stores.filter(store => {
        if (filter === 'pending') return !store.isVerified;
        if (filter === 'verified') return store.isVerified;
        return true;
    });

    const pendingCount = stores.filter(s => !s.isVerified).length;

    const renderStore = ({ item: store }: { item: Store }) => (
        <TouchableOpacity
            className="bg-white rounded-2xl p-4 mb-3 mx-5 shadow-sm border border-gray-100"
            onPress={() => {
                setSelectedStore(store);
                setShowDetailModal(true);
            }}
        >
            <View className="flex-row items-center">
                {store.imageUrl ? (
                    <Image
                        source={store.imageUrl}
                        style={{ width: 56, height: 56, borderRadius: 28 }}
                    />
                ) : (
                    <View className="w-14 h-14 bg-gray-100 rounded-full items-center justify-center">
                        <Ionicons name="storefront" size={24} color="#9CA3AF" />
                    </View>
                )}
                <View className="flex-1 ml-3">
                    <View className="flex-row items-center">
                        <Text className="text-gray-800 font-semibold text-base" numberOfLines={1}>
                            {store.name}
                        </Text>
                        {store.isVerified && (
                            <Ionicons name="checkmark-circle" size={16} color="#22C55E" style={{ marginLeft: 4 }} />
                        )}
                    </View>
                    <Text className="text-gray-500 text-sm" numberOfLines={1}>
                        {store.user?.name || 'Unknown'} • {store.pickupAddress?.city || 'No location'}
                    </Text>
                    <View className="flex-row items-center mt-1">
                        <Text className="text-gray-400 text-xs">
                            {store.totalProducts} produk • {store.totalSales} terjual
                        </Text>
                    </View>
                </View>
                <View className={`px-2 py-1 rounded-full ${store.isVerified ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    <Text className={`text-xs font-medium ${store.isVerified ? 'text-green-700' : 'text-yellow-700'}`}>
                        {store.isVerified ? 'Verified' : 'Pending'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

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
                    title: 'Kelola Toko',
                    headerStyle: { backgroundColor: '#22C55E' },
                    headerTintColor: '#FFFFFF',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />

            <View className="flex-1">
                <PageBackground />

                {/* Stats Header */}
                <View className="bg-white mx-5 mt-4 rounded-2xl p-4 flex-row shadow-sm border border-gray-100">
                    <View className="flex-1 items-center">
                        <Text className="text-2xl font-bold text-gray-800">{stores.length}</Text>
                        <Text className="text-gray-500 text-xs">Total Toko</Text>
                    </View>
                    <View className="w-px bg-gray-200" />
                    <View className="flex-1 items-center">
                        <Text className="text-2xl font-bold text-yellow-600">{pendingCount}</Text>
                        <Text className="text-gray-500 text-xs">Menunggu</Text>
                    </View>
                    <View className="w-px bg-gray-200" />
                    <View className="flex-1 items-center">
                        <Text className="text-2xl font-bold text-green-600">{stores.length - pendingCount}</Text>
                        <Text className="text-gray-500 text-xs">Terverifikasi</Text>
                    </View>
                </View>

                {/* Filter Tabs */}
                <View className="flex-row mx-5 mt-4 bg-gray-100 rounded-xl p-1">
                    {(['all', 'pending', 'verified'] as const).map((f) => (
                        <TouchableOpacity
                            key={f}
                            className={`flex-1 py-2 rounded-lg ${filter === f ? 'bg-white shadow-sm' : ''}`}
                            onPress={() => setFilter(f)}
                        >
                            <Text className={`text-center text-sm font-medium ${filter === f ? 'text-green-600' : 'text-gray-500'}`}>
                                {f === 'all' ? 'Semua' : f === 'pending' ? 'Pending' : 'Verified'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <FlatList
                    data={filteredStores}
                    keyExtractor={(item) => item._id}
                    renderItem={renderStore}
                    contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
                    }
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <Ionicons name="storefront-outline" size={64} color="#D1D5DB" />
                            <Text className="text-gray-400 mt-4 text-lg">Tidak ada toko</Text>
                        </View>
                    }
                />
            </View>

            {/* Store Detail Modal */}
            <Modal visible={showDetailModal} animationType="slide" presentationStyle="pageSheet">
                <View className="flex-1 bg-gray-50">
                    <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
                        <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                        <Text className="text-gray-800 font-bold text-lg">Detail Toko</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {selectedStore && (
                        <View className="flex-1 p-5">
                            {/* Store Header */}
                            <View className="bg-white rounded-2xl p-5 items-center shadow-sm border border-gray-100">
                                {selectedStore.imageUrl ? (
                                    <Image
                                        source={selectedStore.imageUrl}
                                        style={{ width: 80, height: 80, borderRadius: 40 }}
                                    />
                                ) : (
                                    <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center">
                                        <Ionicons name="storefront" size={40} color="#9CA3AF" />
                                    </View>
                                )}
                                <Text className="text-gray-800 text-xl font-bold mt-3">{selectedStore.name}</Text>
                                <Text className="text-gray-500 text-sm">{selectedStore.pickupAddress?.city}</Text>

                                <View className={`mt-3 px-4 py-2 rounded-full ${selectedStore.isVerified ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                    <Text className={`font-medium ${selectedStore.isVerified ? 'text-green-700' : 'text-yellow-700'}`}>
                                        {selectedStore.isVerified ? '✓ Terverifikasi' : '⏳ Menunggu Verifikasi'}
                                    </Text>
                                </View>
                            </View>

                            {/* Owner Info */}
                            <View className="bg-white rounded-2xl p-4 mt-4 shadow-sm border border-gray-100">
                                <Text className="text-gray-600 font-semibold mb-3">Pemilik Toko</Text>
                                <View className="flex-row items-center">
                                    {selectedStore.user?.imageUrl ? (
                                        <Image
                                            source={selectedStore.user.imageUrl}
                                            style={{ width: 40, height: 40, borderRadius: 20 }}
                                        />
                                    ) : (
                                        <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                                            <Ionicons name="person" size={20} color="#9CA3AF" />
                                        </View>
                                    )}
                                    <View className="ml-3">
                                        <Text className="text-gray-800 font-medium">{selectedStore.user?.name}</Text>
                                        <Text className="text-gray-500 text-sm">{selectedStore.user?.email}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Stats */}
                            <View className="bg-white rounded-2xl p-4 mt-4 shadow-sm border border-gray-100 flex-row">
                                <View className="flex-1 items-center">
                                    <Text className="text-xl font-bold text-gray-800">{selectedStore.totalProducts}</Text>
                                    <Text className="text-gray-500 text-xs">Produk</Text>
                                </View>
                                <View className="flex-1 items-center">
                                    <Text className="text-xl font-bold text-gray-800">{selectedStore.totalSales}</Text>
                                    <Text className="text-gray-500 text-xs">Terjual</Text>
                                </View>
                                <View className="flex-1 items-center">
                                    <Text className="text-xl font-bold text-green-600">
                                        Rp {(selectedStore.balance / 1000).toFixed(0)}K
                                    </Text>
                                    <Text className="text-gray-500 text-xs">Saldo</Text>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View className="mt-6">
                                {selectedStore.isVerified ? (
                                    <TouchableOpacity
                                        className="bg-red-50 py-4 rounded-2xl flex-row items-center justify-center"
                                        onPress={() => handleVerify(selectedStore, false)}
                                        disabled={verifyMutation.isPending}
                                    >
                                        {verifyMutation.isPending ? (
                                            <ActivityIndicator color="#EF4444" />
                                        ) : (
                                            <>
                                                <Ionicons name="close-circle" size={20} color="#EF4444" />
                                                <Text className="text-red-600 font-semibold ml-2">Cabut Verifikasi</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        onPress={() => handleVerify(selectedStore, true)}
                                        disabled={verifyMutation.isPending}
                                    >
                                        <LinearGradient
                                            colors={['#22C55E', '#16A34A']}
                                            className="py-4 rounded-2xl flex-row items-center justify-center"
                                        >
                                            {verifyMutation.isPending ? (
                                                <ActivityIndicator color="#FFFFFF" />
                                            ) : (
                                                <>
                                                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                                    <Text className="text-white font-semibold ml-2">Verifikasi Toko</Text>
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </>
    );
}
