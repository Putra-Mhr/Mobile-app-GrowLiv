import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/lib/api';
import { router } from 'expo-router';
import { PageBackground } from '@/components/PageBackground';

interface DashboardStats {
    totalProducts: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
    pendingRevenue: number;
    store: {
        name: string;
        imageUrl?: string;
    };
}

export default function SellerDashboard() {
    const api = useApi();

    const { data, isLoading, refetch, isRefetching } = useQuery<DashboardStats>({
        queryKey: ['seller-dashboard'],
        queryFn: async () => {
            const response = await api.get('/seller/dashboard');
            return response.data;
        },
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const stats = [
        {
            icon: 'cube',
            label: 'Total Produk',
            value: data?.totalProducts || 0,
            color: '#3B82F6',
            bgColor: '#DBEAFE',
        },
        {
            icon: 'time',
            label: 'Pesanan Pending',
            value: data?.pendingOrders || 0,
            color: '#F59E0B',
            bgColor: '#FEF3C7',
        },
        {
            icon: 'checkmark-circle',
            label: 'Pesanan Selesai',
            value: data?.completedOrders || 0,
            color: '#10B981',
            bgColor: '#D1FAE5',
        },
    ];

    return (
        <View className="flex-1">
            <PageBackground />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
                }
            >
                {/* Store Header */}
                <LinearGradient
                    colors={['#22C55E', '#16A34A']}
                    className="px-5 py-6"
                >
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-white/80 text-sm">Selamat datang,</Text>
                            <Text className="text-white text-2xl font-bold">
                                {data?.store?.name || 'Toko Anda'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            className="bg-white/20 p-2 rounded-xl"
                            onPress={() => router.push('/seller/settings')}
                        >
                            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Revenue Cards */}
                <View className="mx-5 -mt-4 flex-row gap-3">
                    {/* Completed Revenue */}
                    <View className="flex-1">
                        <LinearGradient
                            colors={['#FFFFFF', '#F9FAFB']}
                            className="rounded-2xl p-4 shadow-sm border border-gray-100"
                        >
                            <View className="flex-row items-center mb-1">
                                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                                <Text className="text-gray-500 ml-1 text-xs">Sudah Dicairkan</Text>
                            </View>
                            <Text className="text-xl font-bold text-green-600">
                                {formatCurrency(data?.totalRevenue || 0)}
                            </Text>
                        </LinearGradient>
                    </View>

                    {/* Pending Revenue */}
                    <View className="flex-1">
                        <LinearGradient
                            colors={['#FFF7ED', '#FFEDD5']}
                            className="rounded-2xl p-4 shadow-sm border border-orange-100"
                        >
                            <View className="flex-row items-center mb-1">
                                <Ionicons name="time" size={16} color="#F59E0B" />
                                <Text className="text-gray-500 ml-1 text-xs">Menunggu Cair</Text>
                            </View>
                            <Text className="text-xl font-bold text-orange-600">
                                {formatCurrency(data?.pendingRevenue || 0)}
                            </Text>
                        </LinearGradient>
                    </View>
                </View>

                {/* Stats Grid */}
                <View className="flex-row flex-wrap px-5 mt-4 gap-3">
                    {stats.map((stat, index) => (
                        <View
                            key={index}
                            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                            style={{ width: '31%' }}
                        >
                            <View
                                className="w-10 h-10 rounded-xl items-center justify-center mb-2"
                                style={{ backgroundColor: stat.bgColor }}
                            >
                                <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                            </View>
                            <Text className="text-2xl font-bold text-gray-800">{stat.value}</Text>
                            <Text className="text-gray-500 text-xs">{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Quick Actions */}
                <View className="px-5 mt-6">
                    <Text className="text-gray-800 font-bold text-lg mb-3">Aksi Cepat</Text>

                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                            onPress={() => router.push('/(seller)/add-product')}
                        >
                            <LinearGradient
                                colors={['#DCFCE7', '#BBF7D0']}
                                className="w-12 h-12 rounded-xl items-center justify-center mb-3"
                            >
                                <Ionicons name="add-circle" size={24} color="#16A34A" />
                            </LinearGradient>
                            <Text className="text-gray-800 font-semibold">Tambah Produk</Text>
                            <Text className="text-gray-500 text-xs">Upload produk baru</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                            onPress={() => router.push('/(seller)/orders')}
                        >
                            <LinearGradient
                                colors={['#FEF3C7', '#FDE68A']}
                                className="w-12 h-12 rounded-xl items-center justify-center mb-3"
                            >
                                <Ionicons name="clipboard" size={24} color="#D97706" />
                            </LinearGradient>
                            <Text className="text-gray-800 font-semibold">Kelola Pesanan</Text>
                            <Text className="text-gray-500 text-xs">Lihat & proses pesanan</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Back to Buyer Mode */}
                <View className="px-5 mt-6">
                    <TouchableOpacity
                        className="bg-gray-100 rounded-2xl py-4 flex-row items-center justify-center"
                        onPress={() => router.replace('/(tabs)')}
                    >
                        <Ionicons name="arrow-back" size={20} color="#6B7280" />
                        <Text className="text-gray-600 font-medium ml-2">Kembali ke Mode Pembeli</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
