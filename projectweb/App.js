import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Button, FlatList, Alert } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from 'firebase/auth';


// ตั้งค่า Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBQxyTdXu_tLr0MxCj8D8_o6b_rlp6u1qc",
  authDomain: "web2567-2ae3c.firebaseapp.com",
  projectId: "web2567-2ae3c",
  storageBucket: "web2567-2ae3c.appspot.com",
  messagingSenderId: "3818215302",
  appId: "1:3818215302:web:c0ed0b7e9ea0519023fe07",
  measurementId: "G-KYSZTEQ4HJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [stid, setStid] = useState('');
  const [cid, setCid] = useState('');
  const [user, setUser] = useState(null);
  const [courseNames, setCourseNames] = useState({});
  const [studentData, setStudentData] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);  // ห้องเรียนที่นักเรียนเข้าร่วม
  const [selectedClass, setSelectedClass] = useState(null);  // ห้องเรียนที่เลือก
  const [enteredCode, setEnteredCode] = useState('');

  // ฟังก์ชันสมัครสมาชิก
  const signUp = async () => {
    try {
      if (!stid || !name || !email || !password) {
        Alert.alert("ข้อผิดพลาด", "กรุณากรอกข้อมูลให้ครบถ้วน!");
        return;
      }

      const stidQuery = query(collection(db, "users"), where("stid", "==", stid));
      const stidSnapshot = await getDocs(stidQuery);

      if (!stidSnapshot.empty) {
        Alert.alert("ข้อผิดพลาด", "รหัสนักศึกษานี้มีการสมัครแล้ว!");
        return;
      }

      const emailQuery = query(collection(db, "users"), where("email", "==", email));
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        Alert.alert("ข้อผิดพลาด", "อีเมลนี้มีการสมัครแล้ว!");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setUser(user);

      const studentRef = doc(db, `users/${stid}`);
      await setDoc(studentRef, {
        name: name,
        status: 0,
        stid: stid,
        courses: []  // เริ่มต้นด้วยการไม่มีวิชา
      });

      Alert.alert("สำเร็จ", "สมัครสมาชิกเรียบร้อย!");
    } catch (error) {
      Alert.alert("ข้อผิดพลาด", error.message);
    }
  };

  // ฟังก์ชันล็อกอิน
  const login = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setUser(user);

      const studentRef = doc(db, `users/${stid}`);
      const docSnap = await getDoc(studentRef);
      if (docSnap.exists()) {
        setStudentData(docSnap.data());
        Alert.alert("เข้าสู่ระบบสำเร็จ", `ยินดีต้อนรับ ${docSnap.data().name}`);
      } else {
        Alert.alert("ข้อผิดพลาด", "ไม่พบข้อมูลนักศึกษา");
      }
    } catch (error) {
      Alert.alert("ข้อผิดพลาด", error.message);
    }
  };

  // ฟังก์ชันออกจากระบบ
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      Alert.alert("สำเร็จ", "ออกจากระบบแล้ว");
    } catch (error) {
      Alert.alert("ข้อผิดพลาด", error.message);
    }
  };

  // ดึงข้อมูลวิชาที่นักเรียนลงทะเบียน
  const fetchClassNames = async () => {
    if (!studentData?.courses || studentData.courses.length === 0) return;

    try {
      const newCourseNames = {};
      for (const classId of studentData.courses) {
        const classRef = doc(db, "classrooms", classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
          newCourseNames[classId] = classSnap.data().info.name;
        }
      }
      setCourseNames(newCourseNames);
    } catch (error) {
      console.error("Error fetching class names:", error);
    }
  };

  // ดึงรายชื่อห้องเรียนที่นักเรียนเข้าร่วม
  const fetchJoinedClasses = async () => {
    if (studentData?.courses?.length > 0) {
      try {
        const classes = [];
        for (const classId of studentData.courses) {
          const classRef = doc(db, "classrooms", classId);
          const classSnap = await getDoc(classRef);
          if (classSnap.exists()) {
            classes.push({ id: classId, name: classSnap.data().info.name });
          }
        }
        setAvailableClasses(classes);
      } catch (error) {
        console.error("Error fetching joined classes:", error);
      }
    }
  };

  // ฟังก์ชันเข้าร่วมวิชา
  const joinClassroom = async () => {
    if (!cid || !stid || !name) {
      Alert.alert("ข้อผิดพลาด", "กรอกรหัสวิชา รหัสนักศึกษา และชื่อให้ครบถ้วน!");
      return;
    }

    try {
      const classQuery = query(collection(db, "classrooms"), where("info.code", "==", cid));
      const classSnap = await getDocs(classQuery);

      if (classSnap.empty) {
        Alert.alert("ข้อผิดพลาด", "รหัสวิชานี้ไม่ถูกต้อง!");
        return;
      }

      const classDoc = classSnap.docs[0];
      const classId = classDoc.id;

      const studentRef = doc(db, `classrooms/${classId}/student/${stid}`);
      await setDoc(studentRef, {
        name: name,
        stid: stid,
        status: 0,
      });

      const userRef = doc(db, `users/${stid}`);
      await updateDoc(userRef, {
        courses: arrayUnion(classId),
      });

      setStudentData((prevData) => ({
        ...prevData,
        courses: [...(prevData?.courses || []), classId],
      }));

      Alert.alert("สำเร็จ", `เข้าร่วมวิชา ${cid} เรียบร้อยแล้ว!`);
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเข้าร่วมวิชา!");
    }
  };

  // เรียก fetchClassNames ทุกครั้งที่ studentData เปลี่ยนแปลง
  useEffect(() => {
    if (studentData) {
      fetchClassNames();
      fetchJoinedClasses();
    }
  }, [studentData]);

  const handleCheckin = async () => {
    if (!selectedClass) {
      Alert.alert("ข้อผิดพลาด", "กรุณาเลือกห้องเรียนที่ต้องการเช็คชื่อ!");
      return;
    }

    const enteredCode = prompt("กรุณากรอกโค้ดห้องเรียน:");

    if (!enteredCode) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกโค้ดให้ครบถ้วน!");
      return;
    }

    try {
      // Query the "checkins" collection to find the classroom with the matching code
      const classQuery = query(
        collection(db, `classrooms/${selectedClass}/checkins/${checkinId}.code`),
        where("code", "==", enteredCode)
      );
      const classSnap = await getDocs(classQuery);

      if (classSnap.empty) {
        Alert.alert("ข้อผิดพลาด", "โค้ดห้องเรียนไม่ถูกต้อง!");
        return;
      }



      // If the code is correct, proceed with the check-in
      const checkinData = {
        name: name,    // Name of the student
        stid: stid,    // Student ID
        date: Timestamp.now(), // Current timestamp
      };

      const checkinRef = doc(db, `classrooms/${selectedClass}/checkins/${checkinId}/student/${stid}`);
      await addDoc(checkinRef, checkinData);

      const userRef = doc(db, `users/${stid}`);
      await updateDoc(userRef, {
        courses: arrayUnion(classId),
      });

      // Notify the user of success
      Alert.alert("สำเร็จ", `เช็คชื่อในห้องเรียน ${selectedClass} เรียบร้อย`);

    } catch (error) {
      console.error("Error checking in:", error);
      Alert.alert("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเช็คชื่อ!");
    }
  };

  return (
    <View style={styles.container}>
      {!user ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>เข้าสู่ระบบ / สมัครสมาชิก</Text>

          <TextInput style={styles.input} placeholder="ชื่อ" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="รหัสนักศึกษา" value={stid} onChangeText={setStid} />
          <TextInput style={styles.input} placeholder="อีเมล" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="รหัสผ่าน" secureTextEntry value={password} onChangeText={setPassword} />

          <Button title="สมัครสมาชิก" onPress={signUp} />
          <Button title="เข้าสู่ระบบ" onPress={login} />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ข้อมูลส่วนตัว</Text>
          <Text>ชื่อ: {studentData?.name}</Text>
          <Text>รหัสนักศึกษา: {studentData?.stid}</Text>
          <Text>สถานะ: {studentData?.status === 0 ? "นักศึกษา" : "อื่นๆ"}</Text>

          <Text style={styles.cardTitle}>รายชื่อวิชาที่ลงทะเบียน</Text>
          {availableClasses.length > 0 ? (
            <FlatList
              data={studentData.courses}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Text>📚 วิชา: {courseNames[item] || "กำลังโหลด..."}</Text>
              )}
            />
          ) : (
            <Text>ยังไม่ได้ลงทะเบียนวิชา</Text>
          )}



          {/* ฟอร์มการเข้าร่วมวิชา */}
          <TextInput style={styles.input} placeholder="กรอกรหัสวิชา (CID)" value={cid} onChangeText={setCid} />
          <TextInput style={styles.input} placeholder="ชื่อ" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="รหัสนักศึกษา" value={stid} onChangeText={setStid} />
          <Button title="เข้าร่วมวิชา" onPress={joinClassroom} />

          <Button title="ออกจากระบบ" onPress={logout} />
        </View>
      )}

      {/* เช็คห้องเรียนที่เข้าร่วม */}
      {availableClasses.length > 0 && (
        <FlatList
          data={availableClasses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Button
                title={item.name}
                onPress={() => setSelectedClass(item.id)}
                color={selectedClass === item.id ? 'blue' : 'gray'}
              />
            </View>
          )}
        />
      )}

      {selectedClass && (
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="กรอกโค้ดห้องเรียน"
            value={enteredCode}
            onChangeText={setEnteredCode}
          />
          <Button title="เช็คชื่อ" onPress={handleCheckin} />
        </View>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
    width: '90%',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingLeft: 10,
    backgroundColor: '#f9f9f9',
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
});