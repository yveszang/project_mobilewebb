import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TouchableOpacity, // Import TouchableOpacity
} from "react-native";
import {
  Provider as PaperProvider,
  Appbar,
  Card,
  Title,
  Paragraph,
  Avatar,
  Button,
  IconButton,
  MD3Colors,
  Text,
} from "react-native-paper";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { MaterialIcons } from "@expo/vector-icons";
import { signOut, onAuthStateChanged } from "firebase/auth";

// Consistent Theme
const theme = {
  colors: {
    primary: "#8e7cc3",   // Lavender (from LoginScreen)
    accent: "#a7d1ab",    // Pastel green (keep original accent)
    surface: "#f0e6ef",  // Light Lavender, almost white (from LoginScreen)
    text: "#4a4161",     // Dark Purple, almost black (from LoginScreen)
    placeholder: 'grey', // Consistent placeholder color
    outline: '#8e7cc3',   // Consistent outline color
  },
};

const HomeScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        fetchUserName(user.uid);
        fetchCourses(user.uid);
      } else {
        setUserEmail("");
        setUserName("");
        setCourses([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserName = async (uid) => {
    // ... (same as before)
    try {
        const userDocRef = doc(db, "users", uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserName(userDocSnap.data().name || userDocSnap.data().email.split('@')[0]);
        } else {
          setUserName(userEmail.split('@')[0]);
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงชื่อผู้ใช้:", error);
        setUserName(userEmail.split('@')[0]);
      }
  };

  const fetchCourses = async (uid) => {
    // ... (same as before, but with updated placeholder URL if needed)
    if (!uid) return;

      setLoading(true);
      try {
        const userClassroomsRef = collection(db, `users/${uid}/classroom`);
        const userClassroomsSnapshot = await getDocs(userClassroomsRef);

        const coursesPromises = userClassroomsSnapshot.docs.map(async (classroomDoc) => {
          const cid = classroomDoc.id;
          const classroomRef = doc(db, `classroom/${cid}`);
          const classroomSnapshot = await getDoc(classroomRef);

          if (classroomSnapshot.exists()) {
            const classroomData = classroomSnapshot.data();
            const photoUrl = classroomData.info?.photo;

            return {
              id: cid,
              courseName: classroomData.info?.name || "วิชาไม่ทราบชื่อ",
              courseCode: classroomData.info?.code || "ไม่มีรหัสวิชา",
              status: classroomDoc.data()?.status ?? "ไม่ทราบสถานะ",
              imageUrl: photoUrl || `https://via.placeholder.com/150/f0e6ef/8e7cc3?text=${getInitials(classroomData.info?.name)}`, // Consistent placeholder
            };
          } else {
              return {
                id: cid,
                courseName: "วิชาไม่ทราบชื่อ",
                courseCode: "ไม่มีรหัสวิชา",
                status: "ไม่ทราบสถานะ",
                imageUrl: `https://via.placeholder.com/150/f0e6ef/8e7cc3?text=UC`, //Consistent placeholder
              }
          }
        });

        const coursesData = await Promise.all(coursesPromises);
        setCourses(coursesData);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลวิชา:", error);
        Alert.alert(
          "เกิดข้อผิดพลาด",
          "ไม่สามารถดึงข้อมูลวิชาได้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณและลองอีกครั้ง"
        );
      } finally {
        setLoading(false);
      }
  };

  const getInitials = (courseName) => {
      if (!courseName) return "UC"; //Default for "Unknown Course"
        const nameParts = courseName.trim().split(/\s+/);
        let initials = (nameParts[0]?.[0] || '') + (nameParts.length > 1 ? nameParts[1]?.[0] || '' : '');
        return initials.toUpperCase();
    }

  const handleSignOut = async () => {
    // ... (same as before)
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการออกจากระบบ:", error);
      Alert.alert("เกิดข้อผิดพลาดในการออกจากระบบ", error.message);
    }
  };

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.Content
            title={`ยินดีต้อนรับ, ${userName || "ผู้ใช้"}`}
            titleStyle={{ color: theme.colors.text, fontWeight: 'bold' }} // Bold title
          />
          <Appbar.Action icon="logout" onPress={handleSignOut} color={theme.colors.text} />
        </Appbar.Header>

        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            <FlatList
              data={courses}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => navigation.navigate("Checkin", { cid: item.id })}>
                  <Card style={styles.card}>
                    <Card.Title
                      title={item.courseName}
                      titleStyle={{ color: theme.colors.text, fontWeight: 'bold' }} // Bold title
                      subtitle={item.courseCode}
                      subtitleStyle={{ color: theme.colors.text }}
                      left={(props) => <Avatar.Image {...props} source={{ uri: item.imageUrl }} size={48} style={{ backgroundColor: theme.colors.surface }} />}
                       // Removed right icon to simplify, like LoginScreen
                    />
                      <Card.Content>
                      <Text variant="bodyMedium" style={{ color: item.status === 1 ? theme.colors.primary : theme.colors.accent }}>
                        {item.status === 1 ? "ผู้สอน" : "นักเรียน"}
                      </Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text style={styles.emptyText}>ยังไม่มีวิชาที่เพิ่มเข้ามา</Text>
              }
            />
          )}

          <View style={styles.buttonContainer}>
            <Button
              icon="plus"
              mode="contained"
              onPress={() => navigation.navigate("AddClass")}
              style={[styles.button, { backgroundColor: 'rgba(142, 124, 195, 0.7)' }]} // Lavender button
              labelStyle={{ color: 'white' }} // White text
            >
              เพิ่มวิชา
            </Button>
            <Button
              icon="qrcode-scan"
              mode="contained"
              onPress={() => navigation.navigate("QRScanner")}
              style={[styles.button, { backgroundColor: 'rgba(142, 124, 195, 0.7)' }]}  // Lavender button
              labelStyle={{ color: 'white' }} // White text
            >
              สแกน QR
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface, // Light Lavender background
  },
  content: {
    flex: 1,
    padding: 10,
  },
  card: {
    marginBottom: 10,
    backgroundColor: 'white',
    elevation: 2,
    borderRadius: 8, // Rounded corners for cards
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 25, // Rounded buttons
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
  },
});

export default HomeScreen;