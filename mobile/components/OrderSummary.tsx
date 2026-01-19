import { View, Text } from "react-native";

interface OrderSummaryProps {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export default function OrderSummary({ subtotal, shipping, tax, total }: OrderSummaryProps) {
  return (
    <View className="px-5 mt-6">
      <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <Text className="text-gray-800 text-lg font-bold mb-4">Ringkasan Pesanan</Text>

        <View className="gap-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-500 text-base">Subtotal</Text>
            <Text className="text-gray-800 font-semibold text-base">
              Rp {subtotal.toLocaleString("id-ID")}
            </Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-gray-500 text-base">Ongkos Kirim</Text>
            <Text className="text-gray-800 font-semibold text-base">
              Rp {shipping.toLocaleString("id-ID")}
            </Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-gray-500 text-base">Pajak (8%)</Text>
            <Text className="text-gray-800 font-semibold text-base">
              Rp {Math.round(tax).toLocaleString("id-ID")}
            </Text>
          </View>

          {/* Divider */}
          <View className="border-t border-gray-200 pt-3 mt-1" />

          {/* Total */}
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-800 font-bold text-lg">Total</Text>
            <Text className="text-green-600 font-bold text-2xl">
              Rp {Math.round(total).toLocaleString("id-ID")}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
