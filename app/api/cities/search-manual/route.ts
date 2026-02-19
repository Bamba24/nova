import { NextRequest, NextResponse } from "next/server";

interface AddressFeature {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    city?: string;
    name?: string;
    postcode?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { postalCode } = await request.json();

    if (!postalCode) {
      return NextResponse.json(
        { error: "Code postal requis" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${postalCode}&type=municipality&limit=10`
    );

    if (!response.ok) {
      throw new Error("Erreur API Adresse");
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return NextResponse.json({ cities: [] });
    }

    const cities = data.features.map((feature: AddressFeature) => ({
      name: feature.properties.city || feature.properties.name || "",
      postalCode: feature.properties.postcode || postalCode,
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
    }));

    return NextResponse.json({ cities });

  } catch (error) {
    console.error("Erreur API villes:", error);
    return NextResponse.json(
      { error: "Erreur recherche villes" },
      { status: 500 }
    );
  }
}
