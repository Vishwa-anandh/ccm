/**
 * exportInvoicePdf — captures a DOM node (the InvoicePreview root) and
 * saves it as a downloadable, possibly multi-page, PDF. The preview is
 * the single source of truth for layout: whatever renders there is what
 * ends up in the file.
 *
 * NOTE: html2canvas 1.4.1 cannot parse oklch() colors — this only works
 * because this project is on Tailwind 3.x (emits rgb()). A future
 * Tailwind v4 upgrade would silently break PDF export.
 */
export async function exportInvoicePdf(node, filename) {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}
