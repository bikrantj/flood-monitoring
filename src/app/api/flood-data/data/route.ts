import {prisma} from '@/lib/db';
import {Redis} from '@upstash/redis';
import {NextResponse} from 'next/server';

import {FloodData} from '../route';

const redis = Redis.fromEnv();
// GET handler to retrieve data for the line chart
export async function GET(request: Request) {
  try {
    const {searchParams} = new URL(request.url);
    const location = searchParams.get('location');
    const startTime = searchParams.get('start_time');  // ISO 8601 string
    const endTime = searchParams.get('end_time');      // ISO 8601 string

    // Validate parameters
    if (!location) {
      return NextResponse.json(
          {error: 'Missing location parameter'}, {status: 400});
    }

    // Generate cache key
    const cacheKey =
        `flood_data:${location}:${startTime || 'all'}:${endTime || 'all'}`;
    const cacheSetKey = `flood_cache_keys:${location}`;

    // Try to fetch from Redis cache
    try {
      const cachedData: string|null = await redis.get(cacheKey);
      if (!cachedData) {
        throw new Error('Cached Data not found')
      }
      if (cachedData) {
        console.log('Cache hit for:', cacheKey);
        return NextResponse.json({data: JSON.parse(cachedData)}, {status: 200});
      }
    } catch (redisError) {
      console.error('Error accessing Redis cache:', redisError);
      // Continue to fetch from database if cache fails
    }

    // Fetch from PostgreSQL using Prisma Accelerate
    const whereClause: any = {location};
    if (startTime && endTime) {
      whereClause.timestamp = {
        gte: new Date(startTime),
        lte: new Date(endTime),
      };
    }

    const data = await prisma.floodData.findMany({
      where: whereClause,
      orderBy: {timestamp: 'asc'},
      select: {
        timestamp: true,
        waterHeight: true,
        location: true,
      },
    });

    // Format data for response
    const formattedData: FloodData[] =
        data.map(item => ({
                   timestamp: item.timestamp.toISOString(),
                   waterHeight: item.waterHeight,
                   location: item.location,
                 }));

    // Cache the result in Redis (e.g., for 1 hour)
    try {
      await redis.set(cacheKey, JSON.stringify(formattedData), {ex: 3600});
      await redis.sadd(cacheSetKey, cacheKey);  // Track cache key in set
      await redis.expire(cacheSetKey, 3600);    // Set TTL for the set
      console.log('Cached data for:', cacheKey);
    } catch (redisError) {
      console.error('Error caching data in Redis:', redisError);
    }

    return NextResponse.json({data: formattedData}, {status: 200});
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
};