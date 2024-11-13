import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { collection, getDocs, query, orderBy} from "firebase/firestore";
import { db } from "../../firebase";
import { useTheme } from "../../ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

const Denuncias = ({ globalFontSize }) => {
    const { isDarkMode } = useTheme();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const styles = createStyles(globalFontSize);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const reportsQuery = query(collection(db, "reports"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(reportsQuery);
            const reportsData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            console.log("Denúncias carregadas:", reportsData);
            setReports(reportsData);
        } catch (error) {
            console.error("Erro ao buscar denúncias:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchReports();
        }, [])
    );

    if (loading) {
        return (
            <View style={[styles.loadingContainer, isDarkMode && styles.darkLoadingContainer]}>
                <ActivityIndicator size="large" color="#3a9ee4" />
                <Text style={[styles.loadingText, isDarkMode && styles.darkLoadingText]}>Carregando denúncias...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]}>
            {reports.length > 0 ? (
                reports.map((report) => (
                    <View key={report.id} style={[styles.reportCard, isDarkMode && styles.darkReportCard]}>
                        <View style={styles.reportHeader}>
                            <Ionicons name="alert-circle" size={28} color={isDarkMode ? "black" : "black"} />
                            <Text style={[styles.reportTitle, isDarkMode && styles.darkReportTitle]}>Nova denúncia</Text>
                        </View>
                        {report.commentContent ? (
                            <Text style={[styles.reportContent, isDarkMode && styles.darkReportContent]}>
                                {report.commentContent}
                            </Text>
                        ) : (
                            <Text style={[styles.reportContent, isDarkMode && styles.darkReportContent]}>
                                {report.content || "Conteúdo não disponível"}
                            </Text>
                        )}
                        
                        <View style={styles.infoContainer}>
                            <Ionicons name="person-circle-outline" size={25} color="black" />
                            <Text style={[styles.reportUser, isDarkMode && styles.darkReportUser]}>
                                Autor(a): {report.reportedCommentUser || report.author}
                            </Text>
                        </View>
                        <View style={styles.infoContainer}>
                            <Ionicons name="person-outline" size={25} color="black" />
                            <Text style={[styles.reportedBy, isDarkMode && styles.darkReportedBy]}>
                                Denunciado por: {report.reportedBy}
                            </Text>
                        </View>
                        <View style={styles.infoContainer}>
                            <Ionicons name="calendar-outline" size={25} color="black" />
                            <Text style={[styles.reportDate, isDarkMode && styles.darkReportDate]}>
                                Data: {report.timestamp ? report.timestamp.toDate().toLocaleString() : "Data não disponível"}
                            </Text>
                        </View>
                    </View>
                ))
            ) : (
                <View style={styles.semdenuncia}>
                    <Text style={[styles.noReportsText, isDarkMode && styles.darkNoReportsText]}>Nenhuma denúncia registrada.</Text>
                </View>
            )}
        </ScrollView>
    );
};


const createStyles = (globalFontSize) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#fff',
            padding: 16,
        },
        darkContainer: {
            backgroundColor: '#1A1F36',
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#fff',
        },
        darkLoadingContainer: {
            backgroundColor: '#1A1F36',
        },
        loadingText: {
            color: 'black',
            marginTop: 10,
            textAlign: 'center',
            fontSize: 0 + globalFontSize,
        },
        darkLoadingText: {
            color: 'white',
            textAlign: 'center',
            fontSize: 0 + globalFontSize,
        },
        reportCard: {
            backgroundColor: '#ADD8F6',
            borderRadius: 12,
            padding: 16,
            marginVertical: 8,
            elevation: 3,
        },
        darkReportCard: {
            backgroundColor: '#8bb0c9',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            borderColor: 'white',
            borderWidth: 1,
        },
        reportHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
        },
        reportTitle: {
            fontSize: 6 + globalFontSize,
            fontWeight: 'bold',
            color: 'black',
            marginLeft: 8,
            textAlign: 'center',
        },
        darkReportTitle: {
            color: 'black',
        },
        trashIcon: {
            marginLeft: 'auto',
            paddingLeft: 72.5,
        },
        reportContent: {
            fontSize: 3 + globalFontSize,
            color: 'black',
            marginVertical: 8,
            lineHeight: 30,
            textAlign: 'center',
        },
        darkReportContent: {
            color: 'black',
        },
        infoContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 4,
        },
        reportUser: {
            fontSize: 3 + globalFontSize,
            color: 'black',
            marginLeft: 8,
            width: '90%',
        },
        darkReportUser: {
            color: 'black',
            width: '90%',
        },
        reportedBy: {
            fontSize: 3 + globalFontSize,
            color: 'black',
            marginLeft: 8,
            width: '90%',
        },
        darkReportedBy: {
            color: 'black',
            width: '90%',
        },
        reportDate: {
            fontSize: 3 + globalFontSize,
            color: 'black',
            marginLeft: 8,
            width: '90%',
        },
        darkReportDate: {
            color: 'black',
            width: '90%',
        },
        noReportsText: {
            flex: 1,
            color: 'black',
            fontSize: 5 + globalFontSize,
        },
        darkNoReportsText: {
            flex: 1,
            color: 'white',
            fontSize: 5 + globalFontSize,
        },
        semdenuncia: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '90%',
        },
    });

export default Denuncias;
