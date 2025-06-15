'use client'

import { FloodData } from "@/app/api/flood-data/route";
import { getChartOptions, prepareChartData } from "@/utils/chartUtils";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from "chart.js";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DateRange {
  start: string;
  end: string;
}

interface FloodDashboardProps {
  initialData: FloodData[];
  initialLocations: string[];
  initialDateRange: DateRange;
}

export default function FloodDashboard({ 
  initialData, 
  initialLocations,
  initialDateRange 
}: FloodDashboardProps) {
  const [allFloodData, setAllFloodData] = useState<FloodData[]>(initialData);
  const [filteredData, setFilteredData] = useState<FloodData[]>(initialData);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  const [locations, setLocations] = useState<string[]>(initialLocations);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
    
    setFilteredData(filtered);
  };

  
  // Apply filters when selection changes
  useEffect(() => {
    if (allFloodData.length > 0) {
      applyFilters();
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation, dateRange, allFloodData ]);

  // Prepare chart data and options
  const chartData = prepareChartData(filteredData, selectedLocation, locations);
  const chartOptions = getChartOptions();

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-2 text-sm font-medium">Location</label>
          <select 
            className="w-full p-2 border rounded"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="all">All Locations</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block mb-2 text-sm font-medium">Start Date</label>
          <input 
            type="date" 
            className="w-full p-2 border rounded"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          />
        </div>
        
        <div>
          <label className="block mb-2 text-sm font-medium">End Date</label>
          <input 
            type="date" 
            className="w-full p-2 border rounded"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          />
        </div>
      </div>
   
      
      <div className="bg-white p-4 rounded-lg shadow">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : filteredData.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <p className="text-center py-10">No data available for the selected filters</p>
        )}
      </div>
    </div>
  );
}
