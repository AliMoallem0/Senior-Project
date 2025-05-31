import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { FileDown } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportResultsPDFProps {
  projectName: string;
  contentSelector: string;
  fileName?: string;
  buttonText?: string;
}

/**
 * Component for exporting AI analysis results as PDF
 */
export function ExportResultsPDF({ 
  projectName,
  contentSelector,
  fileName = "ai-analysis-results",
  buttonText = "Export as PDF" 
}: ExportResultsPDFProps) {
  const { toast } = useToast();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const generatePDF = async () => {
    // Disable button during generation
    if (buttonRef.current) {
      buttonRef.current.disabled = true;
    }

    try {
      toast({
        title: "Preparing PDF",
        description: "Please wait while we generate your PDF...",
      });

      // Find the content to export
      const contentElement = document.querySelector(contentSelector) as HTMLElement;
      
      if (!contentElement) {
        throw new Error("Content element not found");
      }

      // Create a clone of the element to modify for better PDF output
      const clone = contentElement.cloneNode(true) as HTMLElement;
      
      // Apply styles for better PDF output
      clone.style.padding = "20px";
      clone.style.backgroundColor = "#ffffff";
      clone.style.color = "#000000";
      clone.style.width = "700px"; // Fixed width for PDF
      
      // Add a header to the clone
      const header = document.createElement("div");
      header.innerHTML = `
        <h1 style="font-size: 24px; margin-bottom: 10px; color: #333;">${projectName} - AI Analysis Results</h1>
        <p style="font-size: 14px; margin-bottom: 20px; color: #666;">Generated on ${new Date().toLocaleString()}</p>
        <hr style="margin-bottom: 20px; border: 1px solid #eee;" />
      `;
      clone.insertBefore(header, clone.firstChild);
      
      // Temporarily append the clone to the body but hide it
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      document.body.appendChild(clone);
      
      // Use html2canvas to convert the element to an image
      const canvas = await html2canvas(clone, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      // Remove the clone from the document
      document.body.removeChild(clone);
      
      // Generate PDF from the canvas
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });
      
      // Calculate the PDF dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Save the PDF
      const safeName = fileName
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase() + '-' + Date.now() + '.pdf';
      
      pdf.save(safeName);
      
      toast({
        title: "PDF Generated",
        description: "Your AI analysis results have been exported as a PDF.",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Export Error",
        description: error?.message || "Failed to generate PDF",
        variant: "destructive"
      });
    } finally {
      // Re-enable button
      if (buttonRef.current) {
        buttonRef.current.disabled = false;
      }
    }
  };

  return (
    <Button
      onClick={generatePDF}
      ref={buttonRef}
      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
      variant="default"
    >
      <FileDown className="h-4 w-4" />
      {buttonText}
    </Button>
  );
}
