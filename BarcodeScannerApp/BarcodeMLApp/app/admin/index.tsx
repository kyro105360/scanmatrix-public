import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import adminStyles from "../../assets/styles/AdminPortal.styles";

export default function AdminPortal() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [fromDateTime, setFromDateTime] = useState<Date | null>(null);
  const [toDateTime, setToDateTime] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchUserAndRecords = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email ?? null);

      try {
        let query = supabase
          .from("barcodes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (fromDateTime) query = query.gte("created_at", fromDateTime.toISOString());
        if (toDateTime) query = query.lte("created_at", toDateTime.toISOString());

        const { data: barcodesData, error: barcodesError } = await query;
        if (barcodesError) throw barcodesError;

        const decodedBarcodes = barcodesData
          ?.map((b: any) => String(b.decoded_barcode).trim())
          .filter(Boolean);

        let barcodeIdData: any[] = [];

        if (decodedBarcodes && decodedBarcodes.length > 0) {
          const { data, error } = await supabase
            .from("barcode_id")
            .select("*")
            .in("decoded_barcode", decodedBarcodes);

          if (error) throw error;
          barcodeIdData = data || [];
        }

        const mergedRecords = (barcodesData || []).map((b: any) => {
          const barcodeStr = String(b.decoded_barcode).trim();
          const match = barcodeIdData.find(
            (bd: any) => String(bd.decoded_barcode).trim() === barcodeStr
          );

          return {
            ...b,
            mailing_address: match?.mailing_address || "",
            phone: match?.phone_number || "",
            physical_address: match?.physical_address || "",
            notes: match?.notes || "",
          };
        });

        setRecords(mergedRecords);
      } catch (e: any) {
        Alert.alert("Error", e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndRecords();
  }, [fromDateTime, toDateTime]);

  const updateField = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from("barcodes").update({ [field]: value }).eq("id", id);
    if (error) return;

    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );

    if (field === "decoded_barcode") {
      const barcodeStr = String(value).trim();
      const { data, error: barcodeDataError } = await supabase
        .from("barcode_id")
        .select("*")
        .eq("decoded_barcode", barcodeStr)
        .single();

      if (barcodeDataError || !data) return;

      setRecords((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                mailing_address: data?.mailing_address || "",
                phone: data?.phone_number || "",
                physical_address: data?.physical_address || "",
                notes: data?.notes || "",
              }
            : r
        )
      );
    }
  };

  const sendEmail = async (item: any) => {
    if (!item.email) return Alert.alert("No Email", "Please add an email address first");

    const subject = "Your Package Has Been Received";
    const body = `Dear Customer,

Your package has been received and processed.

Delivery Details:
${item.physical_address ? `Address: ${item.physical_address}` : "Address: Not specified"}
${item.notes ? `Package Notes: ${item.notes}` : ""}

Scanned on: ${new Date(item.created_at).toLocaleString()}

Thank you for using our service.

Best regards,
Package Management Team`;

    try {
      await Linking.openURL(
        `mailto:${item.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      );
    } catch {
      Alert.alert("Error", "Could not open email client");
    }
  };

  const sendText = async (item: any) => {
    if (!item.phone) return Alert.alert("No Phone", "Please add a phone number first");

    const message = `Your package has been received! ${
      item.physical_address ? `Delivery to: ${item.physical_address}` : ""
    } ${item.notes ? `Notes: ${item.notes}` : ""} Scanned: ${new Date(
      item.created_at
    ).toLocaleString()}`;
    try {
      await Linking.openURL(`sms:${item.phone}?body=${encodeURIComponent(message)}`);
    } catch {
      Alert.alert("Error", "Could not open SMS client");
    }
  };

  const Avatar = ({ email }: { email: string }) => {
    const letter = email.charAt(0).toUpperCase();
    return (
      <View style={adminStyles.avatar}>
        <Text style={adminStyles.avatarText}>{letter}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={adminStyles.card}>
      {item.image_url && <Image source={{ uri: item.image_url }} style={adminStyles.barcodeImage} />}
      <Text style={adminStyles.timestamp}>Scanned: {new Date(item.created_at).toLocaleString()}</Text>

      <TextInput
        style={adminStyles.input}
        placeholder="Email Address"
        placeholderTextColor="rgba(255,255,255,0.5)"
        value={item.email || ""}
        onChangeText={(v) => updateField(item.id, "email", v)}
      />
      <TextInput
        style={adminStyles.input}
        placeholder="Mailing Address"
        placeholderTextColor="rgba(255,255,255,0.5)"
        value={item.mailing_address || ""}
        onChangeText={(v) => updateField(item.id, "mailing_address", v)}
      />
      <TextInput
        style={adminStyles.input}
        placeholder="Phone Number"
        placeholderTextColor="rgba(255,255,255,0.5)"
        value={item.phone || ""}
        onChangeText={(v) => updateField(item.id, "phone", v)}
      />
      <TextInput
        style={adminStyles.input}
        placeholder="Physical Address"
        placeholderTextColor="rgba(255,255,255,0.5)"
        value={item.physical_address || ""}
        onChangeText={(v) => updateField(item.id, "physical_address", v)}
      />
      <TextInput
        style={[adminStyles.input, { height: 80 }]}
        multiline
        placeholder="Notes"
        placeholderTextColor="rgba(255,255,255,0.5)"
        value={item.notes || ""}
        onChangeText={(v) => updateField(item.id, "notes", v)}
      />
      <TextInput
        style={adminStyles.input}
        placeholder="Barcode"
        placeholderTextColor="rgba(255,255,255,0.5)"
        value={item.decoded_barcode || ""}
        onChangeText={(v) => updateField(item.id, "decoded_barcode", v)}
      />

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
        <TouchableOpacity style={adminStyles.actionButton} onPress={() => sendEmail(item)}>
          <Text style={adminStyles.actionButtonText}>Send Email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={adminStyles.actionButton} onPress={() => sendText(item)}>
          <Text style={adminStyles.actionButtonText}>Send Text</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={adminStyles.container}>
      <View style={adminStyles.topBar}>
        <View style={adminStyles.titleContainer}>
          <Text style={adminStyles.title}>Scanned Barcodes</Text>
          <Text style={adminStyles.subtitle}>Manage all scanned records</Text>
        </View>
        <TouchableOpacity onPress={() => setShowSidebar(true)} style={adminStyles.menuButton}>
          <Text style={adminStyles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      <View style={adminStyles.filtersContainer}>
        <TouchableOpacity onPress={() => setShowFromPicker(true)} style={adminStyles.filterButton}>
          <Text style={adminStyles.filterButtonText}>
            {fromDateTime ? `From: ${fromDateTime.toLocaleDateString()}` : "Select From"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowToPicker(true)} style={adminStyles.filterButton}>
          <Text style={adminStyles.filterButtonText}>
            {toDateTime ? `To: ${toDateTime.toLocaleDateString()}` : "Select To"}
          </Text>
        </TouchableOpacity>
      </View>

      {showFromPicker && (
        <DateTimePicker
          value={fromDateTime || new Date()}
          mode="datetime"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, date) => {
            setShowFromPicker(false);
            if (date) setFromDateTime(date);
          }}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={toDateTime || new Date()}
          mode="datetime"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, date) => {
            setShowToPicker(false);
            if (date) setToDateTime(date);
          }}
        />
      )}

      {showSidebar && (
        <View style={adminStyles.sidebarOverlay}>
          <TouchableOpacity
            testID="sidebar-background"
            style={adminStyles.sidebarBackground}
            onPress={() => setShowSidebar(false)}
          />
          <View style={adminStyles.sidebar}>
            <View style={adminStyles.sidebarHeader}>
              {userEmail && <Avatar email={userEmail} />}
              <Text style={adminStyles.sidebarUserEmail}>{userEmail}</Text>
            </View>
            <TouchableOpacity
              style={adminStyles.sidebarItem}
              onPress={() => {
                setShowSidebar(false);
                router.push("/authenticated");
              }}
            >
              <Text style={adminStyles.sidebarItemText}> ⛶ Barcode Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={adminStyles.sidebarItem}
              onPress={async () => {
                setShowSidebar(false);
                await supabase.auth.signOut();
                router.push("/(login)");
              }}
            >
              <Text style={[adminStyles.sidebarItemText, { color: "#ff6b6b" }]}>↗ Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={records}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        ListEmptyComponent={!loading ? <Text style={adminStyles.empty}>No records found.</Text> : null}
      />
    </View>
  );
}
