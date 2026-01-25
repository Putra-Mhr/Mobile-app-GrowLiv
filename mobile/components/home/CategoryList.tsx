import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Category {
    name: string;
    label: string;
    icon: string;
    color: string;
    bgColor: string;
}

interface CategoryListProps {
    categories: Category[];
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
}

const CategoryList = ({ categories, selectedCategory, onSelectCategory }: CategoryListProps) => {
    return (
        <View className="bg-white rounded-t-3xl pt-6 pb-4 shadow-sm">
            <View className="px-5 flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                    <Ionicons name="leaf" size={20} color="#22C55E" />
                    <Text className="text-gray-800 text-lg font-bold ml-2">Kategori</Text>
                </View>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
                {categories.map((category) => {
                    const isSelected = selectedCategory === category.name;
                    return (
                        <TouchableOpacity
                            key={category.name}
                            className="items-center"
                            style={{ width: 70 }}
                            onPress={() => onSelectCategory(category.name)}
                        >
                            <View
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 28,
                                    backgroundColor: isSelected ? category.color : category.bgColor,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    marginBottom: 8,
                                    borderWidth: isSelected ? 3 : 0,
                                    borderColor: "#ffffff",
                                    shadowColor: isSelected ? category.color : "transparent",
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: isSelected ? 0.3 : 0,
                                    shadowRadius: 4,
                                    elevation: isSelected ? 4 : 0,
                                }}
                            >
                                <Ionicons
                                    name={category.icon as any}
                                    size={24}
                                    color={isSelected ? "#FFF" : category.color}
                                />
                            </View>
                            <Text
                                className={`text-xs text-center ${isSelected ? "font-bold text-green-600" : "text-gray-600"}`}
                                numberOfLines={1}
                            >
                                {category.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

export default CategoryList;
