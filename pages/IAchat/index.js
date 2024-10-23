import React, { useState, useEffect } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CHATGPT_API_KEY } from '@env';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useTheme } from '../../ThemeContext';

const API_KEY = CHATGPT_API_KEY;

export default function ChatScreen() {
  const { isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

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
            setName(data.name || '');
            setMessages([
              { id: '1', text: `Olá, ${data.name || 'Usuário'}! Como posso te ajudar hoje?`, sender: 'bot' }
            ]);
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSend = async () => {
    if (text.trim()) {
      const userMessage = { id: Date.now().toString(), text, sender: 'user' };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setText('');

      try {
        const formattedMessages = [...messages.map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        })), { role: 'user', content: text }];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: formattedMessages,
            max_tokens: 150,
          }),
        });

        if (response.status === 429) {
          console.log('Muitas requisições, aguardando antes de tentar novamente.');
          await new Promise((resolve) => setTimeout(resolve, 3000));
          handleSend();
          return;
        }

        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
          const botMessage = {
            id: Date.now().toString(),
            text: data.choices[0].message.content.trim(),
            sender: 'bot',
          };
          setMessages((prevMessages) => [...prevMessages, botMessage]);
        } else {
          console.error('Estrutura de resposta inválida', data);
        }
      } catch (error) {
        console.error('Erro na chamada da API:', error);
      }
    }
  };

  const renderItem = ({ item }) => (
    <View style={[
      styles.bubble,
      item.sender === 'user' ? styles.userBubble : styles.botBubble,
      isDarkMode && (item.sender === 'user' ? styles.darkUserBubble : styles.darkBotBubble),
    ]}>
      <Text style={[styles.text, isDarkMode && styles.darkText]}>{item.text}</Text>
    </View>
  );

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatContainer}
      />
      <View style={[styles.inputContainer, isDarkMode && styles.darkInputContainer]}>
        <TextInput
          style={[styles.input, isDarkMode && styles.darkInput]}
          value={text}
          onChangeText={setText}
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
    borderWidth: 1,
    borderColor: '#ccc',
  },
  userBubble: {
    backgroundColor: '#3a9ee4',
    alignSelf: 'flex-end',
  },
  darkUserBubble: {
    backgroundColor: '#3a9ee4',
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
    fontFamily: 'BreeSerif',
    fontSize: 16,
  },
  darkText: {
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
    fontFamily: 'BreeSerif',
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
    fontFamily: 'BreeSerif',
  },
  darkButtonText: {
    color: 'white',
  },
});
