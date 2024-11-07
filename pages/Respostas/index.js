import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList, Alert } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { auth, db } from "../../firebase";
import { doc, getDoc, addDoc, collection, query, where, getDocs, orderBy, deleteDoc, } from "firebase/firestore";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import AlertaExcluir from "../Alertas/AlertaExcluir";
import AlertaLogin from "../Alertas/AlertaLogin";
import AlertaDenuncia from "../Alertas/AlertaDenuncia";
import { useTheme } from "../../ThemeContext";
import Icon from 'react-native-vector-icons/MaterialIcons';

const adminEmails = ["fj878207@gmail.com", "anacarolcorr07@gmail.com", "isabella.barranjard@gmail.com", "contaetec14@gmail.com",];

const Respostas = () => {
  const { isDarkMode } = useTheme();
  const [profilePicture, setProfilePicture] = useState(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [posts, setPosts] = useState([]);
  const [polls] = useState([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [successAlertVisible, setSuccessAlertVisible] = useState(false);
  const [userReceivedComments, setUserReceivedComments] = useState(false);
  const navigation = useNavigation();
  const [reportAlertVisible, setReportAlertVisible] = useState(false);
  const [commentToReport, setCommentToReport] = useState(null);
  const [reportSuccessAlertVisible, setReportSuccessAlertVisible] = useState(false);
  const [reportAlreadyReportedAlertVisible, setReportAlreadyReportedAlertVisible] = useState(false);
  const user = auth.currentUser;
  const isAdmin = adminEmails.includes(user?.email);

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

  const fetchPostsWithComments = async () => {
    try {
      const postsQuery = query(collection(db, "posts"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(postsQuery);
      const fetchedPosts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const postsWithUserDataAndComments = await Promise.all(
        fetchedPosts.map(async (post) => {
          const userRef = doc(db, "users", post.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const commentsRef = collection(db, "posts", post.id, "comments");
            const commentsSnapshot = await getDocs(commentsRef);

            if (!commentsSnapshot.empty) {
              const commentsWithUserData = await Promise.all(
                commentsSnapshot.docs.map(async (commentDoc) => {
                  const commentData = commentDoc.data();
                  const commentUserRef = doc(db, "users", commentData.userId);
                  const commentUserSnap = await getDoc(commentUserRef);
                  if (commentUserSnap.exists()) {
                    return {
                      id: commentDoc.id,
                      ...commentData,
                      user: commentUserSnap.data(),
                    };
                  }
                  return { id: commentDoc.id, ...commentData };
                })
              );
              return { ...post, user: userData, comments: commentsWithUserData };
            }
          }
          return null;
        })
      );

      setPosts(postsWithUserDataAndComments.filter(post => post !== null));
    } catch (error) {
      console.error("Erro ao buscar posts e comentários:", error);
    }
  };


  useEffect(() => {
    fetchUserData();
    fetchPostsWithComments();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchPostsWithComments();
    }, [])
  );

  const handleReportComment = (comment, postId) => {
    setCommentToReport({ ...comment, postId });
    setReportAlertVisible(true);
  };

  const confirmReportComment = async () => {
    setReportAlertVisible(false);
    if (commentToReport) {
      if (!commentToReport?.postId) {
        console.error("postId indefinido:", commentToReport);
        Alert.alert("Erro", "Não foi possível registrar a denúncia.");
        return;
      }

      try {
        const reportsQuery = query(
          collection(db, "reports"),
          where("commentId", "==", commentToReport.id),
          where("reportedBy", "==", user.email)
        );
        const reportsSnapshot = await getDocs(reportsQuery);

        if (!reportsSnapshot.empty) {
          setReportAlreadyReportedAlertVisible(true);
        } else {
          await addDoc(collection(db, "reports"), {
            commentId: commentToReport.id,
            postId: commentToReport.postId,
            commentContent: commentToReport.content,
            reportedBy: user.email,
            reportedCommentUser: commentToReport.user.username,
            timestamp: new Date(),
          });
          setReportSuccessAlertVisible(true);
        }
      } catch (error) {
        console.error("Erro ao registrar denúncia:", error);
      }
      setCommentToReport(null);
    }
  };

  const handleDeleteComment = async () => {
    if (commentToDelete) {
      try {
        await deleteDoc(
          doc(
            db,
            "posts",
            commentToDelete.postId,
            "comments",
            commentToDelete.id
          )
        );
        setAlertVisible(false);
        setCommentToDelete(null);
        fetchPostsWithComments();
        setSuccessAlertVisible(true);
      } catch (error) {
        console.error("Erro ao excluir comentário:", error);
      }
    }
  };

  const onCommentDelete = (deletedComment) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === deletedComment.postId
          ? {
            ...post,
            comments: post.comments.filter(
              (comment) => comment.id !== deletedComment.commentId
            ),
          }
          : post
      )
    );
  };



  const renderPost = ({ item }) => {
    const isUserCommented = item.comments.some(
      (comment) => comment.userId === user.uid
    );
    const isOwnPost = item.userId === user.uid;
    const postBackgroundColor = isOwnPost
      ? "#ADD8F6"
      : isUserCommented
        ? "#ADD8F6"
        : "#ADD8F6";

    return (
      <View
        style={[styles.postContainer, { backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6' }]}
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
            <Text style={[styles.postUsername, { color: isDarkMode ? '#363636' : '#4F4F4F' }]}>
              @{item.user?.username || "username"}
            </Text>
          </View>
        </View>
        <Text style={styles.postContent}>{item.content}</Text>
        <Text style={[styles.postTimestamp, { color: isDarkMode ? 'black' : '#4F4F4F' }]}>
          {item.timestamp?.toDate().toLocaleString()}
        </Text>
        <FlatList
          data={item.comments}
          keyExtractor={(comment) => comment.id}
          renderItem={({ item: comment }) => (
            <View style={styles.comment}>
              <Image
                source={
                  comment.user?.profilePictureURL
                    ? { uri: comment.user.profilePictureURL }
                    : require("../../assets/avatarpadrao.png")
                }
                style={styles.commentProfilePicture}
              />
              <Text style={styles.commentUser}>@{comment.user?.username || "username"}:</Text>
              <Text>{comment.content}</Text>
              {comment.userId === user.uid || isAdmin ? (
                <TouchableOpacity
                  onPress={() => {
                    setCommentToDelete({ ...comment, postId: item.id });
                    setAlertVisible(true);
                  }}
                  style={styles.deleteButton}
                >
                  <MaterialIcons
                    name="delete"
                    size={22}
                    style={styles.commentIcon}
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => handleReportComment(comment, item.id)}
                  style={styles.commentIcon}
                >
                  <MaterialIcons
                    name="report"
                    size={22}
                    style={styles.commentIcon}
                  />
                </TouchableOpacity>

              )}
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
      <AlertaExcluir
        visible={alertVisible}
        title={
          <View style={{ alignItems: "center" }}>
            <Text> <Icon name="delete" size={20} color="#3a9ee4" /> • Confirmar Exclusão</Text>
          </View>
        }
        message="Você tem certeza que deseja excluir este comentário?"
        onClose={() => setAlertVisible(false)}
        onConfirm={handleDeleteComment}
      />

      <AlertaDenuncia
        visible={reportAlertVisible}
        title={
          <View style={{ alignItems: "center" }}>
            <Text> <Icon name="report" size={20} color="#3a9ee4" /> • Confirmar Denúncia</Text>
          </View>
        }
        message="Você confirma a denúncia deste comentário?"
        onClose={() => setReportAlertVisible(false)}
        onConfirm={confirmReportComment}
      />

      <AlertaLogin
        visible={successAlertVisible}
        title={
          <View style={{ alignItems: "center" }}>
            <Text> <Icon name="check-circle" size={20} color="#27ae60" /> • Comentário excluído</Text>
          </View>
        }
        message="Comentário excluído com sucesso"
        onClose={() => setSuccessAlertVisible(false)}
      />

      <AlertaLogin
        visible={reportSuccessAlertVisible}
        title={
          <View style={{ alignItems: "center" }}>
            <Text>  <Icon name="check-circle" size={20} color="#27ae60" /> • Sucesso</Text>
          </View>
        }
        message="Agradecemos pela colaboração. A denúncia foi registrada e logo será analisada!"
        onClose={() => setReportSuccessAlertVisible(false)}
      />

      <AlertaLogin
        visible={reportAlreadyReportedAlertVisible}
        title={
          <View style={{ alignItems: "center" }}>
            <Text><Icon name="warning" size={20} color="#3a9ee4" /> • Aviso</Text>
          </View>
        }
        message="Você já denunciou este comentário."
        onClose={() => setReportAlreadyReportedAlertVisible(false)}
      />



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
          style={[styles.editButton, { backgroundColor: isDarkMode ? '#005a99' : '#3a9ee4' }]}
          onPress={() => navigation.navigate("Perfil")}
        >
          <MaterialIcons name="edit" size={24} color="white" />
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
            styles.navButton,
            { backgroundColor: isDarkMode ? "#8bb0c9" : "#ADD8F6" },
          ]}
          onPress={() => navigation.navigate("Posts")}
        >
          <Text style={styles.navButtonText}>Posts</Text>
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
            styles.navButton1,
            {
              backgroundColor: isDarkMode ? "#8bb0c9" : "#ADD8F6",
              borderColor: isDarkMode ? "white" : "black",
            },
          ]}
          onPress={() => navigation.navigate("Respostas")}
        >
          <Text style={styles.navButtonText1}>Respostas</Text>
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
        <View style={styles.noCommentsContainer}>
          <Text
            style={[
              styles.noCommentsText,
              { color: isDarkMode ? "#FFFFFF" : "#000000" },
            ]}
          >
            Nenhum comentário nas publicações ainda.
          </Text>
        </View>
      ) : (
        <FlatList
          data={[...posts, ...polls]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) =>
            item.hasOwnProperty("options")
              ? renderPoll({ item })
              : renderPost({ item })
          }
          ListEmptyComponent={
            <Text
              style={[
                styles.noPollsText,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
            >
              {userReceivedComments
                ? "Nenhum comentário foi encontrado."
                : "Você não recebeu nenhum comentário."}
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 24,
    color: "#000",
    marginBottom: 5,
    marginTop: 10,
    fontFamily: "BreeSerif",
  },
  username: {
    fontSize: 20,
    color: "#000",
    marginBottom: 5,
    fontFamily: "BreeSerif",
  },
  bio: {
    fontSize: 13,
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
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#ADD8F6",
    borderBottomColor: "black",
    borderTopWidth: 1,
    marginBottom: 15,
  },
  navButton: {
    flex: 1,
    alignItems: "center",
    padding: 2,
    marginHorizontal: 5,
    backgroundColor: "#ADD8F6",
  },
  navButtonText: {
    color: "black",
    fontWeight: "bold",
    fontFamily: "BreeSerif",
    fontSize: 16,
  },
  navButton1: {
    flex: 1,
    alignItems: "center",
    padding: 2,
    marginHorizontal: 5,
    backgroundColor: "#ADD8F6",
    borderBottomWidth: 1,
  },
  navButtonText1: {
    color: "black",
    fontWeight: "bold",
    fontFamily: "BreeSerif",
    fontSize: 16,
  },
  postsList: {
    paddingBottom: 20,
    marginTop: 15,
  },
  postContainer: {
    borderRadius: 20,
    padding: 10,
    marginVertical: 10,
    marginHorizontal: 20,
    width: "85%",
    marginLeft: "8%",
    borderWidth: 1,
    borderColor: '#ccc',
  },
  postHeader: {
    flexDirection: "row",
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
    fontSize: 16,
    fontFamily: "BreeSerif",
  },
  postUsername: {
    color: "#4F4F4F",
    fontFamily: "BreeSerif",
  },
  postContent: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
    width: "100%",
    fontFamily: 'BreeSerif',
    
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    width: "100%",
  },
  icones: {
    marginHorizontal: 20,
  },
  likeCount: {
    marginLeft: 8,
    color: "black",
    fontFamily: "BreeSerif",
  },
  postTimestamp: {
    fontSize: 12,
    color: "#4F4F4F",
    marginTop: 10,
    marginBottom: 15,
    fontFamily: "BreeSerif",
    alignItems: "center",
    textAlign: "center",
  },
  deleteButton: {
    marginLeft: "auto",
    textAlign: "right",
    alignItems: "right",
  },
  comment: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    fontFamily: "BreeSerif",
    fontSize: 15,
  },
  commentUser: {
    marginRight: 5,
    fontFamily: "BreeSerif",
    fontSize: 15,
  },
  commentProfilePicture: {
    width: 27,
    height: 27,
    borderRadius: 12,
    marginRight: 5,
  },
  commentIcon: {
    marginLeft: "auto",
    textAlign: "right",
    alignItems: "right",

  },
  noCommentsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noCommentsText: {
    textAlign: "center",
    fontSize: 18,
    color: "black",
    fontFamily: "BreeSerif",
  },
  deleteIcon: {
    marginLeft: 165,
  },
});

export default Respostas;