import { PdfTemplateParams } from './types';
import { drawModernPurpleTemplate } from './modernPurple';
import { drawMinimalistDarkTemplate } from './minimalistDark';
import { drawSidebarMonoTemplate } from './sidebarMono';
import { drawCleanPurpleProTemplate } from './cleanPurplePro';
import { drawOrangeAccentTemplate } from './orangeAccent';
import { drawNavyGeometricTemplate } from './navyGeometric';
import { drawTealCorporateTemplate } from './tealCorporate';
import { drawRetroBoldTemplate } from './retroBold';
import { drawCorporateCrimsonTemplate } from './corporateCrimson';
import { drawEmeraldCleanTemplate } from './emeraldClean';
import { drawOceanBreezeTemplate } from './oceanBreeze';
import { drawMonochromeLuxuryTemplate } from './monochromeLuxury';
import { drawGoldenEleganceTemplate } from './goldenElegance';

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
    case 'retro_bold':
      return drawRetroBoldTemplate(params);
    case 'corporate_crimson':
      return drawCorporateCrimsonTemplate(params);
    case 'emerald_clean':
      return drawEmeraldCleanTemplate(params);
    case 'ocean_breeze':
      return drawOceanBreezeTemplate(params);
    case 'monochrome_luxury':
      return drawMonochromeLuxuryTemplate(params);
    case 'golden_elegance':
      return drawGoldenEleganceTemplate(params);
    case 'modern_purple':
    default:
      return drawModernPurpleTemplate(params);
  }
}
