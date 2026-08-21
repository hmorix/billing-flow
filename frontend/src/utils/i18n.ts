// Multi-Currency & Multi-Language Translation Utility for BillingFlow (Powered by HMorix)

export type SupportedCurrency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CAD' | 'AUD' | 'JPY' | 'SAR' | 'SGD';
export type SupportedLanguage = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'ar';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar (USD)', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (EUR)', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', locale: 'en-GB' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham (AED)', locale: 'ar-AE' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD)', locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (AUD)', locale: 'en-AU' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)', locale: 'ja-JP' },
  SAR: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal (SAR)', locale: 'ar-SA' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (SGD)', locale: 'en-SG' },
};

export const LANGUAGES: Record<SupportedLanguage, { name: string; nativeName: string; dir: 'ltr' | 'rtl' }> = {
  en: { name: 'English', nativeName: 'English (Default)', dir: 'ltr' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी (Hindi)', dir: 'ltr' },
  es: { name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  fr: { name: 'French', nativeName: 'Français', dir: 'ltr' },
  de: { name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  ar: { name: 'Arabic', nativeName: 'العربية (Arabic)', dir: 'rtl' },
};

export interface InvoiceDictionary {
  invoice: string;
  invoiceNumber: string;
  billedFrom: string;
  billedTo: string;
  issueDate: string;
  dueDate: string;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  subtotal: string;
  discount: string;
  tax: string;
  totalDue: string;
  notesAndTerms: string;
  paymentStatus: string;
  paid: string;
  pending: string;
  overdue: string;
  draft: string;
  thankYouNote: string;
}

export const INVOICE_TRANSLATIONS: Record<SupportedLanguage, InvoiceDictionary> = {
  en: {
    invoice: 'INVOICE',
    invoiceNumber: 'Invoice No',
    billedFrom: 'BILLED FROM',
    billedTo: 'BILLED TO',
    issueDate: 'Issue Date',
    dueDate: 'Due Date',
    description: 'Description',
    quantity: 'Qty',
    unitPrice: 'Unit Price',
    amount: 'Total',
    subtotal: 'Subtotal',
    discount: 'Discount',
    tax: 'Tax',
    totalDue: 'Total Due',
    notesAndTerms: 'Notes & Terms',
    paymentStatus: 'Status',
    paid: 'PAID',
    pending: 'SENT',
    overdue: 'OVERDUE',
    draft: 'DRAFT',
    thankYouNote: 'Thank you for your business! Powered by HMorix Legal & FinTech Platform.',
  },
  hi: {
    invoice: 'बीजक / चालान (INVOICE)',
    invoiceNumber: 'चालान संख्या (Invoice No)',
    billedFrom: 'प्रेषक (Billed From)',
    billedTo: 'प्राप्तकर्ता (Billed To)',
    issueDate: 'जारी करने की तिथि (Date)',
    dueDate: 'अंतिम तिथि (Due Date)',
    description: 'विवरण (Description)',
    quantity: 'मात्रा (Qty)',
    unitPrice: 'दर (Rate)',
    amount: 'कुल योग (Total)',
    subtotal: 'उप-योग (Subtotal)',
    discount: 'छूट (Discount)',
    tax: 'कर (Tax / GST)',
    totalDue: 'देय कुल राशि (Total Due)',
    notesAndTerms: 'नियम एवं शर्तें (Terms)',
    paymentStatus: 'भुगतान स्थिति (Status)',
    paid: 'भुगतान प्राप्त (PAID)',
    pending: 'प्रतीक्षारत (SENT)',
    overdue: 'अतिदेय (OVERDUE)',
    draft: 'प्रारूप (DRAFT)',
    thankYouNote: 'व्यापार के लिए धन्यवाद! Powered by HMorix Legal & FinTech Platform.',
  },
  es: {
    invoice: 'FACTURA',
    invoiceNumber: 'Nº Factura',
    billedFrom: 'EMITIDO POR',
    billedTo: 'FACTURADO A',
    issueDate: 'Fecha de Emisión',
    dueDate: 'Fecha de Vencimiento',
    description: 'Descripción',
    quantity: 'Cant',
    unitPrice: 'Precio Unitario',
    amount: 'Total',
    subtotal: 'Subtotal',
    discount: 'Descuento',
    tax: 'Impuestos',
    totalDue: 'Total a Pagar',
    notesAndTerms: 'Notas y Términos',
    paymentStatus: 'Estado',
    paid: 'PAGADO',
    pending: 'ENVIADO',
    overdue: 'VENCIDO',
    draft: 'BORRADOR',
    thankYouNote: '¡Gracias por su confianza! Powered by HMorix.',
  },
  fr: {
    invoice: 'FACTURE',
    invoiceNumber: 'N° de Facture',
    billedFrom: 'ÉMIS PAR',
    billedTo: 'FACTURÉ À',
    issueDate: 'Date d’émission',
    dueDate: 'Date d’échéance',
    description: 'Description',
    quantity: 'Qté',
    unitPrice: 'Prix Unitaire',
    amount: 'Total',
    subtotal: 'Sous-total',
    discount: 'Remise',
    tax: 'TVA / Taxes',
    totalDue: 'Total à Payer',
    notesAndTerms: 'Notes & Conditions',
    paymentStatus: 'Statut',
    paid: 'PAYÉ',
    pending: 'ENVOYÉ',
    overdue: 'EN RETARD',
    draft: 'BROUILLON',
    thankYouNote: 'Merci pour votre confiance ! Powered by HMorix.',
  },
  de: {
    invoice: 'RECHNUNG',
    invoiceNumber: 'Rechnungs-Nr.',
    billedFrom: 'RECHNUNGSSTELLER',
    billedTo: 'RECHNUNGSEMPFÄNGER',
    issueDate: 'Rechnungsdatum',
    dueDate: 'Fälligkeitsdatum',
    description: 'Beschreibung',
    quantity: 'Menge',
    unitPrice: 'Einzelpreis',
    amount: 'Gesamt',
    subtotal: 'Zwischensumme',
    discount: 'Rabatt',
    tax: 'MwSt.',
    totalDue: 'Gesamtbetrag',
    notesAndTerms: 'Hinweise & Bedingungen',
    paymentStatus: 'Status',
    paid: 'BEZAHLT',
    pending: 'VERSENDET',
    overdue: 'ÜBERFÄLLIG',
    draft: 'ENTWURF',
    thankYouNote: 'Vielen Dank für Ihren Auftrag! Powered by HMorix.',
  },
  ar: {
    invoice: 'فاتورة ضريبية',
    invoiceNumber: 'رقم الفاتورة',
    billedFrom: 'صادرة من',
    billedTo: 'فاتورة إلى',
    issueDate: 'تاريخ الإصدار',
    dueDate: 'تاريخ الاستحقاق',
    description: 'الوصف',
    quantity: 'الكمية',
    unitPrice: 'سعر الوحدة',
    amount: 'الإجمالي',
    subtotal: 'المجموع الفرعي',
    discount: 'الخصم',
    tax: 'الضريبة',
    totalDue: 'المبلغ المستحق',
    notesAndTerms: 'الملاحظات والشروط',
    paymentStatus: 'حالة الدفع',
    paid: 'مدفوع',
    pending: 'تم الإرسال',
    overdue: 'متأخر',
    draft: 'مسودة',
    thankYouNote: 'شكراً لتعاملकम معنا! Powered by HMorix.',
  },
};

/**
 * Format currency amount with regional symbol and decimal grouping
 */
export function formatCurrency(amount: number | string, currencyCode: SupportedCurrency = 'INR'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount || 0;
  const cfg = CURRENCIES[currencyCode] || CURRENCIES.INR;
  try {
    return new Intl.NumberFormat(cfg.locale, {
      style: 'currency',
      currency: cfg.code,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${cfg.symbol} ${num.toFixed(2)}`;
  }
}

/**
 * Get translations for a specific language code
 */
export function getInvoiceTranslations(lang: SupportedLanguage = 'en'): InvoiceDictionary {
  return INVOICE_TRANSLATIONS[lang] || INVOICE_TRANSLATIONS.en;
}
