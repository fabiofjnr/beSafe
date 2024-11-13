import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../../firebase';
import { doc, getDoc, getDocs, updateDoc, arrayUnion, deleteDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import AlertaExcluir from '../Alertas/AlertaExcluir';
import AlertaLogin from '../Alertas/AlertaLogin';
import AlertaDenuncia from "../Alertas/AlertaDenuncia";
import { Entypo, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { PERSPECTIVE_API_KEY } from '@env';
import { useTheme } from '../../ThemeContext';

const Enquetes = ({ globalFontSize}) => {
  const { isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [polls, setPolls] = useState([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [pollToDelete, setPollToDelete] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [alertSuccessVisible, setAlertSuccessVisible] = useState(false);
  const [reportAlertVisible, setReportAlertVisible] = useState(false);
  const [reportSuccessAlertVisible, setReportSuccessAlertVisible] = useState(false);
  const [reportAlreadyReportedAlertVisible, setReportAlreadyReportedAlertVisible] = useState(false);
  const [pollToReport, setPollToReport] = useState(null);


  const navigation = useNavigation();
  const currentUser = auth.currentUser;
  const adminEmails = ['fj878207@gmail.com', 'anacarolcorr07@gmail.com', 'isabella.barranjard@gmail.com', 'contaetec14@gmail.com'];

  const styles = createStyles(globalFontSize);

  const navigateToNewPoll = () => {
    navigation.navigate('NovaEnquete');
  };

  const fetchUserData = async () => {
    if (currentUser) {
      try {
        const docRef = doc(db, 'users', currentUser.uid);
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

  const fetchPolls = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'polls'));
      const pollsData = await Promise.all(querySnapshot.docs.map(async (pollDoc) => {
        const pollData = pollDoc.data();
        const userDoc = await getDoc(doc(db, 'users', pollData.userId));
        const userData = userDoc.data();
        return { id: pollDoc.id, ...pollData, user: userData };
      }));
  
      pollsData.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
      setPolls(pollsData);
  
      const selectedOptions = {};
      for (const poll of pollsData) {
        if (poll.option1.usersVoted?.includes(currentUser?.uid)) {
          selectedOptions[poll.id] = 1;
        } else if (poll.option2.usersVoted?.includes(currentUser?.uid)) {
          selectedOptions[poll.id] = 2;
        }
      }
      setSelectedOptions(selectedOptions);
    } catch (error) {
      console.error('Erro ao buscar enquetes:', error);
    }
  };
  

  const handleVote = async (pollId, option) => {
    if (!currentUser) {
      setAlertMessage('Você precisa estar logado para votar.');
      setAlertVisible(true);
      return;
    }

    const pollRef = doc(db, 'polls', pollId);
    const userId = currentUser.uid;

    try {
      const pollSnapshot = await getDoc(pollRef);
      const pollData = pollSnapshot.data();

      if (pollData.option1.usersVoted?.includes(userId) || pollData.option2.usersVoted?.includes(userId)) {
        setAlertMessage('Você já votou nesta enquete.');
        setAlertVisible(true);
        return;
      }

      const updatedPolls = polls.map(poll => {
        if (poll.id === pollId) {
          return {
            ...poll,
            option1: option === 1 ? { ...poll.option1, votes: poll.option1.votes + 1 } : poll.option1,
            option2: option === 2 ? { ...poll.option2, votes: poll.option2.votes + 1 } : poll.option2,
          };
        }
        return poll;
      });

      setPolls(updatedPolls);

      const updateData = {
        ...(option === 1 ? {
          'option1.votes': pollData.option1.votes + 1,
          'option1.usersVoted': arrayUnion(userId)
        } : {
          'option2.votes': pollData.option2.votes + 1,
          'option2.usersVoted': arrayUnion(userId)
        }),
        'usersVoted': arrayUnion(userId)
      };

      await updateDoc(pollRef, updateData);

      setSelectedOptions((prev) => ({ ...prev, [pollId]: option }));
    } catch (error) {
      console.error('Erro ao votar na enquete:', error);
    }
  };


  const handleAlertConfirm = async () => {
    if (pollToDelete) {
      try {
        const pollRef = doc(db, "polls", pollToDelete);
        const pollSnapshot = await getDoc(pollRef);
        const pollData = pollSnapshot.data();
  
        if (pollSnapshot.exists()) {
          const isAdmin = adminEmails.includes(currentUser?.email);
          const isOwner = pollData.userId === currentUser.uid;
  
          if (!isOwner && isAdmin) {
            const notificationRef = collection(db, "notifications");
            await addDoc(notificationRef, {
              userId: pollData.userId,
              message: `Sua enquete foi excluída por um administrador por ser inapropriada. Não repita este comportamento.`,
              timestamp: serverTimestamp(),
              read: false,
            });
          }
  
          await deleteDoc(pollRef);
          setPollToDelete(null);
          fetchPolls(); 
          setShowAlert(false);
  
          setAlertMessage("Enquete excluída com sucesso!");
          if (!isOwner && isAdmin) {
            setAlertMessage("Enquete excluída por ser inapropriada!");
          }
          setAlertSuccessVisible(true);
        }
      } catch (error) {
        console.error("Erro ao excluir a enquete:", error);
      }
    }
  };

  const handleAlertCancel = () => {
    setShowAlert(false);
    setPollToDelete(null);
  };

  const handleDeletePoll = (pollId) => {
    setPollToDelete(pollId);
    setAlertMessage({
      title: 'Excluir enquete?',
      content: 'Deseja realmente excluir a enquete?'
    });
    setShowAlert(true);
  };

  const handleReportPoll = async (pollId) => {
    const poll = polls.find((p) => p.id === pollId);
  
    if (poll.reportedBy?.includes(currentUser.email)) {
      setReportAlreadyReportedAlertVisible(true);
      return;
    }
  
    setPollToReport(poll);
    setReportAlertVisible(true);
  };
  
  const confirmReportPoll = async () => {
    try {
      const reportRef = collection(db, 'reports');
      await addDoc(reportRef, {
        pollId: pollToReport.id,
        reportedCommentUser: pollToReport.user.name, 
        timestamp: serverTimestamp(),
        content: `Enquete denunciada: \n${pollToReport.content || "Conteúdo não encontrado"}`,
        userId: pollToReport.userId,
        reportedBy: currentUser.email,
      });
  
      setReportAlertVisible(false);
      setReportSuccessAlertVisible(true);
    } catch (error) {
      console.error('Erro ao denunciar a enquete:', error);
    }
  };


  const renderPoll = ({ item }) => {
    const userVoted = selectedOptions[item.id] !== undefined;
    const userVoteOption = selectedOptions[item.id];

    return (
      <View style={[styles.pollContainer, { backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6' }]}>
        <View style={styles.pollHeader}>
          <Image
            source={item.user.profilePictureURL ? { uri: item.user.profilePictureURL } : require('../../assets/avatarpadrao.png')}
            style={styles.pollProfilePicture}
          />
          <View style={styles.pollInfo}>
            <Text style={styles.pollName}>{item.user?.name || 'Usuário'}</Text>
            <Text style={[styles.pollUsername, { color: isDarkMode ? '#363636' : '#4F4F4F' }]}>@{item.user?.username || 'username'}</Text>
          </View>
          {(currentUser?.uid === item.userId || adminEmails.includes(currentUser?.email)) ? (
            <TouchableOpacity onPress={() => handleDeletePoll(item.id)} style={styles.deleteIcon}>
              <MaterialIcons name="delete" size={ 10 + globalFontSize} color="black" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => handleReportPoll(item.id)} style={styles.reportIcon}>
              <MaterialIcons name="report" size={ 10 + globalFontSize} color="black" />
            </TouchableOpacity>

          )}
        </View>
        <Text style={styles.pollContent}>{item.content}</Text>
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.optionButton, userVoteOption === 1 && styles.optionSelected]}
            onPress={() => handleVote(item.id, 1)}
          >
            <Text style={styles.optionText}>
              {item.option1.text} ({item.option1.votes})
            </Text>
            {userVoteOption === 1 && <Ionicons style={styles.check} name="checkmark-circle-outline" size={ 8 + globalFontSize} color="black" />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, userVoteOption === 2 && styles.optionSelected]}
            onPress={() => handleVote(item.id, 2)}
          >
            <Text style={styles.optionText}>
              {item.option2.text} ({item.option2.votes})
            </Text>
            {userVoteOption === 2 && <Ionicons style={styles.check} name="checkmark-circle-outline" size={ 8 + globalFontSize} color="black" />}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      fetchPolls();
    }, [currentUser])
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1A1F36' : 'white' }]}>
      <View style={[styles.profileContainer, { backgroundColor: isDarkMode ? '#1A1F36' : 'white' }]}>
        <Image
          source={profilePicture ? { uri: profilePicture } : require('../../assets/avatarpadrao.png')}
          style={styles.profilePicture}
        />
        <View style={[styles.infoContainer]}>
          <Text style={[styles.name, { color: isDarkMode ? 'white' : 'black' }]}>{name}</Text>
          <Text style={[styles.username, { color: isDarkMode ? 'white' : 'black' }]}>@{username}</Text>
          <Text style={[styles.bio, { color: isDarkMode ? 'white' : 'black' }]}>{bio}</Text>
        </View>
        <TouchableOpacity style={[styles.editButton, { backgroundColor: isDarkMode ? '#005a99' : '#3a9ee4' }]} onPress={() => navigation.navigate('Perfil')}>
          <MaterialIcons name="edit" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <View style={[styles.buttonContainer, { backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6', borderColor: isDarkMode ? 'white' : 'black', borderTopWidth: isDarkMode ? 2 : 1 }]}>
        <TouchableOpacity style={[styles.navButton, { backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6' }]} onPress={() => navigation.navigate('Posts')}>
          <Text style={styles.navButtonText}>Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton1, { backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6', borderColor: isDarkMode ? 'white' : 'black' }]} onPress={() => navigation.navigate('Enquetes')}>
          <Text style={styles.navButtonText1}>Enquetes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton, { backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6' }]} onPress={() => navigation.navigate('Respostas')}>
          <Text style={styles.navButtonText}>Respostas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton, { backgroundColor: isDarkMode ? '#8bb0c9' : '#ADD8F6' }]} onPress={() => navigation.navigate('Curtidas')}>
          <Text style={styles.navButtonText}>Curtidas</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={polls}
        keyExtractor={(item) => item.id}
        renderItem={renderPoll}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: isDarkMode ? 'white' : 'black' }]}>Nenhuma enquete foi publicada ainda.</Text>
          </View>
        )}
      />
      <TouchableOpacity style={[styles.fab, { backgroundColor: isDarkMode ? '#005a99' : '#3a9ee4' }]} onPress={navigateToNewPoll}>
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>


      {reportAlertVisible && (
        <AlertaDenuncia
          visible={reportAlertVisible}
          title={
            <View style={{ alignItems: "center" }}>
              <Text>
                <MaterialIcons name="report" size={20} color="#3a9ee4" /> • Confirmar Denúncia
              </Text>
            </View>
          }
          message="Você confirma a denúncia desta enquete?"
          onClose={() => setReportAlertVisible(false)}
          onConfirm={confirmReportPoll}
        />
      )}

      {reportSuccessAlertVisible && (
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
      )}
      {reportAlreadyReportedAlertVisible && (
        <AlertaLogin
          visible={reportAlreadyReportedAlertVisible}
          title={
            <View style={{ alignItems: "center" }}>
              <Text>
                <Entypo name="warning" size={20} color="#3a9ee4" /> • Aviso
              </Text>
            </View>
          }
          message="Você já denunciou esta enquete."
          onClose={() => setReportAlreadyReportedAlertVisible(false)}
        />
      )}


      {showAlert && (
        <AlertaExcluir
          visible={showAlert}
          title={
            <Text style={{ alignItems: "center", textAlign: "center", fontSize: globalFontSize + 4 }}>
            <Ionicons name="trash-outline" size={20} color="red" /> • Confirmar Exclusão
          </Text>
          }
          message="Deseja excluir esta enquete?"
          onClose={() => setShowAlert(false)}
          onConfirm={handleAlertConfirm}
          onCancel={handleAlertCancel}
        />
      )}
      {alertVisible && (
        <AlertaLogin
          visible={alertVisible}
          message={alertMessage}
          onClose={() => setAlertVisible(false)}
        />
      )}
      {alertSuccessVisible && (
        <AlertaLogin
          visible={alertSuccessVisible}
          title={
            <Text style={{ alignItems: "center", textAlign: "center", fontSize: globalFontSize + 4 }}>
            <Ionicons name="checkmark-circle" size={20} color="#27ae60" /> • Sucesso
          </Text>
          }
          message="Enquete excluída com sucesso!"
          onClose={() => setAlertSuccessVisible(false)}
        />
      )}
    </View>
  );
};

const createStyles = (globalFontSize) =>
  StyleSheet.create({
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
    fontSize: 10 + globalFontSize,
    color: '#000',
    marginBottom: 5,
    marginTop: 10,
    fontFamily: 'BreeSerif',
  },
  username: {
    fontSize: 6 + globalFontSize,
    color: '#000',
    marginBottom: 5,
    fontFamily: 'BreeSerif',
  },
  bio: {
    fontSize: -1 + globalFontSize,
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
  pollContainer: {
    borderRadius: 20,
    padding: 10,
    marginVertical: 10,
    marginHorizontal: 20,
    width: '85%',
    marginLeft: '8%',
    backgroundColor: '#ADD8F6',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  pollProfilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  pollInfo: {
    marginLeft: 8,
  },
  pollName: {
    fontWeight: 'bold',
    fontSize: 2 + globalFontSize,
    fontFamily: 'BreeSerif',
  },
  pollUsername: {
    fontFamily: 'BreeSerif',
  },
  pollContent: {
    marginTop: 10,
    fontSize: 2 + globalFontSize,
    textAlign: 'center',
    width: '100%',
    color: 'black',
    fontFamily: 'BreeSerif',
  },
  optionsContainer: {
    marginVertical: 8
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',  
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: 'white',
    marginTop: 6,
  },
  optionText: {
    color: 'black',
    fontWeight: 'bold',
    fontFamily: 'BreeSerif',
    marginTop: 0,
    fontSize: 0 + globalFontSize,
    textAlign: 'center',
  },
  noPollsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  noPollsText: {
    fontSize: 4 + globalFontSize,
    color: '#000',
    fontFamily: 'BreeSerif',
  },
  optionSelected: {
    backgroundColor: '#C0C0C0'
  },
  check: {
    marginLeft: 8,
    alignSelf: 'center', 
    width: globalFontSize * 1.5, 
    height: globalFontSize * 1.5,
  },
  deleteIcon: {
    marginLeft: 185,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#3a9ee4',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 200,
    padding: 20,
  },
  emptyText: {
    fontSize: 4 + globalFontSize,
    color: '#000',
    fontFamily: 'BreeSerif',
    textAlign: "center",
  },
  reportIcon: {
    marginLeft: 185,
  },
});


export default Enquetes;
