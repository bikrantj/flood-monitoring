import {NextResponse} from 'next/server';

// Interface for the data structure
interface FloodData {
  timestamp: string;
  duration_us: number;
  distance_cm: number;
  distance_inches: number;
}

// GET handler for /api/flood-data?duration=1000
export async function GET(request: Request) {
  try {
    // Extract query parameters
    const {searchParams} = new URL(request.url);
    const durationStr = searchParams.get('duration');

    // Validate duration parameter
    if (!durationStr) {
      return NextResponse.json(
          {error: 'Missing duration parameter'}, {status: 400});
    }

    const duration = parseInt(durationStr, 10);
    if (isNaN(duration) || duration < 0) {
      return NextResponse.json(
          {error: 'Invalid duration value'}, {status: 400});
    }

    // Calculate distances
    const distance_cm = duration / 58;  // Speed of sound: 340 m/s
    const distance_inches =
        distance_cm / 2.54;  // Exact cm-to-inches conversion

    // Generate timestamp (ISO 8601 format)
    const timestamp = new Date().toISOString();

    // Create data object
    const floodData: FloodData = {
      timestamp,
      duration_us: duration,
      distance_cm,
      distance_inches,
    };

    // Log to console
    console.log('Flood Data:', floodData);

    // Return success response
    return NextResponse.json(
        {message: 'Data received', status: floodData}, {status: 200});
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}