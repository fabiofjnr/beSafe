import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebase';
import { doc, setDoc, serverTimestamp, collection, getDoc } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import AlertaLogin from '../Alertas/AlertaLogin';
import { useTheme } from '../../ThemeContext';

const NovaEnquete = () => {
  const { isDarkMode } = useTheme();
  const [content, setContent] = useState('');
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const navigation = useNavigation();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfilePicture(data.profilePictureURL || null);
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleSubmit = async () => {
    if (!user) {
      setAlertTitle('Erro');
      setAlertMessage('Usuário não autenticado');
      setShowAlert(true);
      return;
    }

    if (!content.trim() || !option1.trim() || !option2.trim()) {
      setAlertTitle('Erro');
      setAlertMessage('Todos os campos são obrigatórios');
      setShowAlert(true);
      return;
    }

    try {
      const newPollRef = doc(collection(db, 'polls'));
      await setDoc(newPollRef, {
        userId: user.uid,
        content: content.trim(),
        option1: { text: option1.trim(), votes: 0 },
        option2: { text: option2.trim(), votes: 0 },
        usersVoted: [],
        comments: [],
        timestamp: serverTimestamp(),
      });

      setAlertTitle('Sucesso!');
      setAlertMessage('Enquete publicada com sucesso!');
      setShowAlert(true);
      setContent('');
      setOption1('');
      setOption2('');
    } catch (error) {
      console.error('Erro ao criar enquete:', error);
      setAlertTitle('Erro');
      setAlertMessage('Não foi possível criar a enquete. Tente novamente.');
      setShowAlert(true);
    }
  };

  const handleAlertClose = () => {
    setShowAlert(false);
    if (alertTitle === 'Sucesso!') {  
      navigation.navigate('Enquetes');
    }
  };
  

  return (
    <View style={[styles.container, {backgroundColor: isDarkMode ? '#1A1F36' : 'white'}]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <MaterialIcons name="arrow-back" size={35}  style={[styles.closeButton, {color: isDarkMode ? 'white' : 'black'}]}/>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSubmit} style={[styles.publishButton, {backgroundColor: isDarkMode ? '#005a99' : '#3a9ee4'}]}>
          <Text style={styles.publishButtonText}>PUBLICAR</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>
        <Image
          source={profilePicture ? { uri: profilePicture } : require('../../assets/avatarpadrao.png')}
          style={styles.profilePicture}
        />
        <TextInput
          style={[styles.input, {backgroundColor: isDarkMode ? '#1A1F36' : 'white', color: isDarkMode ? 'white' : 'black'}]}
          placeholder="Escreva sua pergunta aqui"
          multiline
          value={content}
          onChangeText={setContent}
        />
      </View>
      <TextInput
        style={[styles.inputOption, {backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6'}]}
        placeholder="Opção 1"
        value={option1}
        onChangeText={setOption1}
      />
      <TextInput
        style={[styles.inputOption, {backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6'}]}
        placeholder="Opção 2"
        value={option2}
        onChangeText={setOption2}
      />
      <AlertaLogin
        visible={showAlert}
        title={alertTitle}
        message={alertMessage}
        onClose={handleAlertClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  closeButton: {
    padding: 10
  },
  publishButton: {
    backgroundColor: '#3a9ee4',
    padding: 15,
    borderRadius: 15,
    width: '35%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  publishButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'BreeSerif',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    fontFamily: 'BreeSerif',
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    marginLeft: 15,
  },
  input: {
    flex: 1,
    height: 100,
    borderRadius: 10,
    paddingHorizontal: 15,
    textAlignVertical: 'top',
    backgroundColor: 'white',
    marginTop: 10,
    fontFamily: 'BreeSerif',
    fontSize: 22,
  },
  inputOption: {
    borderWidth: 1,
    borderColor: '#ADD8F6',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    fontFamily: 'BreeSerif',
    fontSize: 20,
    color: 'black',
  },
});

export default NovaEnquete;