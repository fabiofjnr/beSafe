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
import { View, StyleSheet } from 'react-native';
import { auth } from './firebase';
import AlertaBV from './pages/Alertas/AlertaBV';
import { ThemeProvider, useTheme } from './ThemeContext';
import IntroTutorial from './pages/IntroTutorial';
import BotaoAcessibilidade from './pages/Acessibilidade';

const Stack = createNativeStackNavigator();

const OtherScreensStack = ({ globalFontSize }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Posts">
      {(props) => <Posts {...props} globalFontSize={globalFontSize} />}
    </Stack.Screen>
    <Stack.Screen name="Enquetes">
      {(props) => <Enquetes {...props} globalFontSize={globalFontSize} />}
    </Stack.Screen>
    <Stack.Screen name="Respostas">
      {(props) => <Respostas {...props} globalFontSize={globalFontSize} />}
    </Stack.Screen>
    <Stack.Screen name="Curtidas">
      {(props) => <Curtidas {...props} globalFontSize={globalFontSize} />}
    </Stack.Screen>
    <Stack.Screen name="NovoPost">
      {(props) => <NovoPost {...props} globalFontSize={globalFontSize} />}
    </Stack.Screen>
    <Stack.Screen name="NovaEnquete">
      {(props) => <NovaEnquete {...props} globalFontSize={globalFontSize} />}
    </Stack.Screen>
  </Stack.Navigator>
);


const Tab = createBottomTabNavigator();

const AppTabs = ({ setIsLoggedIn, globalFontSize }) => {
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
          fontSize: 14 + globalFontSize,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" color={color} size={35} marginTop={5} />
          ),
        }}
      >
        {(props) => <OtherScreensStack {...props} globalFontSize={globalFontSize} />}
      </Tab.Screen>

      <Tab.Screen
        name="SOS"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="phone-in-talk" color={color} marginTop={5} size={35} />
          ),
          headerTitle: 'S.O.S.',
        }}
      >
        {(props) => <SOS {...props} globalFontSize={globalFontSize} />}
      </Tab.Screen>

      <Tab.Screen
        name="IAchat"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="chat" color={color} marginTop={5} size={35} />
          ),
          headerShown: false,
        }}
      >
        {(props) => <IAchat {...props} globalFontSize={globalFontSize} />}
      </Tab.Screen>

      <Tab.Screen
        name="Salvos"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="bookmark" color={color} marginTop={5} size={35} />
          ),
          headerTitle: 'Salvos',
        }}
      >
        {(props) => <Salvos {...props} globalFontSize={globalFontSize} />}
      </Tab.Screen>

      {allowedEmails.includes(userEmail) && (
        <Tab.Screen
          name="Denuncias"
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="report" color={color} marginTop={5} size={35} />
            ),
            headerTitle: 'Denúncias',
          }}
        >
          {(props) => <Denuncias {...props} globalFontSize={globalFontSize} />}
        </Tab.Screen>
      )}

      <Tab.Screen
        name="Perfil"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" color={color} marginTop={5} size={35} />
          ),
          headerTitle: 'Perfil',
        }}
      >
        {(props) => <Perfil {...props} setIsLoggedIn={setIsLoggedIn} globalFontSize={globalFontSize} />}
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
      options={{ title: 'Cadastre-se!', headerStyle: { backgroundColor: 'white' }, headerTintColor: 'black', headerTitleAlign: 'center' }}
    >
      {(props) => <Cadastro {...props} setIsRegistering={setIsRegistering} />}
    </Stack.Screen>

    <Stack.Screen
      name="RecSenha"
      component={RecSenha}
      options={{ title: 'Esqueceu a senha?', headerStyle: { backgroundColor: 'white' }, headerTintColor: 'black', headerTitleAlign: 'center' }}
    />
  </Stack.Navigator>
);

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDaltonismEnabled, setDaltonismEnabled] = useState(false);
  const [isHighContrastEnabled, setHighContrastEnabled] = useState(false);
  const [globalFontSize, setGlobalFontSize] = useState(14);

  const adjustFontSize = (diff) => {
    setGlobalFontSize((prevSize) => prevSize + diff);
  };

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
            <AppTabs setIsLoggedIn={setIsLoggedIn} globalFontSize={globalFontSize} />
          ) : (
            <AuthStack setIsRegistering={setIsRegistering} setHasLoggedIn={setHasLoggedIn} />
          )}

        </NavigationContainer>

        {isLoggedIn && (
          <BotaoAcessibilidade
            setDaltonismEnabled={setDaltonismEnabled}
            setHighContrastEnabled={setHighContrastEnabled}
            setGlobalFontSize={(diff) => setGlobalFontSize(prev => prev + diff)}
          />
        )}

        {isDaltonismEnabled && (
          <View style={[styles.overlay, styles.daltonismFilter]}>
          </View>
        )}

        {isHighContrastEnabled && (
          <View style={[styles.overlay, styles.highContrastFilter]}>
          </View>
        )}

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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  daltonismFilter: {
    backgroundColor: 'rgba(0, 128, 128, 0.3)',
  },
  daltonismText: {
    color: '#404040',
  },
  highContrastFilter: {
    backgroundColor: 'rgba(255, 255, 0, 0.4)',
  },
  highContrastText: {
    color: 'black',
  },
});

export default App;