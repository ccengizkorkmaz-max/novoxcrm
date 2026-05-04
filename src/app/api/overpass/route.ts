import { NextRequest, NextResponse } from 'next/server';

const OVERPASS_API = 'https://overpass.kumi.systems/api/interpreter';

interface AmenityCategory {
    key: string;
    label: string;
    emoji: string;
    tags: string[];
    weight: number;
}

const CATEGORIES: AmenityCategory[] = [
    { key: 'education', label: 'Eğitim', emoji: '🏫', tags: ['amenity=school', 'amenity=kindergarten', 'amenity=university'], weight: 15 },
    { key: 'health', label: 'Sağlık', emoji: '🏥', tags: ['amenity=hospital', 'amenity=clinic', 'amenity=pharmacy'], weight: 15 },
    { key: 'parks', label: 'Yeşil Alan', emoji: '🌳', tags: ['leisure=park', 'leisure=garden', 'leisure=playground'], weight: 12 },
    { key: 'transport', label: 'Ulaşım', emoji: '🚌', tags: ['highway=bus_stop', 'railway=station', 'railway=halt', 'amenity=ferry_terminal'], weight: 12 },
    { key: 'shopping', label: 'Alışveriş', emoji: '🛒', tags: ['shop=supermarket', 'shop=convenience', 'shop=mall'], weight: 10 },
    { key: 'worship', label: 'İbadet', emoji: '🕌', tags: ['amenity=place_of_worship'], weight: 8 },
    { key: 'food', label: 'Yeme-İçme', emoji: '☕', tags: ['amenity=restaurant', 'amenity=cafe', 'amenity=fast_food'], weight: 8 },
    { key: 'finance', label: 'Banka & ATM', emoji: '🏦', tags: ['amenity=bank', 'amenity=atm'], weight: 5 },
    { key: 'sports', label: 'Spor', emoji: '⚽', tags: ['leisure=sports_centre', 'leisure=fitness_centre', 'leisure=swimming_pool', 'leisure=pitch'], weight: 8 },
    { key: 'safety', label: 'Güvenlik', emoji: '🚔', tags: ['amenity=police', 'amenity=fire_station'], weight: 7 },
];

function buildOverpassQuery(lat: number, lon: number, radius: number = 500): string {
    const tagFilters = CATEGORIES.flatMap(cat =>
        cat.tags.map(tag => {
            const [key, value] = tag.split('=');
            return `node["${key}"="${value}"](around:${radius},${lat},${lon});
way["${key}"="${value}"](around:${radius},${lat},${lon});`;
        })
    ).join('\n');

    return `[out:json][timeout:25];
(
${tagFilters}
);
out center;`;
}

function categorizeResults(elements: any[]): Record<string, any[]> {
    const categorized: Record<string, any[]> = {};
    CATEGORIES.forEach(cat => { categorized[cat.key] = []; });

    for (const el of elements) {
        const tags = el.tags || {};
        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;

        for (const cat of CATEGORIES) {
            for (const catTag of cat.tags) {
                const [key, value] = catTag.split('=');
                if (tags[key] === value) {
                    categorized[cat.key].push({
                        name: tags.name || tags['name:tr'] || value,
                        lat, lon,
                        type: value
                    });
                    break;
                }
            }
        }
    }
    return categorized;
}

function calculateScore(categorized: Record<string, any[]>): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const cat of CATEGORIES) {
        totalWeight += cat.weight;
        const count = categorized[cat.key]?.length || 0;
        let catScore = 0;
        if (count >= 3) catScore = 1;
        else if (count === 2) catScore = 0.8;
        else if (count === 1) catScore = 0.6;
        totalScore += catScore * cat.weight;
    }
    return Math.round((totalScore / totalWeight) * 100);
}

async function geocodeAddress(address: string, city?: string): Promise<{ lat: number; lon: number } | null> {
    const queries = [
        city ? `${address}, ${city}, Turkey` : `${address}, Turkey`,
        city ? `${city}, Turkey` : address,
    ];
    
    for (const query of queries) {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
                { headers: { 'User-Agent': 'NovoCRM/1.0' } }
            );
            const data = await res.json();
            if (data.length > 0) {
                return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
            }
        } catch (err) {
            console.error('Geocode error:', err);
        }
    }
    return null;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    let lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    let lon = searchParams.get('lon') ? parseFloat(searchParams.get('lon')!) : null;
    const address = searchParams.get('address');
    const city = searchParams.get('city') || undefined;
    const radius = parseInt(searchParams.get('radius') || '500');

    if ((!lat || !lon) && address) {
        const coords = await geocodeAddress(address, city);
        if (coords) { lat = coords.lat; lon = coords.lon; }
    }

    if (!lat || !lon) {
        return NextResponse.json({ error: 'Coordinates or valid address required' }, { status: 400 });
    }

    try {
        const query = buildOverpassQuery(lat, lon, radius);
        const res = await fetch(OVERPASS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'NovoCRM/1.0 (contact: admin@novoxcrm.com)'
            },
            body: `data=${encodeURIComponent(query)}`
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error('Overpass API error:', res.status, errBody.slice(0, 300));
            return NextResponse.json({ error: 'Overpass API error', status: res.status, detail: errBody.slice(0, 200) }, { status: 502 });
        }

        const data = await res.json();
        const categorized = categorizeResults(data.elements || []);
        const score = calculateScore(categorized);

        const categories = CATEGORIES.map(cat => ({
            key: cat.key,
            label: cat.label,
            emoji: cat.emoji,
            count: categorized[cat.key]?.length || 0,
            items: categorized[cat.key]?.slice(0, 5) || []
        }));

        return NextResponse.json({
            score,
            coordinates: { lat, lon },
            radius,
            totalAmenities: data.elements?.length || 0,
            categories,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
