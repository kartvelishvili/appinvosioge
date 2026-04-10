import html2pdf from 'html2pdf.js';

export const downloadContractPDF = (contract, clientName, performerName) => {
  if (!contract) return;

  const content = `
    <div style="padding: 40px; font-family: 'Helvetica Neue', Arial, sans-serif; color: #333;">
      <h1 style="text-align: center; color: #4f46e5; margin-bottom: 30px;">${contract.contract_number}</h1>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="width: 48%;">
          <h3 style="color: #666; border-bottom: 1px solid #ddd; padding-bottom: 10px;">მხარე 1 (დამკვეთი)</h3>
          <p style="font-size: 16px; font-weight: bold;">${clientName}</p>
        </div>
        <div style="width: 48%;">
          <h3 style="color: #666; border-bottom: 1px solid #ddd; padding-bottom: 10px;">მხარე 2 (შემსრულებელი)</h3>
          <p style="font-size: 16px; font-weight: bold;">${performerName}</p>
        </div>
      </div>

      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="margin-top: 0;">ხელშეკრულების დეტალები</h3>
        <p><strong>დაწყების თარიღი:</strong> ${contract.start_date}</p>
        <p><strong>დასრულების თარიღი:</strong> ${contract.end_date}</p>
        <p><strong>ღირებულება (თვეში):</strong> ${parseFloat(contract.monthly_fee).toLocaleString()} ${contract.currency}</p>
        <p><strong>სტატუსი:</strong> ${contract.status}</p>
      </div>

      <div style="margin-bottom: 40px;">
        <h3>მომსახურების აღწერა</h3>
        <p style="line-height: 1.6;">${contract.service_description || 'აღწერა არ არის მითითებული.'}</p>
      </div>

      <div style="margin-top: 60px; border-top: 2px solid #eee; padding-top: 20px; text-align: center; font-size: 12px; color: #999;">
        <p>გენერირებულია Invoiso-ს მიერ: ${new Date().toLocaleDateString()}</p>
      </div>
    </div>
  `;

  const element = document.createElement('div');
  element.innerHTML = content;

  const opt = {
    margin: 10,
    filename: `contract-${contract.contract_number}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
};

export const downloadInvoicePDF = (element, invoiceNumber) => {
  if (!element) return Promise.reject(new Error("No element provided"));

  const cleanInvoiceNumber = invoiceNumber ? invoiceNumber.replace(/^IN#/, '') : 'unknown';
  
  // Temporarily force A4 height so the PDF is always exactly 1 page
  const origMinH = element.style.minHeight;
  const origH = element.style.height;
  const origOverflow = element.style.overflow;
  element.style.height = '297mm';
  element.style.minHeight = '297mm';
  element.style.overflow = 'hidden';

  const scale = 2;

  const opt = {
    margin: 0,
    filename: `invoice-${cleanInvoiceNumber}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale,
      useCORS: true, 
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      onclone: (clonedDoc) => {
        const style = clonedDoc.createElement('style');
        style.textContent = '* { letter-spacing: 0.02em !important; }';
        clonedDoc.head.appendChild(style);
      },
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: [] }
  };

  return html2pdf().from(element).set(opt).save().then(() => {
    // Restore original styles
    element.style.height = origH;
    element.style.minHeight = origMinH;
    element.style.overflow = origOverflow;
  });
};