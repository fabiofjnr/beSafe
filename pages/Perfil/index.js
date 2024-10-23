import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, KeyboardAvoidingView, Platform, Keyboard, Dimensions, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db, storage } from '../../firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AlertaLogin from '../Alertas/AlertaLogin';
import AlertaLogout from '../Alertas/AlertaLogout';
import { IMAGGA_API_KEY, IMAGGA_API_SECRET } from '@env';
import { useTheme } from '../../ThemeContext';

const Perfil = ({ setIsLoggedIn }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [logoutAlertVisible, setLogoutAlertVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [oldUsername, setOldUsername] = useState('');
  const [imageLabels, setImageLabels] = useState([]);
  const navigation = useNavigation();
  const user = auth.currentUser;

  const { isDarkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setIsKeyboardVisible(true);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setName(data.name || '');
            setUsername(data.username || '');
            setBio(data.bio || '');
            setProfilePicture(data.profilePictureURL || null);
            setOldUsername(data.username || '');
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
        }
      };
      fetchUserData();
    }
  }, [user]);



  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert('Permissão para acessar a galeria de imagens é necessária!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setProfilePicture(imageUri);
    }
  };


  const handleImaggaRequest = async (imageUri) => {
    try {
      console.log('Iniciando análise da imagem:', imageUri);

      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: 'image.jpg',
        type: 'image/jpeg',
      });

      const response = await fetch('https://api.imagga.com/v2/tags', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${IMAGGA_API_KEY}:${IMAGGA_API_SECRET}`)}`,
        },
        body: formData,
      });

      const result = await response.json();
      console.log('Resultado da API:', result);

      if (result.status && result.status.type === "error") {
        console.error('Erro da API:', result.status.text);
        alert(result.status.text);
        return;
      }

      if (result.result && result.result.tags) {
        const tags = result.result.tags.map(tagObj => tagObj.tag.en.toLowerCase());
        console.log('Tags retornadas pela API:', tags);
        return tags;
      } else {
        console.log('Não foi possível encontrar tags na resposta.');
      }
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      alert('Erro ao analisar a imagem. Tente novamente.');
    }
  };

  const isImageInappropriate = (tags) => {
    const inappropriateTags = [
      "brassiere", "lingerie", "erotic", "undergarment", "nude", "topless", "sexual",];
    return tags.some(tag => inappropriateTags.includes(tag));
  };


  const getBase64Image = async (imageUri) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      return base64Data;
    } catch (error) {
      console.error('Erro ao converter a imagem em Base64:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!user) {
      showAlert('beSafe | Erro', 'Usuário não autenticado');
      return;
    }

    if (username && username !== oldUsername && !isValidUsername(username)) {
      showAlert('beSafe | Erro', 'Nome de usuário inválido. Deve conter apenas letras, números, pontos ou sublinhados e ter entre 3 e 12 caracteres.');
      return;
    }

    setLoading(true);

    try {
      let profilePictureURL = profilePicture;

      if (profilePicture && !profilePicture.startsWith('http')) {
        console.log("Analisando imagem antes de salvar...");

        const tags = await handleImaggaRequest(profilePicture);

        if (isImageInappropriate(tags)) {
          console.log('Imagem considerada inapropriada pelas tags:', tags);
          showAlert('⚠️  • Aqui não!', 'Imagem considerada inapropriada. Por favor, escolha outra.');
          setLoading(false);
          return;
        }


        const response = await fetch(profilePicture);
        const blob = await response.blob();
        const storageRef = ref(storage, `profile_pictures/${user.uid}.jpg`);

        await uploadBytes(storageRef, blob);
        profilePictureURL = await getDownloadURL(storageRef);
      }

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        name,
        username,
        bio,
        profilePictureURL,
      }, { merge: true });

      showAlert('beSafe | Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      showAlert('beSafe | Erro', 'Não foi possível atualizar o perfil.');
    } finally {
      setLoading(false);
    }
  };

  const isValidUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9._]{3,24}$/;
    return usernameRegex.test(username);
  };

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
  };

  const confirmLogout = () => {
    auth.signOut().then(() => {
      setIsLoggedIn(false);
    }).catch((error) => {
      console.error('Erro ao sair:', error);
      showAlert('beSafe | Erro', 'Não foi possível sair da conta.');
    });
  };

  const handleLogout = () => {
    setLogoutAlertVisible(true);
  };

  const handleLogoutClose = () => {
    setLogoutAlertVisible(false);
  };


  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, {backgroundColor: isDarkMode ? '#1A1F36' : 'white' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: isKeyboardVisible ? keyboardHeight : 20, backgroundColor: isDarkMode ? '#1A1F36' : 'white'  }]}
        keyboardShouldPersistTaps='handled'
      >

        <TouchableOpacity onPress={toggleDarkMode} style={styles.darkModeButton}>
          <Ionicons name={isDarkMode ? "moon" : "sunny"} size={30} color={isDarkMode ? "yellow" : "black"} />
        </TouchableOpacity>

        <View style={styles.profilePictureContainer}>
          <TouchableOpacity onPress={handleImagePicker}>
            <Image
              source={profilePicture ? { uri: profilePicture } : require('../../assets/avatarpadrao.png')}
              style={styles.profilePicture}
            />
          </TouchableOpacity>
          <Text onPress={handleImagePicker} style={[styles.changePictureText, {color: isDarkMode ? '#DCDCDC' : '#007bff'}]}>Alterar foto</Text>
        </View>

        <View style={[styles.formContainer, {backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6',}]}>
          <Text style={styles.label}>Nome</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-circle-outline" size={24} color="black" style={styles.icon} />
            <TextInput
              placeholder="Seu nome aqui!"
              style={[styles.input, { color: isDarkMode ? 'white' : 'black', backgroundColor: isDarkMode ? '#1A1F36' : '#f9f9f9' }]}
              value={name}
              onChangeText={setName}
              maxLength={100}
              color={isDarkMode ? 'white' : 'white'}
              placeholderTextColor={isDarkMode ? 'white' : 'black'}
            />
          </View>

          <Text style={styles.label}>Nome de usuário </Text>
          <View style={styles.inputContainer}>
            <Ionicons name="at-outline" size={24} color="black" style={styles.icon} />
            <TextInput
              placeholder="Seu nome de usuário aqui! (@)"
              style={[styles.input, { color: isDarkMode ? '#DCDCDC' : 'black', backgroundColor: isDarkMode ? '#1A1F36' : '#f9f9f9' }]}
              value={username}
              onChangeText={setUsername}
              maxLength={24}
              placeholderTextColor={isDarkMode ? 'white' : 'black'}
            />
          </View>

          <Text style={styles.label}>Biografia</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="receipt-outline" size={24} color="black" style={styles.icon} />
            <TextInput
              placeholder="Aqui você escreve sua biografia, conte-nos um pouco sobre você!"
              style={[styles.input, styles.bioInput, { color: isDarkMode ? '#DCDCDC' : 'black', backgroundColor: isDarkMode ? '#1A1F36' : '#f9f9f9' }]}
              value={bio}
              onChangeText={setBio}
              multiline={true}
              numberOfLines={3}
              maxLength={87}
              placeholderTextColor={isDarkMode ? 'white' : 'black'}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'SALVANDO...' : 'SALVAR'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>SAIR DA CONTA</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AlertaLogin
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={handleAlertClose}
      />
      <AlertaLogout
        visible={logoutAlertVisible}
        title="Confirmar Logout"
        message="Você tem certeza que deseja sair da conta?"
        onClose={handleLogoutClose}
        onConfirm={confirmLogout}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ddd',
  },
  changePictureText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'BreeSerif',
  },
  formContainer: {
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  label: {
    marginBottom: 7,
    marginLeft: 40,
    fontWeight: 'bold',
    color: 'black',
    fontFamily: 'BreeSerif',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    flex: 1,
    backgroundColor: '#f9f9f9',
    fontFamily: 'BreeSerif',
  },
  bioInput: {
    height: 150,
    textAlignVertical: 'top',
    fontFamily: 'BreeSerif',
  },
  icon: {
    marginRight: 10,
  },
  button: {
    backgroundColor: '#3a9ee4',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#cff0cc',
  },
  logoutButton: {
    backgroundColor: '#FF6347',
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'BreeSerif',
  },
});

export default Perfil;
