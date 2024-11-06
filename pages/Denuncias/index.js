import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { useTheme } from "../../ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import AlertaLogin from "../Alertas/AlertaLogin";
import { useFocusEffect } from "@react-navigation/native";

const Denuncias = ({ onCommentDelete }) => {
    const { isDarkMode } = useTheme();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertVisible, setAlertVisible] = useState(false);
    const [successAlertVisible, setSuccessAlertVisible] = useState(false);
    const [alertContent, setAlertContent] = useState({ title: "", message: "" });
    const [selectedReport, setSelectedReport] = useState(null);

    // Carregar as denúncias ao focar na tela
    const fetchReports = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "reports"));
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

    const confirmDelete = async () => {
        if (selectedReport) {
            try {
                console.log("Tentando excluir o comentário:", selectedReport.commentId);
                
                // Excluir o comentário do Firebase
                const commentRef = doc(db, "posts", selectedReport.postId, "comments", selectedReport.commentId);
                await deleteDoc(commentRef);
                console.log("Comentário excluído com sucesso:", selectedReport.commentId);

                // Excluir o relatório após remover o comentário
                const reportRef = doc(db, "reports", selectedReport.id);
                await deleteDoc(reportRef);
                console.log("Denúncia excluída com sucesso:", selectedReport.id);

                // Atualizar o estado local removendo a denúncia excluída
                setReports((prevReports) => prevReports.filter((report) => report.id !== selectedReport.id));

                if (onCommentDelete) {
                    onCommentDelete(selectedReport);
                }

                // Fechar o alerta de confirmação e exibir o alerta de sucesso
                setAlertVisible(false);
                setSelectedReport(null);
                setSuccessAlertVisible(true);
            } catch (error) {
                console.error("Erro ao excluir comentário:", error);
            }
        }
    };

    const handleDeleteComment = (report) => {
        setSelectedReport({
            id: report.id,
            postId: report.postId,
            commentId: report.commentId,
        });
        setAlertContent({
            title: "Confirmar Exclusão",
            message: "Tem certeza de que deseja excluir este comentário?",
        });
        setAlertVisible(true);
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, isDarkMode && styles.darkLoadingContainer]}>
                <ActivityIndicator size="large" color="#3a9ee4" />
                <Text style={[styles.loadingText, isDarkMode && styles.darkLoadingText]}>Carregando denúncias...</Text>
            </View>
        );
    }

    return (
        <>
            <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]}>
                {reports.length > 0 ? (
                    reports.map((report) => (
                        <View key={report.id} style={[styles.reportCard, isDarkMode && styles.darkReportCard]}>
                            <View style={styles.reportHeader}>
                                <Ionicons name="alert-circle" size={28} color={isDarkMode ? "black" : "black"} />
                                <Text style={[styles.reportTitle, isDarkMode && styles.darkReportTitle]}>Nova denúncia</Text>
                                 {/* <TouchableOpacity onPress={() => handleDeleteComment(report)}>
                                    <Ionicons name="trash-bin" size={24} color="#1A1F36" style={styles.trashIcon} />
                                </TouchableOpacity> */}
                            </View>
                            <Text style={[styles.reportContent, isDarkMode && styles.darkReportContent]}>
                                {report.commentContent}
                            </Text>
                            <View style={styles.infoContainer}>
                                <Ionicons name="person-circle-outline" size={25} color="black" />
                                <Text style={[styles.reportUser, isDarkMode && styles.darkReportUser]}>
                                    Por: {report.reportedCommentUser}
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
                                    Data: {report.timestamp.toDate().toLocaleString()}
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

            <AlertaLogin
                visible={alertVisible}
                title={alertContent.title}
                message={alertContent.message}
                onClose={() => setAlertVisible(false)}
                onConfirm={confirmDelete}
            />

            <AlertaLogin
                visible={successAlertVisible}
                title="Sucesso"
                message="Comentário excluído com sucesso."
                onClose={() => setSuccessAlertVisible(false)}
            />
        </>
    );
};


const styles = StyleSheet.create({
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
    },
    darkLoadingText: {
        color: 'white',
        textAlign: 'center',
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
        fontSize: 20,
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
        fontSize: 17,
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
        fontSize: 17,
        color: 'black',
        marginLeft: 8,
    },
    darkReportUser: {
        color: 'black',
    },
    reportedBy: {
        fontSize: 17,
        color: 'black',
        marginLeft: 8,
    },
    darkReportedBy: {
        color: 'black',
    },
    reportDate: {
        fontSize: 17,
        color: 'black',
        marginLeft: 8,
    },
    darkReportDate: {
        color: 'black',
    },
    noReportsText: {
        flex: 1,
        color: 'black',
        fontSize: 19,
    },
    darkNoReportsText: {
        flex: 1,
        color: 'white',
        fontSize: 19,
    },
    semdenuncia: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '90%',
    },
});

export default Denuncias;
