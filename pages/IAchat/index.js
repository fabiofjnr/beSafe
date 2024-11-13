import React, { useState, useEffect } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Text, StyleSheet, Image, Keyboard, Animated, Dimensions } from 'react-native';
import axios from 'axios';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useTheme } from '../../ThemeContext';
import { CHATGPT_API_KEY } from '@env';

const API_KEY = CHATGPT_API_KEY;
const { width: screenWidth } = Dimensions.get('window');

const TypingAnimation = () => {
  const dot1 = new Animated.Value(0);
  const dot2 = new Animated.Value(0);
  const dot3 = new Animated.Value(0);

  const animateDots = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 0, duration: 300, useNativeDriver: true }),
      ])
    ).start();
  };

  useEffect(() => {
    animateDots();
  }, []);

  return (
    <View style={styles.typingContainer}>
      <Animated.Text style={[styles.typingDot, { opacity: dot1 }]}>.</Animated.Text>
      <Animated.Text style={[styles.typingDot, { opacity: dot2 }]}>.</Animated.Text>
      <Animated.Text style={[styles.typingDot, { opacity: dot3 }]}>.</Animated.Text>
    </View>
  );
};

export default function IAchat({ globalFontSize }) {
  const { isDarkMode } = useTheme();
  const [name, setName] = useState('Usuário');
  const [chatHistory, setChatHistory] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [keyboardOffset] = useState(new Animated.Value(0));

  useEffect(() => {
    const fetchUserData = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        try {
          const db = getFirestore();
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const userName = data.name || 'Usuário';
            setName(userName);
            const greetingMessage = {
              id: '1',
              text: `Olá, ${userName}! Eu sou a Safira, sua psicóloga. Este é um espaço seguro e confidencial para você se expressar livremente. Lembre-se: você é incrível e merece um lugar acolhedor para refletir, desabafar e buscar apoio. Estou aqui para ouvir você. Como posso ajudar hoje?`,

              sender: 'bot',
            };
            setChatHistory([greetingMessage]);
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
        }
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      Animated.timing(keyboardOffset, {
        toValue: event.endCoordinates.height * 0.8,
        duration: 100,
        useNativeDriver: false,
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [keyboardOffset]);

  const handleSend = async () => {
    if (!userMessage.trim() || isSending) return;

    setIsSending(true);
    const newMessage = { id: Date.now().toString(), text: userMessage, sender: 'user' };
    setChatHistory((prev) => [...prev, newMessage]);
    setUserMessage('');

    try {
      const context = chatHistory
        .slice(-20)
        .map((message) => `${message.sender === 'user' ? 'Usuário' : 'Bot'}: ${message.text}`)
        .join('\n');

      const prompt = `Você é Safira, uma psicóloga do aplicativo beSafe. Seu papel é ser acolhedora, caso o usuário pergunte sobre você responda, seja humana, e oferecer um ambiente confortável ao usuário. ${name ? `Lembre-se de sempre chamar a pessoa pelo nome, que é ${name}.` : ""
        } Evite responder com o seu próprio nome ("Safira") seguido de dois pontos, como "Safira: Resposta". Suas respostas devem ser breves, acolhedoras e de fácil leitura. Não responda com olá a menos que o usuário fale naquela mensagem mais recente. Resuma e mantenha o tom de uma psicóloga humana, criando um espaço seguro e de apoio...
  
      Contexto: ${context}
      Usuário: "${userMessage}"`;

      const response = await axios.post(
        'https://api.cohere.ai/v1/generate',
        {
          prompt,
          model: 'command-xlarge-nightly',
          max_tokens: 300,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const aiMessage = {
        id: Date.now().toString(),
        text: response.data.generations[0].text.trim(),
        sender: 'bot',
      };
      setChatHistory((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Erro ao obter resposta da IA:", error);
      setChatHistory((prev) => [
        ...prev,
        { id: Date.now().toString(), text: 'Desculpe, estou tendo dificuldades em responder no momento. Tente novamente mais tarde :)', sender: 'bot' },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[
      styles.messageContainer,
      { flexDirection: item.sender === 'user' ? 'row-reverse' : 'row' }
    ]}>
      {item.sender === 'bot' && (
        <Image source={require('../../assets/IAbeSafe.png')} style={[styles.messageImage, { width: globalFontSize * 3, height: globalFontSize * 3 }]} />
      )}
      <View style={[
        styles.bubble,
        item.sender === 'user'
          ? (isDarkMode ? styles.darkUserBubble : styles.userBubble)
          : (isDarkMode ? styles.darkBotBubble : styles.botBubble),
      ]}>
        <Text style={[
          styles.text,
          isDarkMode && (item.sender === 'user' ? styles.darkUserText : styles.darkBotText),
          { fontSize: globalFontSize + 4 }
        ]}>
          {item.text}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={[
        styles.header,
        { borderBottomColor: isDarkMode ? '#8bb0c9' : '#3a9ee4' }
      ]}>
        <Image source={require('../../assets/IAbeSafe.png')} style={styles.profileImage} />
        <Text style={[
          styles.botName,
          isDarkMode && styles.darkBotName,
          { fontSize: globalFontSize + 7 }
        ]}>
          Safira
        </Text>
      </View>

      <FlatList
        data={isSending ? [...chatHistory, { id: 'typing', text: <TypingAnimation />, sender: 'bot' }] : chatHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatContainer}
      />

      <Animated.View style={[
        styles.inputContainer,
        isDarkMode && styles.darkInputContainer,
        { marginBottom: keyboardOffset }
      ]}>
        <TextInput
          style={[
            styles.input,
            isDarkMode && styles.darkInput,
            { fontSize: globalFontSize + 1 }
          ]}
          value={userMessage}
          onChangeText={setUserMessage}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={isDarkMode ? 'white' : '#666'}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={[styles.button, isDarkMode && styles.darkButton]} onPress={handleSend}>
          <Text style={[
            styles.buttonText,
            isDarkMode && styles.darkButtonText,
            { fontSize: globalFontSize + 1 }
          ]}>
            ENVIAR
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  darkContainer: {
    backgroundColor: '#1A1F36'
  },
  chatContainer: {
    padding: 10,
    marginTop: 15
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginTop: 30,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 30,
    marginBottom: 5
  },
  botName: {
    fontWeight: 'bold',
    color: 'black'
  },
  darkBotName: {
    color: '#f0f0f0'
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5
  },
  messageImage: {
    borderRadius: 15,
    marginHorizontal: 5
  },
  bubble: {
    borderRadius: 20,
    padding: 18,
    maxWidth: '80%',
    borderWidth: 0.5,
    borderColor: '#ccc'
  },
  userBubble: {
    backgroundColor: '#3a9ee4'
  },
  darkUserBubble: {
    backgroundColor: '#005a99'
  },
  botBubble: {
    backgroundColor: '#ADD8F6'
  },
  darkBotBubble: {
    backgroundColor: '#8bb0c9'
  },
  text: {
    color: 'black'
  },
  darkUserText: {
    color: 'white'
  },
  darkBotText: {
    color: 'black'
  },
  inputContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    backgroundColor: '#fff'
  },
  darkInputContainer: {
    backgroundColor: '#1A1F36'
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3a9ee4',
    padding: 10,
    marginRight: 10
  },
  darkInput: {
    borderColor: '#005a99',
    color: 'white'
  },
  button: {
    width: screenWidth * 0.23,
    backgroundColor: '#3a9ee4',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  darkButton: {
    backgroundColor: '#005a99'
  },
  buttonText: {
    color: 'white'
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  typingDot: {
    color: 'black',
    marginHorizontal: 2
  },
});
