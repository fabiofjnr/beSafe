import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import AlertaLogin from '../Alertas/AlertaLogin';
import { useTheme } from '../../ThemeContext';

const NovoPost = ({ globalFontSize }) => {
  const { isDarkMode } = useTheme();
  const [content, setContent] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const navigation = useNavigation();
  const user = auth.currentUser;

  const styles = createStyles(globalFontSize);

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
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === 'Enter' && !nativeEvent.shiftKey) {
              handlePost();
            }
          }}
        />
      </View>
      <AlertaLogin
        visible={showAlert}
        title={
          <Text style={{ alignItems: "center", textAlign: "center", fontSize: globalFontSize + 4 }}>
          <Ionicons name="checkmark-circle" size={20} color="#27ae60" /> • Sucesso
        </Text>
        }
        message={alertMessage}
        onClose={handleCloseAlert}
      />
    </View>
  );
};

const createStyles = (globalFontSize) =>
  StyleSheet.create({
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
      paddingVertical: 15,
      paddingHorizontal: 10 + globalFontSize / 2,
      borderRadius: 15,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ccc',
      flexShrink: 1,
    },
    publishButtonText: {
      color: 'white',
      fontSize: 4 + globalFontSize,
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
      fontSize: 11 + globalFontSize,
    }
  });

export default NovoPost;
