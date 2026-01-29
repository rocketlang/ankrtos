import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useQuery } from '@apollo/client';
import { GET_FACILITIES } from '@/graphql/queries';
import { getStoredFacilityId, getStoredTenantId, setFacilityId as storeFacilityId } from '@/lib/storage';

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
  const tenantId = getStoredTenantId();
  const [facilityId, setFacilityIdState] = useState<string>(getStoredFacilityId());

  const { data, loading } = useQuery(GET_FACILITIES, {
    variables: { tenantId },
  });

  const facilities: Facility[] = data?.facilities ?? [];

  useEffect(() => {
    if (facilities.length > 0 && !facilityId) {
      setFacilityIdState(facilities[0].id);
      storeFacilityId(facilities[0].id);
    }
  }, [facilities, facilityId]);

  const setFacilityId = useCallback((id: string) => {
    setFacilityIdState(id);
    storeFacilityId(id);
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
