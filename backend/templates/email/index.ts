import { EmailTemplateData } from './types';
import { renderProfessionalEmail } from './professional';
import { renderModernDarkEmail } from './modernDark';

export type { EmailTemplateData };

export function renderEmailTemplate(template: string, data: EmailTemplateData): string {
  switch (template) {
    case 'modern_dark':
      return renderModernDarkEmail(data);
    case 'professional':
    default:
      return renderProfessionalEmail(data);
  }
}
