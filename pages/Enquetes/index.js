import { useNavigation } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, View, Image } from "react-native";

export default function Enquetes() {
    const navegacao = useNavigation();

    return (
        <View style={estilo.container}>

        </View>
    );
}

const estilo = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },

});