import { FloodData } from "@/app/api/flood-data/route";

/**
 * Fetches flood data from the API with optional filtering
 */
export async function fetchFloodData(
  location: string = "all",
  startTime?: string,
  endTime?: string
): Promise<FloodData[]> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (location !== "all") {
      params.append("location", location);
    }
    if (startTime) {
      params.append("start_time", startTime);
    }
    if (endTime) {
      params.append("end_time", endTime);
    }

    // Determine if we're running on the server or client
    const baseUrl = typeof window === 'undefined' 
      ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000' 
      : '';
    
    // Create a proper URL object to handle encoding correctly
    const url = new URL(`${baseUrl}/api/flood-data/data`);
    // Add the search params to the URL
    url.search = params.toString();
    
    // Make API request with properly encoded URL
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch flood data");
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching flood data:", error);
    return [];
  }
}

/**
 * Fetches unique locations from the flood data
 */
export async function fetchLocations(): Promise<string[]> {
  try {
    const data = await fetchFloodData();
    const uniqueLocations = [...new Set(data.map(item => item.location))];
    return uniqueLocations;
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
}
