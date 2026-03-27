import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const apiUrl = process.env.CARNET_API_URL;
    
    if (!apiUrl) {
      console.error("Missing CARNET_API_URL in environment variables.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const fuelTypes = ["Natural 95"];
    let updatedCount = 0;

    for (const type of fuelTypes) {
      const response = await fetch(`apiUrl`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) continue;
      
      const text = await response.text();
      if (!text) continue;
      
      const stations = JSON.parse(text);

      // Upsert into local database
      for (const st of stations) {
        await prisma.station.upsert({
          where: {
            externalId_fuelType: { externalId: st.ID_pumpa, fuelType: type }
          },
          update: {
            price: parseFloat(st.cenaRaw) || 0,
            color: st.color || "#000000",
            updatedAt: st.datum || "",
            lastUpdated: new Date()
          },
          create: {
            externalId: st.ID_pumpa,
            name: st.nazev || "Unknown",
            namePump: st.nazevPumpy || "Unknown",
            color: st.color || "#000000",
            updatedAt: st.datum || "",
            currency: st.mena || "CZK",
            owner: st.nazevMajitele || "Unknown",
            operator: st.nazevProvozovatele || "Unknown",
            addressMunicipality: st.obec || "Unknown",
            addressStreet: st.ulice || "Unknown",
            lat: st.latitude || 0,
            lon: st.longitude || 0,
            price: parseFloat(st.cenaRaw) || 0,
            fuelType: type,
          }
        });
        updatedCount++;
      }
    }

    return NextResponse.json({ message: "Sync complete", updatedCount });
  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: "Failed to sync data" }, { status: 500 });
  }
}