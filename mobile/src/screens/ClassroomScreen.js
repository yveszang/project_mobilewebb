import React, { useState, useEffect } from "react";
import { View, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Alert } from "react-native"; // Import StyleSheet, SafeAreaView
import { useRoute, useNavigation } from "@react-navigation/native";
import { db, auth } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Avatar, Card, Text, Button, IconButton, MD3Colors, List, Divider } from 'react-native-paper'; // Import Paper components

const ClassroomScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { cid } = route.params;
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchClassInfoAndStudents = async () => {
      setLoading(true); // Start loading
      try {
        const classRef = doc(db, `classroom/${cid}`);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
          setClassInfo(classSnap.data());
        } else {
            Alert.alert("Error", "Classroom not found");
            navigation.goBack(); // Go back if class not found
            return;
        }

        const querySnapshot = await getDocs(collection(db, `classroom/${cid}/students`));
        setStudents(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching class info and students:", error);
        Alert.alert("Error", "Failed to fetch classroom information.");
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchClassInfoAndStudents();
  }, [cid, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={MD3Colors.primary50} />
      </SafeAreaView>
    );
  }


    // Function to get initials for the Avatar, handling potentially missing names.
  const getInitials = (name) => {
    if (!name) return "?";
    const nameParts = name.trim().split(/\s+/);
    let initials = (nameParts[0]?.[0] || '') + (nameParts.length > 1 ? nameParts[1]?.[0] || '' : '');
    return initials.toUpperCase();
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {classInfo && (
            <Card style={styles.card}>
              <Card.Cover source={{ uri: classInfo.info.photo || `https://via.placeholder.com/700x200/4a90e2/FFFFFF?text=${getInitials(classInfo.info.name)}` }} />
            <Card.Title
              title={classInfo.info.name}
              subtitle={`รหัสวิชา: ${classInfo.info.code}`}
              titleVariant="titleLarge"
              subtitleVariant="bodyMedium"
            />
            <Card.Content>
                <Text variant="bodyMedium">ห้องเรียน: {classInfo.info.room}</Text>
            </Card.Content>
             <Card.Actions>
                <Button icon="check-circle" mode="contained" onPress={() => navigation.navigate("Checkin", { cid })} style={styles.button}>เช็คชื่อ</Button>
                <Button icon="comment-question" mode="outlined" onPress={() => navigation.navigate("Question", { cid })} style={[styles.button, styles.questionButton]}>ถาม-ตอบ</Button>
            </Card.Actions>
          </Card>
        )}


        <Text variant="titleLarge" style={styles.listTitle}>รายชื่อนักศึกษา</Text>
        <Divider style={{marginBottom: 10}} />
          {loading ? (
            <ActivityIndicator animating={true} color={MD3Colors.primary50}/>
          ):(

        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
           renderItem={({ item }) => (
                <List.Item
                  title={item.name}
                  description={`รหัส: ${item.stdid}`}
                  left={props => <List.Icon {...props} icon="account" />}
                />
           )}
           ListEmptyComponent={<Text style={{textAlign: 'center'}}>ไม่มีรายชื่อนักศึกษา</Text>}

        />
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 10,
  },
  card: {
      marginBottom: 20,
      backgroundColor: 'white',
  },
    button: {
      marginRight: 8,
      flex: 1
  },
  questionButton: {
      borderColor: MD3Colors.primary50,
      backgroundColor: 'white'
  },
  listTitle: {
      marginBottom: 10,
       color: MD3Colors.primary50,
    fontWeight: 'bold',
  }
});

export default ClassroomScreen;