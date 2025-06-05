import {prisma} from '@/lib/db';
import {Redis} from '@upstash/redis';
import {NextResponse} from 'next/server';



// Initialize Redis client
const redis = Redis.fromEnv();

// Interface for the data structure
export interface FloodData {
  timestamp: string;
  waterHeight: number;
  location: string;
}

// GET handler for /api/flood-data?code=pswd&water_height=1000&location=Bagmati
export const GET = async (request: Request) => {
  try {
    // Extract query parameters
    const {searchParams} = new URL(request.url);
    const code = searchParams.get('code');
    const waterHeightStr = searchParams.get('water_height');
    const location = searchParams.get('location');

    // Validate authentication code
    if (code !== process.env.SECRET) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    // Validate required parameters
    if (!waterHeightStr || !location) {
      return NextResponse.json(
          {error: 'Missing water_height or location parameter'}, {status: 400});
    }

    // Parse water height
    const waterHeight = parseFloat(waterHeightStr);
    if (isNaN(waterHeight) || waterHeight < 0) {
      return NextResponse.json(
          {error: 'Invalid water_height value'}, {status: 400});
    }

    // Fetch Nepal (Kathmandu) local time using timeapi.io
    let timestamp: string;
    try {
      const timeResponse = await fetch(
          'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Kathmandu');
      if (!timeResponse.ok) {
        throw new Error(`Time API error: ${timeResponse.status}`);
      }
      const timeData = await timeResponse.json();
      timestamp = timeData.dateTime;  // ISO 8601 format in Nepal time
    } catch (timeError) {
      console.error('Error fetching Nepal time from timeapi.io:', timeError);
      // Fallback to provided system time (Nepal, 2025-06-06 12:44:00 +0545)
      timestamp = new Date('2025-06-06T12:44:00+05:45').toISOString();
    }

    // Create data object
    const floodData: FloodData = {
      timestamp,
      waterHeight,
      location,
    };

    // Save to PostgreSQL using Prisma Accelerate
    await prisma.floodData.create({
      data: {
        timestamp: new Date(timestamp),
        waterHeight,
        location,
      },
    });

    // Invalidate cache for this location using SCAN
    const cachePattern = `flood_data:${location}:*`;
    try {
      let cursor = '0';
      const keysToDelete: string[] = [];
      do {
        const [nextCursor, keys] = await redis.scan(cursor, {
          match: cachePattern,
          count: 100,  // Adjust based on expected key volume
        });
        cursor = nextCursor;
        keysToDelete.push(...keys);
      } while (cursor !== '0');

      if (keysToDelete.length > 0) {
        await redis.del(...keysToDelete);
      }

      // Also clear the cache set key
      const cacheSetKey = `flood_cache_keys:${location}`;
      await redis.del(cacheSetKey);
    } catch (redisError) {
      console.error('Error invalidating Redis cache:', redisError);
      // Continue even if cache invalidation fails
    }

    // Log to console
    console.log('Flood Data Saved:', floodData);

    // Return success response
    return NextResponse.json(
        {message: 'Data saved successfully', data: floodData}, {status: 200});
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
};



export const config = {
  runtime: 'edge',
};