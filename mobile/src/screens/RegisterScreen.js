import React, { useState } from "react";
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native"; // Import StyleSheet, SafeAreaView, and TouchableOpacity
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { TextInput, Button, Text, MD3Colors, HelperText } from 'react-native-paper'; // Import Paper components

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(''); // State for name validation
  const [emailError, setEmailError] = useState(''); // State for email validation
  const [passwordError, setPasswordError] = useState(''); // State for password validation


  const handleRegister = async () => {
    // Reset errors
    setNameError('');
    setEmailError('');
    setPasswordError('');

    // Basic validation
    let hasError = false;
    if (!name) {
      setNameError('กรุณากรอกชื่อ-สกุล');
      hasError = true;
    }
    if (!email) {
      setEmailError('กรุณากรอกอีเมล');
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('อีเมลไม่ถูกต้อง');
      hasError = true;
    }
    if (!password) {
      setPasswordError('กรุณากรอกรหัสผ่าน');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      hasError = true;
    }

    if (hasError) return; // Stop if there are any validation errors

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), { name, email, photo: "", classroom: {} });
      // Alert.alert("สมัครสมาชิกสำเร็จ!"); // Remove alert, navigate directly
      navigation.replace("Home");
    } catch (error) {
        // Improved error handling
        if (error.code === 'auth/email-already-in-use') {
            Alert.alert("สมัครสมาชิกไม่สำเร็จ", "อีเมลนี้ถูกใช้ไปแล้ว");
        } else if (error.code === 'auth/invalid-email') {
           Alert.alert("สมัครสมาชิกไม่สำเร็จ", "รูปแบบอีเมลไม่ถูกต้อง");
        } else if (error.code === 'auth/weak-password') {
            Alert.alert("สมัครสมาชิกไม่สำเร็จ", "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
        }
        else {
            Alert.alert("สมัครสมาชิกไม่สำเร็จ", error.message);
        }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>สมัครสมาชิก</Text>

        <TextInput
          label="ชื่อ-สกุล"
          value={name}
          onChangeText={setName}
          style={styles.input}
          mode="outlined"
          error={!!nameError}
        />
        <HelperText type="error" visible={!!nameError}>
            {nameError}
        </HelperText>

        <TextInput
          label="อีเมล"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          style={styles.input}
          mode="outlined"
          error={!!emailError}
        />
        <HelperText type="error" visible={!!emailError}>
            {emailError}
        </HelperText>

        <TextInput
          label="รหัสผ่าน"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          mode="outlined"
          error={!!passwordError}
        />
        <HelperText type="error" visible={!!passwordError}>
           {passwordError}
        </HelperText>

        <Button mode="contained" onPress={handleRegister} style={styles.button}>
          สมัครสมาชิก
        </Button>

        <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.loginLink}>
          <Text style={styles.loginText}>เข้าสู่ระบบ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
    color: MD3Colors.primary50,
  },
  input: {
    marginBottom: 5,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 15,
    backgroundColor: MD3Colors.primary50,
  },
  loginLink: {
    marginTop: 15,
    alignItems: 'center',
  },
  loginText: {
    color: MD3Colors.primary50,
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;