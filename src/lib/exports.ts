import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, BorderStyle } from "docx";
import ExcelJS from "exceljs";
import { StockItem } from "@/types/stock";

export interface CompanyExportProfile {
  company_name: string;
  company_subtitle: string;
  company_address: string;
  company_email: string;
  company_phone: string;
  logo_url?: string | null;
  currency: string;
}

async function imageUrlToDataUrl(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Failed to read logo blob"));
      reader.readAsDataURL(blob);
    });
    return dataUrl;
  } catch (error) {
    console.error("Error loading company logo for PDF:", error);
    return null;
  }
}

function formatCurrency(value: number | null, currency: string) {
  if (value === null) return "-";
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(value);
}

function productToRecord(item: StockItem) {
  const total = (item.price_ht || 0) * item.quantity;
  const remainingPayment = Math.max(0, total - (item.paid_amount || 0));

  return {
    Numero: item.number,
    Description: item.description,
    Reference: item.reference || "",
    Quantite: item.quantity,
    Reserve: item.reserved,
    Restant: item.remaining,
    PrixHT: item.price_ht ?? "",
    Total: total,
    Versement: item.paid_amount || 0,
    ResteAPayer: remainingPayment,
    ClientNom: item.client?.name || "",
    ClientEmail: item.client?.email || "",
    Marque: item.brand?.name || "",
    Origine: item.origin?.name || "",
    Notes: item.notes || "",
  };
}

export async function exportProductsToExcel(items: StockItem[], _currency: string) {
  const data = items.map((item) => productToRecord(item));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Produits");

  sheet.columns = [
    { header: "Numero", key: "Numero", width: 10 },
    { header: "Description", key: "Description", width: 32 },
    { header: "Reference", key: "Reference", width: 20 },
    { header: "Quantite", key: "Quantite", width: 12 },
    { header: "Reserve", key: "Reserve", width: 12 },
    { header: "Restant", key: "Restant", width: 12 },
    { header: "Prix HT", key: "PrixHT", width: 14 },
    { header: "Total", key: "Total", width: 14 },
    { header: "Versement", key: "Versement", width: 14 },
    { header: "Reste a payer", key: "ResteAPayer", width: 16 },
    { header: "Client Nom", key: "ClientNom", width: 24 },
    { header: "Client Email", key: "ClientEmail", width: 28 },
    { header: "Marque", key: "Marque", width: 18 },
    { header: "Origine", key: "Origine", width: 18 },
    { header: "Notes", key: "Notes", width: 36 },
  ];

  data.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const excelBuffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([excelBuffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  const stamp = new Date().toISOString().slice(0, 10);
  saveAs(blob, `produits-${stamp}.xlsx`);
}

export async function exportProductToPdf(item: StockItem, company: CompanyExportProfile, extraText: string) {
  const doc = new jsPDF();
  const total = (item.price_ht || 0) * item.quantity;
  const remainingPayment = Math.max(0, total - (item.paid_amount || 0));
  const currency = company.currency;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 36, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text(company.company_name || "Fiche Produit", 14, 14);
  doc.setFontSize(10);
  doc.text(company.company_subtitle || "", 14, 20);
  doc.text([company.company_address, company.company_email, company.company_phone].filter(Boolean).join(" • "), 14, 26);

  if (company.logo_url) {
    const logoDataUrl = await imageUrlToDataUrl(company.logo_url);
    if (logoDataUrl) {
      try {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(172, 6, 30, 24, 2, 2, "F");
        doc.addImage(logoDataUrl, "PNG", 174, 8, 26, 20, undefined, "FAST");
      } catch (error) {
        console.error("Error drawing company logo in PDF:", error);
      }
    }
  }

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(14);
  doc.text(`Fiche Produit #${item.number}`, 14, 48);
  doc.setFontSize(10);
  doc.text(`Date d'édition: ${new Date().toLocaleDateString("fr-FR")}`, 14, 54);

  doc.setDrawColor(203, 213, 225);
  doc.line(14, 58, 196, 58);

  doc.setFontSize(11);
  const lines = [
    `Description: ${item.description}`,
    `Reference: ${item.reference || "-"}`,
    `Quantite: ${item.quantity}`,
    `Reserve: ${item.reserved}`,
    `Restant: ${item.remaining}`,
    `Prix HT: ${formatCurrency(item.price_ht, currency)}`,
    `Total: ${formatCurrency(total, currency)}`,
    `Versement: ${formatCurrency(item.paid_amount || 0, currency)}`,
    `Reste a payer: ${formatCurrency(remainingPayment, currency)}`,
    `Client: ${item.client?.name || "-"} ${item.client?.email ? `(${item.client.email})` : ""}`,
    `Marque: ${item.brand?.name || "-"}`,
    `Origine: ${item.origin?.name || "-"}`,
    `Notes: ${item.notes || "-"}`,
  ];

  let cursorY = 66;
  lines.forEach((line) => {
    doc.text(line, 14, cursorY);
    cursorY += 7;
  });

  if (extraText.trim()) {
    cursorY += 6;
    doc.setFontSize(12);
    doc.text("Cahier des charges / Observations:", 14, cursorY);
    cursorY += 8;
    doc.setFontSize(11);
    const wrapped = doc.splitTextToSize(extraText, 180);
    doc.text(wrapped, 14, cursorY);
  }

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`${company.company_name} - Document généré automatiquement`, 14, 288);

  const safeName = item.description.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || `produit-${item.number}`;
  doc.save(`${safeName}.pdf`);
}

export async function exportProductToDoc(item: StockItem, company: CompanyExportProfile, extraText: string) {
  const total = (item.price_ht || 0) * item.quantity;
  const remainingPayment = Math.max(0, total - (item.paid_amount || 0));
  const currency = company.currency;

  const rows = [
    `Description: ${item.description}`,
    `Reference: ${item.reference || "-"}`,
    `Quantite: ${item.quantity}`,
    `Reserve: ${item.reserved}`,
    `Restant: ${item.remaining}`,
    `Prix HT: ${formatCurrency(item.price_ht, currency)}`,
    `Total: ${formatCurrency(total, currency)}`,
    `Versement: ${formatCurrency(item.paid_amount || 0, currency)}`,
    `Reste a payer: ${formatCurrency(remainingPayment, currency)}`,
    `Client: ${item.client?.name || "-"} ${item.client?.email ? `(${item.client.email})` : ""}`,
    `Marque: ${item.brand?.name || "-"}`,
    `Origine: ${item.origin?.name || "-"}`,
    `Notes: ${item.notes || "-"}`,
  ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text: company.company_name || "Fiche Produit", bold: true, size: 34 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: company.company_subtitle || "", italics: true, size: 24 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: [company.company_address, company.company_email, company.company_phone].filter(Boolean).join(" • "), size: 20 })],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [new TextRun({ text: `Fiche Produit #${item.number} — ${new Date().toLocaleDateString("fr-FR")}`, bold: true, size: 28 })],
          }),
          ...rows.map((line) =>
            new Paragraph({
              spacing: { after: 80 },
              children: [new TextRun({ text: line, size: 24 })],
            }),
          ),
          new Paragraph({
            children: [new TextRun({ text: " " })],
          }),
          new Paragraph({
            children: [new TextRun({ text: "Cahier des charges / Observations", bold: true, size: 28 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: extraText || "-", size: 24 })],
          }),
          new Paragraph({
            spacing: { before: 280 },
            children: [new TextRun({ text: `${company.company_name} - Document généré automatiquement`, italics: true, size: 18 })],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = item.description.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || `produit-${item.number}`;
  saveAs(blob, `${safeName}.docx`);
}

// ==================== ENHANCED EXPORTS FOR DETAILED CATALOG ====================

/**
 * Export all products to detailed Excel with images, company info, and all custom fields
 */
export async function exportProductsToExcelDetailed(
  items: StockItem[],
  currency: string,
  company: CompanyExportProfile
) {
  const workbook = new ExcelJS.Workbook();

  // Create company info sheet
  const companySheet = workbook.addWorksheet("Informations Entreprise");
  companySheet.columns = [
    { header: "Champ", key: "champ", width: 25 },
    { header: "Valeur", key: "valeur", width: 40 },
  ];

  const companyData = [
    { champ: "Nom de l'entreprise", valeur: company.company_name },
    { champ: "Sous-titre", valeur: company.company_subtitle },
    { champ: "Adresse", valeur: company.company_address },
    { champ: "Email", valeur: company.company_email },
    { champ: "Téléphone", valeur: company.company_phone },
    { champ: "Logo URL", valeur: company.logo_url || "N/A" },
  ];

  companySheet.addRows(companyData);

  // Style company sheet header
  companySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  companySheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };

  // Create detailed products sheet with images
  const productsSheet = workbook.addWorksheet("Produits Détaillés");
  productsSheet.columns = [
    { header: "Numero", key: "numero", width: 10 },
    { header: "Image", key: "image", width: 20 },
    { header: "Description", key: "description", width: 30 },
    { header: "Reference", key: "reference", width: 15 },
    { header: "Quantite", key: "quantite", width: 10 },
    { header: "Reserve", key: "reserve", width: 10 },
    { header: "Restant", key: "restant", width: 10 },
    { header: "Prix HT", key: "prixHT", width: 12 },
    { header: "Total", key: "total", width: 12 },
    { header: "Versement", key: "versement", width: 12 },
    { header: "Reste a Payer", key: "resteAPayer", width: 12 },
    { header: "Client", key: "client", width: 20 },
    { header: "Email Client", key: "emailClient", width: 25 },
    { header: "Marque", key: "marque", width: 15 },
    { header: "Origine", key: "origine", width: 15 },
    { header: "Fournisseur", key: "fournisseur", width: 15 },
    { header: "Categorie", key: "categorie", width: 15 },
    { header: "Notes", key: "notes", width: 25 },
    { header: "Champs Personnalises", key: "champsPers", width: 40 },
    { header: "Date Creation", key: "dateCreation", width: 15 },
  ];

  // Style header row
  const headerRow = productsSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };

  // Add product rows with images
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const total = (item.price_ht || 0) * item.quantity;
    const remainingPayment = Math.max(0, total - (item.paid_amount || 0));

    const customFieldsStr = item.custom_field_values
      ?.map((cfv) => `${cfv.custom_fields?.name || "Champ"}: ${cfv.value || "-"}`)
      .join(" | ") || "";

    // Add row data without image first
    const rowData = {
      numero: item.number,
      description: item.description,
      reference: item.reference || "-",
      quantite: item.quantity,
      reserve: item.reserved,
      restant: item.remaining,
      prixHT: item.price_ht ?? "-",
      total: total,
      versement: item.paid_amount || 0,
      resteAPayer: remainingPayment,
      client: item.client?.name || "-",
      emailClient: item.client?.email || "-",
      marque: item.brand?.name || "-",
      origine: item.origin?.name || "-",
      fournisseur: item.fournisseur?.name || "-",
      categorie: item.category?.name || "-",
      notes: item.notes || "-",
      champsPers: customFieldsStr,
      dateCreation: item.created_at ? new Date(item.created_at).toLocaleDateString("fr-FR") : "-",
    };

    const row = productsSheet.addRow(rowData);
    row.height = 60; // Set row height for images

    // Try to add image to the image column
    const imageUrl = item.product_images?.[0]?.image_url || item.image_url;

    if (imageUrl) {
      try {
        const imgData = await imageUrlToDataUrl(imageUrl);
        if (imgData) {
          // Extract base64 from data URL
          const base64Data = imgData.split(",")[1];

          // Add image to workbook with base64 encoding
          const imageId = workbook.addImage({
            base64: base64Data,
            extension: "jpeg",
          });

          // Add image to cell (column B, which is the Image column)
          productsSheet.addImage(imageId, {
            tl: { col: 1, row: i + 1 }, // Top-left at column B (index 1), row i+1 (accounting for header)
            ext: { width: 80, height: 60 },
          });
        }
      } catch (error) {
        console.error("Error loading product image:", error);
      }
    }
  }

  // Write workbook to buffer and save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  const stamp = new Date().toISOString().slice(0, 10);
  saveAs(blob, `catalogue-detaille-${stamp}.xlsx`);
}

/**
 * Export enhanced PDF for a single product with images and all details
 */
export async function exportProductToPdfEnhanced(
  item: StockItem,
  company: CompanyExportProfile,
  extraText: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const total = (item.price_ht || 0) * item.quantity;
  const remainingPayment = Math.max(0, total - (item.paid_amount || 0));
  const currency = company.currency;

  // Header with company info
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 50, "F");

  // Company info text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(company.company_name || "Fiche Produit", 14, 15);
  doc.setFontSize(10);
  doc.text(company.company_subtitle || "", 14, 23);
  doc.setFontSize(9);
  const contactInfo = [company.company_address, company.company_email, company.company_phone]
    .filter(Boolean)
    .join(" • ");
  doc.text(contactInfo, 14, 31);

  // Company logo
  if (company.logo_url) {
    const logoDataUrl = await imageUrlToDataUrl(company.logo_url);
    if (logoDataUrl) {
      try {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(pageWidth - 44, 8, 30, 34, 2, 2, "F");
        doc.addImage(logoDataUrl, "PNG", pageWidth - 42, 10, 26, 30, undefined, "FAST");
      } catch (error) {
        console.error("Error drawing company logo in PDF:", error);
      }
    }
  }

  let cursorY = 60;

  // Product title and info
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(14);
  doc.text(`Fiche Produit #${item.number}`, 14, cursorY);
  cursorY += 8;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date d'édition: ${new Date().toLocaleDateString("fr-FR")}`, 14, cursorY);
  cursorY += 8;

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(14, cursorY, pageWidth - 14, cursorY);
  cursorY += 8;

  // Product Images
  if (item.product_images && item.product_images.length > 0) {
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(11);
    doc.text("Images du Produit", 14, cursorY);
    cursorY += 8;

    let imagesPerRow = 2;
    let imageWidth = (pageWidth - 28) / imagesPerRow;
    let imageHeight = 40;
    let currentXPos = 14;
    let currentRow = 0;

    for (let i = 0; i < Math.min(item.product_images.length, 6); i++) {
      const imageUrl = item.product_images[i].image_url;
      try {
        const imgData = await imageUrlToDataUrl(imageUrl);
        if (imgData) {
          if (i > 0 && i % imagesPerRow === 0) {
            currentRow++;
            currentXPos = 14;
            cursorY += imageHeight + 4;
          } else if (i > 0 && i % imagesPerRow !== 0) {
            currentXPos += imageWidth + 4;
          }

          doc.setDrawColor(203, 213, 225);
          doc.rect(currentXPos, cursorY, imageWidth, imageHeight);
          doc.addImage(imgData, "JPEG", currentXPos + 1, cursorY + 1, imageWidth - 2, imageHeight - 2, undefined, "FAST");
        }
      } catch (error) {
        console.error(`Error loading product image ${i}:`, error);
      }
    }

    cursorY += imageHeight + 12;
  }

  // Product Details Section
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(11);
  doc.text("Détails du Produit", 14, cursorY);
  cursorY += 8;

  const detailsLines = [
    { label: "Description", value: item.description },
    { label: "Référence", value: item.reference || "-" },
    { label: "Quantité", value: `${item.quantity}` },
    { label: "Réservé", value: `${item.reserved}` },
    { label: "Restant", value: `${item.remaining}` },
    { label: "Prix HT", value: formatCurrency(item.price_ht, currency) },
    { label: "Total", value: formatCurrency(total, currency) },
    { label: "Versement", value: formatCurrency(item.paid_amount || 0, currency) },
    { label: "Reste à payer", value: formatCurrency(remainingPayment, currency) },
  ];

  doc.setFontSize(10);
  detailsLines.forEach((line) => {
    doc.setTextColor(17, 24, 39);
    doc.setFont(undefined, "bold");
    doc.text(`${line.label}:`, 14, cursorY);
    doc.setFont(undefined, "normal");
    doc.text(line.value, 50, cursorY);
    cursorY += 7;
  });

  cursorY += 4;

  // Relations Section
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(11);
  doc.text("Informations Associées", 14, cursorY);
  cursorY += 8;

  const relationsLines = [
    item.client ? { label: "Client", value: `${item.client.name}${item.client.email ? ` (${item.client.email})` : ""}${item.client.phone ? ` - ${item.client.phone}` : ""}` } : null,
    item.brand ? { label: "Marque", value: item.brand.name } : null,
    item.origin ? { label: "Origine", value: item.origin.name } : null,
    item.fournisseur ? { label: "Fournisseur", value: `${item.fournisseur.name}${item.fournisseur.email ? ` (${item.fournisseur.email})` : ""}${item.fournisseur.phone ? ` - ${item.fournisseur.phone}` : ""}` } : null,
    item.category ? { label: "Catégorie", value: item.category.name } : null,
  ].filter((line) => line !== null) as { label: string; value: string }[];

  doc.setFontSize(10);
  relationsLines.forEach((line) => {
    doc.setTextColor(17, 24, 39);
    doc.setFont(undefined, "bold");
    doc.text(`${line.label}:`, 14, cursorY);
    doc.setFont(undefined, "normal");
    doc.text(line.value, 50, cursorY);
    cursorY += 7;
  });

  // Custom Fields
  if (item.custom_field_values && item.custom_field_values.length > 0) {
    cursorY += 4;
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(11);
    doc.text("Champs Personnalisés", 14, cursorY);
    cursorY += 8;

    doc.setFontSize(10);
    item.custom_field_values.forEach((cfv) => {
      const fieldName = cfv.custom_fields?.name || "Champ";
      doc.setTextColor(17, 24, 39);
      doc.setFont(undefined, "bold");
      doc.text(`${fieldName}:`, 14, cursorY);
      doc.setFont(undefined, "normal");
      doc.text(cfv.value || "-", 50, cursorY);
      cursorY += 7;
    });
  }

  // Check if a new page is needed for notes
  if (cursorY > pageHeight - 60) {
    doc.addPage();
    cursorY = 14;
  }

  // Notes / Specifications
  if (extraText.trim()) {
    cursorY += 6;
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(11);
    doc.text("Cahier des Charges / Observations", 14, cursorY);
    cursorY += 8;
    doc.setFontSize(10);
    const wrapped = doc.splitTextToSize(extraText, pageWidth - 28);
    doc.text(wrapped, 14, cursorY);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`${company.company_name} - Document généré automatiquement`, 14, pageHeight - 10);

  const safeName = item.description.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || `produit-${item.number}`;
  doc.save(`${safeName}-detaille.pdf`);
}

/**
 * Export catalog PDF with multiple products - suitable for creating catalogs
 */
export async function exportCatalogPdf(
  items: StockItem[],
  company: CompanyExportProfile,
  title: string = "Catalogue de Produits"
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const currency = company.currency;

  // Cover page
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Logo on cover
  if (company.logo_url) {
    const logoDataUrl = await imageUrlToDataUrl(company.logo_url);
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, "PNG", pageWidth / 2 - 30, 40, 60, 60, undefined, "FAST");
      } catch (error) {
        console.error("Error adding logo to cover:", error);
      }
    }
  }

  // Cover text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.text(company.company_name || "Catalogue", pageWidth / 2, 120, { align: "center" });

  doc.setFontSize(20);
  doc.text(company.company_subtitle || "", pageWidth / 2, 140, { align: "center" });

  doc.setFontSize(18);
  doc.text(title, pageWidth / 2, 170, { align: "center" });

  doc.setFontSize(12);
  doc.text(`${items.length} produits`, pageWidth / 2, 200, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text(new Date().toLocaleDateString("fr-FR"), pageWidth / 2, pageHeight - 30, { align: "center" });

  // Product pages
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    doc.addPage();
    let cursorY = 14;

    // Product header
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text(`Produit ${index + 1} - #${item.number}`, 14, cursorY);
    cursorY += 10;

    // Product image (main)
    if (item.product_images && item.product_images.length > 0) {
      try {
        const mainImageUrl = item.product_images[0].image_url;
        const imgData = await imageUrlToDataUrl(mainImageUrl);
        if (imgData) {
          doc.addImage(imgData, "JPEG", 14, cursorY, 80, 80, undefined, "FAST");
        }
      } catch (error) {
        console.error("Error loading main product image:", error);
      }
    } else if (item.image_url) {
      try {
        const imgData = await imageUrlToDataUrl(item.image_url);
        if (imgData) {
          doc.addImage(imgData, "JPEG", 14, cursorY, 80, 80, undefined, "FAST");
        }
      } catch (error) {
        console.error("Error loading product image:", error);
      }
    }

    // Product info on the right side
    let rightColX = 100;
    let rightColY = cursorY;

    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.setFont(undefined, "bold");
    doc.text("Description:", rightColX, rightColY);
    doc.setFont(undefined, "normal");
    const descriptionLines = doc.splitTextToSize(item.description, pageWidth - rightColX - 14);
    doc.setFontSize(10);
    doc.text(descriptionLines, rightColX, rightColY + 6);
    rightColY += descriptionLines.length * 6 + 10;

    // Key details
    const total = (item.price_ht || 0) * item.quantity;
    const remainingPayment = Math.max(0, total - (item.paid_amount || 0));

    const keyDetails = [
      { label: "Référence", value: item.reference || "-" },
      { label: "Quantité", value: `${item.quantity}` },
      { label: "Prix HT", value: formatCurrency(item.price_ht, currency) },
      { label: "Total", value: formatCurrency(total, currency) },
    ];

    doc.setFontSize(9);
    keyDetails.forEach((detail) => {
      doc.setFont(undefined, "bold");
      doc.text(`${detail.label}:`, rightColX, rightColY);
      doc.setFont(undefined, "normal");
      doc.text(detail.value, rightColX + 40, rightColY);
      rightColY += 6;
    });

    // Relations
    cursorY = Math.max(cursorY + 85, rightColY + 10);
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.setTextColor(17, 24, 39);

    const relationLines = [
      item.client ? `Client: ${item.client.name}` : null,
      item.brand ? `Marque: ${item.brand.name}` : null,
      item.origin ? `Origine: ${item.origin.name}` : null,
      item.category ? `Catégorie: ${item.category.name}` : null,
    ].filter((line) => line !== null) as string[];

    doc.setFont(undefined, "normal");
    relationLines.forEach((line) => {
      doc.text(line, 14, cursorY);
      cursorY += 6;
    });

    // Notes if present
    if (item.notes) {
      cursorY += 4;
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.text("Observations:", 14, cursorY);
      doc.setFont(undefined, "normal");
      cursorY += 6;
      const noteLines = doc.splitTextToSize(item.notes, pageWidth - 28);
      doc.setFontSize(8);
      doc.text(noteLines, 14, cursorY);
    }

    // Footer with page info
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${index + 2} - ${company.company_name}`, 14, pageHeight - 10);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`catalogue-${stamp}.pdf`);
}
