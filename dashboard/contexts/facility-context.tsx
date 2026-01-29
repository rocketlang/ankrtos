'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useQuery } from '@apollo/client';
import { GET_FACILITIES } from '@/graphql/queries/yard';

interface Facility {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
}

interface FacilityContextValue {
  facilityId: string;
  tenantId: string;
  facilities: Facility[];
  loading: boolean;
  setFacilityId: (id: string) => void;
}

const FacilityContext = createContext<FacilityContextValue>({
  facilityId: '',
  tenantId: 'default',
  facilities: [],
  loading: true,
  setFacilityId: () => {},
});

export function FacilityProvider({ children }: { children: ReactNode }) {
  const tenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? 'default';
  const [facilityId, setFacilityIdState] = useState<string>('');

  const { data, loading } = useQuery(GET_FACILITIES, {
    variables: { tenantId },
  });

  const facilities: Facility[] = data?.facilities ?? [];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('icd-facility-id');
      if (stored) {
        setFacilityIdState(stored);
        return;
      }
    }
    if (facilities.length > 0 && !facilityId) {
      setFacilityIdState(facilities[0].id);
    }
  }, [facilities, facilityId]);

  const setFacilityId = useCallback((id: string) => {
    setFacilityIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('icd-facility-id', id);
    }
  }, []);

  return (
    <FacilityContext.Provider value={{ facilityId, tenantId, facilities, loading, setFacilityId }}>
      {children}
    </FacilityContext.Provider>
  );
}

export function useFacilityContext() {
  return useContext(FacilityContext);
}
