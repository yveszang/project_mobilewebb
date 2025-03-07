import React, { useState, useEffect } from "react";
import { View, StyleSheet, SafeAreaView } from "react-native"; // Import StyleSheet and SafeAreaView
import { useFocusEffect } from "@react-navigation/native";
import { TextInput, Button, Text, MD3Colors } from 'react-native-paper'; // Import Paper components

const AddClass = ({ navigation, route }) => {
  const [cid, setCid] = useState("");

  // useFocusEffect to update the cid when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.scannedCid) {
        setCid(route.params.scannedCid);
        // Alert.alert("สแกนสำเร็จ!", `รหัสวิชา: ${route.params.scannedCid}`); // Removed alert
      }
    }, [route.params?.scannedCid]) // Add route.params?.scannedCid as a dependency
  );


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>เข้าร่วมวิชา</Text>
        <TextInput
          label="รหัสวิชา CID"
          placeholder="รหัสวิชา CID"
          value={cid}
          onChangeText={setCid}
          style={styles.input}
          mode="outlined"
          editable={false} // Disable editing
        />

        <Button mode="contained" onPress={() => navigation.navigate("JoinClass", { cid })} style={styles.button}>
          ดำเนินการต่อ
        </Button>

        <Button mode="outlined" onPress={() => navigation.navigate("QRScanner")} style={[styles.button, styles.scanButton]}>
          สแกน QR Code
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Light background
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
     color: MD3Colors.primary50,
  },
  input: {
    marginBottom: 20,
     backgroundColor: 'white',
  },
  button: {
    marginBottom: 10,
  },
    scanButton:{
      borderColor: MD3Colors.primary50,
      backgroundColor: 'white'
    }
});

export default AddClass;