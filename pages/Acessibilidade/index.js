import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, Switch, PanResponder, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../ThemeContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const BotaoAcessibilidade = ({ setDaltonismEnabled, setHighContrastEnabled, setGlobalFontSize }) => {
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [fontSize, setFontSize] = useState(14);
    const [sliderFontSize, setSliderFontSize] = useState(14);
    const [isDaltonismEnabled, setIsDaltonismEnabled] = useState(false);
    const [isHighContrast, setIsHighContrast] = useState(false);
    const { isDarkMode, toggleDarkMode } = useTheme();

    const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
    const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
    const [position, setPosition] = useState({ x: screenWidth - 70, y: screenHeight / 2 - 30 });

    useEffect(() => {
        const handleDimensionChange = ({ window }) => {
            setScreenWidth(window.width);
            setScreenHeight(window.height);
            setPosition((prevPosition) => ({
                x: Math.min(prevPosition.x, window.width - 50),
                y: Math.min(prevPosition.y, window.height - 50),
            }));
        };

        const subscription = Dimensions.addEventListener('change', handleDimensionChange);
        
        return () => subscription?.remove();
    }, []);

    const toggleMenu = () => setMenuVisible(!isMenuVisible);

    const toggleDaltonism = () => {
        setIsDaltonismEnabled(!isDaltonismEnabled);
        setDaltonismEnabled(!isDaltonismEnabled);
    };

    const toggleHighContrast = () => {
        setIsHighContrast(!isHighContrast);
        setHighContrastEnabled(!isHighContrast);
    };

    const handleFontSizeChangeComplete = (newSize) => {
        if (typeof newSize === 'number' && !isNaN(newSize) && newSize >= 12 && newSize <= 24) {
            const diff = newSize - fontSize;
            setFontSize(newSize);
            setGlobalFontSize(diff);
        }
    };

    const handleSliderValueChange = (value) => {
        if (!isNaN(value)) setSliderFontSize(value);
    };

    const resetFontSize = () => {
        setSliderFontSize(14);
        handleFontSizeChangeComplete(14);
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
            const newX = Math.max(0, Math.min(screenWidth - 50, position.x + gestureState.dx));
            const newY = Math.max(0, Math.min(screenHeight - 50, position.y + gestureState.dy));
            setPosition({ x: newX, y: newY });
        },
        onPanResponderRelease: (_, gestureState) => {
            const finalX = Math.max(0, Math.min(screenWidth - 50, position.x + gestureState.dx));
            const finalY = Math.max(0, Math.min(screenHeight - 50, position.y + gestureState.dy));
            setPosition({ x: finalX, y: finalY });
        },
    });

    return (
        <View
            style={[styles.container, { top: position.y, left: position.x }]}
            {...panResponder.panHandlers}
        >
            <View
                style={[styles.button, { backgroundColor: isDarkMode ? "#005a99" : "#3a9ee4" }]}
                onTouchEnd={toggleMenu}
            >
                <MaterialIcons name="accessibility" size={24} color="white" />
            </View>

            <Modal
                visible={isMenuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={toggleMenu}
            >
               <View style={styles.overlay}>
                    <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#1A1F36' : '#F0F0F5' }]}>
                        <Text style={[styles.title, { fontSize: fontSize || 14, color: isDarkMode ? "white" : "#333" }]}>Acessibilidade</Text>

                        <View style={styles.card1}>
                            <View style={styles.iconTextContainer1}>
                                <MaterialIcons name="format-size" size={24} color={isDarkMode ? "white" : "#333"} />
                                <Text style={[styles.optionText, { fontSize: fontSize || 16, color: isDarkMode ? "white" : "#333" }]}>Tamanho da Fonte</Text>
                            </View>
                            <Slider
                                style={styles.slider}
                                minimumValue={14}
                                maximumValue={24}
                                step={1}
                                value={sliderFontSize}
                                onValueChange={handleSliderValueChange}
                                onSlidingComplete={handleFontSizeChangeComplete}
                            />
                            <TouchableOpacity onPress={resetFontSize} style={styles.resetButton}>
                                <MaterialIcons name="restore" size={24} color={isDarkMode ? "white" : "#333"} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.card}>
                            <MaterialIcons name="brightness-6" size={24} color={isDarkMode ? "white" : "#333"} />
                            <Text style={[styles.optionText, { fontSize: fontSize || 16, color: isDarkMode ? "white" : "#333" }]}>Tema Escuro</Text>
                            <Switch
                                value={isDarkMode}
                                onValueChange={toggleDarkMode}
                            />
                        </View>

                        <View style={styles.card}>
                            <MaterialIcons name="palette" size={24} color={isDarkMode ? "white" : "#333"} />
                            <Text style={[styles.optionText, { fontSize: fontSize || 16, color: isDarkMode ? "white" : "#333" }]}>Modo Daltonismo</Text>
                            <Switch
                                value={isDaltonismEnabled}
                                onValueChange={toggleDaltonism}
                            />
                        </View>

                        <View style={styles.card}>
                            <MaterialIcons name="high-quality" size={24} color={isDarkMode ? "white" : "#333"} />
                            <Text style={[styles.optionText, { fontSize: fontSize || 16, color: isDarkMode ? "white" : "#333" }]}>Alto Contraste</Text>
                            <Switch
                                value={isHighContrast}
                                onValueChange={toggleHighContrast}
                            />
                        </View>

                        <TouchableOpacity onPress={toggleMenu} style={[styles.closeButton, { backgroundColor: isDarkMode ? "#005a99" : "#3a9ee4" }]}>
                            <Text style={[styles.closeButtonText, { fontSize: fontSize || 16 }]}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 1,
    },
    button: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        elevation: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#3333',
        borderRadius: 8,
        padding: 15,
        marginVertical: 8,
        width: '100%',
    },
    optionText: {
        fontSize: 16,
        flex: 1,
        marginLeft: 10,
    },
    slider: {
        width: '90%',
        alignSelf: 'center',
    },
    sampleText: {
        marginTop: 10,
        textAlign: 'center',
        marginBottom: 10,
    },
    closeButton: {
        marginTop: 20,
        padding: 10,
        borderRadius: 8,
        width: '50%',
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
    },
    iconTextContainer1: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    card1: {
        alignItems: 'center',
        backgroundColor: '#3333',
        borderRadius: 8,
        padding: 15,
        marginVertical: 8,
        width: '100%',
    },
});

export default BotaoAcessibilidade;
