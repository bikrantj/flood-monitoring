import { format, parseISO } from "date-fns";
import { FloodData } from "@/app/api/flood-data/route";
import { ChartData, ChartOptions } from "chart.js";

// Color palette for different locations
const locationColors = [
  { border: "rgb(53, 162, 235)", background: "rgba(53, 162, 235, 0.5)" },
  { border: "rgb(255, 99, 132)", background: "rgba(255, 99, 132, 0.5)" },
  { border: "rgb(75, 192, 192)", background: "rgba(75, 192, 192, 0.5)" },
  { border: "rgb(255, 159, 64)", background: "rgba(255, 159, 64, 0.5)" },
  { border: "rgb(153, 102, 255)", background: "rgba(153, 102, 255, 0.5)" },
];

export function prepareChartData(
  filteredData: FloodData[],
  selectedLocation: string,
  locations: string[]
): ChartData<"line"> {
  // Format timestamps correctly, preserving the original timezone
  const formattedLabels = filteredData.map(item => {
    // Parse the ISO string
    const date = parseISO(item.timestamp);
    // Format the date, preserving the original time
    return format(date, "MMM dd, HH:mm");
  });

  // Create data points with x and y values
  const datasets = selectedLocation === "all" 
    ? locations.map((location, index) => {
        const colorIndex = index % locationColors.length;
        const locationData = filteredData.filter(item => item.location === location);
        
        return {
          label: `${location} - Water Height (cm)`,
          data: locationData.map((item, i) => ({
            x: formattedLabels[filteredData.findIndex(d => d.timestamp === item.timestamp)],
            y: item.waterHeight
          })),
          borderColor: locationColors[colorIndex].border,
          backgroundColor: locationColors[colorIndex].background,
        };
      })
    : [
        {
          label: "Water Height (cm)",
          data: filteredData.map((item, i) => ({
            x: formattedLabels[i],
            y: item.waterHeight
          })),
          borderColor: "rgb(53, 162, 235)",
          backgroundColor: "rgba(53, 162, 235, 0.5)",
        },
      ];

  return {
    labels: formattedLabels,
    datasets: datasets as unknown as  ChartData<"line">["datasets"],
  };
}

export function getChartOptions(): ChartOptions<"line"> {
  return {
    responsive: true,
    parsing: false, // Disable automatic data parsing
    scales: {
      x: {
        type: 'category', // Treat x values as categories, not dates
        title: {
          display: true,
          text: "Time (Nepal Time)"
        }
      },
      y: {
        title: {
          display: true,
          text: "Water Height (cm)"
        }
      }
    },
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Flood Water Height Over Time",
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            return context[0].raw.x;
          },
          label: (context: any) => {
            return `${context.dataset.label}: ${context.raw.y} cm`;
          }
        }
      }
    }
  };
}
