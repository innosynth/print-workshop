import React, { useState, useRef, useEffect, Fragment } from "react";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";



import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Loader2, Save, Printer, Trash2, Ban, Banknote, RefreshCw, Check, ChevronsUpDown, Download, Filter, MessageSquare, CheckCircle2, Clock, Edit, FileText, Phone, Mail, MapPin } from "lucide-react";

import { StatusBadge } from "./Dashboard";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { usePrintSettings } from "@/lib/print-settings-context";
import { QRCodeCanvas } from "qrcode.react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.549 4.142 1.594 5.945L0 24l4.374-1.146a11.81 11.81 0 0 0 5.645 1.438h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

function FormCombobox({ label, value, options, onSelect, action, triggerRef, onKeyDown, autoOpen, openOnFocus, includeBlank, allowCustom }: { label: string, value: string, options: string[], onSelect: (v: string) => void, action?: React.ReactNode, triggerRef?: any, onKeyDown?: (e: React.KeyboardEvent) => void, autoOpen?: boolean, openOnFocus?: boolean, includeBlank?: boolean, allowCustom?: boolean }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState("");
  const [search, setSearch] = useState("");
  const justClosed = useRef(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoOpen) {
      const timer = setTimeout(() => setOpen(true), 150);
      return () => clearTimeout(timer);
    }
  }, [autoOpen]);

  useEffect(() => {
    if (open) {
      setHighlighted("___hidden_default___");
      setSearch("");
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          className="w-full mt-1 h-8 justify-between font-normal text-[0.75rem] px-2"
          title={value || `Select ${label.toLowerCase()}`}
          onFocus={() => {
            if (openOnFocus && !justClosed.current) {
              setOpen(true);
            }
            justClosed.current = false;
          }}
          onKeyDown={onKeyDown}
        >
          <span className="truncate" title={value || `Select ${label.toLowerCase()}`}>{value || `Select ${label.toLowerCase()}`}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]" align="start">
        <Command value={highlighted} onValueChange={setHighlighted}>
          <CommandInput
            ref={inputRef}
            placeholder={`Search ${label.toLowerCase()}...`}
            className="h-7 text-xs"
            onValueChange={setSearch}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const hasMatches = options.some(opt => opt.toLowerCase().includes(search.toLowerCase()));
                if (!hasMatches && allowCustom && search) {
                  justClosed.current = true;
                  onSelect(search);
                  setOpen(false);
                  if (onKeyDown) setTimeout(() => onKeyDown(e), 100);
                  return;
                }
                if (onKeyDown && (search || highlighted)) {
                  // Short timeout to allow the Command onSelect to complete first
                  setTimeout(() => onKeyDown(e), 100);
                }
              }
            }}
          />
          <CommandList>
            <CommandEmpty className="p-0">
              {allowCustom && search ? (
                <div
                  className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer text-xs font-bold text-primary border-b"
                  onClick={() => {
                    justClosed.current = true;
                    onSelect(search);
                    setOpen(false);
                  }}
                >
                  <Plus className="h-3 w-3" /> Use "{search}" as Walk-in
                </div>
              ) : null}
              <div className="p-6 text-center text-sm">No {label.toLowerCase()} found.</div>
            </CommandEmpty>
            <CommandGroup className="p-0 h-0 overflow-hidden">
              <CommandItem
                value="___hidden_default___"
                onSelect={() => {
                  justClosed.current = true;
                  setOpen(false);
                  onSelect("");
                }}
              />
            </CommandGroup>

            <CommandGroup>
              {includeBlank && (
                <CommandItem
                  value="none_selected"
                  onSelect={() => {
                    justClosed.current = true;
                    onSelect("");
                    setOpen(false);
                  }}
                >
                  <span className="text-muted-foreground italic">-- Skip / None --</span>
                </CommandItem>
              )}
              {Array.from(new Set(options)).map((opt: string) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => {
                    justClosed.current = true;
                    onSelect(opt);
                    setOpen(false);
                  }}
                  className="text-xs whitespace-nowrap overflow-hidden text-ellipsis py-1 px-2"
                >
                  <Check className={cn("mr-1.5 h-3.5 w-3.5", value === opt ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{String(opt)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {action && (
              <>
                <Separator />
                <div className="p-1">
                  {action}
                </div>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function InvoicePrintPreview({ invoice, onClose, docType, autoDownload }: { invoice: any, onClose: () => void, docType?: string, autoDownload?: boolean }) {
  const { settings } = usePrintSettings();
  const [paperSize, setPaperSize] = useState<"A4" | "A5" | "thermal">("A4");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/core?resource=settings").then(res => res.json())
  });

  const { data: qrs = [] } = useQuery({
    queryKey: ["payment_qrs"],
    queryFn: () => fetch("/api/core?resource=payment_qrs").then(res => res.json())
  });

  const activeQr = qrs.find((qr: any) =>
    docType === "invoices" ? qr.isActiveForInvoice : qr.isActiveForEstimate
  );

  const profile = settingsData?.profile || {
    name: "", slogan: "", address: "", gst: "", phone: "", email: "",
    bankName: "", accountNumber: "", ifscCode: "", bankBranch: "", accountName: "",
    logoUrl: "", website: ""
  };

  const { data: fullInvoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ["invoice", invoice.id, docType],
    queryFn: () => fetch(`/api/sales?resource=${docType || 'invoices'}&id=${invoice.id}`).then(res => res.json()),
    enabled: !!invoice.id,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always"
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetch("/api/core?resource=products").then(res => res.json())
  });

  const activeInvoice = fullInvoice || invoice;

  const items = (activeInvoice?.items || []).map((item: any) => {
    if (item.category) return item;
    const match = allProducts.find((p: any) => p.name === item.name || (item.sku && p.sku === item.sku));
    return { ...item, category: match?.category || "" };
  });

  const isEstimate = docType === "estimates";
  const isIgst = activeInvoice.isIgst === true;
  const taxableAmount = items.reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0);
  const totalTax = items.reduce((sum: number, item: any) => {
    const rate = parseFloat(item.gstRate || 0);
    return sum + (parseFloat(item.amount || 0) * (rate / 100));
  }, 0);
  const total = taxableAmount + totalTax;
  
  const taxGroups = items.reduce((acc: any, item: any) => {
    const rate = parseFloat(item.gstRate || 0);
    if (rate > 0) {
      const amt = parseFloat(item.amount || 0);
      const tax = amt * (rate / 100);
      if (!acc[rate]) acc[rate] = { rate, tax: 0 };
      acc[rate].tax += tax;
    }
    return acc;
  }, {});
  
  const fitsOnOnePage = paperSize === "A5" ? items.length <= 5 : items.length <= 15;

  const handleDownload = async () => {
    const element = printRef.current;
    if (!element) return;

    const docNo = activeInvoice?.invoiceNo || activeInvoice?.quotationNo || activeInvoice?.estimateNo || 'Doc';
    const custName = (activeInvoice?.customerName || 'Customer').replace(/\s+/g, '_');

    const thermalMm = parseFloat(settingsData?.settings?.thermalWidth || settings.thermalWidth || "80");
    const elementHeight = element.offsetHeight;
    const formatWidth = paperSize === "A4" ? 595.28 : paperSize === "A5" ? 595.28 : (thermalMm * 2.83465);
    const formatHeight = paperSize === "A4" ? 841.89 : paperSize === "A5" ? 419.53 : (elementHeight * 0.75) + (isEstimate ? 5 : 20);

    const doc = new jsPDF({
      orientation: paperSize === "A5" ? "landscape" : "portrait",
      unit: "pt",
      format: paperSize === "A4" ? "a4" : paperSize === "A5" ? [formatWidth, formatHeight] : [formatWidth, formatHeight]
    });

    const windowW = paperSize === "thermal" ? (thermalMm * 3.7795) : 800;
    const invoicePage = element.querySelector('.invoice-page') as HTMLElement | null;
    if (invoicePage) {
      invoicePage.style.setProperty('min-height', paperSize === "thermal" ? 'auto' : (paperSize === "A4" ? '296.5mm' : '138mm'), 'important');
      invoicePage.style.setProperty('padding', paperSize === "thermal" ? '5px 38px 15px 38px' : (paperSize === "A5" ? "0 24px 8px 24px" : "0 38px 50px 38px"), 'important');
    }

    const footerEl = element.querySelector('.invoice-footer-section') as HTMLElement | null;
    let spacer: HTMLElement | null = null;
    const pdfMargin = paperSize === "thermal" ? 0 : (paperSize === "A5" ? 25 : 35);
    const usablePageHeight = formatHeight - (pdfMargin * 2);

    if (footerEl && paperSize !== "thermal") {
      const scaleFactor = formatWidth / windowW;
      const elementRect = element.getBoundingClientRect();
      const footerRect = footerEl.getBoundingClientRect();
      const footerTopPx = footerRect.top - elementRect.top;
      const footerHeightPx = footerRect.height;
      
      const footerTopPt = footerTopPx * scaleFactor;
      const footerHeightPt = footerHeightPx * scaleFactor;
      const pageIndex = Math.floor(footerTopPt / usablePageHeight);
      const posOnPage = footerTopPt - (pageIndex * usablePageHeight);
      const safetyBuffer = 30;
      
      if (!fitsOnOnePage && (posOnPage + footerHeightPt + safetyBuffer) > usablePageHeight && posOnPage > 0) {
        const pushPt = (usablePageHeight - posOnPage) + 10;
        const pushPx = pushPt / scaleFactor;
        spacer = document.createElement('div');
        spacer.style.height = `${pushPx}px`;
        spacer.style.width = '100%';
        spacer.className = 'pdf-page-break-spacer';
        footerEl.parentElement?.insertBefore(spacer, footerEl);
      }
    }

    await doc.html(element, {
      x: 0, y: 0, width: formatWidth, windowWidth: windowW, 
      margin: [pdfMargin, 0, pdfMargin, 0],
      callback: function (pdf) {
        if (spacer && spacer.parentElement) spacer.parentElement.removeChild(spacer);
        if (invoicePage) {
          invoicePage.style.removeProperty('min-height');
          invoicePage.style.removeProperty('padding');
        }
        pdf.save(`${docNo}_${custName}.pdf`);
      }
    });
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${activeInvoice?.invoiceNo || activeInvoice?.quotationNo || activeInvoice?.estimateNo || 'Doc'}_${(activeInvoice?.customerName || 'Customer').replace(/\s+/g, '_')}`,
    pageStyle: `@page { size: ${paperSize === "A4" ? "210mm 297mm" : paperSize === "A5" ? "A5 landscape" : (settingsData?.settings?.thermalWidth || settings.thermalWidth || "80") + "mm auto"}; margin: ${paperSize === "thermal" ? "0" : "4mm"}; }`
  });

  useEffect(() => {
    if (docType === "estimates") {
      setPaperSize("thermal");
    } else if (activeInvoice?.items) {
      if (activeInvoice.items.length <= 5) setPaperSize("A5");
      else setPaperSize("A4");
    }
  }, [activeInvoice?.id, docType]);

  useEffect(() => {
    if (autoDownload && activeInvoice?.id) {
      const timer = setTimeout(() => {
        handleDownload().then(() => onClose());
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, activeInvoice?.id]);

  if (invoiceLoading) return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="p-20 flex items-center justify-center">
        <DialogHeader className="sr-only"><DialogTitle>Loading Document</DialogTitle></DialogHeader>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </DialogContent>
    </Dialog>
  );

  const igst = totalTax;
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;
  
  const a4Width = '210mm';
  const a4Height = '297mm';
  const a5Width = '210mm'; 
  const a5Height = '148mm';

  const printStyles = `
   .print-container {
     width: 100%;
     display: flex;
     justify-content: center;
     background: white;
     padding: 0;
     min-height: 100%;
   }

   .invoice-page {
     background: white;
     box-shadow: none;
     width: ${paperSize === "A4" ? a4Width : paperSize === "A5" ? a5Width : "100%"} !important;
     min-height: ${paperSize === "A4" ? a4Height : paperSize === "A5" ? a5Height : "auto"} !important;
     margin: 0 auto;
     padding: ${paperSize === "A5" ? "24px" : "0 38px 50px 38px"} !important;
     box-sizing: border-box;
     display: flex;
     flex-direction: column;
     position: relative;
     color: black;
     transform: none !important;
   }

    .thermal-format {
      width: ${settingsData?.settings?.thermalWidth || settings.thermalWidth || "72.1"}mm !important;
      padding: ${isEstimate ? '0' : '2mm'} 5mm 2mm 5mm !important;
      margin: 0 auto !important;
      background: white !important;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      box-sizing: border-box !important;
      color: black !important;
    }

    .thermal-format table {
      width: 100% !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
    }

    .thermal-format th, .thermal-format td {
      padding: 4px 2px !important;
      line-height: 1.2 !important;
      vertical-align: top !important;
      word-break: break-word !important;
    }
    
    .thermal-format thead th {
      background: white !important;
      font-weight: bold !important;
    }

    .thermal-dashed-line {
      border-top: 1px dashed black !important;
      width: 100% !important;
      margin: 4mm 0 2mm 0 !important;
    }

    /* Items table - thead repeats on every printed page */
    .invoice-items-table {
      width: 100%;
      border-collapse: collapse;
    }
    .invoice-items-table thead {
      display: table-header-group;
    }
    .invoice-items-table thead th {
      height: 28px !important;
      line-height: 28px !important;
      padding: 0 !important;
      vertical-align: middle !important;
      box-sizing: border-box !important;
    }
    .invoice-items-table tbody {
      display: table-row-group;
    }
    /* Footer section stays together */
    .invoice-footer-section {
      page-break-inside: avoid;
      break-inside: avoid;
    }

  @media print {
    @page {
      size: ${paperSize === "A4" ? "A4 portrait" : paperSize === "A5" ? "A5 landscape" : (settingsData?.settings?.thermalWidth || settings.thermalWidth || "72.1") + "mm auto"};
      margin: ${paperSize === "thermal" ? "0" : "10mm 4mm 4mm 4mm"};
    }
    
    html,
    body {
      width: ${paperSize === "thermal" ? (settingsData?.settings?.thermalWidth || settings.thermalWidth || "80") + "mm" : "auto"} !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Hide everything including Radix UI overlays/portals except our specific invoice content */
    #root, 
    header, 
    aside, 
    footer, 
    .no-print,
    [role="dialog"] > button,
    [data-radix-portal] .no-print {
      display: none !important;
    }

    [data-radix-portal] {
      position: static !important;
    }

    [data-radix-portal] > div {
      position: static !important;
      background: white !important;
      padding: 0 !important;
      margin: 0 !important;
      display: block !important;
      width: 100% !important;
      box-shadow: none !important;
    }

    .print-container {
      padding: 0 !important;
      background: white !important;
      display: block !important;
      width: 100% !important;
    }

    .invoice-page {
      box-shadow: none !important;
      width: 100% !important;
      min-height: auto !important;
      margin: 0 !important;
      padding: ${paperSize === "A5" ? "3mm" : "6mm"} !important;
      border: none !important;
    }

    /* Table header repeats on each page with top padding on continuation pages */
    .invoice-items-table thead {
      display: table-header-group !important;
    }
    .invoice-items-table thead th {
      padding-top: 6mm !important;
    }

    /* Prevent item rows from breaking across pages */
    .invoice-items-table tbody tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .invoice-items-table tbody td {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Footer never breaks */
    .invoice-footer-section {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-before: auto;
      display: block !important;
    }

    .thermal-format {
      width: 100% !important;
      padding: 5mm !important;
      box-shadow: none !important;
    }
  }
`;



  const docTitle = docType === "estimates" ? "ESTIMATE" : docType === "quotations" ? "QUOTATION" : "TAX INVOICE";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className={cn(
        "h-[58rem] max-h-[95vh] overflow-auto bg-[#f5f5f5] p-0 transition-all duration-300 border-none", 
        paperSize === "thermal" ? "max-w-fit min-w-[22.5rem]" : "max-w-[63.75rem]",
        autoDownload && "opacity-0 pointer-events-none fixed left-[-9999px]"
      )}>
        <DialogHeader className="sr-only">
          <DialogTitle>Print Preview - {docTitle}</DialogTitle>
        </DialogHeader>
        <style>{`
          ${printStyles}
          .a5-format {
            font-size: 10px !important;
          }
          .a5-format .text-xl { font-size: 1rem !important; }
          .a5-format .text-lg { font-size: 0.85rem !important; }
          .a5-format .text-base { font-size: 0.75rem !important; }
          .a5-format .text-\\[0\\.7rem\\] { font-size: 0.52rem !important; }
          .a5-format .text-\\[0\\.6rem\\] { font-size: 0.52rem !important; }
          .a5-format .text-\\[0\\.62rem\\] { font-size: 0.47rem !important; }
          .a5-format .text-\\[0\\.65rem\\] { font-size: 0.56rem !important; }
          .a5-format .text-\\[0\\.68rem\\] { font-size: 0.58rem !important; }
          .a5-format .text-\\[0\\.75rem\\] { font-size: 0.56rem !important; }
          .a5-format .text-\\[0\\.55rem\\] { font-size: 0.4rem !important; }
          .a5-format .text-\\[0\\.5rem\\] { font-size: 0.36rem !important; }
          .a5-format .text-sm { font-size: 0.61rem !important; }
          
          /* Reduce padding and spacing for A5 */
          .a5-format .space-y-4 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0.2rem !important;
          }
          .a5-format .py-2 { padding-top: 0.3rem !important; padding-bottom: 0.3rem !important; }
          .a5-format .py-1\\.5 { padding-top: 0.2rem !important; padding-bottom: 0.2rem !important; }
          .a5-format .pb-4 { padding-bottom: 0.6rem !important; }
          .a5-format .pt-6 { padding-top: 0.8rem !important; }
          .a5-format .mt-auto { margin-top: 1rem !important; }
          .a5-format { padding-top: 0 !important; }

          /* Header Text Scaling for A5 */
          .a5-format .header-brand-name { font-size: 1.2rem !important; }
          .a5-format .header-slogan { font-size: 0.48rem !important; }
          .a5-format .header-sub-brand { font-size: 0.54rem !important; }
          .a5-format .header-contact-text { font-size: 0.675rem !important; }
        `}</style>


        <div className="p-4 border-b flex items-center justify-between no-print sticky top-0 bg-white z-10 shadow-sm">
          <span className="font-bold" title={(activeInvoice.customerName || invoice.customerName || "Customer").replace(/\s+/g, '_')}>
            {(activeInvoice.invoiceNo || activeInvoice.quotationNo || invoice.invoiceNo || invoice.quotationNo || "Draft")}_{(activeInvoice.customerName || invoice.customerName || "Customer").replace(/\s+/g, '_').length > 15 ? (activeInvoice.customerName || invoice.customerName || "Customer").replace(/\s+/g, '_').substring(0, 15) + "..." : (activeInvoice.customerName || invoice.customerName || "Customer").replace(/\s+/g, '_')}
          </span>
          <div className="flex gap-2">
            {isEstimate ? (
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-primary/30 text-primary rounded-full bg-white">Thermal POS Only</div>
            ) : (
              <>
                <Button variant={paperSize === "A4" ? "default" : "outline"} size="sm" onClick={() => setPaperSize("A4")}>A4 Paper</Button>
                <Button variant={paperSize === "A5" ? "default" : "outline"} size="sm" onClick={() => setPaperSize("A5")}>A5 Paper</Button>
              </>
            )}
            <Separator orientation="vertical" className="h-8 mx-2" />
            {isEstimate && (
              <Button onClick={handlePrint} className="gap-2 bg-green-600 hover:bg-green-700">
                <Printer className="h-4 w-4" /> Print Document
              </Button>
            )}
            <Button variant="outline" onClick={handleDownload} className="gap-2 border-green-600 text-green-600 hover:bg-green-50">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>

        <div
          ref={printRef}
          className={`print-container mx-auto overflow-auto ${paperSize === "thermal" ? (isEstimate ? "p-0" : "p-4") : "p-0"}`}
          style={{ transform: 'none', transformOrigin: 'top left' }}
        >
          {paperSize === "A4" || paperSize === "A5" ? (
            <div className={`invoice-page ${paperSize === "A5" ? "a5-format" : ""}`} style={{ fontSize: `${(settingsData?.settings?.a4FontSize || settings.a4FontSize) * 0.9}px`, fontFamily: "Arial, Helvetica, sans-serif" }}>

              <div className="space-y-4">
                {/* Header Layout */}
                <div className="flex justify-between items-start w-full border-b-2 border-black/20 pb-2">
                  <div className="flex items-center">
                    {profile.logoUrl ? (
                      <img src={profile.logoUrl} className="w-16 h-16 object-contain mr-3 shrink-0" alt="Logo" />
                    ) : (
                      <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center text-white font-bold text-2xl mr-3 shrink-0">PW</div>
                    )}
                    <div>
                      <h1 className="text-xl font-black tracking-tighter uppercase leading-none whitespace-nowrap header-brand-name">{profile.name || "PRINT WORKSHOP"}</h1>
                      <p className="text-[0.55rem] font-bold text-gray-500 uppercase mt-0.5 italic header-slogan">{profile.slogan}</p>
                      <p className="text-[0.6rem] font-bold text-black uppercase header-sub-brand">DIGITAL PRINTING</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <table className={`${paperSize === "A4" && !isEstimate ? "text-[0.7rem]" : "text-[0.6rem]"} font-bold border-separate border-spacing-x-3 header-contact-text`} style={{ width: 'auto', marginLeft: 'auto', tableLayout: 'auto' }}>
                      <tbody>
                        <tr className="align-top">
                          <td className="text-right pr-3 shrink-0 header-contact-text">
                            <p className="flex items-center justify-end gap-1 header-contact-text" style={{ whiteSpace: 'nowrap' }}>
                              <Mail className="h-2.5 w-2.5 text-gray-500" />
                              <span style={{ letterSpacing: '-0.3px' }} className="header-contact-text">{profile.email.replace(/\s+/g, '')}</span>
                            </p>
                          </td>
                          <td className="text-center px-3 border-l border-gray-300 shrink-0 header-contact-text">
                            <div className="flex flex-col items-center header-contact-text">
                              <p className="flex items-center gap-1 header-contact-text" style={{ whiteSpace: 'nowrap' }}>
                                <Phone className="h-2.5 w-2.5 text-gray-500" />
                                <span style={{ letterSpacing: '-0.2px' }} className="header-contact-text">{profile.phone.startsWith('+91') ? '' : '+91 '} {profile.phone}</span>
                              </p>
                              <p className="flex items-center gap-1 mt-0.5 header-contact-text" style={{ whiteSpace: 'nowrap' }}>
                                <Phone className="h-2.5 w-2.5 text-gray-500 invisible" />
                                <span style={{ letterSpacing: '-0.2px' }} className="header-contact-text">0422 2244066</span>
                              </p>
                            </div>
                          </td>
                          <td className="text-right pl-3 border-l border-gray-300 shrink-0 header-contact-text">
                            <div className="flex flex-col items-end header-contact-text">
                              <p className="flex items-start justify-end gap-1 header-contact-text" style={{ whiteSpace: 'nowrap' }}>
                                <MapPin className="h-2.5 w-2.5 text-gray-500 mt-0.5 shrink-0" />
                                <span style={{ letterSpacing: '-0.2px' }} className="header-contact-text">No.68, Sarojini Road,</span>
                              </p>
                              <p style={{ whiteSpace: 'nowrap', letterSpacing: '-0.2px' }} className="header-contact-text">Sidhapudur, Coimbatore-44</p>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Title & Shop GST Area */}
                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-3"></div>
                  <div className="col-span-6 text-center">
                    <h2 className="text-lg font-black tracking-widest uppercase">{docTitle}</h2>
                  </div>
                  <div className="col-span-3 text-right">
                    <p className="text-[0.7rem] font-bold">GSTIN : <span className="font-black">{profile.gst}</span></p>
                  </div>
                </div>

                {/* Billing & Meta Info */}
                <div className="grid grid-cols-12 gap-4 text-[0.7rem]">
                  <div className="col-span-7 space-y-0.5">
                    <p className="font-bold text-gray-500 uppercase tracking-widest text-[0.6rem]">To :</p>
                    <p className="text-base font-black uppercase leading-tight">{activeInvoice.customerName || invoice.customerName || "Walk-in Customer"}</p>
                    <p className="text-gray-600 font-bold">COIMBATORE</p>
                    <p className="mt-2 font-bold uppercase">GSTIN : {activeInvoice.customerGst || "N/A"}</p>
                    <p className="font-bold uppercase">State & Code:</p>
                  </div>
                  <div className="col-span-5 space-y-1">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      <span className="text-gray-500 font-bold uppercase">{docType === "quotations" ? "Quotation No" : docType === "estimates" ? "Estimate No" : "Invoice No"}</span>
                      <span className="font-black text-right">: {activeInvoice.invoiceNo || activeInvoice.quotationNo || activeInvoice.estimateNo || invoice.invoiceNo || invoice.quotationNo || invoice.estimateNo || "DRAFT"}</span>

                      <span className="text-gray-500 font-bold uppercase">{docType === "quotations" ? "Quotation Date" : docType === "estimates" ? "Estimate Date" : "Invoice Date"}</span>
                      <span className="font-black text-right">: {activeInvoice.date || invoice.date || new Date().toLocaleDateString()}</span>

                      <span className="text-gray-500 font-bold uppercase">PO No</span>
                      <span className="font-black text-right">: -</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full border-collapse text-[0.6rem] invoice-items-table">
                  <thead className="bg-white font-bold uppercase border-y-2 border-black">
                    <tr className="text-[10px] align-middle leading-none">
                      <th className="px-0.5 text-center align-middle" style={{ width: '5%' }}>S.No</th>
                      <th className="px-2 text-left align-middle" style={{ width: '25%' }}>Description</th>
                      <th className="px-0.5 text-center align-middle" style={{ width: '8%' }}>HSN</th>
                      <th className="px-0.5 text-center align-middle" style={{ width: '8%' }}>QTY</th>
                      <th className="px-0.5 text-center align-middle" style={{ width: '8%' }}>RATE (RS.)</th>

                      {!isEstimate && (
                        isIgst ? (
                          <>
                            <th className="px-0.5 text-center align-middle" style={{ width: '8%' }}>IGST %</th>
                            <th className="px-0.5 text-center align-middle" style={{ width: '12%' }}>IGST Amt(RS.)</th>

                          </>
                        ) : (
                          <>
                            <th className="px-0.5 text-center align-middle" style={{ width: '7%' }}>CGST %</th>
                            <th className="px-0.5 text-center align-middle" style={{ width: '10%' }}>CGST(RS.)</th>
                            <th className="px-0.5 text-center align-middle" style={{ width: '7%' }}>SGST %</th>
                            <th className="px-0.5 text-center align-middle" style={{ width: '10%' }}>SGST(RS.)</th>

                          </>
                        )
                      )}
                      <th className="px-2 text-right align-middle" style={{ width: '12%' }}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium text-[0.65rem]">
                    {items.map((item: any, i: number) => {
                      const itemRate = parseFloat(item.gstRate || 0);
                      const itemAmount = parseFloat(item.amount || 0);
                      const itemTax = itemAmount * (itemRate / 100);
                      return (
                        <tr key={i} className="">
                          <td className="px-0.5 py-2 text-center">{i + 1}</td>
                          <td className="px-2 py-2 font-black uppercase text-[0.68rem]">{item.category || item.name || "Custom Service"}</td>
                          <td className="px-0.5 py-2 text-center">{item.hsnCode || "4909"}</td>
                          <td className="px-0.5 py-2 text-center">{parseFloat(item.qty || 0).toFixed(2)}</td>
                          <td className="px-0.5 py-2 text-center">{(parseFloat(item.rate || 0)).toFixed(2)}</td>
                            {isIgst ? (
                              <>
                                <td className="px-0.5 py-2 text-center">{itemRate.toFixed(2)}</td>
                                <td className="px-0.5 py-2 text-center">{itemTax.toFixed(2)}</td>
                              </>
                            ) : (
                              <>
                                <td className="px-0.5 py-2 text-center">{(itemRate / 2).toFixed(2)}</td>
                                <td className="px-0.5 py-2 text-center">{(itemTax / 2).toFixed(2)}</td>
                                <td className="px-0.5 py-2 text-center">{(itemRate / 2).toFixed(2)}</td>
                                <td className="px-0.5 py-2 text-center">{(itemTax / 2).toFixed(2)}</td>
                              </>
                            )}
                          <td className="px-2 py-2 text-right font-black">{itemAmount.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    {/* Fill empty rows only when items fit on a single page */}
                    {fitsOnOnePage && Array.from({ length: Math.max(0, (paperSize === "A5" ? 5 : 15) - items.length) }).map((_, i) => (
                      <tr key={`empty-${i}`} className="h-8">
                        <td colSpan={isIgst ? 8 : (isEstimate ? 6 : 10)}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>

              {/* Footer Layout - on page 1: pushed to bottom; on multi-page: immediately after items */}
              {paperSize === "A5" ? (
                <div className={`invoice-footer-section ${fitsOnOnePage ? 'mt-auto' : 'mt-4'}`} style={{ pageBreakInside: 'avoid', breakInside: 'avoid', display: 'block', width: '100%' }}>
                  <div className="grid grid-cols-12 gap-2 pt-1 border-t border-gray-200" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                    <div className="col-span-4">
                      <p className="font-black mb-1 uppercase text-[11.5px]">Bank Details</p>
                      <div className="grid grid-cols-12 gap-y-0.5 text-[11.5px]">
                        <span className="col-span-5 text-gray-500 font-bold uppercase text-[10px]">Account Name</span>
                        <span className="col-span-7 font-black">: {profile.accountName || profile.name}</span>

                        <span className="col-span-5 text-gray-500 font-bold uppercase text-[10px]">Bank</span>
                        <span className="col-span-7 font-black">: {profile.bankName || "ICICI Bank"}</span>

                        <span className="col-span-5 text-gray-500 font-bold uppercase text-[10px]">Branch</span>
                        <span className="col-span-7 font-black">: {profile.bankBranch || "Gandhipuram"}</span>

                        <span className="col-span-5 text-gray-500 font-bold uppercase text-[10px]">A/C No</span>
                        <span className="col-span-7 font-black">: {profile.accountNumber || "730705000264"}</span>

                        <span className="col-span-5 text-gray-500 font-bold uppercase text-[10px]">IFSC Code</span>
                        <span className="col-span-7 font-black">: {profile.ifscCode || "ICIC0007307"}</span>
                      </div>
                      <div className="mt-4">
                        <p className="text-[11px] font-black uppercase tracking-widest text-left">THANK YOU FOR YOUR BUSINESS</p>
                      </div>
                    </div>

                    <div className="col-span-3 flex flex-col items-center justify-start pt-1">
                      {activeQr && (
                        <div className="text-center">
                          <img src={activeQr.imageUrl} className="h-[135px] w-[135px] p-1 mb-1" alt="Payment QR" />
                          <p className="text-[10px] font-black uppercase text-gray-700">Scan to Pay</p>
                        </div>
                      )}
                    </div>

                    <div className="col-span-5 flex flex-col items-end">
                      <table className="w-full text-[11.5px] border-collapse border border-gray-300" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                        <tbody>
                          <tr>
                            <td className="px-2 py-1 text-gray-600 font-bold">Sub Total</td>
                            <td className="px-2 py-1 text-right font-black">Rs. {taxableAmount.toFixed(2)}</td>
                          </tr>
                          {Object.values(taxGroups).map((group: any) => (
                            isIgst ? (
                              <tr key={`igst-${group.rate}`}>
                                <td className="px-2 py-1 text-gray-600 font-bold uppercase text-[10px]">IGST {group.rate}%</td>
                                <td className="px-2 py-1 text-right font-black">Rs. {group.tax.toFixed(2)}</td>
                              </tr>
                            ) : (
                              <Fragment key={`gst-${group.rate}`}>
                                <tr>
                                  <td className="px-2 py-1 text-gray-600 font-bold uppercase text-[10px]">CGST {group.rate / 2}%</td>
                                  <td className="px-2 py-1 text-right font-black">Rs. {(group.tax / 2).toFixed(2)}</td>
                                </tr>
                                <tr>
                                  <td className="px-2 py-1 text-gray-600 font-bold uppercase text-[10px]">SGST {group.rate / 2}%</td>
                                  <td className="px-2 py-1 text-right font-black">Rs. {(group.tax / 2).toFixed(2)}</td>
                                </tr>
                              </Fragment>
                            )
                          ))}
                          <tr>
                            <td className="px-2 py-1 text-gray-600 font-bold uppercase">Round Off</td>
                            <td className="px-2 py-1 text-right font-black">Rs. 0.00</td>
                          </tr>
                          <tr className="bg-gray-100 border-t border-gray-300 shadow-sm">
                            <td className="px-3 py-2 text-black text-[13.5px] font-black uppercase">Grand Total</td>
                            <td className="px-3 py-2 text-right text-black text-[13.5px] font-black">Rs. {total.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="mt-2 w-full">
                        <p className="text-[9px] text-right text-gray-500 font-medium leading-tight">This is computer generated {docType === "quotations" ? "quotation" : docType === "estimates" ? "estimate" : "invoice"} signature not required</p>
                        {activeInvoice.fileName && (
                          <p className="text-[10px] text-right font-bold uppercase text-primary mt-1">File: {activeInvoice.fileName}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`invoice-footer-section grid grid-cols-12 gap-2 pt-1 border-t border-gray-200 ${fitsOnOnePage ? 'mt-auto' : 'mt-4'}`} style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                  <div className="col-span-4">
                    <p className="font-black mb-1 uppercase text-[11.5px]">Bank Details</p>
                    <div className="grid grid-cols-12 gap-y-0.5 text-[11.5px]">
                      <span className="col-span-5 text-gray-500 font-bold uppercase text-[10px]">Account Name</span>
                      <span className="col-span-7 font-black">: {profile.accountName || profile.name}</span>

                      <span className="col-span-5 text-gray-500 font-bold uppercase text-[10px]">Bank</span>
                      <span className="col-span-7 font-black">: {profile.bankName || "ICICI Bank"}</span>

                      <span className="col-span-5 text-gray-500 font-bold uppercase text-[10px]">Branch</span>
                      <span className="col-span-7 font-black">: {profile.bankBranch || "Gandhipuram"}</span>

                      <span className="col-span-5 text-gray-500 font-bold uppercase text-[10px]">A/C No</span>
                      <span className="col-span-7 font-black">: {profile.accountNumber || "730705000264"}</span>

                      <span className="col-span-5 text-gray-500 font-bold uppercase text-[10px]">IFSC Code</span>
                      <span className="col-span-7 font-black">: {profile.ifscCode || "ICIC0007307"}</span>
                    </div>
                    <div className="mt-4">
                      <p className="text-[11px] font-black uppercase tracking-widest text-left">THANK YOU FOR YOUR BUSINESS</p>
                    </div>
                  </div>

                  <div className="col-span-3 flex flex-col items-center justify-start pt-1">
                    {activeQr && (
                      <div className="text-center">
                        <img src={activeQr.imageUrl} className="h-[135px] w-[135px] p-1 mb-1" alt="Payment QR" />
                        <p className="text-[10px] font-black uppercase text-gray-700">Scan to Pay</p>
                      </div>
                    )}
                  </div>

                  <div className="col-span-5 flex flex-col items-end">
                    <table className="w-full text-[11.5px] border-collapse border border-gray-300" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                      <tbody>
                        <tr>
                          <td className="px-2 py-1 text-gray-600 font-bold">Sub Total</td>
                          <td className="px-2 py-1 text-right font-black">Rs. {taxableAmount.toFixed(2)}</td>
                        </tr>
                        {Object.values(taxGroups).map((group: any) => (
                          isIgst ? (
                            <tr key={`igst-${group.rate}`}>
                              <td className="px-2 py-1 text-gray-600 font-bold uppercase text-[10px]">IGST {group.rate}%</td>
                              <td className="px-2 py-1 text-right font-black">Rs. {group.tax.toFixed(2)}</td>
                            </tr>
                          ) : (
                            <Fragment key={`gst-${group.rate}`}>
                              <tr>
                                <td className="px-2 py-1 text-gray-600 font-bold uppercase text-[10px]">CGST {group.rate / 2}%</td>
                                <td className="px-2 py-1 text-right font-black">Rs. {(group.tax / 2).toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td className="px-2 py-1 text-gray-600 font-bold uppercase text-[10px]">SGST {group.rate / 2}%</td>
                                <td className="px-2 py-1 text-right font-black">Rs. {(group.tax / 2).toFixed(2)}</td>
                              </tr>
                            </Fragment>
                          )
                        ))}
                        <tr>
                          <td className="px-2 py-1 text-gray-600 font-bold uppercase">Round Off</td>
                          <td className="px-2 py-1 text-right font-black">Rs. 0.00</td>
                        </tr>
                        <tr className="bg-gray-100 border-t border-gray-300 shadow-sm">
                          <td className="px-3 py-2 text-black text-[13.5px] font-black uppercase">Grand Total</td>
                          <td className="px-3 py-2 text-right text-black text-[13.5px] font-black">Rs. {total.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="mt-2 w-full">
                      <p className="text-[9px] text-right text-gray-500 font-medium leading-tight">This is computer generated {docType === "quotations" ? "quotation" : docType === "estimates" ? "estimate" : "invoice"} signature not required</p>
                      {activeInvoice.fileName && (
                        <p className="text-[10px] text-right font-bold uppercase text-primary mt-1">File: {activeInvoice.fileName}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>
          ) : (
            <div className="text-center tracking-tight leading-tight thermal-format" style={{ fontSize: `${settingsData?.settings?.thermalFontSize || settings.thermalFontSize}px`, fontFamily: "Arial, Helvetica, sans-serif" }}>
              {/* Thermal Format Header */}
              <div>
                {profile.logoUrl && !isEstimate && <img src={profile.logoUrl} className="h-12 mx-auto mb-2 object-contain" alt="Logo" />}
                <h1 className="text-xl font-black uppercase tracking-tight leading-none">{profile.name || "Print Workshop"}</h1>
                <p className="text-[0.6rem] mt-1">( {profile.slogan || "Innovation in Impression"} )</p>
                <p className={`${isEstimate ? 'text-[0.61rem]' : 'text-[0.55rem]'} mt-1`}>{profile.address || "No.68, Sarojini Road, Sidhapudur, Coimbatore-44"}</p>
                <p className={isEstimate ? 'text-[0.61rem]' : 'text-[0.55rem]'}>Call @ {profile.phone || "+91 84352 66666"}</p>
                <p className={`${isEstimate ? 'text-[0.61rem]' : 'text-[0.55rem]'} font-bold`}>Mail : {profile.email || "aprintworkshop@gmail.com"}</p>

                <h2 className="text-[0.85rem] font-black uppercase mt-2">{docTitle}</h2>
                <div className="thermal-dashed-line" />
              </div>

              <div className={`${isEstimate ? 'text-[0.69rem]' : 'text-[0.6rem]'} space-y-0.5`}>
                <div className="flex justify-between font-normal">
                  <span>No.<span className={isEstimate ? "font-black" : ""}>{activeInvoice.invoiceNo || activeInvoice.quotationNo || activeInvoice.estimateNo || invoice.invoiceNo || invoice.quotationNo || invoice.estimateNo || "DRAFT"}</span></span>
                  <span>Date: {activeInvoice.date || invoice.date || new Date().toLocaleDateString('en-GB').split('/').reverse().join('-')}</span>
                </div>
                <div className="text-left font-normal">
                  C.ID : {activeInvoice.customerName || invoice.customerName || "Walk-in Customer"}
                </div>
              </div>

              <div className="thermal-dashed-line" />

              <div className="mt-1">
                <table className={`w-full ${isEstimate ? 'text-[0.72rem]' : 'text-[0.625rem]'}`}>
                  <thead>
                    <tr className="font-black">
                      <th className="py-1 text-left px-0.5" style={{ width: '45%' }}>Product Name</th>
                      <th className="text-right py-1 px-0.5" style={{ width: '10%' }}>Qty</th>
                      <th className="text-right py-1 px-0.5" style={{ width: '20%' }}>Rate</th>
                      <th className="text-right py-1 px-0.5" style={{ width: '25%' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody className="font-normal">
                    {items && items.length > 0 ? items.map((item: any, i: number) => (
                      <tr key={i} className="align-top">
                        <td className="text-left py-1 px-0.5 uppercase leading-tight">{item.category || item.name}</td>
                        <td className="text-right py-1 px-0.5">{item.qty}</td>
                        <td className="text-right py-1 px-0.5">{parseFloat(item.rate || 0).toFixed(0)}</td>
                        <td className="text-right py-1 px-0.5">{parseFloat(item.amount || 0).toFixed(2)}</td>
                      </tr>
                    )) : (
                      <tr className="h-10"><td colSpan={4} className="text-center italic opacity-50">No items listed</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="thermal-dashed-line" />

              <div className="text-left font-bold text-[0.625rem] py-1">
                <div className="flex items-center">
                  <div className="space-y-1">
                    <p>Total Items : {items?.length || 0}</p>
                    <p>Total Qty : {items?.reduce((a: any, b: any) => a + parseInt(b.qty || 0), 0) || 0}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-[0.85rem] font-black tabular-nums">Total: {total.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="mt-1 space-y-0.5 font-normal text-[0.55rem] text-right">
                  {Object.values(taxGroups).map((group: any) => (
                    isIgst ? (
                      <p key={`igst-${group.rate}`}>IGST {group.rate}% : {group.tax.toFixed(2)}</p>
                    ) : (
                      <Fragment key={`gst-${group.rate}`}>
                        <p>CGST {group.rate / 2}% : {(group.tax / 2).toFixed(2)}</p>
                        <p>SGST {group.rate / 2}% : {(group.tax / 2).toFixed(2)}</p>
                      </Fragment>
                    )
                  ))}
                </div>
              </div>

              <div className="thermal-dashed-line" />

              <div className="pt-1 space-y-1">
                <div className={`text-left font-normal ${isEstimate ? 'text-[0.63rem]' : 'text-[0.55rem]'} space-y-0.5`}>
                  <p>File : {activeInvoice.fileName || "-"}</p>
                  <p>User :admin | Time : {new Date().toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '.')}</p>
                </div>
                <div className="mt-2 space-y-0.5">
                  <p className="font-bold text-[0.6rem]">{profile.website || 'www.printworkshop.in'}</p>
                  <p className="font-bold text-[0.625rem] uppercase">Thank For Your Business</p>
                </div>
              </div>
              {activeQr && (
                <div className="flex flex-col items-center mt-4">
                  <img src={activeQr.imageUrl} className={isEstimate ? "h-32 w-32" : "h-24 w-24"} alt="QA" />
                  <p className="text-[0.55rem] font-black mt-0.5 uppercase tracking-tighter">SCAN & PAY</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateSalesModal({ trigger, title, type, initialData, open: controlledOpen, onOpenChange: controlledOnOpenChange }: {
  trigger?: React.ReactNode;
  title: string;
  type: string;
  initialData?: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

  const [items, setItems] = useState([{
    name: "", qty: 1, rate: 0, amount: 0, hsnCode: "", gstRate: "0",
    category: "", subCategory: "", sku: ""
  }]);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [fileName, setFileName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [gstEnabled, setGstEnabled] = useState(true);
  const [isIgst, setIsIgst] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Navigation Refs
  const customerRef = useRef<HTMLButtonElement>(null);
  const categoryRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const productRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const subCategoryRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const qtyRefs = useRef<(HTMLInputElement | null)[]>([]);
  const rateRefs = useRef<(HTMLInputElement | null)[]>([]);
  const saveBtnRef = useRef<HTMLButtonElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);


  const handleEnter = (e: React.KeyboardEvent, nextRef: React.RefObject<any> | any) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef && 'current' in nextRef) {
        nextRef.current?.focus();
      } else if (nextRef) {
        nextRef?.focus();
      }
    }
  };

  // Fetch full details if editing, list view usually has only summary
  const { data: fullDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["sales_detail", type, initialData?.id],
    queryFn: () => fetch(`/api/sales?resource=${type === 'quotations' ? 'quotations' : 'invoices'}&id=${initialData.id}`).then(res => res.json()),
    enabled: open && !!initialData?.id
  });

  const { data: contacts = [], isError: contactsError } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => fetch("/api/core?resource=contacts").then(res => {
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    })
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetch("/api/core?resource=products").then(res => {
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    })
  });

  const products = allProducts.filter((p: any) => p.status === "Active" || !p.status);



  // Reset form when opening or when type/initialData changes
  const initialFocusDone = useRef(false);
  const formInitialized = useRef(false);

  // Reset initialization state when modal closes
  useEffect(() => {
    if (!open) {
      formInitialized.current = false;
      initialFocusDone.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (open && !formInitialized.current) {
      if (initialData) {
        // If we have initialData but are waiting for fullDetails, wait
        if (!fullDetails) return;

        const source = fullDetails || initialData;
        const mappedItems = (source.items || []).map((item: any) => {
          let category = item.category;
          let subCategory = item.subCategory;

          if (!category && products.length > 0) {
            const match = products.find((p: any) => p.name === item.name || (item.sku && p.sku === item.sku));
            if (match) {
              category = match.category;
              subCategory = match.subCategory;
            }
          }

          return {
            ...item,
            category: category || "",
            subCategory: subCategory || "",
            qty: parseFloat(item.qty || 0),
            rate: parseFloat(item.rate || 0),
            amount: parseFloat(item.amount || 0)
          };
        });

        setItems(mappedItems);
        setCustomerId(source.customerId?.toString() || "");
        setCustomerName(source.customerName || "");
        setFileName(source.fileName || "");
        setDate(source.date || new Date().toISOString().split('T')[0]);
        setGstEnabled(true);
        setIsIgst(source.isIgst === true);
        formInitialized.current = true;
      } else {
        // Create new mode
        setItems([{
          name: "", qty: 1, rate: 0, amount: 0, hsnCode: "", gstRate: "0",
          category: "", subCategory: "", sku: ""
        }]);
        setCustomerId("");
        setCustomerName("");
        setFileName("");
        setDate(new Date().toISOString().split('T')[0]);
        setGstEnabled(true);
        setIsIgst(false);
        formInitialized.current = true;
      }
    }
  }, [open, type, initialData, fullDetails, products]);

  // Focus customer select on open
  useEffect(() => {
    if (open && !initialFocusDone.current) {
      const timer = setTimeout(() => {
        customerRef.current?.focus();
        initialFocusDone.current = true;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle auto-scroll to bottom when new item added
  useEffect(() => {
    if (scrollViewportRef.current && items.length > 1) {
      const timer = setTimeout(() => {
        scrollViewportRef.current?.scrollTo({
          top: scrollViewportRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [items.length]);




  const addItem = () => setItems([...items, {
    name: "", qty: 1, rate: 0, amount: 0, hsnCode: "", gstRate: "0",
    category: "", subCategory: "", sku: ""
  }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => {
      const newItems = [...prev];
      if (!newItems[index]) return prev;
      const updated = { ...newItems[index], [field]: value };
      if (field === "qty" || field === "rate") {
        updated.amount = (Number(updated.qty || 0)) * (Number(updated.rate || 0));
      }
      newItems[index] = updated;
      return newItems;
    });
  };

  const validItems = items.filter(i => i.name && i.name.trim() !== "");
  const subtotal = validItems.reduce((sum, item) => sum + item.amount, 0);
  const totalTax = gstEnabled ? validItems.reduce((sum, item) => sum + (item.amount * (parseFloat(item.gstRate || "18") / 100)), 0) : 0;
  const grandTotal = subtotal + (!gstEnabled ? 0 : totalTax);

  const resetForm = () => {
    setItems([{
      name: "", qty: 1, rate: 0, amount: 0, hsnCode: "", gstRate: "0",
      category: "", subCategory: "", sku: ""
    }]);
    setCustomerId("");
    setCustomerName("");
    setFileName("");
    setGstEnabled(true);
    setIsIgst(false);
  };

  const handleSave = async (stayOpen: boolean = false) => {
    if (!customerId && !customerName) {
      toast({ variant: "destructive", title: "Missing information", description: "Please select or type a customer name" });
      return;
    }

    if (grandTotal <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Bill Value",
        description: "0 bill value is not allowed to store. Add any items and try again."
      });
      return;
    }

    setLoading(true);
    try {
      const endpoint = `/api/sales?resource=${type === 'quotations' ? 'quotations' : 'invoices'}${initialData ? `&id=${initialData.id}` : ''}`;
      const res = await fetch(endpoint, {
        method: initialData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId ? parseInt(customerId) : null,
          customerName: customerName || null,
          fileName: fileName || null,
          [type === 'quotations' ? 'quotationNo' : 'invoiceNo']: initialData ? (initialData.invoiceNo || initialData.quotationNo) : `${type === 'quotations' ? 'QT' : type === 'estimates' ? 'EST' : 'INV'}-${Date.now().toString().slice(-6)}`,
          date: date,
          amount: subtotal.toFixed(2),
          tax: !gstEnabled ? "0" : totalTax.toFixed(2),
          total: grandTotal.toFixed(2),
          isIgst: isIgst,
          status: initialData ? initialData.status : (type === 'estimates' ? "Draft" : "Pending"),
          items: validItems.map(item => ({
            ...item,
            qty: parseFloat(item.qty.toString()),
            rate: parseFloat(item.rate.toString()).toFixed(2),
            amount: parseFloat(item.amount.toString()).toFixed(2),
            hsnCode: item.hsnCode,
            gstRate: item.gstRate
          }))
        })
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Success", description: `${title} ${initialData ? 'updated' : 'created'} successfully` });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
      queryClient.invalidateQueries({ queryKey: ["sales_detail"] });

      if (stayOpen) {
        resetForm();
      } else {
        setOpen(false);
        resetForm();
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[76.8rem] w-[95vw] h-[58rem] max-h-[92vh] p-0 flex flex-col overflow-hidden transition-all duration-300">
        <div className="flex flex-col h-full bg-white relative">
          <DialogHeader className="p-2.5 px-4 border-b flex flex-row items-center justify-between space-y-0 pr-12 shrink-0">
            <DialogTitle>{title}</DialogTitle>
            {items.length > 5 && (
              <div className="flex items-center gap-6 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="text-right">
                  <p className="text-[0.5625rem] font-black text-muted-foreground uppercase opacity-70 leading-none">Subtotal</p>
                  <p className="text-xs font-bold tabular-nums">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                {(type !== 'estimates' || gstEnabled) && (
                  <div className="text-right">
                    <p className="text-[0.5625rem] font-black text-muted-foreground uppercase opacity-70 leading-none">{isIgst ? 'IGST' : 'GST'}</p>
                    <p className="text-xs font-bold tabular-nums">₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                )}
                <div className="h-8 w-px bg-border mx-1" />
                <div className="text-right bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                  <p className="text-[0.5625rem] font-black text-green-800 uppercase leading-none">Grand Total</p>
                  <p className="text-sm font-black text-green-600 tabular-nums">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0 relative">
            {detailsLoading && (
              <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center backdrop-blur-[1px]">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs font-bold text-muted-foreground animate-pulse">Loading Document Details...</p>
                </div>
              </div>
            )}
            {/* Static Top Section */}
            <div className="p-3 md:p-4 pb-2 space-y-2 shrink-0">
              {/* Header info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="space-y-0.5">
                  <Label className="text-[0.6875rem] font-bold text-muted-foreground">Select Customer</Label>
                  <FormCombobox
                    triggerRef={customerRef}
                    onKeyDown={(e) => handleEnter(e, categoryRefs.current[0])}
                    autoOpen={!initialData}
                    allowCustom
                    label="Customer"
                    value={contacts.find((c: any) => c.id.toString() === customerId)?.name || customerName || ""}
                    options={Array.from(new Set(contacts.filter((c: any) => c.status !== "Inactive" && (c.type === "B2B" || c.type === "B2C")).map((c: any) => c.name)))}
                    onSelect={(v) => {
                      const contact = contacts.find((c: any) => c.name === v && (c.type === "B2B" || c.type === "B2C"));
                      if (contact) {
                        setCustomerId(contact.id.toString());
                        setCustomerName("");
                      } else {
                        setCustomerId("");
                        setCustomerName(v);
                      }
                    }}
                    action={
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-primary h-8 px-2 text-xs gap-2 hover:bg-primary/5"
                        onClick={() => navigate("/contacts?tab=b2b&action=add")}
                      >
                        <Plus className="h-3 w-3" /> Add New Customer
                      </Button>
                    }
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[0.6875rem] font-bold text-muted-foreground">Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-xs px-2" />
                </div>
              </div>
              <Separator />

              {/* Line Items Section Header */}
              <div className="flex justify-between items-center bg-muted/40 p-1.5 rounded-md shrink-0">
                <Label className="text-[0.6875rem] font-black uppercase tracking-wider text-muted-foreground ml-2">Line Items</Label>
                <div className="flex items-center gap-3">
                  {true && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center space-x-2 bg-white/50 px-3 py-1 rounded-full border border-primary/10 transition-all hover:bg-white">
                        <Checkbox
                          id="use-igst"
                          checked={isIgst}
                          onCheckedChange={(checked) => setIsIgst(checked as boolean)}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-4 w-4"
                        />
                        <label
                          htmlFor="use-igst"
                          className="text-[0.625rem] font-black uppercase cursor-pointer select-none text-muted-foreground data-[enabled=true]:text-blue-700"
                          data-enabled={isIgst}
                        >
                          Use IGST
                        </label>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/50 px-3 py-1 rounded-full border border-primary/10 transition-all hover:bg-white">
                        <Checkbox
                          id="enable-gst"
                          checked={gstEnabled}
                          onCheckedChange={(checked) => setGstEnabled(checked as boolean)}
                          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 h-4 w-4"
                        />
                        <label
                          htmlFor="enable-gst"
                          className="text-[0.625rem] font-black uppercase cursor-pointer select-none text-muted-foreground data-[enabled=true]:text-green-700"
                          data-enabled={gstEnabled}
                        >
                          Enable GST
                        </label>
                      </div>
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={addItem} className="h-8 gap-1 border-primary/20 hover:bg-primary/5">
                    <Plus className="h-3.5 w-3.5" /> Add Item
                  </Button>
                </div>
              </div>
            </div>

            {/* Scrollable Items Section */}
            <div ref={scrollViewportRef} className="flex-1 overflow-y-auto p-3 md:p-4 pt-1">
              <div className="space-y-2">
                {items.map((item, index) => {
                  const uniqueCategories = Array.from(new Set(products.map((p: any) => p.category))).filter(Boolean) as string[];
                  const productNames = Array.from(new Set(products.filter((p: any) => !item.category || p.category === item.category).map((p: any) => p.name))).filter(Boolean) as string[];
                  const subCategories = Array.from(new Set(products.filter((p: any) =>
                    (!item.category || p.category === item.category) &&
                    (!item.name || p.name === item.name)
                  ).map((p: any) => p.subCategory))).filter(Boolean) as string[];

                  return (
                    <div key={index} className="relative p-2.5 border rounded-lg bg-white shadow-sm hover:shadow-md transition-all group border-muted-foreground/10">
                      {/* Responsive Grid Layout */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2 items-end">
                        {/* Row 1/Top section on mobile, Left section on desktop */}
                        <div className="md:col-span-2 space-y-0.5">
                          <Label className="text-[0.625rem] uppercase font-bold text-muted-foreground tracking-tight">Category</Label>
                          <FormCombobox
                            triggerRef={(el: any) => categoryRefs.current[index] = el}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !item.category) {
                                e.preventDefault();
                                saveBtnRef.current?.focus();
                              } else {
                                handleEnter(e, productRefs.current[index]);
                              }
                            }}
                            openOnFocus
                            label="Category"
                            value={item.category}
                            options={uniqueCategories}
                            onSelect={(v) => {
                              if (!v) {
                                saveBtnRef.current?.focus();
                                return;
                              }
                              updateItem(index, "category", v);
                              updateItem(index, "name", "");
                              updateItem(index, "subCategory", "");
                              updateItem(index, "sku", "");
                              setTimeout(() => productRefs.current[index]?.focus(), 150);
                            }}
                          />
                        </div>
                        <div className="sm:col-span-2 md:col-span-3 space-y-0.5">
                          <Label className="text-[0.625rem] uppercase font-bold text-muted-foreground tracking-tight">Product</Label>
                          <FormCombobox
                            triggerRef={(el: any) => productRefs.current[index] = el}
                            onKeyDown={(e) => handleEnter(e, subCategoryRefs.current[index])}
                            openOnFocus
                            label="Product"
                            value={item.name}
                            options={productNames}
                            onSelect={(v) => {
                              updateItem(index, "name", v);
                              updateItem(index, "subCategory", "");
                              updateItem(index, "sku", "");
                              setTimeout(() => subCategoryRefs.current[index]?.focus(), 150);
                            }}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-0.5">
                          <Label className="text-[0.625rem] uppercase font-bold text-muted-foreground tracking-tight">Sub Category</Label>
                          <FormCombobox
                            triggerRef={(el: any) => subCategoryRefs.current[index] = el}
                            onKeyDown={(e) => handleEnter(e, qtyRefs.current[index])}
                            openOnFocus
                            label="Sub Category"
                            value={item.subCategory}
                            options={subCategories}
                            onSelect={(v) => {
                              updateItem(index, "subCategory", v);

                              // Once sub-category is selected, pick the exact product record
                              const exactProd = products.find((p: any) =>
                                p.name === item.name &&
                                p.subCategory === v &&
                                (!item.category || p.category === item.category)
                              );

                              if (exactProd) {
                                updateItem(index, "sku", exactProd.sku || "");
                                updateItem(index, "rate", parseFloat(exactProd.sellPrice || 0));
                                updateItem(index, "hsnCode", exactProd.hsnCode || "");
                                updateItem(index, "gstRate", exactProd.gstRate || "0");
                                if (exactProd.category && !item.category) {
                                  updateItem(index, "category", exactProd.category);
                                }
                              }
                              setTimeout(() => qtyRefs.current[index]?.focus(), 150);
                            }}
                          />
                        </div>

                        {/* Financials Row */}
                        <div className={cn("grid gap-2 items-end md:col-span-4", (!gstEnabled) ? "grid-cols-3" : "grid-cols-4")}>
                          <div className="space-y-0.5">
                            <Label className="text-[0.625rem] uppercase font-bold text-muted-foreground tracking-tight text-center block">Qty</Label>
                            <Input
                              ref={el => qtyRefs.current[index] = el}
                              onKeyDown={(e) => handleEnter(e, rateRefs.current[index])}
                              type="number"
                              value={item.qty}
                              className="h-8 font-bold px-1 text-center text-xs"
                              title={item.qty.toString()}
                              onChange={e => updateItem(index, "qty", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[0.625rem] uppercase font-bold text-muted-foreground tracking-tight">Rate</Label>
                            <Input
                              ref={el => rateRefs.current[index] = el}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (index === items.length - 1) {
                                    addItem();
                                    setTimeout(() => categoryRefs.current[index + 1]?.focus(), 100);
                                  } else {
                                    categoryRefs.current[index + 1]?.focus();
                                  }
                                }
                              }}
                              type="number"
                              value={item.rate}
                              className="h-8 font-bold text-xs"
                              title={item.rate.toString()}
                              onChange={e => updateItem(index, "rate", parseFloat(e.target.value) || 0)}
                            />
                          </div>

                          {gstEnabled && (
                            <div className="space-y-0.5">
                              <Label className="text-[0.625rem] uppercase font-bold text-muted-foreground tracking-tight text-center block">GST %</Label>
                              <Input
                                type="number"
                                value={item.gstRate}
                                className="h-8 font-black text-center text-orange-600 bg-orange-50/10 border-orange-200 text-xs"
                                title={`${item.gstRate}%`}
                                onChange={e => updateItem(index, "gstRate", e.target.value)}
                              />
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <Label className="text-[0.625rem] uppercase font-bold text-muted-foreground tracking-tight">Total</Label>
                            <div className="h-8 flex items-center px-1 bg-primary/5 border border-primary/20 rounded-md font-black text-[0.6875rem] text-primary overflow-hidden truncate" title={`₹${item.amount.toFixed(2)}`}>
                              ₹{item.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-1 flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Static Bottom Section */}
            <div className="p-3 md:p-4 pt-1 shrink-0 space-y-2">
              <Separator />

              {/* Footer Summary Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 w-full sm:max-w-xs space-y-1">
                  <Label className="text-[0.625rem] uppercase font-black text-muted-foreground tracking-widest">File Reference</Label>
                  <div className="relative group">
                    <Input
                      placeholder="Enter filename or job ID..."
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="pl-9 bg-white border-primary/10 focus:border-primary/30 transition-all text-xs font-bold h-8"
                    />
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                </div>
                <div className="w-full sm:w-[320px] bg-muted/20 p-2.5 rounded-lg space-y-1 border shadow-inner">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium uppercase tracking-tighter">Subtotal</span>
                    <span className="font-bold tabular-nums">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {(type !== 'estimates' || gstEnabled) && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium uppercase tracking-tighter">{isIgst ? 'IGST' : 'GST'} Amount</span>
                      <span className="font-bold tabular-nums">₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <Separator className="bg-muted-foreground/20" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-black text-[0.625rem] uppercase tracking-widest text-muted-foreground">Grand Total</span>
                    <span className="font-black text-lg text-green-600 tabular-nums">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 px-4 border-t bg-muted/30 flex justify-end gap-3 shrink-0">
            <Button variant="outline" size="lg" className="px-8" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="secondary" size="lg" className="px-4 gap-2 border-primary/10" onClick={() => handleSave(true)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Save & Create Another
            </Button>
            <Button
              ref={saveBtnRef}
              size="lg"
              className="px-8 shadow-lg shadow-primary/20 gap-2"
              onClick={() => handleSave(false)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                initialData ? <Edit className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />
              )}
              {initialData ? 'Update' : 'Save'} {type.endsWith('s') ? type.slice(0, -1) : type}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ColumnFilter({ label, column, filters, setFilters, options }: any) {
  const [open, setOpen] = useState(false);
  const currentFilter = filters[column] || "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("h-5 w-5 ml-auto p-0 hover:bg-muted-foreground/10", currentFilter && "text-primary bg-primary/5")}>
          <Filter className={cn("h-2.5 w-2.5", currentFilter && "fill-current")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 shadow-xl border-primary/10 z-[110]" align="end">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-[0.625rem] font-black uppercase tracking-widest text-muted-foreground">Filter {label}</p>
            {currentFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[0.5625rem] font-bold text-destructive hover:text-destructive hover:bg-destructive/5"
                onClick={() => {
                  const newFilters = { ...filters };
                  delete newFilters[column];
                  setFilters(newFilters);
                  setOpen(false);
                }}
              >
                Clear
              </Button>
            )}
          </div>
          {options ? (
            <Select value={currentFilter} onValueChange={(v) => {
              if (v === "all") {
                const newFilters = { ...filters };
                delete newFilters[column];
                setFilters(newFilters);
              } else {
                setFilters({ ...filters, [column]: v });
              }
              setOpen(false);
            }}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={`Select ${label}...`} />
              </SelectTrigger>
              <SelectContent className="z-[120]">
                <SelectItem value="all">All {label}s</SelectItem>
                {options.map((opt: any) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder={`Search ${label}...`}
              value={currentFilter}
              onChange={(e) => setFilters({ ...filters, [column]: e.target.value })}
              className="h-8 text-xs font-medium focus-visible:ring-primary/20"
              autoFocus
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TxTable({ data, cols, isLoading, onPrint, onConvert, onToggleStatus, loadingId, onWhatsApp, onEdit, onDownload }: {
  data: any[];
  cols: any[];
  isLoading?: boolean,
  onPrint?: (r: any) => void,
  onConvert?: (r: any) => void,
  onToggleStatus?: (r: any) => void,
  loadingId?: number | null,
  onWhatsApp?: (r: any) => void,
  onEdit?: (r: any) => void,
  onDownload?: (r: any) => void
}) {
  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const filtered = (data || []).filter(row => {
    // Global search
    const matchesSearch = Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase()));

    // Column specific filters
    const matchesColumnFilters = Object.entries(columnFilters).every(([col, val]) => {
      if (!val) return true;
      const rowValue = row[col];
      if (col.toLowerCase() === "status") {
        return String(rowValue).toLowerCase() === val.toLowerCase();
      }
      return String(rowValue).toLowerCase().includes(val.toLowerCase());
    });

    return matchesSearch && matchesColumnFilters;
  });

  const clearFilters = () => {
    setSearch("");
    setColumnFilters({});
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search records..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {(search || Object.keys(columnFilters).length > 0) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs font-bold text-muted-foreground hover:text-primary">
            Clear Filters
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto min-h-[200px] flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {cols.map(c => (
                      <th key={c.key} className="px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center group">
                          <span className="uppercase tracking-widest font-black text-[0.5625rem]">{c.label}</span>
                          <ColumnFilter
                            label={c.label}
                            column={c.key}
                            filters={columnFilters}
                            setFilters={setColumnFilters}
                            options={c.filterOptions}
                          />
                        </div>
                      </th>
                    ))}
                    {(onPrint || onConvert || onEdit) && <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      {cols.map(c => (
                        <td key={c.key} className="px-4 py-2.5">
                          {c.render ? c.render(row) : row[c.key]}
                        </td>
                      ))}
                      {(onPrint || onConvert || onEdit) && (
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1">
                            {onPrint && (
                              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => onPrint(row)}>
                                <Printer className="h-3.5 w-3.5" />Print
                              </Button>
                            )}
                            {onDownload && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 p-0" onClick={() => onDownload(row)} title="Download">
                                <Download className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            {onEdit && (
                              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onEdit(row)}>
                                <Edit className="h-3.5 w-3.5" />Edit
                              </Button>
                            )}
                            {onConvert && row.status !== 'Invoiced' && (
                              <Button
                                variant="default"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={() => onConvert(row)}
                                disabled={loadingId === row.id}
                              >
                                {loadingId === row.id && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                                Convert
                              </Button>
                            )}
                            {onToggleStatus && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 p-0" onClick={() => onToggleStatus(row)} title={row.status === "Paid" ? "Mark as Pending" : "Mark as Paid"}>
                                {row.status === "Paid" ? <Clock className="h-4 w-4 text-orange-500" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                              </Button>
                            )}
                            {onWhatsApp && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 p-0 hover:bg-green-50" onClick={() => onWhatsApp(row)} title="Send via WhatsApp">
                                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={cols.length + 1} className="px-4 py-8 text-center text-muted-foreground">No records found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">{filtered.length} records</p>
    </div>
  );
}

export default function Sales() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "estimates";
  const setActiveTab = (v: string) => setSearchParams({ tab: v });
  const [selectedInvoice, setSelectedInvoice] = useState<any>({ data: null, type: "invoices" });
  const [editingRecord, setEditingRecord] = useState<{ data: any, type: string } | null>(null);
  const [waDialog, setWaDialog] = useState<{ open: boolean, data: any, contact: any }>({ open: false, data: null, contact: null });

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/core?resource=settings").then(res => res.json())
  });

  const profile = settingsData?.profile || {
    name: "", slogan: "", address: "", gst: "", phone: "", email: "",
    bankName: "", bankBranch: "", accountNumber: "", ifscCode: "", accountName: "",
    logoUrl: "", website: ""
  };

  const { data: contacts = [] } = useQuery({ queryKey: ["contacts"], queryFn: () => fetch("/api/core?resource=contacts").then(res => res.json()) });
  const { data: invoices = [], isLoading: invLoading } = useQuery({ queryKey: ["invoices"], queryFn: () => fetch("/api/sales?resource=invoices").then(res => res.json()) });
  const { data: quotations = [], isLoading: qtLoading } = useQuery({ queryKey: ["quotations"], queryFn: () => fetch("/api/sales?resource=quotations").then(res => res.json()) });
  const { data: returns = [], isLoading: srLoading } = useQuery({ queryKey: ["returns"], queryFn: () => fetch("/api/sales?resource=returns").then(res => res.json()) });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [convertDialog, setConvertDialog] = useState<{ open: boolean, data: any, type: string }>({ open: false, data: null, type: "" });

  const handleConvert = async (source: any, sourceType: string, targetType: string) => {
    setConvertingId(source.id);
    try {
      // 1. Fetch full details including items
      const res = await fetch(`/api/sales?resource=${sourceType === 'quotations' ? 'quotations' : 'invoices'}&id=${source.id}`);
      if (!res.ok) throw new Error("Failed to fetch document details");
      const detail = await res.json();

      // 2. Prepare new document body
      const isTargetInvoice = targetType === 'invoices';
      const prefix = targetType === 'quotations' ? 'QT' : targetType === 'estimates' ? 'EST' : 'INV';
      const sourceNo = detail.invoiceNo || detail.quotationNo || "DOC";

      const convertedItems = (detail.items || []).map((item: any) => ({
        name: item.name,
        qty: parseInt(item.qty || 0),
        rate: parseFloat(item.rate || 0).toFixed(2),
        amount: parseFloat(item.amount || 0).toFixed(2),
        hsnCode: item.hsnCode || "",
        gstRate: item.gstRate || "0"
      }));

      const calculatedTax = isTargetInvoice ? convertedItems.reduce((acc, item) => {
        const amt = parseFloat(item.amount);
        const rate = parseFloat(item.gstRate);
        return acc + (amt * (rate / 100));
      }, 0) : 0;

      const subtotal = convertedItems.reduce((acc, item) => acc + parseFloat(item.amount), 0);

      const newBody: any = {
        customerId: detail.customerId,
        customerName: detail.customerName,
        fileName: detail.fileName,
        [isTargetInvoice ? 'invoiceNo' : 'quotationNo']: `${prefix}-${sourceNo.split('-').pop()}`,
        date: new Date().toISOString().split('T')[0],
        amount: subtotal.toFixed(2),
        status: isTargetInvoice ? "Paid" : "Pending",
        items: convertedItems
      };

      if (isTargetInvoice) {
        newBody.tax = calculatedTax.toFixed(2);
        newBody.total = (subtotal + calculatedTax).toFixed(2);
      }

      // 3. Create target document
      const createRes = await fetch(`/api/sales?resource=${targetType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBody)
      });
      if (!createRes.ok) throw new Error(`Failed to create ${targetType}`);
      const newDoc = await createRes.json();

      // 4. Update source document status
      const newStatus = targetType === 'invoices' ? 'Invoiced' : 'Quoted';
      await fetch(`/api/sales?resource=${sourceType === 'quotations' ? 'quotations' : 'invoices'}&id=${source.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      toast({ title: "Success", description: `Document converted to ${targetType} successfully` });

      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
      queryClient.invalidateQueries({ queryKey: ["sales_detail"] });

      // 5. Invalidate and Close dialog
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setConvertDialog({ open: false, data: null, type: "" });

      // 6. Automatically trigger Print/Preview for the NEW document
      // We need the full detail for the preview to work properly
      const finalRes = await fetch(`/api/sales?resource=${targetType}&id=${newDoc.id}`);
      const finalDoc = await finalRes.json();
      setSelectedInvoice({ data: finalDoc, type: targetType });

    } catch (e: any) {
      toast({ variant: "destructive", title: "Conversion Failed", description: e.message });
    } finally {
      setConvertingId(null);
    }
  };

  const handleWhatsApp = async (row: any) => {
    const resource = row.invoiceNo ? 'invoices' : row.quotationNo ? 'quotations' : 'returns';
    try {
      const res = await fetch(`/api/sales?resource=${resource}&id=${row.id}`);
      if (!res.ok) throw new Error("Failed to fetch details");
      const fullData = await res.json();
      const contact = contacts.find((c: any) => c.id === fullData.customerId);
      setWaDialog({ open: true, data: fullData, contact });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: "Could not fetch document details for WhatsApp sharing." });
    }
  };

  const confirmSendWhatsApp = () => {
    if (!waDialog.contact?.whatsapp && !waDialog.contact?.mobile) {
      toast({ variant: "destructive", title: "No Number", description: "This customer has no WhatsApp/Mobile number saved." });
      return;
    }
    const number = waDialog.contact.whatsapp || waDialog.contact.mobile;
    const cleanNumber = number.replace(/\D/g, '');

    const docType = waDialog.data.invoiceNo ? "TAX INVOICE" : waDialog.data.quotationNo ? "QUOTATION" : "ESTIMATE";
    const docNo = waDialog.data.invoiceNo || waDialog.data.quotationNo || waDialog.data.estimateNo;
    const p = profile;

    let msg = `*${p.name}*\n${p.slogan || ''}\n\n`;
    msg += `📞 ${p.phone}\n`;
    msg += `✉️ ${p.email}\n`;
    msg += `📍 ${p.address}\n\n`;
    msg += `*${docType}*\n`;
    msg += `--------------------------\n`;
    msg += `*To:* ${waDialog.contact.name}\n`;
    msg += `*City:* ${waDialog.contact.city || '—'}\n`;
    msg += `*GSTIN:* ${waDialog.contact.gst || 'N/A'}\n`;
    msg += `--------------------------\n`;
    const noLabel = waDialog.data.invoiceNo ? "Invoice No" : waDialog.data.quotationNo ? "Quotation No" : "Estimate No";
    const dateLabel = waDialog.data.invoiceNo ? "Invoice Date" : waDialog.data.quotationNo ? "Quotation Date" : "Estimate Date";
    msg += `*${noLabel}:* ${docNo}\n`;
    msg += `*${dateLabel}:* ${waDialog.data.date}\n`;
    msg += `*Status:* ${waDialog.data.status === 'Paid' ? 'Paid' : 'Yet to Pay'}\n`;
    msg += `*GSTIN:* ${p.gst}\n\n`;

    msg += `*S.No | Description | QTY | RATE | AMOUNT*\n`;
    msg += `--------------------------\n`;

    waDialog.data.items?.forEach((item: any, idx: number) => {
      msg += `${idx + 1}. ${item.name} | ${item.qty} | ₹${item.rate} | *₹${item.amount}*\n`;
    });

    msg += `--------------------------\n`;

    if (waDialog.data.status !== 'Paid') {
      msg += `*Bank Details*\n`;
      msg += `Acc Name: *${p.accountName || p.name}*\n`;
      msg += `Bank: *${p.bankName}*\n`;
      msg += `Branch: *${p.bankBranch}*\n`;
      msg += `A/C No: *${p.accountNumber}*\n`;
      msg += `IFSC: *${p.ifscCode}*\n\n`;
    }

    msg += `*Sub Total:* ₹${parseFloat(waDialog.data.amount || 0).toLocaleString('en-IN')}\n`;
    const tax = parseFloat(waDialog.data.tax || 0);
    if (tax > 0) {
      // Find the first item with a GST rate to identify the percentage (e.g., 18% -> 9% CGST + 9% SGST)
      const firstGstItem = waDialog.data.items?.find((i: any) => parseFloat(i.gstRate || 0) > 0);
      const rate = firstGstItem ? (parseFloat(firstGstItem.gstRate) / 2) : 9;
      msg += `*CGST ${rate}%:* ₹${(tax / 2).toLocaleString('en-IN')}\n`;
      msg += `*SGST ${rate}%:* ₹${(tax / 2).toLocaleString('en-IN')}\n`;
    }
    msg += `*Grand Total: ₹${parseFloat(waDialog.data.total || 0).toLocaleString('en-IN')}*\n`;
    msg += `--------------------------\n`;
    msg += `*THANK YOU FOR YOUR BUSINESS*\n`;
    msg += `_This is computer generated document signature not required_`;

    const message = encodeURIComponent(msg);
    window.open(`https://wa.me/91${cleanNumber}?text=${message}`, '_blank');
    setWaDialog({ open: false, data: null, contact: null });
  };

  const handleToggleStatus = async (invoice: any) => {
    try {
      const newStatus = invoice.status === "Paid" ? "Pending" : "Paid";
      const res = await fetch(`/api/sales?resource=invoices&id=${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast({ title: "Status Updated", description: `Invoice marked as ${newStatus}` });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const estCols = [
    { key: "invoiceNo", label: "Estimate No", render: (r: any) => <span className="font-mono text-xs font-semibold text-primary cursor-pointer hover:underline" onClick={() => setSelectedInvoice({ data: r, type: "estimates" })}>{r.invoiceNo}</span> },
    { key: "date", label: "Date" },
    { key: "customerName", label: "Company Name", render: (r: any) => <span className="font-medium">{r.customerName}</span> },
    { 
      key: "totalQty", 
      label: "Qty", 
      render: (r: any) => <span>{r.totalQty || 0}</span> 
    },
    { 
      key: "amount", 
      label: "E-Amount", 
      render: (r: any) => <span className="font-semibold tabular-nums">₹{parseFloat(r.amount || 0).toLocaleString("en-IN")}</span>
    },
    { 
      key: "total", 
      label: "Total", 
      render: (r: any) => <span className="font-semibold tabular-nums">₹{(parseFloat(r.amount || 0) + parseFloat(r.tax || 0)).toLocaleString("en-IN")}</span>
    },
    {
      key: "status",
      label: "Status",
      render: (r: any) => <StatusBadge status={r.status} />,
      filterOptions: [
        { label: "Draft", value: "Draft" },
        { label: "Quoted", value: "Quoted" },
        { label: "Invoiced", value: "Invoiced" }
      ]
    },
  ];

  const invCols = [
    { key: "invoiceNo", label: "Invoice #", render: (r: any) => <span className="font-mono text-xs font-semibold text-primary cursor-pointer hover:underline" onClick={() => setSelectedInvoice({ data: r, type: "invoices" })}>{r.invoiceNo}</span> },
    { key: "date", label: "Date" },
    { key: "customerName", label: "Company Name", render: (r: any) => <span className="font-medium">{r.customerName}</span> },
    { 
      key: "totalQty", 
      label: "Qty", 
      render: (r: any) => <span>{r.totalQty || 0}</span> 
    },
    { 
      key: "amount", 
      label: "E-Amount", 
      render: (r: any) => <span className="font-semibold tabular-nums">₹{parseFloat(r.amount || 0).toLocaleString("en-IN")}</span>
    },
    { 
      key: "total", 
      label: "Total", 
      render: (r: any) => <span className="font-semibold tabular-nums">₹{(parseFloat(r.amount || 0) + parseFloat(r.tax || 0)).toLocaleString("en-IN")}</span>
    },
    {
      key: "status",
      label: "Status",
      render: (r: any) => <StatusBadge status={r.status} />,
      filterOptions: [
        { label: "Pending", value: "Pending" },
        { label: "Paid", value: "Paid" }
      ]
    },
  ];

  const qtCols = [
    { key: "quotationNo", label: "Quotation #", render: (r: any) => <span className="font-mono text-xs font-semibold text-primary cursor-pointer hover:underline" onClick={() => setSelectedInvoice({ data: r, type: "quotations" })}>{r.quotationNo}</span> },
    { key: "date", label: "Date" },
    { key: "customerName", label: "Company Name", render: (r: any) => <span className="font-medium">{r.customerName}</span> },
    { 
      key: "totalQty", 
      label: "Qty", 
      render: (r: any) => <span>{r.totalQty || 0}</span> 
    },
    { 
      key: "amount", 
      label: "E-Amount", 
      render: (r: any) => <span className="font-semibold tabular-nums">₹{parseFloat(r.amount || 0).toLocaleString("en-IN")}</span>
    },
    { 
      key: "total", 
      label: "Total", 
      render: (r: any) => <span className="font-semibold tabular-nums">₹{(parseFloat(r.amount || 0) + parseFloat(r.tax || 0)).toLocaleString("en-IN")}</span>
    },
    {
      key: "status",
      label: "Status",
      render: (r: any) => <StatusBadge status={r.status} />,
      filterOptions: [
        { label: "Pending", value: "Pending" },
        { label: "Invoiced", value: "Invoiced" }
      ]
    },
  ];

  const srCols = [
    ...qtCols.slice(0, -1),
    {
      key: "status",
      label: "Status",
      render: (r: any) => <StatusBadge status={r.status} />,
      filterOptions: [
        { label: "Pending", value: "Pending" },
        { label: "Completed", value: "Completed" },
        { label: "Cancelled", value: "Cancelled" }
      ]
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Sales</h1>
        <p className="text-sm text-muted-foreground">Invoices, quotations, and sales transactions</p>
      </div>
      <Tabs defaultValue="invoices" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList className="h-12 flex-wrap gap-2 bg-transparent">
            {[
              { id: "estimates", label: "Estimates" },
              { id: "quotations", label: "Quotations" },
              { id: "invoices", label: "Invoices" },
              { id: "returns", label: "Returns" },
              { id: "receipts", label: "Receipts" },
              { id: "proforma", label: "Proforma / SO" },
              { id: "obf", label: "OBF" },
              { id: "pricing", label: "Customer Pricing" }
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id} className="text-xs px-5 h-10 font-black uppercase tracking-tight data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary transition-all">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <CreateSalesModal
            type={activeTab}
            title={`Create New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}`}
            trigger={
              <Button size="sm" className="h-9 gap-1 shadow-lg shadow-primary/20">
                <Plus className="h-3.5 w-3.5" />New {activeTab.slice(0, -1)}
              </Button>
            }
          />
        </div>

        <TabsContent value="estimates" className="mt-4">
          <TxTable
            data={Array.isArray(invoices) ? invoices.filter((i: any) => i.invoiceNo?.startsWith('EST-')) : []}
            cols={estCols}
            isLoading={invLoading}
            onPrint={(r) => setSelectedInvoice({ data: r, type: "estimates", autoDownload: false })}
            onDownload={(r) => setSelectedInvoice({ data: r, type: "estimates", autoDownload: true })}
            onWhatsApp={handleWhatsApp}
            onEdit={(r) => setEditingRecord({ data: r, type: "estimates" })}
            onConvert={(r) => setConvertDialog({ open: true, data: r, type: "estimates" })}
            loadingId={convertingId}
          />
        </TabsContent>
        <TabsContent value="quotations" className="mt-4">
          <TxTable
            data={quotations}
            cols={qtCols}
            isLoading={qtLoading}
            onPrint={(r) => setSelectedInvoice({ data: r, type: "quotations", autoDownload: false })}
            onDownload={(r) => setSelectedInvoice({ data: r, type: "quotations", autoDownload: true })}
            onConvert={(r) => handleConvert(r, "quotations", "invoices")}
            loadingId={convertingId}
            onWhatsApp={handleWhatsApp}
            onEdit={(r) => setEditingRecord({ data: r, type: "quotations" })}
          />
        </TabsContent>
        <TabsContent value="invoices" className="mt-4">
          <TxTable
            data={Array.isArray(invoices) ? invoices.filter((i: any) => i.invoiceNo?.startsWith('INV-')) : []}
            cols={invCols}
            isLoading={invLoading}
            onPrint={(r) => setSelectedInvoice({ data: r, type: "invoices", autoDownload: false })}
            onDownload={(r) => setSelectedInvoice({ data: r, type: "invoices", autoDownload: true })}
            onToggleStatus={handleToggleStatus}
            onWhatsApp={handleWhatsApp}
            onEdit={(r) => setEditingRecord({ data: r, type: "invoices" })}
          />
        </TabsContent>
        <TabsContent value="returns" className="mt-4">
          <TxTable data={returns} cols={srCols} isLoading={srLoading} />
        </TabsContent>
        <TabsContent value="receipts" className="mt-4">
          <div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">No receipts recorded today</div>
        </TabsContent>
        <TabsContent value="proforma" className="mt-4">
          <div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">No active Proforma / Sales Orders</div>
        </TabsContent>
        <TabsContent value="obf" className="mt-4">
          <div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">Order Booking Forms (OBF) summary</div>
        </TabsContent>
        <TabsContent value="pricing" className="mt-4">
          <div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">Special customer pricing matrix</div>
        </TabsContent>
      </Tabs>

      {/* WhatsApp Confirmation Dialog */}
      <Dialog open={waDialog.open} onOpenChange={(v) => setWaDialog(prev => ({ ...prev, open: v }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
              Send to WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg space-y-2 border border-border/50">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Customer Details</p>
              <p className="font-bold text-lg">{waDialog.contact?.name || "Unknown Customer"}</p>
              <div className="flex items-center gap-2 text-primary font-black">
                <p className="text-xl">
                  {waDialog.contact?.whatsapp || waDialog.contact?.mobile || "No Number Linked"}
                </p>
              </div>
            </div>
            <div className="text-sm text-balance text-muted-foreground">
              Confirm sending {waDialog.data?.invoiceNo || waDialog.data?.quotationNo || "document"} details to this number. This will open WhatsApp in a new tab.
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setWaDialog({ open: false, data: null, contact: null })}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700 gap-2 shadow-lg shadow-green-600/20" onClick={confirmSendWhatsApp}>
              Confirm & Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conversion Options Dialog */}
      <Dialog open={convertDialog.open} onOpenChange={(v) => setConvertDialog(prev => ({ ...prev, open: v }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Convert Document</DialogTitle>
          </DialogHeader>
          <div className="py-6 flex flex-col gap-6">
            <p className="text-sm text-muted-foreground text-center">
              What would you like to convert this <b>Estimate</b> into?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                className="flex flex-col items-center justify-center h-48 p-4 gap-3 group border-2 hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 relative"
                variant="outline"
                disabled={convertingId !== null}
                onClick={() => handleConvert(convertDialog.data, "estimates", "quotations")}
              >
                <div className="bg-blue-100 p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-black text-blue-900 uppercase text-[0.75rem] tracking-wider">Quotation</p>
                  <p className="text-[0.625rem] font-medium text-muted-foreground leading-tight px-2">Formal proposal for customer</p>
                </div>
                {convertingId === convertDialog.data?.id && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                )}
              </Button>

              <Button
                className="flex flex-col items-center justify-center h-48 p-4 gap-3 group border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-300 relative"
                variant="outline"
                disabled={convertingId !== null}
                onClick={() => handleConvert(convertDialog.data, "estimates", "invoices")}
              >
                <div className="bg-primary/10 p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-black text-primary uppercase text-[0.75rem] tracking-wider">Tax Invoice</p>
                  <p className="text-[0.625rem] font-medium text-muted-foreground leading-tight px-2">Final bill with GST calculations</p>
                </div>
                {convertingId === convertDialog.data?.id && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </Button>
            </div>

            <p className="text-[0.625rem] text-center text-muted-foreground uppercase font-bold tracking-widest opacity-50">
              Original status will update to "Quoted" or "Invoiced"
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {editingRecord && (
        <CreateSalesModal
          open={!!editingRecord}
          onOpenChange={(open) => !open && setEditingRecord(null)}
          initialData={editingRecord.data}
          type={editingRecord.type}
          title={`Edit ${editingRecord.type.charAt(0).toUpperCase() + editingRecord.type.slice(1, -1)}`}
        />
      )}

      {selectedInvoice.data && (
        <InvoicePrintPreview
          invoice={selectedInvoice.data}
          docType={selectedInvoice.type}
          autoDownload={selectedInvoice.autoDownload}
          onClose={() => setSelectedInvoice({ data: null, type: "invoices" })}
        />
      )}
    </div>
  );
}
