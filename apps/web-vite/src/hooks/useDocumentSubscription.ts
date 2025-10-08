import { useSubscription } from '@apollo/client';
import { gql } from '@apollo/client';
import { useEffect } from 'react';

const DOCUMENT_CHANGED = gql`
  subscription DocumentChanged($documentId: String!) {
    documentChanged(documentId: $documentId) {
      type
      documentId
      userId
      change
      timestamp
    }
  }
`;

export function useDocumentSubscription(
  documentId: string,
  onUpdate: (data: any) => void
) {
  const { data, loading, error } = useSubscription(DOCUMENT_CHANGED, {
    variables: { documentId },
    shouldResubscribe: true,
  });

  useEffect(() => {
    if (data?.documentChanged) {
      onUpdate(data.documentChanged);
    }
  }, [data, onUpdate]);

  return { loading, error };
}
