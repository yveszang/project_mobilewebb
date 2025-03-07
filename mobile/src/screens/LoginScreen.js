import React, { useState, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { getAuth, signInWithPhoneNumber, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { TextInput, Button, Text, MD3Colors, HelperText } from 'react-native-paper';
import PhoneInput from 'react-native-phone-number-input';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';

const auth = getAuth();

function LoginScreen() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [confirmation, setConfirmation] = useState(null);
    const [phoneNumberError, setPhoneNumberError] = useState('');
    const [otpError, setOtpError] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loginMethod, setLoginMethod] = useState('email');

    const phoneInput = useRef(null);
    const navigation = useNavigation();

    // --- reCAPTCHA Setup ---
    const recaptchaVerifier = useRef(null);

    const setupRecaptcha = () => {
        if (!recaptchaVerifier.current) {
            recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'sitekey': '6LdXCecqAAAAAEqKTTMyTw2qSiRPHfpB4Af0LdsE',
                'size': 'invisible',
                'callback': (response) => {
                    console.log("reCAPTCHA solved", response);
                },
                'expired-callback': () => {
                    console.warn("reCAPTCHA expired");
                    Alert.alert("reCAPTCHA Expired", "Please try sending the OTP again.");
                }
            }, auth);
        }
    }

    // --- OTP Functions ---
    const handleSendOtp = async () => {
        setPhoneNumberError('');
        setOtpError('');

        if (!formattedPhoneNumber) {
            setPhoneNumberError('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง');
            return;
        }

        console.log("formattedPhoneNumber:", formattedPhoneNumber);
        setupRecaptcha();

        try {
            await recaptchaVerifier.current?.render();

            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber.trim(), recaptchaVerifier.current);
            setConfirmation(confirmationResult);
            setIsOtpSent(true);
            Alert.alert('Success', 'รหัส OTP ถูกส่งแล้ว');
        } catch (error) {
            if (error.code === 'auth/invalid-phone-number') {
                setPhoneNumberError('เบอร์โทรศัพท์ไม่ถูกต้อง');
            } else if (error.code === 'auth/too-many-requests') {
                Alert.alert('Error', 'คุณได้ส่งคำขอมากเกินไป โปรดลองอีกครั้งในภายหลัง');
            } else {
                Alert.alert('Error', error.message);
                console.error(error);
            }
        }
    };

    const handleConfirmOtp = async () => {
        setOtpError('');

        if (!otp) {
            setOtpError('กรุณากรอกรหัส OTP');
            return;
        }
        try {
            await confirmation.confirm(otp);
            navigation.replace('Home');
            Alert.alert('Success', 'เข้าสู่ระบบสำเร็จ!');
        } catch (error) {
            if (error.code === 'auth/invalid-verification-code') {
                setOtpError('รหัส OTP ไม่ถูกต้อง');
            } else {
                Alert.alert('Error', error.message);
                console.error(error);
            }
        }
    };

    const handleResendOTP = async () => {
        try {
            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber.trim(), recaptchaVerifier.current);
            setConfirmation(confirmationResult);
            Alert.alert('Success', 'OTP sent!');
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    }

    // --- Email/Password Login ---
    const handleEmailLogin = async () => {
        setEmailError('');
        setPasswordError('');

        let hasError = false;
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
        }

        if (hasError) return;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigation.replace('Home');
        } catch (error) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                Alert.alert("เข้าสู่ระบบไม่สำเร็จ", "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
            } else if (error.code === 'auth/invalid-email') {
                Alert.alert("เข้าสู่ระบบไม่สำเร็จ", "อีเมลไม่ถูกต้อง");
            } else {
                Alert.alert("เข้าสู่ระบบไม่สำเร็จ", error.message);
            }
        }
    };


    return (
        <SafeAreaView style={styles.container}>
            {/* Hidden reCAPTCHA container */}
            <View style={{ height: 0, width: 0, overflow: 'hidden' }}>
                <View id="recaptcha-container" />
            </View>

            <View style={styles.content}>
                <Text variant="headlineMedium" style={styles.title}>เข้าสู่ระบบ</Text>

                <View style={styles.buttonContainer}>
                    <Button
                        mode={loginMethod === 'email' ? "contained" : "outlined"}
                        onPress={() => setLoginMethod('email')}
                        style={[styles.methodButton, loginMethod === 'email' ? styles.activeMethodButton : styles.inactiveMethodButton]}
                        labelStyle={loginMethod === 'email' ? styles.activeButtonText : styles.inactiveButtonText}
                    >
                        อีเมล
                    </Button>
                    <Button
                        mode={loginMethod === 'phone' ? "contained" : "outlined"}
                        onPress={() => setLoginMethod('phone')}
                        style={[styles.methodButton, loginMethod === 'phone' ? styles.activeMethodButton : styles.inactiveMethodButton]}
                        labelStyle={loginMethod === 'phone' ? styles.activeButtonText : styles.inactiveButtonText}

                    >
                        โทรศัพท์
                    </Button>
                </View>


                {loginMethod === 'email' ? (
                    <>
                        <TextInput
                            label="อีเมล"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            style={styles.input}
                            mode="outlined"
                            error={!!emailError}
                            theme={{ colors: { text: 'black', placeholder: 'grey', primary: '#8e7cc3', outline: '#8e7cc3' } }}
                            outlineStyle={styles.roundedInput}
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
                            theme={{ colors: { text: 'black', placeholder: 'grey', primary: '#8e7cc3', outline: '#8e7cc3' } }}
                            outlineStyle={styles.roundedInput}
                        />
                        <HelperText type="error" visible={!!passwordError}>
                            {passwordError}
                        </HelperText>
                        <Button mode="contained" onPress={handleEmailLogin} style={styles.button}  buttonColor='rgba(142, 124, 195, 0.7)'>
                            เข้าสู่ระบบ
                        </Button>
                    </>
                ) : (
                    <>
                        {!isOtpSent ? (
                            <>
                                <PhoneInput
                                    ref={phoneInput}
                                    defaultValue={phoneNumber}
                                    defaultCode="TH"
                                    layout="first"
                                    onChangeText={(text) => {
                                        setPhoneNumber(text);
                                    }}
                                    onChangeFormattedText={(text) => {
                                        console.log("Formatted Text:", text);
                                        setFormattedPhoneNumber(text);
                                    }}
                                    withDarkTheme={false}
                                    withShadow
                                    autoFocus={false}
                                    containerStyle={[styles.phoneInputContainer, styles.roundedInput]}
                                    textContainerStyle={[styles.phoneInputTextContainer, styles.roundedInput, {backgroundColor: 'white'}]}
                                    textInputStyle={styles.phoneInputTextInput}
                                    codeTextStyle={styles.phoneInputCodeText}
                                    flagButtonStyle={styles.phoneInputFlagButton}
                                    countryPickerButtonStyle={styles.countryPickerButton}

                                />

                                <HelperText type="error" visible={!!phoneNumberError}>
                                    {phoneNumberError}
                                </HelperText>
                                <Button mode="contained" onPress={handleSendOtp} style={styles.button} buttonColor='rgba(142, 124, 195, 0.7)'>
                                    ส่ง OTP
                                </Button>
                            </>
                        ) : (
                            <>
                                <TextInput
                                    label="รหัส OTP"
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="number-pad"
                                    style={styles.input}
                                    mode="outlined"
                                    error={!!otpError}
                                    theme={{ colors: { text: 'black', placeholder: 'grey', primary: '#8e7cc3', outline: '#8e7cc3' } }}
                                    outlineStyle={styles.roundedInput}
                                />
                                <HelperText type="error" visible={!!otpError}>
                                    {otpError}
                                </HelperText>
                                <Button mode="contained" onPress={handleConfirmOtp} style={styles.button} buttonColor='rgba(142, 124, 195, 0.7)'>
                                    ยืนยัน OTP
                                </Button>
                                <TouchableOpacity onPress={handleResendOTP} style={styles.resendLink}>
                                    <Text style={styles.resendText}>ส่ง OTP อีกครั้ง</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </>
                )}


                <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.registerLink}>
                    <Text style={styles.registerText}>สมัครสมาชิก</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#f0e6ef', // Light Lavender, almost white
    },
    content: {
        paddingHorizontal: 20,
    },
    title: {
        marginBottom: 20,
        textAlign: 'center',
        color: '#4a4161', // Dark Purple, almost black
        fontWeight: 'bold',
    },
    input: {
        marginBottom: 5,
        backgroundColor: 'white',

    },
    roundedInput: {
        borderRadius: 25,
    },
    button: {
        marginTop: 15,
        borderRadius: 25,

    },
    registerLink: {
        marginTop: 15,
        alignItems: 'center',
    },
    registerText: {
        color: '#8e7cc3',  // Lavender
        textDecorationLine: 'underline',
    },
    resendLink: {
        marginTop: 15,
        alignItems: 'center',
    },
    resendText: {
        color: '#8e7cc3',  // Lavender
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    methodButton: {
        flex: 1,
        marginHorizontal: 5,
        borderRadius: 25,


    },
    activeMethodButton: {
         backgroundColor: 'rgba(142, 124, 195, 0.7)', // Lavender, active

    },
    inactiveMethodButton: {
        backgroundColor: 'transparent',
        borderColor: 'rgba(142, 124, 195, 0.7)', // Lavender border
        borderWidth: 1,

    },
      activeButtonText: {
        color: 'white',
    },
    inactiveButtonText: {
        color: '#8e7cc3',  // Lavender
    },
    phoneInputContainer: {
        width: '100%',
        marginBottom: 5,
        backgroundColor: 'white',


    },
    phoneInputTextContainer: {
        //backgroundColor: 'white', // Remove or set to white if needed
        paddingVertical: 0,
        borderRadius: 25,

    },
    phoneInputTextInput: {
        paddingVertical: 0,
        color: 'black'
    },
    phoneInputCodeText: {
        fontSize: 16,
        color: 'black'
    },
    phoneInputFlagButton: {
    },
    countryPickerButton: {

    }

});

export default LoginScreen;