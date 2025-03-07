import React, { useState, useEffect } from "react";
import { View, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { db, auth } from "../firebase";
import { doc, setDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { TextInput, Button, Text, MD3Colors, HelperText } from 'react-native-paper'; // Import Paper components

const QuestionScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { cid } = route.params;

  const [cno, setCno] = useState("");
  const [questionShow, setQuestionShow] = useState(false);
  const [answer, setAnswer] = useState("");
  const [questionNo, setQuestionNo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [questionText, setQuestionText] = useState(""); // Store the actual question text
  const [submitting, setSubmitting] = useState(false); // Track answer submission

  useEffect(() => {
    const fetchOpenCheckin = async () => {
        setLoading(true);
      try {
        const checkinQuery = query(collection(db, `classroom/${cid}/checkin`), where("status", "==", 1));
        const querySnapshot = await getDocs(checkinQuery);

        if (!querySnapshot.empty) {
          const openCheckin = querySnapshot.docs[0];
          setCno(openCheckin.id);
        } else {
            // No open checkin session, navigate back to home.
            Alert.alert("ไม่มีการเช็คชื่อ", "ไม่มีการเช็คชื่อที่เปิดอยู่ในขณะนี้");
            navigation.navigate("Home");
        }
      } catch (error) {
        console.error("Error fetching open check-in:", error);
        Alert.alert("Error", "Failed to fetch open check-in session.");
      } finally {
          setLoading(false);
      }
    };

    if (cid) fetchOpenCheckin();
  }, [cid, navigation]);


  useEffect(() => {
    if (!cno) return;

    const questionRef = doc(db, `classroom/${cid}/checkin/${cno}`);
    const unsubscribeQuestion = onSnapshot(questionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setQuestionShow(data.question_show);
        setQuestionNo(data.question_no);
        setQuestionText(data.question || ""); // Get the actual question text
      }
    });

    return () => {
      unsubscribeQuestion();
    };
  }, [cid, cno]);

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      Alert.alert("กรุณากรอกคำตอบ");
      return;
    }
      setSubmitting(true); // Start loading

    try {
        const userUid = auth.currentUser.uid;

        // Check if student already answered
        const answersRef = collection(db, `classroom/${cid}/checkin/${cno}/answers`);
        const answerQuery = query(answersRef, where(`students.${userUid}`, "!=", null));
        const answerQuerySnapshot = await getDocs(answerQuery);

        if (!answerQuerySnapshot.empty) {
            Alert.alert("คุณได้ส่งคำตอบแล้ว", "คุณได้ส่งคำตอบสำหรับคำถามนี้ไปแล้ว");
            return;
        }


      const studentAnswerRef = doc(db, `classroom/${cid}/checkin/${cno}/answers/${questionNo}/students/${auth.currentUser.uid}`);
        //Use set doc since we have the specific path.
      await setDoc(studentAnswerRef, {
        text: answer,
        time: new Date().toISOString(),
      });

        //Or we can save the answer using the following approach.
        //   const answersRef = collection(db, `classroom/${cid}/checkin/${cno}/answers`);
        //   await addDoc(answersRef, {  // Use addDoc to let Firestore generate the ID
        //    question: questionText, // Use questionText state
        //     students: {
        //       [userUid]: {
        //         text: answer,
        //         time: new Date().toISOString(),
        //       },
        //     },
        //      });
      setAnswer("");
      Alert.alert("ส่งคำตอบสำเร็จ!");
    } catch (error){
        console.error("Error submitting Answer: ", error);
        Alert.alert("Error", "Failed to submit answer")
    } finally {
        setSubmitting(false); // Stop loading
    }

  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>ตอบคำถาม</Text>

        {loading ? (
            <ActivityIndicator size="large" color={MD3Colors.primary50}/>
        ) : (
            questionShow ? (
                <>
                    <Text variant="titleMedium" style={styles.question}>{questionText}</Text>
                    <TextInput
                      placeholder="กรอกคำตอบของคุณ"
                      value={answer}
                      onChangeText={setAnswer}
                      style={styles.input}
                      mode="outlined"
                      multiline
                    />
                    <Button mode="contained" onPress={handleSubmitAnswer} style={styles.button} loading={submitting} disabled={submitting}>
                      ส่งคำตอบ
                    </Button>
                  </>
                ) : (
                  <Text style={styles.noQuestion}>❌ ยังไม่มีคำถาม</Text>
                )
        )}


        <Button mode="outlined" onPress={() => navigation.goBack()} style={[styles.button, styles.backButton]}>
          กลับ
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
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
    color: MD3Colors.primary50
  },
  question: {
      marginBottom: 10,
      textAlign: 'center',
      color: MD3Colors.primary50,
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white'
  },
  button: {
    marginTop: 10,
  },
    backButton: {
      borderColor: MD3Colors.primary50,
      backgroundColor: 'white',
        marginTop: 20,
    },
  noQuestion: {
    textAlign: 'center',
    marginTop: 20,
    color: MD3Colors.error50,
  },
});

export default QuestionScreen;