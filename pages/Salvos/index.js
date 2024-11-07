import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, query, getDocs, updateDoc, arrayRemove, orderBy, deleteDoc } from 'firebase/firestore';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AlertaExcluir from '../Alertas/AlertaExcluir';
import AlertaLogin from '../Alertas/AlertaLogin'; 
import { useTheme } from '../../ThemeContext';

const Salvos = () => {

  const { isDarkMode } = useTheme();
  const [savedPosts, setSavedPosts] = useState([]);
  const navigation = useNavigation();
  const user = auth.currentUser;
  const [postToDelete, setPostToDelete] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false); 

  const fetchSavedPosts = async () => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const savedPostIds = userData.savedPosts || [];

      const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(postsQuery);

      const allPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filteredPosts = allPosts.filter(post => savedPostIds.includes(post.id));

      const postsWithUserData = await Promise.all(filteredPosts.map(async post => {
        const userRef = doc(db, 'users', post.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          return { ...post, user: userData };
        }
        return post;
      }));

      setSavedPosts(postsWithUserData);
    }
  };

  const handleSavePost = async (postId) => {
    const userId = auth.currentUser.uid;
    const userRef = doc(db, 'users', userId);
    const postRef = doc(db, 'posts', postId);

    try {
      const postSnapshot = await getDoc(postRef);
      const userSnapshot = await getDoc(userRef);

      if (postSnapshot.exists() && userSnapshot.exists()) {
        const postData = postSnapshot.data();
        const userData = userSnapshot.data();

        const postSavedBy = Array.isArray(postData.savedBy) ? postData.savedBy : [];
        const userSavedPosts = Array.isArray(userData.savedPosts) ? userData.savedPosts : [];

        if (postSavedBy.includes(userId)) {
          await updateDoc(postRef, {
            savedBy: arrayRemove(userId),
          });
          await updateDoc(userRef, {
            savedPosts: arrayRemove(postId),
          });
        }
        fetchSavedPosts(); 
      }
    } catch (error) {
      console.error('Erro ao salvar o post:', error);
    }
  };

  const confirmDeletePost = (postId) => {
    setPostToDelete(postId);
    setShowAlert(true);
  };

  const handleDeletePost = async () => {
    if (postToDelete) {
      try {
        const postRef = doc(db, 'posts', postToDelete);
        await deleteDoc(postRef);
        fetchSavedPosts();
        setPostToDelete(null);
        setShowAlert(false);
        setShowSuccessAlert(true); 
      } catch (error) {
        console.error('Erro ao excluir o post:', error);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSavedPosts();
    }, [user])
  );

  const renderPost = ({ item }) => {
    const postSavedBy = item.savedBy || []; 

    return (
      <View style={[styles.postContainer, { backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6' }]}>
        <View style={styles.postHeader}>
          <Image
            source={item.user?.profilePictureURL ? { uri: item.user.profilePictureURL } : require('../../assets/avatarpadrao.png')}
            style={styles.postProfilePicture}
          />
          <View style={styles.postUserInfo}>
            <Text style={[styles.postName, {color: isDarkMode ? 'black' : 'black'}]}>{item.user?.name || 'Usuário'}</Text>
            <Text style={[styles.postUsername, {color: isDarkMode ? 'black' : '#4F4F4F'}]}>@{item.user?.username || 'username'}</Text>
          </View>
          {(item.userId === user.uid) && (
            <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDeletePost(item.id)}>
              <MaterialIcons name="more-vert" size={24} color={isDarkMode ? 'white' : 'black'} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.postContent, {color: isDarkMode ? 'black' : 'black'}]}>{item.content}</Text>
        <Text style={[styles.postTimestamp, {color: isDarkMode ? 'black' : '#4F4F4F'}]}>
          {item.timestamp?.toDate().toLocaleString()}
        </Text>
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.icones} onPress={() => handleSavePost(item.id)}>
            <Ionicons name={postSavedBy.includes(user.uid) ? 'bookmark' : 'bookmark-outline'} size={24} color={isDarkMode ? 'black' : 'black'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: isDarkMode ? '#1A1F36' : 'white' }]}>
      <View style={[styles.header, {backgroundColor: isDarkMode ? '#1A1F36' : 'white' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, {color: isDarkMode ? 'white' : 'black' }]}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: isDarkMode ? 'white' : 'black'}]}></Text>
      </View>
      <View style={[styles.separator, {backgroundColor: isDarkMode ? 'white' : 'black' }]} />
      {savedPosts.length > 0 ? (
        <FlatList
          data={savedPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.postsList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, {color: isDarkMode ? 'white' : 'black'}]}>Você não salvou nenhuma publicação ainda.</Text>
        </View>
      )}
      <AlertaExcluir
        visible={showAlert}
        title="Excluir Publicação?"
        message="O que deseja fazer?"
        onClose={() => setShowAlert(false)}
        onConfirm={() => {
          handleDeletePost();
          setShowAlert(false);
        }}
      />
      <AlertaLogin
        visible={showSuccessAlert}
        title="Sucesso"
        message="Post excluído com sucesso!"
        onClose={() => setShowSuccessAlert(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: 'white',
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'BreeSerif',
  },
  separator: {
    height: 1,
  },
  postsList: {
    paddingBottom: 20,
    marginTop: 20,
  },
  postContainer: {
    borderRadius: 20,
    padding: 10,
    marginVertical: 10,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    width: '80%',
    marginLeft: '10%',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  postProfilePicture: {
    width: 45,
    height: 45,
    borderRadius: 22,
    marginRight: 10,
  },
  postUserInfo: {
    flex: 1,
  },
  postName: {
    fontWeight: 'bold',
    fontFamily: 'BreeSerif',
  },
  postUsername: {
    fontFamily: 'BreeSerif',
  },
  postContent: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    width: '100%',
    fontFamily: 'BreeSerif',
  },
  postActions: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  icones: {
    marginHorizontal: 20,
  },
  likeCount: {
    marginLeft: 8,
    color: 'black',
  },
  postTimestamp: {
    fontSize: 12,
    marginTop: 10,
    marginBottom: 5,
    fontFamily: 'BreeSerif',
  },
  deleteButton: {
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#000',
    fontFamily: 'BreeSerif',
  },
});

export default Salvos;
