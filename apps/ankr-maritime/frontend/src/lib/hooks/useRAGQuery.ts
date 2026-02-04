import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { useRAGStore } from '../stores/ragStore';

const ASK_MARI8X_RAG = gql`
  query AskMari8xRAG($question: String!, $limit: Int, $docTypes: [String!]) {
    askMari8xRAG(question: $question, limit: $limit, docTypes: $docTypes) {
      answer
      sources {
        documentId
        title
        excerpt
        page
        relevanceScore
      }
      confidence
      timestamp
      followUpSuggestions
    }
  }
`;

export interface UseRAGQueryOptions {
  question: string;
  limit?: number;
  docTypes?: string[];
  enabled?: boolean;
}

export function useRAGQuery(options: UseRAGQueryOptions) {
  const { question, limit = 5, docTypes, enabled = true } = options;
  const {
    addMessage,
    addSources,
    setConfidence,
    setIsQuerying,
    setFollowUpSuggestions,
  } = useRAGStore();

  const { data, loading, error, refetch } = useQuery(ASK_MARI8X_RAG, {
    variables: { question, limit, docTypes },
    skip: !question || !enabled,
    onCompleted: (data) => {
      if (data?.askMari8xRAG) {
        const result = data.askMari8xRAG;

        // Add assistant message to conversation
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: result.answer,
          timestamp: new Date(result.timestamp),
          sources: result.sources,
          confidence: result.confidence,
        });

        // Update sources and confidence
        addSources(result.sources);
        setConfidence(result.confidence);
        setFollowUpSuggestions(result.followUpSuggestions);
        setIsQuerying(false);
      }
    },
    onError: () => {
      setIsQuerying(false);
    },
  });

  return {
    answer: data?.askMari8xRAG?.answer,
    sources: data?.askMari8xRAG?.sources || [],
    confidence: data?.askMari8xRAG?.confidence || 0,
    followUpSuggestions: data?.askMari8xRAG?.followUpSuggestions || [],
    loading,
    error,
    refetch,
  };
}
