export const revalidate = 0;

import { Suspense } from 'react';

import { fetchFloodData } from "@/lib/services/floodDataService";
import FloodDashboard from "@/components/FloodDashboard";

export default async function Home() {
  // Set default date range (last 7 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  // Fetch initial data on the server
  const initialData = await fetchFloodData(
    undefined,
    startDate.toISOString(),
    endDate.toISOString()
  );
  
  // Extract unique locations from the data
  const locations = [...new Set(initialData.map(item => item.location))];
  
  // Initial date range to pass to client
  const initialDateRange = {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-3xl font-bold text-center">Flood Monitoring System</h1>
      
      <Suspense fallback={
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }>
        <FloodDashboard 
          initialData={initialData} 
          initialLocations={locations}
          initialDateRange={initialDateRange}
        />
      </Suspense>
      
      <footer className="text-center text-sm text-gray-500">
        © 2025 Flood Monitoring System
      </footer>
    </div>
  );
}
