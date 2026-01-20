import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { SimpleMapPicker } from "./SimpleMapPicker";

interface AddressFormData {
  label: string;
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isDefault: boolean;
}

interface AddressFormModalProps {
  visible: boolean;
  isEditing: boolean;
  addressForm: AddressFormData;
  isAddingAddress: boolean;
  isUpdatingAddress: boolean;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (form: AddressFormData) => void;
}

const AddressFormModal = ({
  addressForm,
  isAddingAddress,
  isEditing,
  isUpdatingAddress,
  onClose,
  onFormChange,
  onSave,
  visible,
}: AddressFormModalProps) => {
  const [showMapPicker, setShowMapPicker] = useState(false);

  const handleLocationSelect = (coords: { latitude: number; longitude: number }) => {
    onFormChange({
      ...addressForm,
      coordinates: coords,
    });
    setShowMapPicker(false);
  };

  if (showMapPicker) {
    return (
      <Modal visible={visible} animationType="slide">
        <SimpleMapPicker
          initialCoordinates={addressForm.coordinates}
          onLocationSelect={handleLocationSelect}
          onCancel={() => setShowMapPicker(false)}
        />
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 bg-gray-50">
          {/* HEADER */}
          <LinearGradient
            colors={["#22C55E", "#16A34A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <TouchableOpacity onPress={onClose} className="bg-white/20 p-2 rounded-xl mr-3">
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <View>
                  <Text className="text-white text-xl font-bold">
                    {isEditing ? "Edit Alamat" : "Tambah Alamat"}
                  </Text>
                  <Text className="text-white/70 text-sm">
                    {isEditing ? "Perbarui detail alamat" : "Isi detail alamat baru"}
                  </Text>
                </View>
              </View>
              <View className="bg-white/20 p-2 rounded-xl">
                <Ionicons name="location" size={22} color="#FFFFFF" />
              </View>
            </View>
          </LinearGradient>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="p-5">
              {/* LABEL INPUT */}
              <View className="mb-4">
                <Text className="text-gray-700 font-semibold mb-2">Label</Text>
                <TextInput
                  className="bg-white border border-gray-200 text-gray-800 p-4 rounded-xl text-base"
                  placeholder="contoh: Rumah, Kantor"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.label}
                  onChangeText={(text) => onFormChange({ ...addressForm, label: text })}
                />
              </View>

              {/* NAME INPUT */}
              <View className="mb-4">
                <Text className="text-gray-700 font-semibold mb-2">Nama Lengkap</Text>
                <TextInput
                  className="bg-white border border-gray-200 text-gray-800 px-4 py-4 rounded-xl text-base"
                  placeholder="Masukkan nama lengkap"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.fullName}
                  onChangeText={(text) => onFormChange({ ...addressForm, fullName: text })}
                />
              </View>

              {/* Address Input */}
              <View className="mb-4">
                <Text className="text-gray-700 font-semibold mb-2">Alamat Lengkap</Text>
                <TextInput
                  className="bg-white border border-gray-200 text-gray-800 px-4 py-4 rounded-xl text-base"
                  placeholder="Nama jalan, nomor rumah, RT/RW"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.streetAddress}
                  onChangeText={(text) => onFormChange({ ...addressForm, streetAddress: text })}
                  multiline
                />
              </View>

              {/* City Input */}
              <View className="mb-4">
                <Text className="text-gray-700 font-semibold mb-2">Kota</Text>
                <TextInput
                  className="bg-white border border-gray-200 text-gray-800 px-4 py-4 rounded-xl text-base"
                  placeholder="contoh: Jakarta Selatan"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.city}
                  onChangeText={(text) => onFormChange({ ...addressForm, city: text })}
                />
              </View>

              {/* State Input */}
              <View className="mb-4">
                <Text className="text-gray-700 font-semibold mb-2">Provinsi</Text>
                <TextInput
                  className="bg-white border border-gray-200 text-gray-800 px-4 py-4 rounded-xl text-base"
                  placeholder="contoh: DKI Jakarta"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.state}
                  onChangeText={(text) => onFormChange({ ...addressForm, state: text })}
                />
              </View>

              {/* ZIP Code Input */}
              <View className="mb-4">
                <Text className="text-gray-700 font-semibold mb-2">Kode Pos</Text>
                <TextInput
                  className="bg-white border border-gray-200 text-gray-800 px-4 py-4 rounded-xl text-base"
                  placeholder="contoh: 12345"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.zipCode}
                  onChangeText={(text) => onFormChange({ ...addressForm, zipCode: text })}
                  keyboardType="numeric"
                />
              </View>

              {/* Map Location Picker */}
              <View className="mb-4">
                <Text className="text-gray-700 font-semibold mb-2">📍 Lokasi (untuk ongkir)</Text>
                <TouchableOpacity
                  className="bg-white border border-gray-200 p-4 rounded-xl flex-row items-center justify-between"
                  onPress={() => setShowMapPicker(true)}
                >
                  <View className="flex-1">
                    {addressForm.coordinates ? (
                      <>
                        <Text className="text-gray-800 font-semibold">✓ Lokasi sudah dipilih</Text>
                        <Text className="text-gray-500 text-sm">
                          Lat: {addressForm.coordinates.latitude.toFixed(4)}, Lng:{" "}
                          {addressForm.coordinates.longitude.toFixed(4)}
                        </Text>
                      </>
                    ) : (
                      <Text className="text-gray-400">Tap untuk pilih lokasi di peta</Text>
                    )}
                  </View>
                  <Ionicons name="map" size={24} color="#22C55E" />
                </TouchableOpacity>
              </View>

              {/* Phone Input */}
              <View className="mb-4">
                <Text className="text-gray-700 font-semibold mb-2">Nomor Telepon</Text>
                <TextInput
                  className="bg-white border border-gray-200 text-gray-800 px-4 py-4 rounded-xl text-base"
                  placeholder="+62 812 3456 7890"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.phoneNumber}
                  onChangeText={(text) => onFormChange({ ...addressForm, phoneNumber: text })}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Default Address Toggle */}
              <View className="bg-white border border-gray-200 rounded-xl p-4 flex-row items-center justify-between mb-6">
                <View className="flex-row items-center">
                  <View className="bg-green-100 p-2 rounded-lg mr-3">
                    <Ionicons name="star" size={18} color="#22C55E" />
                  </View>
                  <Text className="text-gray-800 font-semibold">Jadikan alamat utama</Text>
                </View>
                <Switch
                  value={addressForm.isDefault}
                  onValueChange={(value) => onFormChange({ ...addressForm, isDefault: value })}
                  thumbColor="#FFFFFF"
                  trackColor={{ false: "#D1D5DB", true: "#22C55E" }}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                className="overflow-hidden rounded-xl"
                activeOpacity={0.8}
                onPress={onSave}
                disabled={isAddingAddress || isUpdatingAddress}
              >
                <LinearGradient
                  colors={["#22C55E", "#15803D"]}
                  className="py-4 items-center"
                >
                  {isAddingAddress || isUpdatingAddress ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-bold text-lg">
                      {isEditing ? "Simpan Perubahan" : "Tambah Alamat"}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddressFormModal;
