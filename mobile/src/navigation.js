import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ClassroomScreen from "./screens/ClassroomScreen";
import CheckinScreen from "./screens/CheckinScreen";
import QuestionScreen from "./screens/QuestionScreen";
import QRScannerScreen from "./screens/QRScannerScreen";
import AddClass from "./screens/AddClass";
import JoinClass from "./screens/JoinClass";

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Classroom" component={ClassroomScreen} />
      <Stack.Screen name="Checkin" component={CheckinScreen} />
      <Stack.Screen name="Question" component={QuestionScreen} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} />
      <Stack.Screen name="JoinClass" component={JoinClass} />
      <Stack.Screen name="AddClass" component={AddClass} />
    </Stack.Navigator>
  );
}
