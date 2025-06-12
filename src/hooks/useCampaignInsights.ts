import { useQuery, useQueries } from '@tanstack/react-query';
import { useAuthStore } from "../api/store/authStore";
import { getCampaignInsights } from '../api/campaigns';

// Single campaign insights fetch using the API function
export const fetchCampaignInsights = async (campaignId: string) => {

  try {
    const response = await getCampaignInsights(campaignId);
    return response.data;
  } catch (error) {
    console.error(`Error fetching insights for campaign ${campaignId}:`, error);
    
    // If the error message contains 'unauthorized', it's an auth error
    if (error instanceof Error && 
        (error.message.toLowerCase().includes('unauthorized') || 
         error.message.toLowerCase().includes('401'))) {
      throw new Error('Unauthorized: Your session may have expired');
    }
    
    return null; // Return null for other errors
  }
};

// Hook to fetch insights for multiple campaigns
export const useCampaignInsightsQueries = (campaignIds: string[]) => {
  const { isAuthenticated } = useAuthStore();

  return useQueries({
    queries: campaignIds.map(id => ({
      queryKey: ['campaignInsights', id],
      queryFn: () => fetchCampaignInsights(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: isAuthenticated && !!id // Only run query if authenticated and ID exists
    })),
    combine: (results) => {
      // Create a map of campaign ID to insights
      const insightsMap = results.reduce((acc, result, index) => {
        const campaignId = campaignIds[index];
        if (result.data) {
          acc[campaignId] = result.data;
        }
        return acc;
      }, {});
      
      // Check for authorization errors
      const hasAuthError = results.some(result => 
        result.error && result.error.message?.includes('Unauthorized')
      );
      
      return {
        data: insightsMap,
        isLoading: results.some(result => result.isLoading),
        isError: results.some(result => result.isError),
        isUnauthorized: hasAuthError,
        errors: results.filter(result => result.error).map(result => result.error)
      };
    }
  });
};

// Single campaign insights query
export const useCampaignInsightsQuery = (campaignId: string) => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: ['campaignInsights', campaignId],
    queryFn: () => fetchCampaignInsights(campaignId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isAuthenticated && !!campaignId
  });
};