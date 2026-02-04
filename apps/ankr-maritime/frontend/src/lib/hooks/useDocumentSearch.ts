import { useLazyQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { useSearchStore } from '../stores/searchStore';

const SEARCH_DOCUMENTS = gql`
  query SearchDocuments(
    $query: String!
    $limit: Int
    $docTypes: [String!]
    $vesselId: String
    $voyageId: String
    $minImportance: Float
    $rerank: Boolean
  ) {
    searchDocuments(
      query: $query
      limit: $limit
      docTypes: $docTypes
      vesselId: $vesselId
      voyageId: $voyageId
      minImportance: $minImportance
      rerank: $rerank
    ) {
      id
      documentId
      title
      content
      excerpt
      score
      metadata
      entities {
        vesselNames
        portNames
        cargoTypes
        parties
      }
      createdAt
    }
  }
`;

export function useDocumentSearch() {
  const {
    query,
    filters,
    pageSize,
    setResults,
    setIsSearching,
    setTotalResults,
    addRecentSearch,
  } = useSearchStore();

  const [searchDocuments, { data, loading, error, refetch }] = useLazyQuery(
    SEARCH_DOCUMENTS,
    {
      onCompleted: (data) => {
        if (data?.searchDocuments) {
          setResults(data.searchDocuments);
          setTotalResults(data.searchDocuments.length);
          setIsSearching(false);

          // Add to recent searches
          if (query) {
            addRecentSearch(query);
          }
        }
      },
      onError: () => {
        setIsSearching(false);
      },
    }
  );

  const executeSearch = (customQuery?: string, customFilters?: any) => {
    const searchQuery = customQuery || query;
    const searchFilters = customFilters || filters;

    if (!searchQuery.trim()) return;

    setIsSearching(true);

    searchDocuments({
      variables: {
        query: searchQuery,
        limit: pageSize,
        docTypes: searchFilters.docTypes?.length > 0 ? searchFilters.docTypes : undefined,
        vesselId: searchFilters.vesselId,
        voyageId: searchFilters.voyageId,
        minImportance: searchFilters.minImportance,
        rerank: true, // Always use reranking for better results
      },
    });
  };

  return {
    results: data?.searchDocuments || [],
    loading,
    error,
    executeSearch,
    refetch,
  };
}
