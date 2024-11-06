import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import AlertaLogin from '../Alertas/AlertaLogin';
import { useTheme } from '../../ThemeContext';

const NovoPost = () => {
  const { isDarkMode } = useTheme();
  const [content, setContent] = useState('');
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

  const handlePost = async () => {
    if (!user) {
      setAlertTitle('Erro');
      setAlertMessage('Usuário não autenticado');
      setShowAlert(true);
      return;
    }

    if (!content.trim()) {
      setAlertTitle('Erro');
      setAlertMessage('O conteúdo do post não pode estar vazio');
      setShowAlert(true);
      return;
    }

    try {
      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        username: user.displayName,
        profilePictureURL: user.photoURL,
        content: content.trim(),
        timestamp: serverTimestamp(),
        likes: [],
        comments: [],
        savedBy: [],
      });
      setAlertTitle('Sucesso');
      setAlertMessage('Publicação postada com sucesso!');
      setShowAlert(true);
      setContent('');
    } catch (error) {
      console.error('Erro ao criar post:', error);
      setAlertTitle('Erro');
      setAlertMessage('Não foi possível criar o post. Tente novamente.');
      setShowAlert(true);
    }
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
    if (alertTitle === 'Sucesso') {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1A1F36' : 'white' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <MaterialIcons name="arrow-back" size={35} style={[styles.closeButton, { color: isDarkMode ? 'white' : 'black' }]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePost} style={[styles.publishButton, { backgroundColor: isDarkMode ? '#005a99' : '#3a9ee4' }]}>
          <Text style={styles.publishButtonText}>PUBLICAR</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>
        <Image
          source={profilePicture ? { uri: profilePicture } : require('../../assets/avatarpadrao.png')}
          style={styles.profilePicture}
        />
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#1A1F36' : 'white', color: isDarkMode ? 'white' : 'black' }]}
          placeholder="Desabafe aqui..."
          multiline
          value={content}
          placeholderTextColor={isDarkMode ? 'white' : 'black'}
          onChangeText={setContent}
        />
      </View>
      <AlertaLogin
        visible={showAlert}
        title={alertTitle}
        message={alertMessage}
        onClose={handleCloseAlert}
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
    height: 650,
    borderRadius: 10,
    paddingHorizontal: 15,
    textAlignVertical: 'top',
    backgroundColor: 'white',
    marginTop: 10,
    fontFamily: 'BreeSerif',
    fontSize: 25,
  }
});

export default NovoPost;
