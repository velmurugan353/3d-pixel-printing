import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Settings } from '@/models';

export async function GET() {
  try {
    await dbConnect();
    const pricing = await Settings.findOne({ key: 'pricing_config' });
    
    // Default config if not found
    const defaultPricing = {
      ELECTRICITY_RATE: 8.5,
      LABOR_RATE: 250,
      DEPRECIATION_RATE: 15,
      MAINTENANCE_RATE: 0.05,
      PRINTER_WATTAGE: 350,
      OVERHEAD_PCT: 15,
      PROFIT_PCT: 40,
      GST_PCT: 18,
      MIN_SHIPPING: 60,
      FREE_SHIPPING_THRESHOLD: 1500,
      SETUP_FEE: 100,
      FILAMENT_BASE: 1200,
      RESIN_BASE: 3500,
      FAIL_BUFFER_PCT: 5,
      SERVICES_STATUS: {
        design: 'active',
        printing: 'active',
        repair: 'active',
        amc: 'active'
      },
      DESIGN_SERVICES: [],
      STORE_CATEGORIES: [],
      STORE_BRANDS: [],
      MATERIALS: [],
      COLORS: [],
      LAYER_HEIGHTS: [],
      FINISHES: [],
      BULK_DISCOUNTS: [],
      REGIONAL_PRICING: {
        domesticTax: 18,
        domesticShipMult: 1.0,
        internationalTax: 0,
        internationalShipMult: 3.5,
        internationalCustoms: 500
      },
      TIME_SURCHARGES: {
        rush: 25,
        weekend: 15,
        holiday: 20
      },
      VOLUME_BREAKS: []
    };

    return NextResponse.json(pricing?.value || defaultPricing);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    
    await Settings.findOneAndUpdate(
      { key: 'pricing_config' },
      { key: 'pricing_config', value: body },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ success: true, message: 'Pricing config updated!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
