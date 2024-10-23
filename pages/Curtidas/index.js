import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, query, getDocs, where, documentId, updateDoc, arrayRemove } from 'firebase/firestore';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../ThemeContext';

const Curtidas = () => {
  const { isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [likedPosts, setLikedPosts] = useState([]);
  const navigation = useNavigation();
  const user = auth.currentUser;

  const fetchUserData = async () => {
    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || '');
          setUsername(data.username || 'Sem nome de usuário');
          setBio(data.bio || 'Sem biografia');
          setProfilePicture(data.profilePictureURL || null);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      }
    }
  };

  const fetchLikedPosts = async () => {
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const likedPostIds = userData.likedPosts || [];

          if (likedPostIds.length > 0) {
            const postsQuery = query(collection(db, 'posts'), where(documentId(), 'in', likedPostIds));
            const querySnapshot = await getDocs(postsQuery);
            const fetchedPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const postsWithUserData = await Promise.all(fetchedPosts.map(async post => {
              const userRef = doc(db, 'users', post.userId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userData = userSnap.data();
                return { ...post, user: userData };
              }
              return post;
            }));

            const sortedPosts = postsWithUserData.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
            
            setLikedPosts(sortedPosts);
          } else {
            setLikedPosts([]);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar posts curtidos:', error);
      }
    }
  };

  const handleUnlike = async (postId) => {
    const postRef = doc(db, 'posts', postId);
    const userRef = doc(db, 'users', user.uid);

    try {
      await updateDoc(postRef, {
        likes: arrayRemove(user.uid)
      });
      await updateDoc(userRef, {
        likedPosts: arrayRemove(postId)
      });
      fetchLikedPosts();
    } catch (error) {
      console.error('Erro ao descurtir o post:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      fetchLikedPosts();
    }, [user])
  );

  const renderPost = ({ item }) => (
    <View style={[styles.postContainer, { backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6'}]}>
      <View style={styles.postHeader}>
        <Image
          source={item.user?.profilePictureURL ? { uri: item.user.profilePictureURL } : require('../../assets/avatarpadrao.png')}
          style={styles.postProfilePicture}
        />
        <View style={styles.postUserInfo}>
          <Text style={styles.postName}>{item.user?.name || 'Usuário'}</Text>
          <Text style={[styles.postUsername, {color: isDarkMode ? '#363636' : '#4F4F4F'}]}>@{item.user?.username || 'username'}</Text>
        </View>
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
      <Text style={[styles.postTimestamp, {color: isDarkMode ? 'black' : '#4F4F4F'}]}>
        {item.timestamp?.toDate().toLocaleString()}
      </Text>
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.icones} onPress={() => handleUnlike(item.id)}>
          <FontAwesome name="heart" size={24} color="red" />
          <Text style={styles.likeCount}>{item.likes?.length || 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, {backgroundColor: isDarkMode ? '#1A1F36' : 'white'}]}>
      <View style={[styles.profileContainer, {backgroundColor: isDarkMode ? '#1A1F36' : 'white'}]}>
        <Image
          source={profilePicture ? { uri: profilePicture } : require('../../assets/avatarpadrao.png')}
          style={styles.profilePicture}
        />
        <View style={styles.infoContainer}>
          <Text style={[styles.name, {color: isDarkMode ? 'white' : 'black'}]}>{name}</Text>
          <Text style={[styles.username, {color: isDarkMode ? 'white' : 'black'}]}>@{username}</Text>
          <Text style={[styles.bio, {color: isDarkMode ? 'white' : 'black'}]}>{bio}</Text>
        </View>
        <TouchableOpacity style={[styles.editButton, { backgroundColor: isDarkMode ? '#005a99' : '#3a9ee4' }]} onPress={() => navigation.navigate('Perfil')}>
        <MaterialIcons name="edit" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <View style={[styles.buttonContainer, { backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6', borderColor: isDarkMode ? 'white' : 'black', borderTopWidth: isDarkMode ? 2 : 1}]}>
        <TouchableOpacity style={[styles.navButton, { backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6'}]} onPress={() => navigation.navigate('Posts')}>
          <Text style={styles.navButtonText}>Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton, { backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6'}]} onPress={() => navigation.navigate('Enquetes')}>
          <Text style={styles.navButtonText}>Enquetes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton, { backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6'}]} onPress={() => navigation.navigate('Respostas')}>
          <Text style={styles.navButtonText}>Respostas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton1, { backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6', borderColor: isDarkMode ? 'white' : 'black'}]} onPress={() => navigation.navigate('Curtidas')}>
          <Text style={styles.navButtonText1}>Curtidas</Text>
        </TouchableOpacity>
      </View>
      {likedPosts.length > 0 ? (
        <FlatList
          data={likedPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.postsList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: isDarkMode ? 'white' : 'black'}]}>Você não curtiu nenhuma publicação ainda.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    height: '33%',
  },
  profilePicture: {
    width: 130,
    height: 130,
    borderRadius: 100,
    marginRight: 35,
    marginLeft: 30,
    marginTop: 20,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    color: '#000',
    marginBottom: 5,
    marginTop: 10,
    fontFamily: 'BreeSerif',
  },
  username: {
    fontSize: 20,
    color: '#000',
    marginBottom: 5,
    fontFamily: 'BreeSerif',
  },
  bio: {
    fontSize: 13,
    color: '#000',
    fontFamily: 'BreeSerif',
    marginBottom: 15,
  },
  editButton: {
    position: 'absolute',
    bottom: 20,
    right: 33,
    backgroundColor: '#3a9ee4',
    borderRadius: 18,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  editButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontFamily: 'BreeSerif',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#ADD8F6',
    borderBottomColor: 'black',
    borderTopWidth: 1,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    padding: 2,
    marginHorizontal: 5,
    backgroundColor: '#ADD8F6',
  },
  navButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontFamily: 'BreeSerif',
    fontSize: 16,
  },
  navButton1: {
    flex: 1,
    alignItems: 'center',
    padding: 2,
    marginHorizontal: 5,
    backgroundColor: '#ADD8F6',
    borderBottomWidth: 1,
  },
  navButtonText1: {
    color: 'black',
    fontWeight: 'bold',
    fontFamily: 'BreeSerif',
    fontSize: 16,
  },
  postsList: {
    paddingBottom: 20,
    marginTop: 15,
  },
  postContainer: {
    backgroundColor: '#ADD8F6',
    borderRadius: 20,
    padding: 10,
    marginVertical: 10,
    marginHorizontal: 20,
    width: '85%',
    marginLeft: '8%',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  postProfilePicture: {
    width: 45,
    height: 45,
    borderRadius: 25,
  },
  postUserInfo: {
    marginLeft: 10,
  },
  postName: {
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'BreeSerif',
  },
  postUsername: {
    color: '#4F4F4F',
    fontSize: 14,
    fontFamily: 'BreeSerif',
  },
  postContent: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'left',
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
    color: '#4F4F4F',
    marginTop: 10,
    marginBottom: 5,
    fontFamily: 'BreeSerif',
    alignItems: "center",
    textAlign: "center",
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

export default Curtidas;
