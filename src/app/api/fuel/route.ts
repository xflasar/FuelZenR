import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    let body: any = {};
    const textBody = await req.text();
    if (textBody) {
      try { body = JSON.parse(textBody); } catch (e) {}
    }

    const { type = "Natural 95", lat, lon, radius = 10, sortBy = "price" } = body;

    let stations: any[];

    // 1. Spatial Haversine query ONLY if lat and lon are explicitly provided
    if (lat !== undefined && lat !== null && lon !== undefined && lon !== null) {
      stations = await prisma.$queryRaw`
        SELECT * FROM (
          SELECT 
            id, "externalId", name, "namePump", color, "updatedAt", currency, owner, operator, "addressMunicipality", "addressStreet", lat, lon, price, "fuelType", "lastUpdated",
            ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( lat ) ) * cos( radians( lon ) - radians(${lon}) ) + sin( radians(${lat}) ) * sin( radians( lat ) ) ) ) AS distance
          FROM "Station"
          WHERE "fuelType" = ${type}
        ) AS subquery
        WHERE distance <= ${radius}
        ORDER BY 
          CASE WHEN ${sortBy} = 'price' THEN price END ASC,
          CASE WHEN ${sortBy} = 'distance' THEN distance END ASC
        LIMIT 100;
      `;
    } 
    // 2. Nationwide query if no location parameters are provided
    else {
      stations = await prisma.$queryRaw`
        SELECT 
          id, "externalId", name, "namePump", color, "updatedAt", currency, owner, operator, "addressMunicipality", "addressStreet", lat, lon, price, "fuelType", "lastUpdated"
        FROM "Station"
        WHERE "fuelType" = ${type}
        ORDER BY price ASC
        LIMIT 300;
      `;
    }

    return NextResponse.json(stations);
  } catch (error) {
    console.error("Local DB Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}