import React, { useState, useEffect } from "react";
import { View, StyleSheet, SafeAreaView, FlatList, Alert } from "react-native"; // Import StyleSheet, SafeAreaView
import { useRoute, useNavigation } from "@react-navigation/native";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc, onSnapshot } from "firebase/firestore";
import { TextInput, Button, Text, MD3Colors, List, Divider, ActivityIndicator } from 'react-native-paper';

const CheckinScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { cid, checkinCode } = route.params || {};

  const [cno, setCno] = useState("");
  const [code, setCode] = useState(checkinCode || "");
  const [students, setStudents] = useState([]);
  const [questionShow, setQuestionShow] = useState(false);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false); // Loading state
  const [checkinLoading, setCheckinLoading] = useState(false); // Loading state for check-in
  const [answerLoading, setAnswerLoading] = useState(false); // Loading state for answering

  useEffect(() => {
    const fetchOpenCheckin = async () => {
      setLoading(true); // Start loading
      try {
        const checkinQuery = query(collection(db, `classroom/${cid}/checkin`), where("status", "==", 1));
        const querySnapshot = await getDocs(checkinQuery);

        if (!querySnapshot.empty) {
          const openCheckin = querySnapshot.docs[0];
          setCno(openCheckin.id);
        } else {
          Alert.alert("❌ ไม่มีการเช็คชื่อที่เปิดอยู่");
          navigation.goBack(); // Go back if no open check-in
        }
      } catch (error) {
        console.error("Error fetching open check-in:", error);
        Alert.alert("Error", "Failed to fetch open check-in session.");
      } finally {
        setLoading(false); // End loading
      }
    };

    if (cid) fetchOpenCheckin();
  }, [cid, navigation]);

  useEffect(() => {
    const fetchStudents = async () => {
        if (!cno) return;
        setLoading(true);
        try {
          const querySnapshot = await getDocs(collection(db, `classroom/${cid}/checkin/${cno}/students`));
        setStudents(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        } catch(error) {
          console.error("Error fetching students: ", error);
          Alert.alert("Error", "Failed to fetch the list of students");
        } finally {
          setLoading(false);
        }

    };

    fetchStudents();
  }, [cid, cno]);

  useEffect(() => {
    const checkQuestionStatus = async () => {
      if (!cid || !cno) return;

      const questionRef = doc(db, `classroom/${cid}/checkin/${cno}`);
      const unsubscribe = onSnapshot(questionRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setQuestionShow(data.question_show);
        }
      });

      return unsubscribe;
    };


      checkQuestionStatus();

  }, [cid, cno]);

  const handleCheckIn = async () => {
    if (!cno || !code) return Alert.alert("กรุณากรอกรหัสเข้าเรียน");

    setCheckinLoading(true); // Start check-in loading
    try {
      const checkinRef = doc(db, `classroom/${cid}/checkin/${cno}`);
      const checkinSnap = await getDoc(checkinRef);

      if (checkinSnap.exists() && checkinSnap.data().code === code) {
        const userUid = auth.currentUser.uid;
        const userName = auth.currentUser.displayName || "ไม่มีชื่อ";

        // Check if the student has already checked in
        const studentDocRef = doc(db, `classroom/${cid}/checkin/${cno}/students`, userUid);
        const studentDocSnap = await getDoc(studentDocRef);

        if (studentDocSnap.exists()) {
            Alert.alert("แจ้งเตือน", "คุณได้เช็คชื่อไปแล้ว");
            return; // Exit if already checked in
        }

        // 1. Record check-in
        await setDoc(studentDocRef, {
          stdid: userUid,
          name: userName,
          date: new Date().toISOString(),
        });

        // 2. Update check-in score
        await setDoc(doc(db, `classroom/${cid}/checkin/${cno}/scores`, userUid), {
          date: new Date().toISOString(),
          status: 1, // 1 = Present
          score: 10, // Check-in score
        });

        Alert.alert("✅ เช็คชื่อสำเร็จ!");
      } else {
        Alert.alert("❌ รหัสเข้าเรียนไม่ถูกต้อง");
      }
    } catch (error) {
      console.error("Error during check-in:", error);
      Alert.alert("Error", "Failed to check in. Please try again.");
    } finally {
      setCheckinLoading(false); // End check-in loading
    }
  };

  const handleAnswerSubmit = async () => {
    if (!answer) {
      Alert.alert("กรุณากรอกคำตอบ");
      return;
    }
      setAnswerLoading(true);

    try{
        const userUid = auth.currentUser.uid;
        const questionRef = collection(db, `classroom/${cid}/checkin/${cno}/answers`);
        const newAnswerRef = doc(questionRef);

          // Check if student has already answered.
        const answerQuery = query(questionRef, where(`students.${userUid}`, "!=", null));
        const answerQuerySnapshot = await getDocs(answerQuery);

        if (!answerQuerySnapshot.empty) {
          Alert.alert("แจ้งเตือน", "คุณได้ส่งคำตอบสำหรับคำถามนี้ไปแล้ว");
          return; // Early return
         }


        // Save answer
        await setDoc(newAnswerRef, {
          text: `คำถาม ${cno}`,  // Or fetch from Firestore if available
          students: {
            [userUid]: {
              text: answer,
              time: new Date().toISOString(),
            },
          },
        });

        Alert.alert("✅ คำตอบของคุณได้รับการบันทึก");
        setAnswer(""); // Clear answer after submission
    } catch (error){
      console.error("Error submiting answer", error);
      Alert.alert("Error", "Failed to submit answer");
    } finally {
      setAnswerLoading(false);
    }

  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}> เช็คชื่อเข้าเรียน</Text>

        <Text style={styles.cnoText}>ลำดับการเช็คชื่อ (CNO): {cno || "⏳ กำลังโหลด..."}</Text>

        <TextInput
          label="รหัสเข้าเรียน (Code)"
          placeholder="รหัสเข้าเรียน (Code)"
          value={code}
          onChangeText={setCode}
          style={styles.input}
          mode="outlined"
        />

        <Button mode="outlined" onPress={() => navigation.navigate("QRScanner")} style={[styles.button, styles.scanButton]}>
          🔍 สแกน QR Code
        </Button>
        <Button mode="contained" onPress={handleCheckIn} style={styles.button} loading={checkinLoading} disabled={checkinLoading}>
          ✅ เช็คชื่อ
        </Button>

        {questionShow && (
          <View style={styles.questionContainer}>
            <Text variant="titleLarge" style={styles.questionTitle}>📚 ตอบคำถาม</Text>
            <TextInput
              label="กรอกคำตอบของคุณ"
              placeholder="กรอกคำตอบของคุณ"
              value={answer}
              onChangeText={setAnswer}
              style={styles.input}
              mode="outlined"
              multiline // Allow multiline input
            />
            <Button mode="contained" onPress={handleAnswerSubmit} style={styles.button} loading={answerLoading} disabled={answerLoading}>
              ส่งคำตอบ
            </Button>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
    color: MD3Colors.primary50,
  },
  cnoText: {
    marginBottom: 10,
    textAlign: 'center',
    color: MD3Colors.neutral60, // Less prominent color for CNO
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white'
  },
  button: {
    marginBottom: 10,
  },
    scanButton: {
      borderColor: MD3Colors.primary50,
      backgroundColor: 'white'
  },
  listTitle: {
    marginTop: 20,
    marginBottom: 5,
      color: MD3Colors.primary50,
  },
  questionContainer: {
    marginTop: 20,
    borderColor: MD3Colors.primary50,
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
  },
  questionTitle: {
    marginBottom: 10,
      color: MD3Colors.primary50,
  },
    listItem: { // Added style for list items
      backgroundColor: 'white',
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
    },
});

export default CheckinScreen;