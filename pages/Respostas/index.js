import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { auth, db } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import AlertaExcluir from "../Alertas/AlertaExcluir";
import AlertaLogin from "../Alertas/AlertaLogin";
import { useTheme } from "../../ThemeContext";

const adminEmails = [
  "fj878207@gmail.com",
  "anacarolcorr07@gmail.com",
  "isabella.barranjard@gmail.com",
  "contaetec14@gmail.com",
];

const Respostas = () => {
  const { isDarkMode } = useTheme();
  const [profilePicture, setProfilePicture] = useState(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [posts, setPosts] = useState([]);
  const [polls, setPolls] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [alertVisible, setAlertVisible] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [successAlertVisible, setSuccessAlertVisible] = useState(false);
  const [userReceivedComments, setUserReceivedComments] = useState(false);
  const navigation = useNavigation();
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
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("timestamp", "desc")
    );
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
        return post;
      })
    );

    let filteredPosts;

    if (isAdmin) {
      filteredPosts = postsWithUserDataAndComments.filter(
        (post) => post.comments.length > 0
      );
    } else {
      filteredPosts = postsWithUserDataAndComments
        .filter(
          (post) =>
            post.comments.length > 0 &&
            (post.userId === user.uid ||
              post.comments.some((comment) => comment.userId === user.uid))
        )
        .map((post) => ({
          ...post,
          comments:
            post.userId === user.uid
              ? post.comments
              : post.comments.filter((comment) => comment.userId === user.uid),
        }));
    }

    setUserReceivedComments(
      postsWithUserDataAndComments.some(
        (post) => post.userId === user.uid && post.comments.length > 0
      )
    ); // Atualiza o estado

    setPosts(filteredPosts);
  };

  const fetchPollsWithComments = async () => {
    const pollsQuery = query(
      collection(db, "polls"),
      orderBy("timestamp", "desc")
    );
    const querySnapshot = await getDocs(pollsQuery);
    const fetchedPolls = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const pollsWithUserDataAndComments = await Promise.all(
      fetchedPolls.map(async (poll) => {
        const userRef = doc(db, "users", poll.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const commentsRef = collection(db, "polls", poll.id, "comments");
          const commentsSnapshot = await getDocs(commentsRef);
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

          return { ...poll, user: userData, comments: commentsWithUserData };
        }
        return poll;
      })
    );

    let filteredPolls;

    if (isAdmin) {
      filteredPolls = pollsWithUserDataAndComments.filter(
        (poll) => poll.comments.length > 0
      );
    } else {
      filteredPolls = pollsWithUserDataAndComments
        .filter(
          (poll) =>
            poll.comments.length > 0 &&
            (poll.userId === user.uid ||
              poll.comments.some((comment) => comment.userId === user.uid))
        )
        .map((poll) => ({
          ...poll,
          comments:
            poll.userId === user.uid
              ? poll.comments
              : poll.comments.filter((comment) => comment.userId === user.uid),
        }));
    }

    setPolls(filteredPolls);
  };

  const handleVote = async (pollId, option) => {
    if (!currentUser) {
      setAlertMessage("Você precisa estar logado para votar.");
      setAlertVisible(true);
      return;
    }

    const pollRef = doc(db, "polls", pollId);
    const userId = currentUser.uid;

    try {
      const pollSnapshot = await getDoc(pollRef);
      const pollData = pollSnapshot.data();

      if (
        pollData.option1.usersVoted?.includes(userId) ||
        pollData.option2.usersVoted?.includes(userId)
      ) {
        setAlertMessage("Você já votou nesta enquete.");
        setAlertVisible(true);
        return;
      }

      const updatedPolls = polls.map((poll) => {
        if (poll.id === pollId) {
          return {
            ...poll,
            option1:
              option === 1
                ? { ...poll.option1, votes: poll.option1.votes + 1 }
                : poll.option1,
            option2:
              option === 2
                ? { ...poll.option2, votes: poll.option2.votes + 1 }
                : poll.option2,
          };
        }
        return poll;
      });

      setPolls(updatedPolls);

      const updateData = {
        ...(option === 1
          ? {
              "option1.votes": pollData.option1.votes + 1,
              "option1.usersVoted": arrayUnion(userId),
            }
          : {
              "option2.votes": pollData.option2.votes + 1,
              "option2.usersVoted": arrayUnion(userId),
            }),
        usersVoted: arrayUnion(userId),
      };

      await updateDoc(pollRef, updateData);

      setSelectedOptions((prev) => ({ ...prev, [pollId]: option }));
    } catch (error) {
      console.error("Erro ao votar na enquete:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchPostsWithComments();
    fetchPollsWithComments();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      fetchPostsWithComments();
      fetchPollsWithComments();
    }, [user])
  );

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
        style={[styles.postContainer, { backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6'}]}
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
            <Text style={[styles.postUsername, {color: isDarkMode ? '#363636' : '#4F4F4F'}]}>
              @{item.user?.username || "username"}
            </Text>
          </View>
        </View>
        <Text style={styles.postContent}>{item.content}</Text>
        <Text style={[styles.postTimestamp, {color: isDarkMode ? 'black' : '#4F4F4F'}]}>
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
              <Text style={styles.commentUser}>@{comment.user?.username}:</Text>
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
                <MaterialIcons
                  name="comment"
                  size={22}
                  style={styles.commentIcon}
                />
              )}
            </View>
          )}
        />
      </View>
    );
  };

  const renderPoll = ({ item }) => {
    const userVoted = selectedOptions[item.id] !== undefined;
    const userVoteOption = selectedOptions[item.id];

    return (
      <View style={[styles.pollContainer, { backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6'}]}>
        <View style={styles.pollHeader}>
          <Image
            source={
              item.user.profilePictureURL
                ? { uri: item.user.profilePictureURL }
                : require("../../assets/avatarpadrao.png")
            }
            style={styles.pollProfilePicture}
          />
          <View style={styles.pollInfo}>
            <Text style={styles.pollName}>{item.user?.name || "Usuário"}</Text>
            <Text style={styles.pollUsername}>
              @{item.user?.username || "username"}
            </Text>
          </View>
        </View>
        <Text style={styles.pollContent}>{item.content}</Text>
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              userVoteOption === 1 && styles.optionSelected,
            ]}
            onPress={() => handleVote(item.id, 1)}
          >
            <Text style={styles.optionText}>
              {item.option1.text} ({item.option1.votes})
            </Text>
            {userVoteOption === 1 && (
              <Ionicons
                style={styles.check}
                name="checkmark-circle-outline"
                size={22}
                color="black"
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.optionButton,
              userVoteOption === 2 && styles.optionSelected,
            ]}
            onPress={() => handleVote(item.id, 2)}
          >
            <Text style={styles.optionText}>
              {item.option2.text} ({item.option2.votes})
            </Text>
            {userVoteOption === 2 && (
              <Ionicons
                style={styles.check}
                name="checkmark-circle-outline"
                size={22}
                color="black"
              />
            )}
          </TouchableOpacity>
        </View>
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
              <Text style={styles.commentUser}>@{comment.user?.username}:</Text>
              <Text>{comment.content}</Text>
              {comment.userId === user.uid || isAdmin ? (
                <TouchableOpacity
                  onPress={() => {
                    setCommentToDelete({ ...comment, pollId: item.id });
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
                <MaterialIcons
                  name="comment"
                  size={22}
                  style={styles.commentIcon}
                />
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
        title="Confirmar Exclusão"
        message="Você tem certeza que deseja excluir este comentário?"
        onClose={() => setAlertVisible(false)}
        onConfirm={handleDeleteComment}
      />
      <AlertaLogin
        visible={successAlertVisible}
        title="Comentário excluído"
        message="Comentário excluído com sucesso"
        onClose={() => setSuccessAlertVisible(false)}
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
            Nenhum comentário em seus posts ainda.
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
    textAlign: "left",
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
    marginRight: 10,
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
