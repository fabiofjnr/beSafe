import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Posts from './pages/Posts';
import NovoPost from './pages/NovoPost';
import Enquetes from './pages/Enquetes';
import NovaEnquete from './pages/NovaEnquete';
import Respostas from './pages/Respostas';
import Curtidas from './pages/Curtidas';
import SOS from './pages/SOS';
import Salvos from './pages/Salvos';
import Perfil from './pages/Perfil';
import RecSenha from './pages/RecSenha';
import IAchat from './pages/IAchat';
import Denuncias from './pages/Denuncias';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { auth } from './firebase';
import AlertaBV from './pages/Alertas/AlertaBV';
import { ThemeProvider, useTheme } from './ThemeContext';
import IntroTutorial from './pages/IntroTutorial';

const Stack = createNativeStackNavigator();

const OtherScreensStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Posts" component={Posts} />
    <Stack.Screen name="Enquetes" component={Enquetes} />
    <Stack.Screen name="Respostas" component={Respostas} />
    <Stack.Screen name="Curtidas" component={Curtidas} />
    <Stack.Screen name="NovoPost" component={NovoPost} />
    <Stack.Screen name="NovaEnquete" component={NovaEnquete} />
  </Stack.Navigator>
);

const Tab = createBottomTabNavigator();

const AppTabs = ({ setIsLoggedIn }) => {
  const { isDarkMode } = useTheme();
  const [userEmail, setUserEmail] = useState(null);
  
  const allowedEmails = [
    "fj878207@gmail.com",
    "anacarolcorr07@gmail.com",
    "isabella.barranjard@gmail.com",
    "contaetec14@gmail.com",
  ];

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserEmail(user.email);
    }
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: isDarkMode ? 'white' : '#ADD8F6',
        tabBarInactiveTintColor: isDarkMode ? 'black' : 'white',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#8bb0c9' : '#3a9ee4',
          height: '8.5%',
          borderTopWidth: 0,
        },
        headerStyle: {
          backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6',
          borderBottomWidth: 0,
        },
        headerTintColor: isDarkMode ? 'black' : 'black',
        headerTitleAlign: 'center',
        headerTitle: 'beSafe',
        headerTitleStyle: {
          fontFamily: 'BreeSerif',
          fontSize: 28,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={OtherScreensStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={35} marginTop={5} />
          ),
        }}
      />
      <Tab.Screen
        name="SOS"
        component={SOS}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="phone-in-talk" color={color} marginTop={5} size={35} />
          ),
          headerTitle: 'S.O.S.',
        }}
      />
      <Tab.Screen
        name="IAchat"
        component={IAchat}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="chat" color={color} marginTop={5} size={35} />
          ),
          headerShown: false,
        }} />
      <Tab.Screen
        name="Salvos"
        component={Salvos}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="bookmark" color={color} marginTop={5} size={35} />
          ),
          headerTitle: 'Salvos',
        }}
      />
     {allowedEmails.includes(userEmail) && (
        <Tab.Screen
          name="Denuncias"
          component={Denuncias}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="report" color={color} marginTop={5} size={35} />
            ),
            headerTitle: 'Denúncias',
          }}
        />
      )}
      <Tab.Screen
        name="Perfil"
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} marginTop={5} size={35} />
          ),
          headerTitle: 'Perfil',
        }}
      >
        {() => <Perfil setIsLoggedIn={setIsLoggedIn} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const AuthStack = ({ setIsRegistering, setHasLoggedIn }) => (
  <Stack.Navigator>
    <Stack.Screen
      name="Login"
      options={{ headerShown: false }}
    >
      {props => <Login {...props} setHasLoggedIn={setHasLoggedIn} />}
    </Stack.Screen>
    <Stack.Screen
      name="Cadastro"
      component={props => <Cadastro {...props} setIsRegistering={setIsRegistering} />}
      options={{ title: 'Cadastre-se!', headerStyle: { backgroundColor: 'white' }, headerTintColor: 'black', headerTitleAlign: 'center' }}
    />
    <Stack.Screen
      name="RecSenha"
      component={RecSenha}
      options={{ title: 'Esqueceu a senha?', headerStyle: { backgroundColor: 'white' }, headerTintColor: 'black', headerTitleAlign: 'center'  }}
    />
  </Stack.Navigator>
);

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setIsLoggedIn(true);

        if (isRegistering) {
          setShowIntro(true);
        } else if (hasLoggedIn) {
          setShowAlert(true);
          setHasLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    });

    return unsubscribe;
  }, [isRegistering, hasLoggedIn]);

  return (
    <ThemeProvider>
      <View style={{ flex: 1 }}>
        <NavigationContainer>
          {isLoggedIn ? (
            <AppTabs setIsLoggedIn={setIsLoggedIn} />
          ) : (
            <AuthStack setIsRegistering={setIsRegistering} setHasLoggedIn={setHasLoggedIn} />
          )}
        </NavigationContainer>
        {showIntro && (
          <IntroTutorial onClose={() => setShowIntro(false)} />
        )}
        {showAlert && !showIntro && (
          <AlertaBV
            visible={showAlert}
            title="beSafe"
            message="Seja bem-vindo(a) ao beSafe!"
            onClose={() => setShowAlert(false)}
          />
        )}
      </View>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
