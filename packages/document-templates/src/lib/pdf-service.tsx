import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { Font } from "@react-pdf/renderer";
import path from "node:path";
import fs from "node:fs";

// Template registry type
type PDFTemplate = React.ComponentType<any>;

/**
 * PDF Service for generating PDFs from React templates
 */
export class PDFService {
  private templates: Map<string, PDFTemplate> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.registerFonts();
  }

  /**
   * Render PDF directly from a React component without registration
   */
  async renderPDF(Template: PDFTemplate, props: any): Promise<Buffer> {
    try {
      const buffer = await renderToBuffer(<Template {...props} />);
      return buffer;
    } catch (error) {
      console.error("Error rendering PDF:", error);
      throw error;
    }
  }

  /**
   * Save PDF to disk
   */
  async savePDF(buffer: Buffer, fileName: string): Promise<string> {
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  /**
   * Register fonts for PDF generation
   */
  private registerFonts() {
    if (this.initialized) return;

    try {
      const fontPath = path.join(__dirname, "fonts");
      if (!fs.existsSync(fontPath)) {
        console.warn(`Fonts directory not found at ${fontPath}`);
        return;
      }

      // Font weight mapping
      const fontWeightMap: Record<string, number> = {
        Thin: 100,
        ExtraLight: 200,
        Light: 300,
        Regular: 400,
        Medium: 500,
        SemiBold: 600,
        Bold: 700,
        ExtraBold: 800,
        Black: 900,
      };

      // Register Inter fonts
      const interFonts = fs
        .readdirSync(fontPath)
        .filter((file) => file.startsWith("Inter_24pt"))
        .map((file) => {
          const nameParts = file.replace(".ttf", "").split("-");
          if (nameParts.length !== 2) return null;

          let weight = "Regular";
          let isItalic = false;

          if (nameParts[1].includes("Italic")) {
            isItalic = true;
            weight = nameParts[1].replace("Italic", "") || "Regular";
          } else {
            weight = nameParts[1];
          }

          return {
            src: path.join(fontPath, file),
            fontWeight: fontWeightMap[weight] || 400,
            fontStyle: isItalic ? "italic" : "normal",
          };
        })
        .filter(Boolean);

      if (interFonts.length > 0) {
        Font.register({ family: "Inter", fonts: interFonts as any });
        console.log(`Registered ${interFonts.length} Inter fonts successfully`);
      }

      this.initialized = true;
    } catch (error) {
      console.error("Error registering fonts:", error);
    }
  }
}

// Export singleton instance
export const pdfService = new PDFService();
