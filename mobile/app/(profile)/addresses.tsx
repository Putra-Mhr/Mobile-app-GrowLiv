import AddressCard from "@/components/AddressCard";
import AddressFormModal from "@/components/AddressFormModal";
import { useAddresses } from "@/hooks/useAddresses";
import { Address } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useNotification } from "@/context/NotificationContext";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

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

function AddressesScreen() {
  const {
    addAddress,
    addresses,
    deleteAddress,
    isAddingAddress,
    isDeletingAddress,
    isError,
    isLoading,
    isUpdatingAddress,
    updateAddress,
  } = useAddresses();
  const { showToast, showConfirmation } = useNotification();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    label: "",
    fullName: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    phoneNumber: "",
    coordinates: undefined,
    isDefault: false,
  });

  const handleAddAddress = () => {
    setShowAddressForm(true);
    setEditingAddressId(null);
    setAddressForm({
      label: "",
      fullName: "",
      streetAddress: "",
      city: "",
      state: "",
      zipCode: "",
      phoneNumber: "",
      coordinates: undefined,
      isDefault: false,
    });
  };

  const handleEditAddress = (address: Address) => {
    setShowAddressForm(true);
    setEditingAddressId(address._id);
    setAddressForm({
      label: address.label,
      fullName: address.fullName,
      streetAddress: address.streetAddress,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      phoneNumber: address.phoneNumber,
      coordinates: address.coordinates,
      isDefault: address.isDefault,
    });
  };

  const handleDeleteAddress = (addressId: string, label: string) => {
    showConfirmation({
      title: 'Hapus Alamat',
      message: `Yakin ingin menghapus "${label}"?`,
      type: 'danger',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      onConfirm: () => deleteAddress(addressId),
    });
  };

  const handleSaveAddress = () => {
    if (
      !addressForm.label ||
      !addressForm.fullName ||
      !addressForm.streetAddress ||
      !addressForm.city ||
      !addressForm.state ||
      !addressForm.zipCode ||
      !addressForm.phoneNumber
    ) {
      showToast('error', 'Data Belum Lengkap', 'Mohon isi semua field');
      return;
    }

    // Warn if no coordinates (optional but recommended)
    if (!addressForm.coordinates?.latitude || !addressForm.coordinates?.longitude) {
      showToast(
        'warning',
        'Lokasi Belum Dipilih',
        'Mohon pilih lokasi di peta untuk menghitung ongkir yang akurat'
      );
      return;
    }



    if (editingAddressId) {
      updateAddress(
        {
          addressId: editingAddressId,
          addressData: addressForm,
        },
        {
          onSuccess: () => {
            setShowAddressForm(false);
            setEditingAddressId(null);
            showToast('success', 'Berhasil! ✓', 'Alamat berhasil diperbarui');
          },
          onError: (error: any) => {
            showToast('error', 'Gagal', error?.response?.data?.error || 'Gagal memperbarui alamat');
          },
        }
      );
    } else {
      addAddress(addressForm, {
        onSuccess: () => {
          setShowAddressForm(false);
          showToast('success', 'Berhasil! ✓', 'Alamat baru berhasil ditambahkan');
        },
        onError: (error: any) => {
          showToast('error', 'Gagal', error?.response?.data?.error || 'Gagal menambah alamat');
        },
      });
    }
  };

  const handleCloseAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
  };

  if (isLoading) return <LoadingUI />;
  if (isError) return <ErrorUI />;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={["#22C55E", "#16A34A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white/20 p-2 rounded-xl mr-3"
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Alamat Saya</Text>
            <Text className="text-white/70 text-sm">
              {addresses.length} alamat tersimpan
            </Text>
          </View>
          <View className="bg-white/20 p-2 rounded-xl">
            <Ionicons name="location" size={22} color="#FFFFFF" />
          </View>
        </View>
      </LinearGradient>

      {addresses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="relative mb-6">
            <View className="bg-amber-50 p-8 rounded-full">
              <Ionicons name="location-outline" size={64} color="#F59E0B" />
            </View>
            <View className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-sm">
              <Ionicons name="leaf" size={24} color="#22C55E" />
            </View>
          </View>
          <Text className="text-gray-800 font-bold text-xl">Belum Ada Alamat</Text>
          <Text className="text-gray-500 text-center mt-2 mb-6">
            Tambahkan alamat pengiriman untuk menerima pesanan Anda
          </Text>
          <TouchableOpacity
            className="overflow-hidden rounded-xl"
            activeOpacity={0.8}
            onPress={handleAddAddress}
          >
            <LinearGradient
              colors={["#22C55E", "#15803D"]}
              className="px-6 py-3 flex-row items-center"
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text className="text-white font-bold ml-2">Tambah Alamat</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="px-5 py-4">
            {addresses.map((address: Address) => (
              <AddressCard
                key={address._id}
                address={address}
                onEdit={handleEditAddress}
                onDelete={handleDeleteAddress}
                isUpdatingAddress={isUpdatingAddress}
                isDeletingAddress={isDeletingAddress}
              />
            ))}

            <TouchableOpacity
              className="overflow-hidden rounded-2xl mt-2"
              activeOpacity={0.8}
              onPress={handleAddAddress}
            >
              <LinearGradient
                colors={["#22C55E", "#15803D"]}
                className="py-4 flex-row items-center justify-center"
              >
                <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
                <Text className="text-white font-bold text-base ml-2">Tambah Alamat Baru</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <AddressFormModal
        visible={showAddressForm}
        isEditing={!!editingAddressId}
        addressForm={addressForm}
        isAddingAddress={isAddingAddress}
        isUpdatingAddress={isUpdatingAddress}
        onClose={handleCloseAddressForm}
        onSave={handleSaveAddress}
        onFormChange={setAddressForm}
      />
    </View>
  );
}
export default AddressesScreen;

function ErrorUI() {
  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient
        colors={["#22C55E", "#16A34A"]}
        style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="bg-white/20 p-2 rounded-xl mr-3">
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Alamat Saya</Text>
        </View>
      </LinearGradient>
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-red-50 p-6 rounded-full mb-4">
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        </View>
        <Text className="text-gray-800 font-bold text-xl">Gagal Memuat</Text>
        <Text className="text-gray-500 text-center mt-2">
          Periksa koneksi internet Anda
        </Text>
      </View>
    </View>
  );
}

function LoadingUI() {
  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient
        colors={["#22C55E", "#16A34A"]}
        style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="bg-white/20 p-2 rounded-xl mr-3">
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Alamat Saya</Text>
        </View>
      </LinearGradient>
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-gray-500 mt-4">Memuat alamat...</Text>
      </View>
    </View>
  );
}
