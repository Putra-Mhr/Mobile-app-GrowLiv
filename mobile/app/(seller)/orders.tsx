import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { PageBackground } from '@/components/PageBackground';

interface Order {
    _id: string;
    status: string;
    totalPrice: number;
    createdAt: string;
    user: {
        name: string;
        email: string;
        imageUrl?: string;
    };
    orderItems: Array<{
        name: string;
        quantity: number;
        price: number;
        image: string;
    }>;
    shippingAddress: {
        fullName: string;
        streetAddress: string;
        city: string;
    };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Pending', color: '#F59E0B', bgColor: '#FEF3C7' },
    shipped: { label: 'Dikirim', color: '#3B82F6', bgColor: '#DBEAFE' },
    delivered: { label: 'Selesai', color: '#10B981', bgColor: '#D1FAE5' },
    canceled: { label: 'Dibatalkan', color: '#EF4444', bgColor: '#FEE2E2' },
};

export default function SellerOrders() {
    const api = useApi();
    const queryClient = useQueryClient();
    const { showToast } = useNotification();

    const { data: orders, isLoading, refetch, isRefetching } = useQuery<Order[]>({
        queryKey: ['seller-orders'],
        queryFn: async () => {
            const response = await api.get('/seller/orders');
            return response.data;
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
            await api.put(`/seller/orders/${orderId}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
            showToast('success', 'Status pesanan diperbarui');
        },
        onError: () => {
            showToast('error', 'Gagal memperbarui status');
        },
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getNextStatus = (currentStatus: string): string | null => {
        if (currentStatus === 'pending') return 'shipped';
        return null; // Only admin can mark as delivered
    };

    const renderOrder = ({ item }: { item: Order }) => {
        const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
        const nextStatus = getNextStatus(item.status);

        return (
            <View className="bg-white rounded-2xl p-4 mb-3 mx-5 shadow-sm border border-gray-100">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                        <Image
                            source={item.user?.imageUrl || 'https://via.placeholder.com/40'}
                            style={{ width: 40, height: 40, borderRadius: 20 }}
                        />
                        <View className="ml-3">
                            <Text className="text-gray-800 font-semibold">{item.user?.name || 'User'}</Text>
                            <Text className="text-gray-400 text-xs">{formatDate(item.createdAt)}</Text>
                        </View>
                    </View>
                    <View
                        className="px-3 py-1 rounded-full"
                        style={{ backgroundColor: statusConfig.bgColor }}
                    >
                        <Text className="text-xs font-medium" style={{ color: statusConfig.color }}>
                            {statusConfig.label}
                        </Text>
                    </View>
                </View>

                {/* Order Items Preview */}
                <View className="bg-gray-50 rounded-xl p-3 mb-3">
                    {item.orderItems.slice(0, 2).map((orderItem, index) => (
                        <View key={index} className="flex-row items-center mb-2 last:mb-0">
                            <Image
                                source={orderItem.image}
                                style={{ width: 40, height: 40, borderRadius: 8 }}
                                contentFit="cover"
                            />
                            <View className="flex-1 ml-3">
                                <Text className="text-gray-700 text-sm" numberOfLines={1}>{orderItem.name}</Text>
                                <Text className="text-gray-400 text-xs">{orderItem.quantity}x {formatCurrency(orderItem.price)}</Text>
                            </View>
                        </View>
                    ))}
                    {item.orderItems.length > 2 && (
                        <Text className="text-gray-400 text-xs">+{item.orderItems.length - 2} item lainnya</Text>
                    )}
                </View>

                {/* Shipping Info */}
                <View className="flex-row items-center mb-3">
                    <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                    <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>
                        {item.shippingAddress.streetAddress}, {item.shippingAddress.city}
                    </Text>
                </View>

                {/* Footer */}
                <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                    <View>
                        <Text className="text-gray-400 text-xs">Total</Text>
                        <Text className="text-green-600 font-bold text-lg">
                            {formatCurrency(item.totalPrice)}
                        </Text>
                    </View>

                    {nextStatus && (
                        <TouchableOpacity
                            onPress={() => updateStatusMutation.mutate({ orderId: item._id, status: nextStatus })}
                            disabled={updateStatusMutation.isPending}
                        >
                            <LinearGradient
                                colors={['#22C55E', '#16A34A']}
                                className="px-4 py-2 rounded-xl flex-row items-center"
                            >
                                {updateStatusMutation.isPending ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="send" size={16} color="#FFFFFF" />
                                        <Text className="text-white font-semibold ml-2">Kirim</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

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
                data={orders}
                keyExtractor={(item) => item._id}
                renderItem={renderOrder}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
                }
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
                        <Text className="text-gray-400 mt-4 text-lg">Belum ada pesanan</Text>
                        <Text className="text-gray-400 text-sm">Pesanan baru akan muncul di sini</Text>
                    </View>
                }
            />
        </View>
    );
}
