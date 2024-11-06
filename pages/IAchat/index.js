import React, { useState, useEffect } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useTheme } from '../../ThemeContext';
import { CHATGPT_API_KEY } from '@env';

const API_KEY = CHATGPT_API_KEY;

export default function ChatScreen() {
  const { isDarkMode } = useTheme();
  const [name, setName] = useState('Usuário');
  const [chatHistory, setChatHistory] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

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
              text: `Olá, ${userName}! Como posso te ajudar hoje?`,
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

      const response = await axios.post(
        'https://api.cohere.ai/v1/generate',
        {
          prompt: `Você é uma psicóloga online... Contexto: ${context}\nUsuário: "${userMessage}"\nBot:`,
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
      styles.bubble,
      item.sender === 'user'
        ? (isDarkMode ? styles.darkUserBubble : styles.userBubble)
        : (isDarkMode ? styles.darkBotBubble : styles.botBubble),
      { alignSelf: item.sender === 'user' ? 'flex-end' : 'flex-start' }
    ]}>
      <Text style={[
        styles.text,
        isDarkMode && (item.sender === 'user' ? styles.darkUserText : styles.darkBotText)
      ]}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <FlatList
        data={isSending ? [...chatHistory, { id: 'typing', text: 'Digitando...', sender: 'bot' }] : chatHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatContainer}
      />

      <View style={[styles.inputContainer, isDarkMode && styles.darkInputContainer]}>
        <TextInput
          style={[styles.input, isDarkMode && styles.darkInput]}
          value={userMessage}
          onChangeText={setUserMessage}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={isDarkMode ? 'white' : '#666'}
        />
        <TouchableOpacity style={[styles.button, isDarkMode && styles.darkButton]} onPress={handleSend}>
          <Text style={[styles.buttonText, isDarkMode && styles.darkButtonText]}>ENVIAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#1A1F36',
  },
  chatContainer: {
    padding: 10,
    marginTop: 15,
  },
  bubble: {
    borderRadius: 20,
    padding: 18,
    marginVertical: 5,
    maxWidth: '80%',
    borderWidth: 0.5,
    borderColor: '#ccc',
  },
  userBubble: {
    backgroundColor: '#3a9ee4',
    alignSelf: 'flex-end',
  },
  darkUserBubble: {
    backgroundColor: '#005a99',
  },
  botBubble: {
    backgroundColor: '#ADD8F6',
    alignSelf: 'flex-start',
  },
  darkBotBubble: {
    backgroundColor: '#8bb0c9',
  },
  text: {
    color: 'black',
    fontSize: 16,
  },
  darkUserText: {
    color: 'white',
  },
  darkBotText: {
    color: 'black',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
  },
  darkInputContainer: {
    backgroundColor: '#1A1F36',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3a9ee4',
    padding: 10,
    marginRight: 10,
  },
  darkInput: {
    borderColor: '#005a99',
    color: 'white',
  },
  button: {
    backgroundColor: '#3a9ee4',
    borderRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  darkButton: {
    backgroundColor: '#005a99',
  },
  buttonText: {
    color: 'white',
  },
  darkButtonText: {
    color: 'white',
  },
});
