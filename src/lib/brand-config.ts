// White-Label Brand Configuration System
// Reads brand_config from tenant table and provides defaults

// ─── UI Style System ───────────────────────────────────────────────
export type UIStyleName = 'default' | 'fluent' | 'apple' | 'material' | 'glass'

export interface UIStyleConfig {
    name: string
    description: string
    radius: string           // Card / container border-radius
    radiusSm: string         // Button / input border-radius
    shadow: string           // Card shadow
    shadowHover: string      // Card hover shadow
    cardBorder: string       // Card border width
    cardBg: string           // Card background
    fontFamily: string       // Primary font
    inputStyle: string       // flat | outlined | underlined
    buttonWeight: string     // font-weight for buttons
    headerWeight: string     // font-weight for headers
    transition: string       // animation speed
}

export const UI_STYLES: Record<UIStyleName, UIStyleConfig> = {
    default: {
        name: 'NovoCRM',
        description: 'Varsayılan modern tasarım',
        radius: '0.75rem',
        radiusSm: '0.5rem',
        shadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)',
        shadowHover: '0 4px 12px -2px rgb(0 0 0 / 0.08)',
        cardBorder: '1px',
        cardBg: 'white',
        fontFamily: "'Inter', system-ui, sans-serif",
        inputStyle: 'outlined',
        buttonWeight: '500',
        headerWeight: '700',
        transition: '150ms',
    },
    fluent: {
        name: 'Microsoft Fluent',
        description: 'Keskin hatlar, temiz ve profesyonel',
        radius: '4px',
        radiusSm: '4px',
        shadow: '0 2px 4px rgb(0 0 0 / 0.04), 0 0 2px rgb(0 0 0 / 0.06)',
        shadowHover: '0 4px 8px rgb(0 0 0 / 0.08), 0 0 2px rgb(0 0 0 / 0.06)',
        cardBorder: '1px',
        cardBg: 'white',
        fontFamily: "'Segoe UI', 'Noto Sans', system-ui, sans-serif",
        inputStyle: 'outlined',
        buttonWeight: '600',
        headerWeight: '600',
        transition: '100ms',
    },
    apple: {
        name: 'Apple',
        description: 'Minimal, zarif ve yuvarlak',
        radius: '1rem',
        radiusSm: '0.625rem',
        shadow: '0 1px 4px rgb(0 0 0 / 0.04)',
        shadowHover: '0 8px 24px rgb(0 0 0 / 0.06)',
        cardBorder: '0.5px',
        cardBg: 'rgba(255,255,255,0.8)',
        fontFamily: "system-ui, -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        inputStyle: 'outlined',
        buttonWeight: '500',
        headerWeight: '700',
        transition: '200ms',
    },
    material: {
        name: 'Material',
        description: 'Elevated kartlar, belirgin gölgeler',
        radius: '0.75rem',
        radiusSm: '0.5rem',
        shadow: '0 1px 3px rgb(0 0 0 / 0.12), 0 1px 2px rgb(0 0 0 / 0.08)',
        shadowHover: '0 6px 16px rgb(0 0 0 / 0.12), 0 3px 6px rgb(0 0 0 / 0.08)',
        cardBorder: '0',
        cardBg: 'white',
        fontFamily: "'Roboto', 'Noto Sans', system-ui, sans-serif",
        inputStyle: 'outlined',
        buttonWeight: '500',
        headerWeight: '500',
        transition: '200ms',
    },
    glass: {
        name: 'Glassmorphism',
        description: 'Buzlu cam efekti, şeffaf katmanlar',
        radius: '1rem',
        radiusSm: '0.625rem',
        shadow: '0 4px 30px rgb(0 0 0 / 0.05)',
        shadowHover: '0 8px 40px rgb(0 0 0 / 0.08)',
        cardBorder: '1px',
        cardBg: 'rgba(255, 255, 255, 0.65)',
        fontFamily: "'Inter', system-ui, sans-serif",
        inputStyle: 'outlined',
        buttonWeight: '500',
        headerWeight: '700',
        transition: '250ms',
    },
}

// ─── Brand Config ──────────────────────────────────────────────────
export interface BrandConfig {
    appName: string
    logoUrl: string | null
    faviconUrl: string | null
    sidebarBg: string
    sidebarBorder: string
    primaryColor: string
    primaryHover: string
    accentColor: string
    badgeBg: string
    badgeText: string
    badgeLabel: string
    loginBg: string
    loginAccent: string
    fontFamily: string
    uiStyle: UIStyleName
}

// Default NovoCRM branding (used when tenant has no brand_config)
export const DEFAULT_BRAND: BrandConfig = {
    appName: 'Novo CRM',
    logoUrl: null,
    faviconUrl: null,
    sidebarBg: 'rgb(2 6 23)',           // slate-950
    sidebarBorder: 'rgb(30 41 59)',      // slate-800
    primaryColor: '#3b82f6',             // blue-500
    primaryHover: '#2563eb',             // blue-600
    accentColor: '#6366f1',              // indigo-500
    badgeBg: 'rgba(59,130,246,0.2)',
    badgeText: '#60a5fa',                // blue-400
    badgeLabel: '.dev',
    loginBg: 'from-slate-950 via-blue-950 to-slate-900',
    loginAccent: '#3b82f6',
    fontFamily: 'Inter',
    uiStyle: 'default',
}

// Color presets for quick setup
export const BRAND_PRESETS: Record<string, Partial<BrandConfig>> = {
    novo: {}, // Default
    emerald: {
        appName: 'GreenCRM',
        primaryColor: '#10b981',
        primaryHover: '#059669',
        accentColor: '#14b8a6',
        badgeBg: 'rgba(16,185,129,0.2)',
        badgeText: '#34d399',
        badgeLabel: '.pro',
        loginAccent: '#10b981',
        sidebarBg: 'rgb(2 17 12)',
        sidebarBorder: 'rgb(6 78 59)',
    },
    violet: {
        appName: 'VioletCRM',
        primaryColor: '#8b5cf6',
        primaryHover: '#7c3aed',
        accentColor: '#a78bfa',
        badgeBg: 'rgba(139,92,246,0.2)',
        badgeText: '#a78bfa',
        badgeLabel: '.vip',
        loginAccent: '#8b5cf6',
        sidebarBg: 'rgb(13 2 23)',
        sidebarBorder: 'rgb(46 16 80)',
    },
    amber: {
        appName: 'GoldCRM',
        primaryColor: '#f59e0b',
        primaryHover: '#d97706',
        accentColor: '#eab308',
        badgeBg: 'rgba(245,158,11,0.2)',
        badgeText: '#fbbf24',
        badgeLabel: '.gold',
        loginAccent: '#f59e0b',
        sidebarBg: 'rgb(23 12 2)',
        sidebarBorder: 'rgb(80 46 6)',
    },
    rose: {
        appName: 'RoseCRM',
        primaryColor: '#f43f5e',
        primaryHover: '#e11d48',
        accentColor: '#fb7185',
        badgeBg: 'rgba(244,63,94,0.2)',
        badgeText: '#fb7185',
        badgeLabel: '.lux',
        loginAccent: '#f43f5e',
        sidebarBg: 'rgb(23 2 8)',
        sidebarBorder: 'rgb(80 6 24)',
    },
}

/**
 * Merge tenant's brand_config with defaults
 */
export function resolveBrand(tenantBrandConfig?: Record<string, any> | null): BrandConfig {
    if (!tenantBrandConfig || Object.keys(tenantBrandConfig).length === 0) {
        return DEFAULT_BRAND
    }

    return {
        ...DEFAULT_BRAND,
        ...tenantBrandConfig,
    } as BrandConfig
}

/**
 * Generate CSS custom properties from brand config + UI style
 */
export function brandToCssVars(brand: BrandConfig): Record<string, string> {
    const style = UI_STYLES[brand.uiStyle] || UI_STYLES.default

    // Convert radius string (e.g. "4px", "1rem") to the base --radius value
    // Tailwind computes --radius-sm, --radius-md, --radius-lg etc from --radius
    const radiusMap: Record<UIStyleName, string> = {
        default: '0.625rem',  // Tailwind default
        fluent:  '0.25rem',   // 4px - sharp corners
        apple:   '0.875rem',  // 14px - very round
        material: '0.625rem', // same as default
        glass:   '0.875rem',  // round for glass
    }

    return {
        // Brand colors
        '--brand-sidebar-bg': brand.sidebarBg,
        '--brand-sidebar-border': brand.sidebarBorder,
        '--brand-primary': brand.primaryColor,
        '--brand-primary-hover': brand.primaryHover,
        '--brand-accent': brand.accentColor,
        '--brand-badge-bg': brand.badgeBg,
        '--brand-badge-text': brand.badgeText,
        // Override Tailwind's --radius directly so ALL rounded-* classes change
        '--radius': radiusMap[brand.uiStyle] || '0.625rem',
        // UI Style extras
        '--ui-shadow': style.shadow,
        '--ui-shadow-hover': style.shadowHover,
        '--ui-card-border': style.cardBorder,
        '--ui-card-bg': style.cardBg,
        '--ui-font': style.fontFamily,
        '--ui-transition': style.transition,
        '--ui-btn-weight': style.buttonWeight,
        '--ui-header-weight': style.headerWeight,
    }
}
