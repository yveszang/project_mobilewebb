import React, { useState, useEffect } from "react";
import { View, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from "react-native";
import { Button, Text, MD3Colors, TextInput, HelperText } from 'react-native-paper';
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native"; // Import useNavigation


const JoinClass = ({ route }) => {
  const { cid } = route.params;
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState(null);
  const [isJoining, setIsJoining] = useState(false); // State for joining process
  const navigation = useNavigation();
    const [stdid, setStdid] = useState("");
    const [name, setName] = useState("");
    const [stdIdError, setStdIdError] = useState('');
    const [nameError, setNameError] = useState('');

  useEffect(() => {
    const fetchClassInfo = async () => {
      if (!cid) {
        Alert.alert("Error", "No class ID provided.");
        navigation.goBack(); // Go back if no cid
        return;
      }

      try {
        const classRef = doc(db, "classroom", cid);
        const classSnap = await getDoc(classRef);

        if (classSnap.exists()) {
          setClassInfo(classSnap.data());
        } else {
          Alert.alert("Error", "Class not found.");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error fetching class info:", error);
        Alert.alert("Error", "Failed to fetch class information.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchClassInfo();
  }, [cid, navigation]);

  const handleJoinClass = async () => {
      // Reset errors
      setNameError('');
      setStdIdError('');
      //Basic Validation
      let hasError = false;
      if(!stdid) {
          setStdIdError("กรุณากรอกรหัสนักศึกษา");
          hasError = true;
      }
      if(!name){
          setNameError("กรุณากรอก ชื่อ - นามสกุล");
          hasError = true;
      }

      if(hasError) return;

      setIsJoining(true);
      try {
          const user = auth.currentUser;
          if (!user) {
              Alert.alert("Error", "User not logged in. Please log in to join a class.");
              navigation.navigate("Login"); // Redirect to login
              return;
          }

          // Check if user is already in the classroom
          const userClassroomRef = doc(db, `users/${user.uid}/classroom`, cid);
          const userClassroomSnap = await getDoc(userClassroomRef);

           if (userClassroomSnap.exists()) {
                Alert.alert("Info", "You are already in this class.");
                navigation.navigate("Home"); // Navigate to home.
                return;
            }

          // 1. Add user to the classroom's students collection
          const classroomStudentsRef = doc(db, `classroom/${cid}/students`, user.uid);
          await setDoc(classroomStudentsRef, {
              joinedAt: new Date(),
              uid: user.uid, // Store UID for easier querying later
              name: name,
              stdid: stdid
          });

          // 2. Add the classroom to the user's classroom collection
          await setDoc(userClassroomRef, {
              status: 0, // Assuming 0 means student
              joinedAt: new Date(),
          });


          Alert.alert("Success", "You have successfully joined the class.");
          navigation.navigate("Home");

      } catch (error) {
          console.error("Error joining class:", error);
          Alert.alert("Error", "Failed to join the class. Please try again.");
      } finally {
          setIsJoining(false);
      }
  };


  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={MD3Colors.primary50} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>เข้าร่วมชั้นเรียน</Text>
        <Text style={styles.classCode}>รหัสวิชา: {cid}</Text>

        <TextInput
            label = "รหัสนักศึกษา"
          placeholder="รหัสนักศึกษา"
          value={stdid}
          onChangeText={setStdid}
          style={styles.input}
          mode="outlined"
          keyboardType="numeric"
          error={!!stdIdError}
        />
        <HelperText type="error" visible={!!stdIdError}>
            {stdIdError}
        </HelperText>

        <TextInput
            label="ชื่อ - นามสกุล"
          placeholder="ชื่อ - นามสกุล"
          value={name}
          onChangeText={setName}
          style={styles.input}
          mode="outlined"
          error={!!nameError}
        />
         <HelperText type="error" visible={!!nameError}>
            {nameError}
        </HelperText>

        <Button mode="contained" onPress={handleJoinClass} style={styles.button} loading={isJoining} disabled={isJoining}>
          ยืนยันการเข้าร่วม
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
    color: MD3Colors.primary50,
  },
  classCode: {
    marginBottom: 20,
    textAlign: 'center',
    color: MD3Colors.neutral60,
  },
  input: {
    marginBottom: 5,
     backgroundColor: 'white',
  },
  button: {
    marginTop: 15,
  },
});

export default JoinClass;