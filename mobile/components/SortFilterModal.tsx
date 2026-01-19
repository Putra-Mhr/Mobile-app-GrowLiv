import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Modal, ScrollView, Text, TouchableOpacity, View, Switch } from "react-native";
import { ShopFilters, SortOption, ViewMode } from "@/hooks/useShopPreferences";

interface SortFilterModalProps {
    visible: boolean;
    onClose: () => void;
    sortBy: SortOption;
    filters: ShopFilters;
    viewMode: ViewMode;
    onSortChange: (sort: SortOption) => void;
    onFiltersChange: (filters: ShopFilters) => void;
    onViewModeChange: (mode: ViewMode) => void;
    onReset: () => void;
}

const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
    { value: 'default', label: 'Default', icon: 'apps' },
    { value: 'price_asc', label: 'Price: Low to High', icon: 'arrow-up' },
    { value: 'price_desc', label: 'Price: High to Low', icon: 'arrow-down' },
    { value: 'name_asc', label: 'Name: A to Z', icon: 'text' },
    { value: 'name_desc', label: 'Name: Z to A', icon: 'text' },
    { value: 'newest', label: 'Newest First', icon: 'time' },
];

export default function SortFilterModal({
    visible,
    onClose,
    sortBy,
    filters,
    viewMode,
    onSortChange,
    onFiltersChange,
    onViewModeChange,
    onReset,
}: SortFilterModalProps) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl max-h-[85%]">
                    {/* Header */}
                    <LinearGradient
                        colors={["#0D9488", "#059669"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="px-6 py-5 rounded-t-3xl"
                    >
                        <View className="flex-row items-center justify-between">
                            <Text className="text-white text-xl font-bold">Sort & Filter</Text>
                            <TouchableOpacity onPress={onClose} className="bg-white/20 p-2 rounded-full">
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
                        {/* View Mode Section */}
                        <View className="mb-6">
                            <Text className="text-gray-800 font-bold text-lg mb-3">
                                <Ionicons name="grid" size={18} color="#0D9488" /> View Mode
                            </Text>
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border-2 ${viewMode === 'grid' ? 'border-teal-600 bg-teal-50' : 'border-gray-200 bg-white'
                                        }`}
                                    onPress={() => onViewModeChange('grid')}
                                >
                                    <Ionicons
                                        name="grid-outline"
                                        size={20}
                                        color={viewMode === 'grid' ? '#0D9488' : '#6B7280'}
                                    />
                                    <Text className={`ml-2 font-semibold ${viewMode === 'grid' ? 'text-teal-600' : 'text-gray-500'}`}>
                                        Grid
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border-2 ${viewMode === 'list' ? 'border-teal-600 bg-teal-50' : 'border-gray-200 bg-white'
                                        }`}
                                    onPress={() => onViewModeChange('list')}
                                >
                                    <Ionicons
                                        name="list-outline"
                                        size={20}
                                        color={viewMode === 'list' ? '#0D9488' : '#6B7280'}
                                    />
                                    <Text className={`ml-2 font-semibold ${viewMode === 'list' ? 'text-teal-600' : 'text-gray-500'}`}>
                                        List
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Sort Section */}
                        <View className="mb-6">
                            <Text className="text-gray-800 font-bold text-lg mb-3">
                                <Ionicons name="swap-vertical" size={18} color="#0D9488" /> Sort By
                            </Text>
                            <View className="gap-2">
                                {SORT_OPTIONS.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        className={`flex-row items-center px-4 py-3 rounded-xl ${sortBy === option.value ? 'bg-teal-50 border-2 border-teal-600' : 'bg-gray-50 border-2 border-transparent'
                                            }`}
                                        onPress={() => onSortChange(option.value)}
                                    >
                                        <View className={`w-8 h-8 rounded-full items-center justify-center ${sortBy === option.value ? 'bg-teal-600' : 'bg-gray-200'
                                            }`}>
                                            <Ionicons
                                                name={option.icon as any}
                                                size={16}
                                                color={sortBy === option.value ? '#FFFFFF' : '#6B7280'}
                                            />
                                        </View>
                                        <Text className={`ml-3 font-medium ${sortBy === option.value ? 'text-teal-600' : 'text-gray-700'
                                            }`}>
                                            {option.label}
                                        </Text>
                                        {sortBy === option.value && (
                                            <Ionicons name="checkmark-circle" size={20} color="#0D9488" className="ml-auto" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Filters Section */}
                        <View className="mb-6">
                            <Text className="text-gray-800 font-bold text-lg mb-3">
                                <Ionicons name="funnel" size={18} color="#0D9488" /> Filters
                            </Text>

                            {/* In Stock Only Toggle */}
                            <View className="flex-row items-center justify-between bg-gray-50 px-4 py-4 rounded-xl">
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                                        <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                                    </View>
                                    <View>
                                        <Text className="text-gray-800 font-semibold">In Stock Only</Text>
                                        <Text className="text-gray-500 text-sm">Hide out of stock items</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={filters.inStockOnly}
                                    onValueChange={(value) => onFiltersChange({ ...filters, inStockOnly: value })}
                                    trackColor={{ false: '#E5E7EB', true: '#0D9488' }}
                                    thumbColor={filters.inStockOnly ? '#FFFFFF' : '#F3F4F6'}
                                />
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View className="flex-row gap-3 pb-8">
                            <TouchableOpacity
                                className="flex-1 py-4 rounded-xl border-2 border-gray-300"
                                onPress={onReset}
                            >
                                <Text className="text-gray-600 font-bold text-center">Reset All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 overflow-hidden rounded-xl"
                                onPress={onClose}
                            >
                                <LinearGradient
                                    colors={["#0D9488", "#059669"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="py-4"
                                >
                                    <Text className="text-white font-bold text-center">Apply</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
