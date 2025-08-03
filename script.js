const pdfInput = document.getElementById('pdfInput');
const convertBtn = document.getElementById('convertBtn');
const statusEl = document.getElementById('status');

convertBtn.addEventListener('click', async () => {
  const file = pdfInput.files[0];
  if (!file) {
    alert("Please upload a PDF file");
    return;
  }

  statusEl.textContent = "Processing PDF...";

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    let pageText = textContent.items.map(item => item.str).join(" ");

    if (pageText.trim().length === 0) {
      // If page is scanned (image) - OCR
      statusEl.textContent = `OCR on page ${i}...`;
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;

      const ocrResult = await Tesseract.recognize(canvas, 'eng');
      pageText = ocrResult.data.text;
    }

    fullText += `\n--- Page ${i} ---\n${pageText}\n`;
  }

  // Create Word Document
  statusEl.textContent = "Generating Word document...";
  const doc = new docx.Document({
    sections: [
      {
        properties: {},
        children: [
          new docx.Paragraph(fullText)
        ]
      }
    ]
  });

  const blob = await docx.Packer.toBlob(doc);
  saveAs(blob, file.name.replace(".pdf", ".docx"));

  statusEl.textContent = "Conversion complete ✅";
});
