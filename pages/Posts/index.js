import React, { useState, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList, TextInput, } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { auth, db } from "../../firebase";
import axios from "axios";
import { where, doc, getDoc, collection, query, getDocs, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, deleteDoc, orderBy, } from "firebase/firestore";
import { FontAwesome, Ionicons, MaterialIcons, Entypo } from "@expo/vector-icons";
import AlertaExcluir from "../Alertas/AlertaExcluir";
import AlertaLogin from "../Alertas/AlertaLogin";
import AlertaDenuncia from "../Alertas/AlertaDenuncia";
import { PERSPECTIVE_API_KEY } from "@env";
import { useTheme } from "../../ThemeContext";

const authorizedEmails = [
  "fj878207@gmail.com",
  "anacarolcorr07@gmail.com",
  "isabella.barranjard@gmail.com",
  "contaetec14@gmail.com",
];
const API_KEY = PERSPECTIVE_API_KEY;

const Posts = ({ globalFontSize }) => {
  const { isDarkMode } = useTheme();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("");
  const navigation = useNavigation();
  const user = auth.currentUser;
  const [reportAlertVisible, setReportAlertVisible] = useState(false);
  const [reportSuccessAlertVisible, setReportSuccessAlertVisible] = useState(false);
  const [reportAlreadyReportedAlertVisible, setReportAlreadyReportedAlertVisible] = useState(false);
  const [reportedPosts, setReportedPosts] = useState([]);
  const [selectedPostToReport, setSelectedPostToReport] = useState(null);

  const navigateToNewPost = () => {
    navigation.navigate("NovoPost");
  };

  const styles = createStyles(globalFontSize);

  const fetchUserData = async () => {
    if (user) {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || "");
          setUsername(data.username || "Sem nome de usuário");
          setBio(data.bio || "Sem biografia");
          setProfilePicture(data.profilePictureURL || null);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      }
    }
  };

  const fetchPosts = async () => {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("timestamp", "desc")
    );
    const querySnapshot = await getDocs(postsQuery);
    const fetchedPosts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  
    const postsWithUserData = await Promise.all(
      fetchedPosts.map(async (post) => {
        const userRef = doc(db, "users", post.userId);
        const userSnap = await getDoc(userRef);
  
        if (userSnap.exists()) {
          const userData = userSnap.data();
          return {
            ...post,
            user: { 
              username: userData.username || "username", 
              ...userData 
            }  
          };
        } 

        return { 
          ...post, 
          user: { username: "Usuário desconhecido" } 
        };
      })
    );
  
    setPosts(postsWithUserData);
  };
  

  const handleSavePost = async (postId) => {
    const userId = auth.currentUser.uid;
    const userRef = doc(db, "users", userId);
    const postRef = doc(db, "posts", postId);

    try {
      const postSnapshot = await getDoc(postRef);
      const userSnapshot = await getDoc(userRef);

      if (postSnapshot.exists() && userSnapshot.exists()) {
        const postData = postSnapshot.data();
        const userData = userSnapshot.data();

        const postSavedBy = Array.isArray(postData.savedBy)
          ? postData.savedBy
          : [];
        const userSavedPosts = Array.isArray(userData.savedPosts)
          ? userData.savedPosts
          : [];

        if (postSavedBy.includes(userId)) {
          await updateDoc(postRef, {
            savedBy: arrayRemove(userId),
          });
          await updateDoc(userRef, {
            savedPosts: arrayRemove(postId),
          });
        } else {
          await updateDoc(postRef, {
            savedBy: arrayUnion(userId),
          });
          await updateDoc(userRef, {
            savedPosts: arrayUnion(postId),
          });
        }
        fetchPosts();
      }
    } catch (error) {
      console.error("Erro ao salvar o post:", error);
    }
  };

  const handleLike = async (postId) => {
    const postRef = doc(db, "posts", postId);
    const userId = auth.currentUser.uid;
    const userRef = doc(db, "users", userId);

    try {
      const postSnapshot = await getDoc(postRef);
      const userSnapshot = await getDoc(userRef);

      if (postSnapshot.exists() && userSnapshot.exists()) {
        const postData = postSnapshot.data();
        const userData = userSnapshot.data();

        if (postData.likes.includes(userId)) {
          await updateDoc(postRef, {
            likes: arrayRemove(userId),
          });
          await updateDoc(userRef, {
            likedPosts: arrayRemove(postId),
          });
        } else {
          await updateDoc(postRef, {
            likes: arrayUnion(userId),
          });
          await updateDoc(userRef, {
            likedPosts: arrayUnion(postId),
          });
        }
        fetchPosts();
      }
    } catch (error) {
      console.error("Erro ao curtir o post:", error);
    }
  };

  const handleComment = async (postId) => {
    if (!newComment.trim()) {
      setAlertMessage("O comentário não pode estar vazio");
      setAlertTitle("😶  • Erro");
      setAlertVisible(true);
      return;
    }
  
    const commentsRef = collection(db, "posts", postId, "comments");
    const user = auth.currentUser;
  
    try {
      const isCommentAppropriate = await checkComment(newComment);
      if (!isCommentAppropriate) {
        setAlertMessage("Isso não pode ser dito aqui!");
        setAlertTitle("☝️  • Cuidado com o que diz!");
        setAlertVisible(true);
        return;
      }
  
      await addDoc(commentsRef, {
        userId: user.uid,
        username: user.displayName,
        content: newComment,
        timestamp: serverTimestamp(),
      });
      setNewComment(""); 
      setSelectedPostId(null); 
      fetchPosts(); 
      setAlertMessage("Comentário enviado com sucesso!");
      setAlertTitle("✅  • Sucesso!");
      setAlertVisible(true);
    } catch (error) {
      console.error("Erro ao comentar no post:", error);
    }
  };

  const checkComment = async (comment) => {
    try {
      const response = await axios.post(
        `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${API_KEY}`,
        {
          comment: { text: comment },
          languages: ["pt"],
          languages: ["en"],
          requestedAttributes: { TOXICITY: {} },
        }
      );
      const toxicityScore =
        response.data.attributeScores.TOXICITY.summaryScore.value;
      return toxicityScore < 0.1;
    } catch (error) {
      console.error("Ocorreu um erro ao verificar o comentário:", error);
      return false;
    }
  };

  const fetchUserPostsWithComments = async () => {
    const userPostsQuery = query(
      collection(db, "posts"),
      where("userId", "==", user.uid)
    );
    const querySnapshot = await getDocs(userPostsQuery);

    const userPosts = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const postData = { id: doc.id, ...doc.data() };
        const commentsRef = collection(db, "posts", doc.id, "comments");
        const commentsSnapshot = await getDocs(commentsRef);
        const comments = commentsSnapshot.docs.map((commentDoc) => ({
          id: commentDoc.id,
          ...commentDoc.data(),
        }));
        return { ...postData, comments };
      })
    );

    return userPosts;
  };

  const handleReportPost = async (postId, postOwnerId, postContent, postUser) => { 
    console.log("Iniciando denúncia...");
    console.log("Post User:", postUser);  
  
    if (!postOwnerId) {
      console.error("ID do dono do post não definido");
      setAlertMessage("Não foi possível denunciar este post.");
      setAlertVisible(true);
      return;
    }
  
    let userData = postUser;
    if (!postUser?.username) {
      try {
        const userRef = doc(db, "users", postOwnerId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          userData = userSnap.data();
          console.log("Dados do usuário carregados:", userData);
        } else {
          console.error("Usuário não encontrado no banco de dados.");
          userData = { username: "Usuário desconhecido" };
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        userData = { username: "Usuário desconhecido" };
      }
    } else {
      console.log("Username encontrado em postUser:", postUser.username);
    }
  
    if (user.email !== postOwnerId && !reportedPosts.includes(postId)) {
      setSelectedPostToReport({ 
        postId, 
        postOwnerId, 
        content: postContent, 
        user: userData 
      });
      setReportAlertVisible(true);
    } else {
      setReportAlreadyReportedAlertVisible(true);
    }
  };

  const confirmReportPost = async () => {
    if (selectedPostToReport) {
      try {
        const { postId, postOwnerId } = selectedPostToReport;

        if (!postOwnerId) {
          console.error("O ID do dono do post não está definido.");
          return;
        }

        setReportedPosts([...reportedPosts, postId]);

        const notificationRef = collection(db, "reports");

        await addDoc(notificationRef, {
          content: `Publicação denunciada: \n${selectedPostToReport.content || "Conteúdo não encontrado"}`,
          author: selectedPostToReport.user.name || "Usuário desconhecido",
          reportedBy: user.email,
          timestamp: serverTimestamp(),
        });

        setReportSuccessAlertVisible(true);
      } catch (error) {
        console.error("Erro ao denunciar o post:", error);
      } finally {
        setReportAlertVisible(false);
        setSelectedPostToReport(null);
      }
    }
  };

  const confirmDeletePost = (postId) => {
    setPostToDelete(postId);
    setShowAlert(true);
  };

  const handleDeletePost = async () => {
    if (postToDelete) {
      try {
        const postRef = doc(db, "posts", postToDelete);
        const postSnapshot = await getDoc(postRef);
        const postData = postSnapshot.data();

        if (postSnapshot.exists()) {
          const isAdmin = isAuthorized();
          const isOwner = postData.userId === user.uid;

          if (!isOwner && isAdmin) {
            const notificationRef = collection(db, "notifications");
            await addDoc(notificationRef, {
              userId: postData.userId,
              message: `Seu post foi excluído por um administrador por ser inapropriado. Não repita este comportamento.`,
              timestamp: serverTimestamp(),
              read: false,
            });
          }

          await deleteDoc(postRef);
          fetchPosts();
          setPostToDelete(null);
          setShowAlert(false);
          if (!isOwner && isAdmin) {
            setAlertMessage("Post excluído por ser inapropriado!");
            setAlertTitle("✅  • Sucesso!");
            setAlertVisible(true);
          } else {
            setAlertMessage("Post excluído com sucesso!");
            setAlertTitle("✅  • Sucesso!");
            setAlertVisible(true);
          }
        }
      } catch (error) {
        console.error("Erro ao excluir o post:", error);
      }
    }
  };


  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      fetchPosts();
      fetchUserPostsWithComments();
    }, [user])
  );

  const checkNotifications = async () => {
    const notificationsRef = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("read", "==", false)
    );

    const notificationSnapshot = await getDocs(notificationsRef);
    const notifications = notificationSnapshot.docs.map((doc) => doc.data());

    if (notifications.length > 0) {
      const notification = notifications[0];
      setAlertMessage(notification.message);
      setAlertTitle("⚠️  • Notificação");
      setAlertVisible(true);

      notificationSnapshot.docs.forEach(async (doc) => {
        await updateDoc(doc.ref, { read: true });
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      fetchPosts();
      fetchUserPostsWithComments();
      checkNotifications();
    }, [user])
  );

  const isAuthorized = () => {
    return user && authorizedEmails.includes(user.email);
  };

  const renderPost = ({ item }) => {
    const postSavedBy = item.savedBy || [];

    return (
      <View
        style={[
          styles.postContainer,
          { backgroundColor: isDarkMode ? "#8bb0c9" : "#ADD8F6" },
        ]}
      >
        <View style={styles.postHeader}>
          <Image
            source={
              item.user?.profilePictureURL
                ? { uri: item.user.profilePictureURL }
                : require("../../assets/avatarpadrao.png")
            }
            style={styles.postProfilePicture}
          />
          <View style={styles.postUserInfo}>
            <Text style={styles.postName}>{item.user?.name || "Usuário"}</Text>
            <Text
              style={[
                styles.postUsername,
                { color: isDarkMode ? "#363636" : "#4F4F4F" },
              ]}
            >
              @{item.user?.username || "username"}
            </Text>
          </View>

          {(item.userId === user.uid || isAuthorized()) ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => confirmDeletePost(item.id)}
            >
              <MaterialIcons name="delete" size={10 + globalFontSize} color="black" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => handleReportPost(item.id, item.userId, item.content, item.user)}
            >
              <MaterialIcons name="report" size={10 + globalFontSize} color="black" />
            </TouchableOpacity>
          )}

        </View>
        <Text style={styles.postContent}>{item.content}</Text>
        <Text
          style={[
            styles.postTimestamp,
            { color: isDarkMode ? "black" : "#4F4F4F" },
          ]}
        >
          {item.timestamp?.toDate().toLocaleString()}
        </Text>
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.icones}
            onPress={() =>
              setSelectedPostId(selectedPostId === item.id ? null : item.id)
            }
          >
            <Ionicons name="chatbubble-outline" size={10 + globalFontSize} color="black" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.icones}
            onPress={() => handleLike(item.id)}
          >
            <FontAwesome
              name={item.likes.includes(user.uid) ? "heart" : "heart-o"}
              size={10 + globalFontSize}
              color="red"
            />
            <Text style={styles.likeCount}>{item.likes.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.icones}
            onPress={() => handleSavePost(item.id)}
          >
            <Ionicons
              name={
                postSavedBy.includes(user.uid) ? "bookmark" : "bookmark-outline"
              }
              size={10 + globalFontSize}
              color="black"
            />
          </TouchableOpacity>
        </View>
        {selectedPostId === item.id && (
          <View style={styles.commentInputContainer}>
            <TextInput
              style={[styles.commentInput, { backgroundColor: isDarkMode ? '#1A1F36' : '#f9f9f9', color: isDarkMode ? "white" : "black" }]}
              placeholder="Escreva um comentário..."
              placeholderTextColor={isDarkMode ? "white" : "black"}
              value={newComment}
              onChangeText={setNewComment}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Enter' && !nativeEvent.shiftKey) {
                  handleComment(item.id);
                }
              }}
            />
            <TouchableOpacity
              style={[styles.botaoEnviar, { backgroundColor: isDarkMode ? "#005a99" : "#3a9ee4" }]}
              onPress={() => handleComment(item.id)}
            >
              <Text style={[styles.submitCommentButton, { color: isDarkMode ? "white" : "black" }]}>ENVIAR</Text>
            </TouchableOpacity>
          </View>
        )}
        <FlatList
          data={item.comments}
          keyExtractor={(comment) => comment.id}
          renderItem={({ item: comment }) => (
            <View style={styles.comment}>
              <Text style={styles.commentUser}>{comment.username}:</Text>
              <Text>{comment.content}</Text>
            </View>
          )}
        />
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#1A1F36" : "white" },
      ]}
    >
      <View
        style={[
          styles.profileContainer,
          { backgroundColor: isDarkMode ? "#1A1F36" : "white" },
        ]}
      >
        <Image
          source={
            profilePicture
              ? { uri: profilePicture }
              : require("../../assets/avatarpadrao.png")
          }
          style={styles.profilePicture}
        />
        <View style={styles.infoContainer}>
          <Text
            style={[styles.name, { color: isDarkMode ? "white" : "black" }]}
          >
            {name}
          </Text>
          <Text
            style={[styles.username, { color: isDarkMode ? "white" : "black" }]}
          >
            @{username}
          </Text>
          <Text style={[styles.bio, { color: isDarkMode ? "white" : "black" }]}>
            {bio}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.editButton,
            { backgroundColor: isDarkMode ? "#005a99" : "#3a9ee4" },
          ]}
          onPress={() => navigation.navigate("Perfil")}
        >
          <MaterialIcons
            name="edit"
            size={24}
            color={isDarkMode ? "white" : "white"}
          />
        </TouchableOpacity>
      </View>
      <View
        style={[
          styles.buttonContainer,
          {
            backgroundColor: isDarkMode ? "#8bb0c9" : "#ADD8F6",
            borderColor: isDarkMode ? "white" : "black",
            borderTopWidth: isDarkMode ? 2 : 1,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.navButton1,
            {
              backgroundColor: isDarkMode ? "#8bb0c9" : "#ADD8F6",
              borderColor: isDarkMode ? "white" : "black",
            },
          ]}
          onPress={() => navigation.navigate("Posts")}
        >
          <Text style={styles.navButtonText1}>Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            { backgroundColor: isDarkMode ? "#8bb0c9" : "#ADD8F6" },
          ]}
          onPress={() => navigation.navigate("Enquetes")}
        >
          <Text style={styles.navButtonText}>Enquetes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            { backgroundColor: isDarkMode ? "#8bb0c9" : "#ADD8F6" },
          ]}
          onPress={() => navigation.navigate("Respostas")}
        >
          <Text style={styles.navButtonText}>Respostas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            { backgroundColor: isDarkMode ? "#8bb0c9" : "#ADD8F6" },
          ]}
          onPress={() => navigation.navigate("Curtidas")}
        >
          <Text style={styles.navButtonText}>Curtidas</Text>
        </TouchableOpacity>
      </View>

      {posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text
            style={[
              styles.emptyText,
              { color: isDarkMode ? "white" : "black" },
            ]}
          >
            Nenhuma publicação foi feita ainda.
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.postsList}
        />
      )}

      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: isDarkMode ? "#005a99" : "#3a9ee4" },
        ]}
        onPress={navigateToNewPost}
      >
        <MaterialIcons
          name="add"
          size={24}
          color={isDarkMode ? "white" : "white"}
        />
      </TouchableOpacity>
      <AlertaExcluir
        visible={showAlert}
        title={
          <Text style={{ alignItems: "center", textAlign: "center", fontSize: globalFontSize + 4 }}>
          <Ionicons name="trash-outline" size={20} color="red" /> • Confirmar Exclusão
        </Text>
        }
        message="Deseja excluir esta publicação?"
        onClose={() => setShowAlert(false)}
        onConfirm={() => {
          handleDeletePost();
          setShowAlert(false);
        }}
      />
      <AlertaLogin
        visible={alertVisible}
        message={alertMessage}
        title={alertTitle}
        onClose={() => setAlertVisible(false)}
      />

      <AlertaDenuncia
        visible={reportAlertVisible}
        title={
          <View style={{ alignItems: "center" }}>
            <Text>
              <MaterialIcons name="report" size={20} color="#3a9ee4" /> • Confirmar Denúncia
            </Text>
          </View>
        }
        message="Você confirma a denúncia desta publicação?"
        onClose={() => setReportAlertVisible(false)}
        onConfirm={confirmReportPost}
      />

      <AlertaLogin
        visible={reportSuccessAlertVisible}
        title={
          <View style={{ alignItems: "center" }}>
            <Text>
              <Ionicons name="checkmark-circle" size={20} color="#27ae60" /> • Sucesso
            </Text>
          </View>
        }
        message="Agradecemos pela colaboração. A denúncia foi registrada e logo será analisada!"
        onClose={() => setReportSuccessAlertVisible(false)}
      />

      <AlertaLogin
        visible={reportAlreadyReportedAlertVisible}
        title={
          <View style={{ alignItems: "center" }}>
            <Text>
              <Entypo name="warning" size={20} color="#3a9ee4" /> • Aviso
            </Text>
          </View>
        }
        message="Você já denunciou esta publicação."
        onClose={() => setReportAlreadyReportedAlertVisible(false)}
      />
    </View>
  );
};

const createStyles = (globalFontSize) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "white",
    },
    profileContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      backgroundColor: "white",
      height: "33%",
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
      fontSize: 10 + globalFontSize,
      color: "#000",
      marginBottom: 5,
      marginTop: 10,
      fontFamily: "BreeSerif",
    },
    username: {
      fontSize: 6 + globalFontSize,
      color: "#000",
      marginBottom: 5,
      fontFamily: "BreeSerif",
    },
    bio: {
      fontSize: -1 + globalFontSize,
      color: "#000",
      fontFamily: "BreeSerif",
      marginBottom: 15,
    },
    editButton: {
      position: "absolute",
      bottom: 20,
      right: 33,
      backgroundColor: "#3a9ee4",
      borderRadius: 18,
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      elevation: 5,
    },
    editButtonText: {
      color: "#000",
      fontWeight: "bold",
      fontFamily: "BreeSerif",
    },
    buttonContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-around",
      padding: 10,
      backgroundColor: "#ADD8F6",
      borderTopWidth: 1,
    },
    navButton: {
      flexBasis: "25%",
      minWidth: 80,
      marginVertical: 0,
      paddingVertical: 4,
      alignItems: "center",
      backgroundColor: "#ADD8F6",
    },
    navButtonText: {
      color: "black",
      fontWeight: "bold",
      fontFamily: "BreeSerif",
      fontSize: 11 + (globalFontSize / 3),
    },
    navButton1: {
      flexBasis: "25%",
      minWidth: 80,
      marginVertical: 0,
      paddingVertical: 4,
      alignItems: "center",
      backgroundColor: "#ADD8F6",
      borderBottomWidth: 1,

    },
    navButtonText1: {
      color: "black",
      fontWeight: "bold",
      fontFamily: "BreeSerif",
      fontSize: 11 + (globalFontSize / 3),
    },
    postsList: {
      paddingBottom: 20,
      marginTop: 15,
    },
    postContainer: {
      backgroundColor: "#ADD8F6",
      borderRadius: 15,
      padding: 10,
      marginVertical: 10,
      marginHorizontal: 20,
      alignItems: "center",
      textAlign: "center",
      width: "85%",
      marginLeft: "8%",
      borderWidth: 1,
      borderColor: "#ccc",
    },
    postHeader: {
      flexDirection: "row",
      flexWrap: 'wrap',
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
    },
    postProfilePicture: {
      width: 45,
      height: 45,
      borderRadius: 22,
      marginRight: 10,
    },
    postUserInfo: {
      flex: 1,
      fontFamily: "BreeSerif",
    },
    postName: {
      fontWeight: "bold",
      fontSize: 2 + globalFontSize,
      fontFamily: "BreeSerif",
    },
    postUsername: {
      color: "#4F4F4F",
      fontFamily: "BreeSerif",
      fontSize: 0 + globalFontSize,
    },
    postContent: {
      marginTop: 10,
      fontSize: 2 + globalFontSize,
      textAlign: "center",
      width: "100%",
      fontFamily: "BreeSerif",

    },
    postActions: {
      flexDirection: "row",
      flexWrap: 'wrap',
      justifyContent: "space-between",
      marginTop: 10,
      width: "100%",
    },
    icones: {
      marginHorizontal: 20,
    },
    likeCount: {
      color: "black",
      fontFamily: "BreeSerif",
      fontSize: 0 + globalFontSize,
      textAlign: 'center',
    },
    postTimestamp: {
      fontSize: -2 + globalFontSize,
      color: "#4F4F4F",
      marginTop: 10,
      marginBottom: 5,
      fontFamily: "BreeSerif",
      textAlign: 'center',
    },
    commentInputContainer: {
      flexDirection: "row",
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      marginTop: 10,
      alignItems: "center",
    },
    commentInput: {
      flex: 1,
      borderRadius: 8,
      padding: 5,
      fontFamily: "BreeSerif",
      color: "black",
      fontSize: 3 + globalFontSize,
      backgroundColor: "white",
      borderRadius: 8,
      alignItems: "center",
      width: '50%',
      maxWidth: '80%',
    },
    botaoEnviar: {
      marginLeft: 20,
      marginRight: 20,
      backgroundColor: "#3a9ee4",
      borderRadius: 8,
      padding: 7,
      width: "30%",
      alignItems: "center",
    },
    submitCommentButton: {
      color: "black",
      fontFamily: "BreeSerif",
      fontSize: 2 + globalFontSize,
    },
    deleteButton: {
      marginLeft: 10,
    },
    reportButton: {
      marginLeft: 10,
    },
    fab: {
      position: "absolute",
      bottom: 20,
      right: 20,
      backgroundColor: "#3a9ee4",
      borderRadius: 30,
      width: 60,
      height: 60,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.8,
      shadowRadius: 2,
      elevation: 5,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    emptyText: {
      fontSize: 4 + globalFontSize,
      color: "#000",
      textAlign: "center",
      fontFamily: "BreeSerif",
    },
  });

export default Posts;
