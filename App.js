import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import React from 'react';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Posts from './pages/Posts';
import Respostas from './pages/Respostas';
import Enquetes from './pages/Enquetes';
import Curtidas from './pages/Curtidas';

const Menu = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Menu.Navigator>

        <Menu.Screen
          name="Login"
          component={Login}
          options={{
            headerShown: false,
            headerTintColor: 'black',
          }}
        />

        <Menu.Screen
          name='Cadastro'
          component={Cadastro}
          options={{
            title: 'Cadastre-se!',
            headerStyle: {
              backgroundColor: 'white',
              borderBottomWidth: 0, 
              borderColor: 'transparent', 
              elevation: 0, 
              shadowOpacity: 0, 
            },
            headerTintColor: 'black',
            headerTitleAlign: 'center',
            fontWeight: 'BreeSerif-Regular',
          }}
        />



        <Menu.Screen
          name='Posts'
          component={Posts}
          options={{
            title: 'Posts beSafe',
            headerStyle: {
              backgroundColor: 'white',
              borderBottomWidth: 0,
            },
            headerTintColor: 'black',
            headerTitleAlign: 'center',
            fontWeight: 'BreeSerif-Regular',
          }
          }
        />

        <Menu.Screen
          name='Respostas'
          component={Respostas}
          options={{
            title: 'Respostas beSafe',
            headerStyle: {
              backgroundColor: 'white',
              borderBottomWidth: 0,
            },
            headerTintColor: 'black',
            headerTitleAlign: 'center',
            fontWeight: 'BreeSerif-Regular',
          }
          }
        />

        <Menu.Screen
          name='Enquetes'
          component={Enquetes}
          options={{
            title: 'Enquetes beSafe',
            headerStyle: {
              backgroundColor: 'white',
              borderBottomWidth: 0,
            },
            headerTintColor: 'black',
            headerTitleAlign: 'center',
            fontWeight: 'BreeSerif-Regular',
          }
          }
        />

        <Menu.Screen
          name='Curtidas'
          component={Curtidas}
          options={{
            title: 'Curtidas beSafe',
            headerStyle: {
              backgroundColor: 'white',
              borderBottomWidth: 0,
            },
            headerTintColor: 'black',
            headerTitleAlign: 'center',
            fontWeight: 'BreeSerif-Regular',
          }
          }
        />

      </Menu.Navigator>
    </NavigationContainer>
  );
}


