import { useState, useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native"; // Removed unnecessary Text import, added ActivityIndicator
import { CameraView, useCameraPermissions } from "expo-camera";
import { Text, Button, MD3Colors } from 'react-native-paper'; // Import Paper components

export default function QRScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const isProcessing = useRef(false);
  const [loading, setLoading] = useState(false); // Added loading state

  useEffect(() => {
    (async () => {
      if (!permission) {
        await requestPermission();
      }
    })();
  }, [permission]);

  const extractData = (data) => {
    const registerMatch = data.match(/\/register\/([a-zA-Z0-9_-]+)/);
    const checkinMatch = data.match(/\/checkin\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9]+)/);

    if (registerMatch) {
      return { type: "cid", value: registerMatch[1] };
    } else if (checkinMatch) {
      return { type: "checkin", cid: checkinMatch[1], code: checkinMatch[2] };
    } else {
      return { type: "unknown", value: data };
    }
  };

  const handleScan = ({ data }) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setLoading(true); // Show loading indicator

    const extracted = extractData(data);
    setScanned(true);
    console.log("✅ QR Code ที่สแกนได้:", extracted);

    // Simulate network request (replace with your actual logic)
      setTimeout(() => {
        setLoading(false); // Hide loading indicator
        isProcessing.current = false;

        if (extracted.type === "cid") {
             navigation.navigate("AddClass", { scannedCid: extracted.value });
          // Removed alert and setTimeOut. Navigate Directly.
        } else if (extracted.type === "checkin") {
            navigation.navigate("Checkin", {
                cid: extracted.cid,
                checkinCode: extracted.code,
            });
           // Removed alert and setTimeOut. Navigate Directly.

        } else {
            //Simplified the alert by removing unneccesary onPress function and timeout
          Alert.alert("QR Code ไม่รองรับ", `ข้อมูลที่สแกน: ${extracted.value}`, [
            { text: "OK" },
          ]);
           isProcessing.current = false;
           setScanned(false);
        }
    }, 1000); // Simulate 1-second delay

  };

  if (!permission) {
    return (
      <View style={styles.messageContainer}>
        <Text>กำลังขอสิทธิ์ใช้งานกล้อง...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.messageContainer}>
        <Text>❌ ไม่สามารถเข้าถึงกล้องได้</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={MD3Colors.primary50} />
        </View>
      )}

      {!loading && scanned && ( // Show only when not loading
        <Button
          style={styles.scanAgainButton}
          onPress={() => {
            setScanned(false);
            isProcessing.current = false; // Reset processing flag
          }}
          mode="contained"
          buttonColor={MD3Colors.primary50}
        >
         สแกนอีกครั้ง
        </Button>
      )}

      <Button
        icon="arrow-left"
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        textColor={MD3Colors.primary50} // Changed to text color for better visibility
      >
        กลับ
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center" },
  camera: { flex: 1 },
  messageContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scanAgainButton: {
    position: "absolute",
    bottom: 50,
    left: "25%", // Use percentage for consistent positioning
    width: "50%",
    borderRadius: 10, // Removed padding, using button's internal padding
  },

  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    // Removed padding and background color, using button's default style
    borderRadius: 5,
  },
  loadingOverlay: { // Style for the loading overlay
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
});