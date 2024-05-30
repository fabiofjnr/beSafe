import { useNavigation } from "@react-navigation/native";
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function Login() {
    const navegacao = useNavigation();

    return (
        <View style={styles.container}>
            <Image style={styles.img} source={require('../../assets/logo.png')} />


            <View style={styles.inputcontainer}>
                <Icon name="at" size={30} color="black" style={styles.icon} />
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
                <Icon name="key" size={30} color="black" style={styles.icon} />
                <TextInput
                    placeholder="Senha"
                    placeholderTextColor="black"
                    autoCapitalize="none"
                    secureTextEntry
                    style={styles.input}
                />
            </View>

            <TouchableOpacity style={styles.esqueceuasenha} onPress={() => navegacao.navigate('esqueceuasenha')}>
                <Text style={styles.esqueceuasenhatxt}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>ENTRAR</Text>
            </TouchableOpacity>


            <View style={styles.login2}>
                <TouchableOpacity style={styles.loginapps} onPress={() => navegacao.navigate('google')}>
                    <Image style={styles.imglogin} source={require('../../assets/google.png')} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.loginapps} onPress={() => navegacao.navigate('twitter')}>
                    <Image style={styles.imglogin} source={require('../../assets/twitter.png')} />
                </TouchableOpacity>
            </View>


            <TouchableOpacity style={styles.cadastrese} onPress={() => navegacao.navigate('Cadastro')}>
                <Text style={styles.cadastresetxt}>Não tem uma conta? Cadastre-se</Text>
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

    input: {
        height: 40,
        width: 250,
        paddingHorizontal: 10,
        borderRadius: 15,
        backgroundColor: '#d5dbe3',
        color: 'black',
    },

    button: {
        backgroundColor: '#ADD9F6',
        width: 250,
        padding: 13,
        marginBottom: 10,
        borderRadius: 15,
    },

    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },

    esqueceuasenha: {
        backgroundColor: '#fff',
        width: 250,
        padding: 10,
        marginBottom: 70,
        marginTop: -5,
    },

    esqueceuasenhatxt: {
        color: '#EBADFA',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 15,
        textDecorationLine: 'underline',
    },

    cadastrese: {
        backgroundColor: '#fff',
        width: 250,
        padding: 10,
        marginBottom: 10,
    },


    cadastresetxt: {
        color: '#EBADFA',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 14,
    },

    buttonContainer: {
        flex: 1,
        width: '70%',
    },

    img: {
        width: 390,
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
      },
    
      icon: {
        marginRight: 10,
        width: 30,
      },

});

