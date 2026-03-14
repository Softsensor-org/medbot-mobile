import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, typography, spacing } from "../../../src/theme";
import EvidenceProgressBar from "../../../src/components/EvidenceProgressBar";
import EscalationGateModal from "../../../src/components/EscalationGateModal";
import { ChatCardInline } from "../../../src/components/ChatCardInline";
import { useSessionTranscript, useEvidenceSnapshot } from "../../../src/hooks/useSessions";
import { streamChat } from "../../../src/stream/streamChat";
import { TranscriptMessage, sessionsApi } from "../../../src/api/sessionsApi";
import { useQueryClient } from "@tanstack/react-query";
import { sessionKeys } from "../../../src/queryKeys";
import type { ChatCard } from "../../../src/types/ai";

export default function ChatScreen() {
  const params = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setIsStreamedContent] = useState("");
  const [escalation, setEscalation] = useState<{
    visible: boolean;
    category?: string | null;
    guidance?: string | null;
  }>({ visible: false });
  const [summaryCard, setSummaryCard] = useState<ChatCard | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const streamedContentRef = useRef("");

  const {
    data: transcriptData,
    isLoading: isTranscriptLoading,
  } = useSessionTranscript(sessionId || "");

  const { data: snapshot } = useEvidenceSnapshot(sessionId || "");

  // Local state for optimistic UI and streaming
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);

  // IMP-161: transcriptData is now a bare TranscriptMessage[] array
  useEffect(() => {
    if (transcriptData && Array.isArray(transcriptData)) {
      setMessages(transcriptData);
    }
  }, [transcriptData]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !sessionId || isStreaming) return;

    const userMessage: TranscriptMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);
    streamedContentRef.current = "";
    setIsStreamedContent("");

    try {
      await streamChat({
        sessionId,
        query: userMessage.content,
        onEvent: (event) => {
          if (event.type === "token") {
            streamedContentRef.current += event.content;
            setIsStreamedContent(streamedContentRef.current);
          } else if (event.type === "complete") {
            // Check for escalation gate
            const mo = event.model_output;
            if (mo?.escalation_required) {
              setEscalation({
                visible: true,
                category: mo.escalation_category,
                guidance: mo.escalation_guidance,
              });
            }

            const finalAssistantContent = streamedContentRef.current.trim();
            if (finalAssistantContent) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: finalAssistantContent,
                  timestamp: new Date().toISOString(),
                },
              ]);
            }

            queryClient.invalidateQueries({ queryKey: sessionKeys.transcript(sessionId) });
            setIsStreaming(false);
            streamedContentRef.current = "";
            setIsStreamedContent("");
          } else if (event.type === "error") {
            setIsStreaming(false);
            streamedContentRef.current = "";
            // Show error message
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: "Sorry, I encountered an error. Please try again.",
                timestamp: new Date().toISOString(),
              },
            ]);
          }
        },
        onError: (err) => {
          console.error("Stream error:", err);
          setIsStreaming(false);
          streamedContentRef.current = "";
        },
      });
    } catch (err) {
      console.error("Failed to start stream:", err);
      setIsStreaming(false);
    }
  }, [input, sessionId, isStreaming, queryClient]);

  const handleSummarize = useCallback(async () => {
    if (!sessionId || isSummarizing) return;
    setIsSummarizing(true);
    try {
      const card = await sessionsApi.summarizeSession(sessionId);
      setSummaryCard(card);
    } catch (err) {
      console.error("Failed to summarize session:", err);
    } finally {
      setIsSummarizing(false);
    }
  }, [sessionId, isSummarizing]);

  const handleSummaryCardUpdate = useCallback((updated: ChatCard) => {
    setSummaryCard(updated);
  }, []);

  const renderMessage = ({ item }: { item: TranscriptMessage }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
          {item.content}
        </Text>
      </View>
    );
  };

  if (!sessionId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Invalid session ID.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isTranscriptLoading && messages.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Consultation</Text>
          <Text style={styles.headerSubtitle}>ID: {sessionId.slice(0, 8)}...</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleSummarize}
            disabled={isSummarizing}
          >
            {isSummarizing ? (
              <ActivityIndicator size="small" color={colors.info} />
            ) : (
              <MaterialIcons name="article" size={24} color={colors.info} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/(auth)/intake")}
          >
            <MaterialIcons name="info-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {snapshot && (
        <View style={styles.progressOverlay}>
          <EvidenceProgressBar
            evidenceSlots={snapshot.slots}
            evidenceCompleteness={snapshot.evidence_completeness}
            missingEvidence={snapshot.missing_evidence}
            onPress={() => router.push("/(auth)/intake")}
          />
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          <>
            {isStreaming && streamedContent ? (
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <Text testID="streamed-content" style={[styles.messageText, styles.assistantText]}>{streamedContent}</Text>
              </View>
            ) : isStreaming ? (
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null}
            {summaryCard && (
              <ChatCardInline card={summaryCard} onCardUpdate={handleSummaryCardUpdate} escalationActive={escalation.visible} />
            )}
          </>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          testID="send-button"
          style={[styles.sendButton, (!input.trim() || isStreaming) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || isStreaming}
        >
          <MaterialIcons name="send" size={24} color={colors.surface} />
        </TouchableOpacity>
      </View>

      <EscalationGateModal
        visible={escalation.visible}
        category={escalation.category}
        guidance={escalation.guidance}
        onAcknowledge={() => setEscalation({ visible: false })}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: spacing.xs,
  },
  progressOverlay: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.sm,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceVariant,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...typography.body,
  },
  userText: {
    color: colors.surface,
  },
  assistantText: {
    color: colors.textPrimary,
  },
  loadingBubble: {
    alignSelf: "flex-start",
    padding: spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    marginRight: spacing.sm,
    maxHeight: 100,
    ...typography.body,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    marginBottom: spacing.md,
  },
  backButton: {
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.surface,
    fontWeight: "bold",
  },
});
