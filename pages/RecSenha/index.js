import React, { useState, useEffect } from 'react';
import { Image, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import AlertaLogin from '../Alertas/AlertaLogin';

const RecSenha = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    const showAlert = (title, message) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertVisible(true);
    };

    const handleResetPassword = async () => {
        if (!email.trim()) {
            showAlert('beSafe | Erro', 'Por favor, insira seu e-mail.');
            return;
        }

        try {
            console.log('E-mail:', email);

            await sendPasswordResetEmail(auth, email);
            showAlert('beSafe | Sucesso', 'E-mail de redefinição de senha enviado!');
        } catch (error) {
            console.error('Erro ao enviar e-mail de redefinição:', error);

            if (error.code === 'auth/invalid-email') {
                showAlert('beSafe | Erro', 'Por favor, insira um e-mail válido!');
            } else if (error.code === 'auth/user-not-found') {
                showAlert('beSafe | Erro', 'Nenhum usuário foi encontrado com este e-mail!');
            } else {
                showAlert('beSafe | Erro', 'Erro ao enviar e-mail de redefinição!');
            }
        }
    };

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            setIsKeyboardVisible(true);
        });
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setIsKeyboardVisible(false);
        });

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <ScrollView
                contentContainerStyle={styles.scrollViewContainer}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={isKeyboardVisible}
            >
                <View style={styles.innerContainer}>
                    <Image style={styles.img} source={require('../../assets/logo.png')} />
                    <Text style={styles.title}>Recuperação de Senha</Text>
                    <View style={styles.inputcontainer}>
                        <Icon name="email" size={30} color="black" style={styles.icon} />
                        <TextInput
                            placeholder="E-mail"
                            placeholderTextColor="black"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>
                    <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                        <Text style={styles.buttonText}>ENVIAR E-MAIL</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <AlertaLogin
                visible={alertVisible}
                title={alertTitle}
                message={alertMessage}
                onClose={() => setAlertVisible(false)}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollViewContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingBottom: 20,
    },
    innerContainer: {
        width: '100%',
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 25,
        marginBottom: 20,
        fontWeight: 'bold',
        color: '#3a9ee4',
        fontFamily: 'BreeSerif',
    },
    input: {
        height: 40,
        width: '100%',
        maxWidth: 250,
        paddingHorizontal: 10,
        borderRadius: 15,
        backgroundColor: '#d5dbe3',
        color: 'black',
        fontFamily: 'BreeSerif',
    },
    button: {
        backgroundColor: '#3a9ee4',
        width: '100%',
        maxWidth: 300,
        padding: 13,
        marginBottom: 10,
        borderRadius: 15,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontFamily: 'BreeSerif',
    },
    inputcontainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
        borderRadius: 15,
        backgroundColor: '#d5dbe3',
        height: 50,
        width: 300,
    },
    icon: {
        marginRight: 10,
        width: 30,
    },
    img: {
        width: '100%',
        height: 300,
        borderColor: 'black',
        marginTop: 28,
        marginBottom: 28,
    },
});

export default RecSenha;
