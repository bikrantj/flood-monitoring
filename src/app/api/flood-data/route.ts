import {prisma} from '@/lib/db';
import {NextResponse} from 'next/server';
import {format, toZonedTime} from 'date-fns-tz';

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

    // Get Nepal (Kathmandu) local time using date-fns-tz
    const nepalTimeZone = 'Asia/Kathmandu';
    const now = new Date();
    const nepalTime = toZonedTime(now, nepalTimeZone);
    const timestamp = format(nepalTime, "yyyy-MM-dd'T'HH:mm:ssXXX", {timeZone: nepalTimeZone});

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
