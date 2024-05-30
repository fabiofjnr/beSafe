import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CadastroScreen = () => {
  return (
    <View style={styles.container}>

      <Image style={styles.img} source={require('../../assets/logo.png')} />

      <View style={styles.inputcontainer}>
        <Icon name="account" size={25} color="black" style={styles.icon} />
        <TextInput
          placeholder="Nome"
          placeholderTextColor="black"
          autoCapitalize="words"
          keyboardType="default"
          style={styles.input}
        />
      </View>

      <View style={styles.inputcontainer}>
        <Icon name="email" size={25} color="black" style={styles.icon} />
        <TextInput
          placeholder="Email"
          placeholderTextColor="black"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={styles.input}
        />
      </View>

      <View style={styles.inputcontainer}>
        <Icon name="shield-lock-outline" size={25} color="black" style={styles.icon} />
        <TextInput
          placeholder="Senha"
          placeholderTextColor="black"
          autoCapitalize="none"
          secureTextEntry
          style={styles.input}
        />
      </View>

      <View style={styles.inputcontainer}>
        <Icon name="check-circle" size={25} color="black" style={styles.icon} />
        <TextInput
          placeholder="Confirme a senha"
          autoCapitalize="none"
          placeholderTextColor="black"
          secureTextEntry
          style={styles.input}
        />
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>CADASTRAR</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 20,
  },

  input: {
    height: 30,
    width: 200,
    borderRadius: 0,
    backgroundColor: '#d5dbe3',
    color: 'black',
  },

  button: {
    backgroundColor: '#ADD9F6',
    width: 250,
    padding: 13,
    borderRadius: 15,
    marginTop: 30,
  },

  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  img: {
    width: 390,
    height: 300,
    borderColor: 'black',
    marginTop: 28,
    marginBottom: 10,
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
    marginRight: 20,
    width: 30,
  },


});

export default CadastroScreen;