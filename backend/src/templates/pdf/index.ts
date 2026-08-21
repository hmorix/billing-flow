import { PdfTemplateParams } from './types';
import { drawModernPurpleTemplate } from './modernPurple';
import { drawMinimalistDarkTemplate } from './minimalistDark';
import { drawSidebarMonoTemplate } from './sidebarMono';
import { drawCleanPurpleProTemplate } from './cleanPurplePro';
import { drawOrangeAccentTemplate } from './orangeAccent';
import { drawNavyGeometricTemplate } from './navyGeometric';
import { drawTealCorporateTemplate } from './tealCorporate';

export type { PdfTemplateParams };

export function drawPdfTemplate(templateName: string, params: PdfTemplateParams) {
  switch (templateName) {
    case 'minimalist_dark':
      return drawMinimalistDarkTemplate(params);
    case 'sidebar_mono':
      return drawSidebarMonoTemplate(params);
    case 'clean_purple_pro':
      return drawCleanPurpleProTemplate(params);
    case 'orange_accent':
      return drawOrangeAccentTemplate(params);
    case 'navy_geometric':
      return drawNavyGeometricTemplate(params);
    case 'teal_corporate':
      return drawTealCorporateTemplate(params);
    case 'modern_purple':
    default:
      return drawModernPurpleTemplate(params);
  }
}
