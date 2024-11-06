import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const IntroTutorial = ({ currentStep = 0, onNext, onClose }) => {
    const tutorialSteps = [
        { 
            title: "Bem-vindo(a) ao beSafe!", 
            message: "Aqui você encontra um espaço seguro para expressar suas emoções e se conectar com quem entende você.",
            icon: "hand-heart"
        },
        { 
            title: "Exploração de Enquetes e Posts", 
            message: "Participe da comunidade! Em “Enquetes”, peça conselhos sobre situações de conflito e veja opiniões. Em “Posts”, compartilhe seus momentos e receba apoio e motivação de pessoas que passam por experiências parecidas.",
            icon: "forum"
        },
        { 
            title: "Funcionalidade SOS", 
            message: "No botão SOS, você pode ligar rapidamente para o 188 em momentos difíceis e falar com alguém que entende.",
            icon: "phone-in-talk"
        },
        { 
            title: "Chat com I.A", 
            message: "Converse com nossa Inteligência Artificial para conselhos práticos e apoio emocional imediato!",
            icon: "chat"
        },
        { 
            title: "Perfil Seguro e Informativo", 
            message: "Seu perfil guarda apenas sua foto de perfil, nome, biografia e nome de usuário fictício. Aqui, você pode alterar essas informações!",
            icon: "shield-account"
        }
    ];

    const isLastStep = currentStep === tutorialSteps.length - 1;
    const currentContent = tutorialSteps[currentStep] || { title: "Erro", message: "Passo do tutorial não encontrado." };

    return (
        <Modal visible={true} transparent={true} animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <MaterialCommunityIcons name={currentContent.icon} size={50} color="#3a9ee4" style={styles.icon} />
                    <Text style={styles.title}>{currentContent.title}</Text>
                    <Text style={styles.message}>{currentContent.message}</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={styles.button} 
                            onPress={isLastStep ? onClose : onNext}
                        >
                            <Ionicons name={isLastStep ? "checkmark-circle" : "arrow-forward-circle"} size={24} color="white" />
                            <Text style={styles.buttonText}>
                                {isLastStep ? "Concluir" : "Próximo"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const TutorialScreen = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isTutorialVisible, setTutorialVisible] = useState(true);

    const handleNext = () => {
        setCurrentStep(prevStep => prevStep + 1);
    };

    const handleClose = () => {
        setTutorialVisible(false); 
        setCurrentStep(0); 
    };

    return (
        <>
            {isTutorialVisible && (
                <IntroTutorial 
                    currentStep={currentStep} 
                    onNext={handleNext} 
                    onClose={handleClose} 
                />
            )}
        </>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: '#f9f9f9',
        padding: 30,
        borderRadius: 20,
        width: '85%',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    icon: {
        marginBottom: 15,
    },
    title: { 
        fontSize: 24, 
        fontWeight: '600', 
        marginBottom: 10,
        color: '#333',
        textAlign: 'center',
    },
    message: { 
        fontSize: 16, 
        textAlign: 'center', 
        color: '#555',
        marginBottom: 30,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3a9ee4',
        paddingVertical: 14,
        paddingHorizontal: 25,
        borderRadius: 25,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});

export default TutorialScreen;
