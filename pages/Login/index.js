import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Keyboard, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import AlertaLogin from '../Alertas/AlertaLogin';

const Login = ({ setHasLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = () => {
    setLoading(true);

    setTimeout(() => {
      if (!email || !password) {
        setLoading(false);
        showAlert("beSafe | Erro", "É necessário preencher ambos os campos para fazer login!");
        return;
      }

      if (!isValidEmail(email)) {
        setLoading(false);
        showAlert("beSafe | Erro", "Por favor, insira um e-mail válido!");
        return;
      }

      if (password.length < 6) {
        setLoading(false);
        showAlert("beSafe | Erro", "A senha deve ter no mínimo 6 caracteres!");
        return;
      }

      signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
          const user = userCredential.user;
          console.log('Usuário logado com:', user.email);
          setHasLoggedIn(true);
          setLoading(false);
        })
        .catch(error => {
          setLoading(false);

          if (error.code === 'auth/wrong-password' || error.message.includes("password")) {
            showAlert("beSafe | Erro", "Senha incorreta! Tente novamente.");
          } else if (error.code === 'auth/user-not-found' || error.message.includes("user")) {
            showAlert("beSafe | Erro", "Verifique o e-mail e tente novamente!");
          } else if (error.code === 'auth/invalid-email') {
            showAlert("beSafe | Erro", "Por favor, insira um e-mail válido!");
          } else {
            showAlert("beSafe | Erro", "Ocorreu um erro ao fazer login! Verifique o e-mail e a senha e tente novamente.");
          }
        });
    }, 500);
  };



  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollViewContainer}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={isKeyboardVisible}
      >
        <View style={styles.innerContainer}>
          <Image style={styles.img} source={require('../../assets/logo.png')} />

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

          <View style={styles.inputcontainer}>
            <Icon name="shield-lock-outline" size={30} color="black" style={styles.icon} />
            <TextInput
              placeholder="Senha"
              placeholderTextColor="black"
              autoCapitalize="none"
              secureTextEntry={!showPassword}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Enter' && !nativeEvent.shiftKey) {
                  handleLogin();
                }
              }}              
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Icon name={showPassword ? "eye" : "eye-off"} size={25} color="black" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.esqueceuasenha} onPress={() => navigation.navigate('RecSenha')}>
            <Text style={styles.esqueceuasenhatxt}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>ENTRAR</Text>

            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cadastrese} onPress={() => navigation.navigate('Cadastro')}>
            <Text style={styles.cadastresetxt}>Não tem uma conta? Cadastre-se</Text>
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
  },

  innerContainer: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  input: {
    height: 40,
    width: '100%',
    maxWidth: 249,
    paddingHorizontal: 10,
    borderRadius: 15,
    backgroundColor: '#d5dbe3',
    color: 'black',

  },

  button: {
    backgroundColor: '#3a9ee4',
    width: '100%',
    maxWidth: 250,
    padding: 13,
    marginBottom: 10,
    borderRadius: 15,
  },

  buttonText: {
    color: 'white',
    textAlign: 'center',

  },

  esqueceuasenha: {
    backgroundColor: 'transparent',
    width: '100%',
    maxWidth: 250,
    padding: 10,
    marginBottom: 70,
    marginTop: -5,
  },

  esqueceuasenhatxt: {
    color: '#3a9ee4',
    textAlign: 'center',
    fontSize: 16,
    textDecorationLine: 'underline',

  },

  cadastrese: {
    backgroundColor: 'transparent',
    width: '100%',
    maxWidth: 250,
    padding: 10,
    marginBottom: 10,
  },

  cadastresetxt: {
    color: '#3a9ee4',
    textAlign: 'center',
    fontSize: 15,

  },

  buttonContainer: {
    flex: 1,
    width: '70%',
  },

  img: {
    width: '100%',
    height: 300,
    borderColor: 'black',
    marginTop: 28,
    marginBottom: 28,
  },

  imglogin: {
    width: 40,
    height: 40,
  },

  login2: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginapps: {
    marginHorizontal: 10,
  },

  inputcontainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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

  eyeIcon: {
    position: 'absolute',
    right: 10,
    height: '100%',
    justifyContent: 'center',
  },
});

export default Login;
