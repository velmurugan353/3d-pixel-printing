export function validateAMCPlan(amcData: any) {
    const errors: string[] = [];

    // Basic validation
    if (!amcData.customer?.name) {
        errors.push('Customer name is required');
    }
    if (!amcData.planName) {
        errors.push('Plan name is required');
    }
    if (amcData.price === undefined || amcData.price < 0) {
        errors.push('Valid price is required');
    }
    if (!amcData.expiryDate || new Date(amcData.expiryDate) <= new Date()) {
        errors.push('Valid expiry date is required');
    }

    // Service validation
    if (amcData.includedServices) {
        amcData.includedServices.forEach((service: any, index: number) => {
            if (!service.service) {
                errors.push(`IncludedServices[${index}]: service name is required`);
            }
            if (service.visits !== undefined && service.visits < 0) {
                errors.push(`IncludedServices[${index}]: visits cannot be negative`);
            }
        });
    }

    return errors;
}

export function validatePricingConfig(config: any) {
    const errors: string[] = [];

    // Validate basic rates
    if (config.ELECTRICITY_RATE !== undefined && config.ELECTRICITY_RATE < 0) {
        errors.push('ELECTRICITY_RATE cannot be negative');
    }
    if (config.LABOR_RATE !== undefined && config.LABOR_RATE < 0) {
        errors.push('LABOR_RATE cannot be negative');
    }
    if (config.MAINTENANCE_RATE !== undefined && config.MAINTENANCE_RATE < 0) {
        errors.push('MAINTENANCE_RATE cannot be negative');
    }
    
    // Validate percentage fields (0-100)
    const percentageFields = ['DEPRECIATION_RATE', 'OVERHEAD_PCT', 'PROFIT_PCT', 'GST_PCT'];
    percentageFields.forEach(field => {
        if (config[field] !== undefined && (config[field] < 0 || config[field] > 100)) {
            errors.push(`${field} must be between 0 and 100`);
        }
    });

    // Validate bulk discount tiers
    if (config.BULK_DISCOUNT_TIERS) {
        config.BULK_DISCOUNT_TIERS.forEach((tier: any, index: number) => {
            if (tier.minQty === undefined || tier.minQty < 0) {
                errors.push(`BULK_DISCOUNT_TIERS[${index}]: minQty is required and must be >= 0`);
            }
            if (tier.discount === undefined || tier.discount < 0 || tier.discount > 100) {
                errors.push(`BULK_DISCOUNT_TIERS[${index}]: discount must be between 0 and 100`);
            }
        });
    }

    // Validate materials
    if (config.MATERIALS) {
        config.MATERIALS.forEach((material: any, index: number) => {
            if (!material.name) {
                errors.push(`MATERIALS[${index}]: name is required`);
            }
            if (material.basePrice === undefined || material.basePrice < 0) {
                errors.push(`MATERIALS[${index}]: basePrice is required and must be >= 0`);
            }
            if (material.minOrder === undefined || material.minOrder <= 0) {
                errors.push(`MATERIALS[${index}]: minOrder is required and must be > 0`);
            }
        });
    }

    return errors;
}
