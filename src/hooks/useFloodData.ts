import { useState, useEffect } from "react";
import { fetchFloodData } from "@/lib/services/floodDataService";
import { FloodData } from "@/app/api/flood-data/route";

interface DateRange {
  start: string;
  end: string;
}

export function useFloodData() {
  const [allFloodData, setAllFloodData] = useState<FloodData[]>([]);
  const [filteredData, setFilteredData] = useState<FloodData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    start: "",
    end: ""
  });
  const [locations, setLocations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize with default date range (last 7 days)
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    setDateRange({
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    });
  }, []);

  // Fetch data from API
  const fetchData = async () => {
    console.log("FETCH DATA CALLED");
    setIsLoading(true);
    setError(null);
    
    try {
      if (dateRange.start && dateRange.end) {
        // Format dates for API
        const startTime = new Date(dateRange.start);
        startTime.setHours(0, 0, 0, 0);
        
        const endTime = new Date(dateRange.end);
        endTime.setHours(23, 59, 59, 999);
        
        console.log("Before API call", { startTime, endTime });
        
        const data = await fetchFloodData(
          undefined, // Fetch all locations
          startTime.toISOString(),
          endTime.toISOString()
        );
        
        console.log("API response data:", data);
        
        setAllFloodData(data);
        
        // Extract unique locations from the data
        const uniqueLocations = [...new Set(data.map(item => item.location))];
        setLocations(uniqueLocations);
        
        // Apply initial filters
        applyFilters(data);
      }
    } catch (err) {
      console.error("Error loading flood data:", err);
      setError("Failed to load flood data");
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters to the data without refetching
  const applyFilters = (data = allFloodData) => {
    let filtered = [...data];
    
    // Filter by location if not "all"
    if (selectedLocation !== "all") {
      filtered = filtered.filter(item => item.location === selectedLocation);
    }
    
    // Filter by date range
    if (dateRange.start && dateRange.end) {
      const startTime = new Date(dateRange.start);
      startTime.setHours(0, 0, 0, 0);
      
      const endTime = new Date(dateRange.end);
      endTime.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= startTime && itemDate <= endTime;
      });
    }
    
    console.log("Filtered data:", filtered);
    setFilteredData(filtered);
  };

  // Initial data fetch when date range is set
  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.start, dateRange.end]);

  // Apply filters when selection changes
  useEffect(() => {
    if (allFloodData.length > 0) {
      applyFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation, dateRange, allFloodData]);

  return {
    filteredData,
    selectedLocation,
    setSelectedLocation,
    dateRange,
    setDateRange,
    locations,
    isLoading,
    error,
    fetchData
  };
}
