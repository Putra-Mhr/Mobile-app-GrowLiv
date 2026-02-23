import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Modal,
    ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSellerOrders, useSellerOrderDetail, SellerOrder } from '@/hooks/useSellerOrders';
import { useNotification } from '@/context/NotificationContext';
import { PageBackground } from '@/components/PageBackground';

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
    pending: { label: 'Pending', color: '#F59E0B', bgColor: '#FEF3C7', icon: 'time-outline' },
    shipped: { label: 'Dikirim', color: '#3B82F6', bgColor: '#DBEAFE', icon: 'airplane-outline' },
    delivered: { label: 'Selesai', color: '#10B981', bgColor: '#D1FAE5', icon: 'checkmark-circle-outline' },
    canceled: { label: 'Dibatalkan', color: '#EF4444', bgColor: '#FEE2E2', icon: 'close-circle-outline' },
};

function OrderDetailModal({ orderId, visible, onClose }: {
    orderId: string;
    visible: boolean;
    onClose: () => void;
}) {
    const { data, isLoading } = useSellerOrderDetail(orderId);
    const order = data?.order;
    const tracking = data?.trackingHistory || order?.trackingHistory || [];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View className="flex-1 bg-gray-50">
                {/* Header */}
                <View className="flex-row items-center justify-between px-5 pt-14 pb-4 bg-white border-b border-gray-100">
                    <Text className="text-lg font-bold text-gray-800">Detail Pesanan</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#22C55E" />
                    </View>
                ) : order ? (
                    <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
                        {/* Order ID + Status */}
                        <View className="bg-white rounded-2xl p-4 mb-4">
                            <View className="flex-row items-center justify-between mb-3">
                                <Text className="text-gray-400 text-xs">Order ID</Text>
                                <View
                                    className="px-3 py-1 rounded-full"
                                    style={{ backgroundColor: STATUS_CONFIG[order.status]?.bgColor }}
                                >
                                    <Text className="text-xs font-medium" style={{ color: STATUS_CONFIG[order.status]?.color }}>
                                        {STATUS_CONFIG[order.status]?.label}
                                    </Text>
                                </View>
                            </View>
                            <Text className="text-gray-800 font-mono text-sm">
                                #{order._id.slice(-8).toUpperCase()}
                            </Text>
                            <Text className="text-gray-400 text-xs mt-1">
                                {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </Text>
                        </View>

                        {/* Customer Info */}
                        <View className="bg-white rounded-2xl p-4 mb-4">
                            <Text className="text-gray-800 font-semibold mb-3">Pembeli</Text>
                            <View className="flex-row items-center">
                                <Image
                                    source={order.user?.imageUrl || 'https://via.placeholder.com/40'}
                                    style={{ width: 40, height: 40, borderRadius: 20 }}
                                />
                                <View className="ml-3">
                                    <Text className="text-gray-800 font-medium">{order.user?.name}</Text>
                                    <Text className="text-gray-400 text-xs">{order.user?.email}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Items */}
                        <View className="bg-white rounded-2xl p-4 mb-4">
                            <Text className="text-gray-800 font-semibold mb-3">Produk</Text>
                            {order.orderItems.map((item, index) => (
                                <View key={index} className="flex-row items-center mb-3 last:mb-0">
                                    <Image
                                        source={item.image || item.product?.images?.[0]}
                                        style={{ width: 48, height: 48, borderRadius: 10 }}
                                        contentFit="cover"
                                    />
                                    <View className="flex-1 ml-3">
                                        <Text className="text-gray-700 text-sm" numberOfLines={2}>
                                            {item.name || item.product?.name}
                                        </Text>
                                        <Text className="text-gray-400 text-xs mt-1">
                                            {item.quantity}x Rp {item.price.toLocaleString('id-ID')}
                                        </Text>
                                    </View>
                                    <Text className="text-gray-800 font-medium text-sm">
                                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                                    </Text>
                                </View>
                            ))}
                            <View className="border-t border-gray-100 mt-3 pt-3">
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-600 font-semibold">Total</Text>
                                    <Text className="text-green-600 font-bold">
                                        Rp {order.totalPrice.toLocaleString('id-ID')}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Shipping Address */}
                        {order.shippingAddress && (
                            <View className="bg-white rounded-2xl p-4 mb-4">
                                <Text className="text-gray-800 font-semibold mb-3">Alamat Pengiriman</Text>
                                <View className="flex-row">
                                    <Ionicons name="location" size={18} color="#22C55E" />
                                    <View className="ml-2 flex-1">
                                        <Text className="text-gray-700 text-sm font-medium">{order.shippingAddress.fullName}</Text>
                                        <Text className="text-gray-500 text-xs mt-1">{order.shippingAddress.streetAddress}</Text>
                                        <Text className="text-gray-500 text-xs">{order.shippingAddress.city}, {order.shippingAddress.province}</Text>
                                        {order.shippingAddress.phone && (
                                            <Text className="text-gray-500 text-xs mt-1">📱 {order.shippingAddress.phone}</Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Tracking Timeline */}
                        {tracking.length > 0 && (
                            <View className="bg-white rounded-2xl p-4 mb-6">
                                <Text className="text-gray-800 font-semibold mb-4">Riwayat Status</Text>
                                {tracking.map((entry, index) => {
                                    const isLast = index === tracking.length - 1;
                                    const statusCfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending;

                                    return (
                                        <View key={index} className="flex-row mb-4 last:mb-0">
                                            <View className="items-center mr-3">
                                                <View
                                                    style={{
                                                        width: 28, height: 28, borderRadius: 14,
                                                        backgroundColor: index === 0 ? statusCfg.bgColor : '#F3F4F6',
                                                        justifyContent: 'center', alignItems: 'center',
                                                    }}
                                                >
                                                    <Ionicons
                                                        name={statusCfg.icon as any}
                                                        size={14}
                                                        color={index === 0 ? statusCfg.color : '#9CA3AF'}
                                                    />
                                                </View>
                                                {!isLast && (
                                                    <View style={{ width: 2, flex: 1, backgroundColor: '#E5E7EB', marginTop: 4 }} />
                                                )}
                                            </View>
                                            <View className="flex-1 pb-2">
                                                <Text className="text-gray-800 text-sm font-medium">{entry.title}</Text>
                                                <Text className="text-gray-500 text-xs mt-0.5">{entry.description}</Text>
                                                <Text className="text-gray-400 text-[10px] mt-1">
                                                    {new Date(entry.timestamp).toLocaleDateString('id-ID', {
                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </ScrollView>
                ) : (
                    <View className="flex-1 items-center justify-center">
                        <Ionicons name="alert-circle-outline" size={48} color="#D1D5DB" />
                        <Text className="text-gray-400 mt-2">Tidak dapat memuat detail pesanan</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
}

export default function SellerOrders() {
    const { orders, isLoading, refetch, isRefetching, updateStatus, isUpdating } = useSellerOrders();
    const { showToast } = useNotification();
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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
        return null;
    };

    const handleUpdateStatus = (orderId: string, status: string) => {
        updateStatus(
            { orderId, status },
            {
                onSuccess: () => showToast('success', 'Status pesanan diperbarui'),
                onError: () => showToast('error', 'Gagal memperbarui status'),
            }
        );
    };

    const renderOrder = ({ item }: { item: SellerOrder }) => {
        const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
        const nextStatus = getNextStatus(item.status);

        return (
            <TouchableOpacity
                className="bg-white rounded-2xl p-4 mb-3 mx-5 shadow-sm border border-gray-100"
                activeOpacity={0.7}
                onPress={() => setSelectedOrderId(item._id)}
            >
                {/* Header */}
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                        <Image
                            source={item.user?.imageUrl || 'https://via.placeholder.com/40'}
                            style={{ width: 40, height: 40, borderRadius: 20 }}
                        />
                        <View className="ml-3 flex-1">
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

                {/* Shipping Info + Tap hint */}
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                        <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                        <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>
                            {item.shippingAddress?.streetAddress}, {item.shippingAddress?.city}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
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
                            onPress={(e) => {
                                e.stopPropagation?.();
                                handleUpdateStatus(item._id, nextStatus);
                            }}
                            disabled={isUpdating}
                        >
                            <LinearGradient
                                colors={['#22C55E', '#16A34A']}
                                className="px-4 py-2 rounded-xl flex-row items-center"
                            >
                                {isUpdating ? (
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
            </TouchableOpacity>
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

            {/* Order Detail Modal */}
            {selectedOrderId && (
                <OrderDetailModal
                    orderId={selectedOrderId}
                    visible={!!selectedOrderId}
                    onClose={() => setSelectedOrderId(null)}
                />
            )}
        </View>
    );
}
