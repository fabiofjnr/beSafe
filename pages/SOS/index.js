import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Dimensions, ScrollView } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../../ThemeContext';

const { width, height } = Dimensions.get('window');

const SOS = () => {

  const { isDarkMode } = useTheme();
  
  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: isDarkMode ? '#1A1F36' : 'white' }} 
      contentContainerStyle={styles.scrollViewContent}
    >
      <View style={[styles.caixinha, styles.caixinha1, {backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6'}]}>
        <TouchableOpacity style={styles.caixinhaContent} onPress={() => Linking.openURL('tel:188')}>
          <FontAwesome name="phone" size={40} color="black" />
          <View style={styles.textContainer}>
            <Text style={styles.caixinhaTitle}>188</Text>
            <Text style={styles.caixinhaText}>
              Caso esteja em uma situação em que desabafos não são mais suficientes, clique no botão de ligar ao lado para entrar em contato com o Centro de Valorização da Vida!
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.caixinha, styles.caixinha2, {backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6'}]}>
        <TouchableOpacity style={styles.caixinhaContent} onPress={() => Linking.openURL('https://servidorseguro.mysuite1.com.br/client/chatan.php?&h=cd1edd1547c5e91058f4f6b95511c427&inf=&sl=cvw')}>
          <FontAwesome name="comments" size={40} color="black" />
          <View style={styles.textContainer}>
            <Text style={styles.caixinhaTitle}>Voluntário Treinado</Text>
            <Text style={styles.caixinhaText}>
              Caso queira ser atendido(a) por um voluntário com respeito e anonimato, que guardará sigilo sobre tudo o que for dito, clique no botão de chat ao lado. Os voluntários são treinados para conversar com todas as pessoas que procuram ajuda e apoio emocional.
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingHorizontal: 20, 
    paddingTop: height * 0.05, 
    paddingBottom: height * 0.05, 
    justifyContent: 'center', 
    alignItems: 'center',
    flexGrow: 1, 
  },  title: {
    fontSize: width * 0.1,
    color: '#3a9ee4',
    marginBottom: height * 0.05,
    fontFamily: 'BreeSerif',
  },
  caixinha: {
    width: '96%',
    padding: '5%',
    marginBottom: height * 0.03,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  caixinha1: {
  },
  caixinha2: {
  },
  caixinhaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  textContainer: {
    marginLeft: width * 0.03,
    flex: 1,
    fontFamily: 'BreeSerif',
  },
  caixinhaTitle: {
    fontSize: 30,
    color: 'black',
    marginBottom: height * 0.01,
    fontFamily: 'BreeSerif',
  },
  caixinhaText: {
    fontSize: 20,
    color: 'black',
    fontFamily: 'BreeSerif',
  },
});

export default SOS;
