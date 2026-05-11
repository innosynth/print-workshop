import React, { useState, useRef, useEffect, Fragment } from "react";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

const generateNextNo = (list: any[], type: string) => {
  const prefix = type === 'quotations' ? 'QT' : type === 'estimates' ? 'EST' : 'INV';
  const nums = list
    .filter((i: any) => {
      const val = i.invoiceNo || i.quotationNo;
      return val && typeof val === 'string' && val.startsWith(prefix + '-');
    })
    .map((i: any) => {
      const val = i.invoiceNo || i.quotationNo;
      // Since we filtered by startsWith(prefix + '-'), we know it has a hyphen
      const parts = val.split('-');
      const lastPart = parts[parts.length - 1];
      const num = parseInt(lastPart);
      // Ignore old 6-digit random numbers (like 940120, 030242) to allow starting from 1000.
      // We only ignore them if they are exactly 6 digits and higher than 10000.
      if (lastPart.length === 6 && num > 10000) return 0;
      return isNaN(num) ? 0 : num;
    })
    .filter(n => n >= 1000);

  const max = nums.length > 0 ? Math.max(...nums) : 999;
  return `${prefix}-${max + 1}`;
};

function FormCombobox({ label, value, options, onSelect, action, triggerRef, onKeyDown, autoOpenTrigger, openOnFocus, includeBlank, allowCustom }: { label: string, value: string, options: string[], onSelect: (v: string) => void, action?: React.ReactNode, triggerRef?: any, onKeyDown?: (e: React.KeyboardEvent) => void, autoOpenTrigger?: number, openOnFocus?: boolean, includeBlank?: boolean, allowCustom?: boolean }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState("");
  const [search, setSearch] = useState("");
  const justClosed = useRef(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoOpenTrigger && autoOpenTrigger > 0) {
      const timer = setTimeout(() => {
        setOpen(true);
        justClosed.current = false;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [autoOpenTrigger]);

  useEffect(() => {
    if (open) {
      setHighlighted("___hidden_default___");
      setSearch("");
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    } else {
      // When popover closes, reset justClosed after a short delay.
      // This ensures that if focus moves to another field and then back (e.g. via Shift+Tab),
      // the dropdown can open again. The delay covers the automatic focus-return phase.
      const timer = setTimeout(() => {
        justClosed.current = false;
      }, 150);
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
          onFocus={(e) => {
            if (openOnFocus && !open && !justClosed.current) {
              // Increase delay to ensure DOM and focus state are stable
              setTimeout(() => setOpen(true), 100);
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
              if (onKeyDown && e.shiftKey && (e.key === 'Tab' || e.key === 'Enter')) {
                setOpen(false);
                // Increase delay to ensure Popover handles closing before we move focus
                setTimeout(() => onKeyDown(e), 100);
                return;
              }
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
                  title={opt}
                  onSelect={() => {
                    justClosed.current = true;
                    onSelect(opt);
                    setOpen(false);
                  }}
                  className="text-xs whitespace-nowrap overflow-hidden text-ellipsis py-1 px-2 cursor-default"
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
  const { toast } = useToast();
  const [paperSize, setPaperSize] = useState<"A4" | "A5" | "thermal">("A4");
  const [isDownloading, setIsDownloading] = useState(false);
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

  const formatDate = (d: string) => {
    if (!d) return new Date().toLocaleDateString('en-GB').split('/').join('-');
    const parts = d.split('-');
    if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return d;
  };

  const items = (activeInvoice?.items || []).map((item: any) => {
    if (item.category) return item;
    const match = allProducts.find((p: any) => p.name === item.name || (item.sku && p.sku === item.sku));
    return { ...item, category: match?.category || "" };
  });

  const isEstimate = docType === "estimates";
  const isIgst = activeInvoice.isIgst === true;
  const taxableAmount = items.reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0);

  // Use the saved tax value to determine if GST should be shown
  const savedTax = parseFloat(activeInvoice.tax || "0");
  // Force calculation only for older quotations that don't have a saved tax value (NULL)
  const isLegacyQuotation = docType === 'quotations' && (activeInvoice.tax === null || activeInvoice.tax === undefined);

  const totalTax = (savedTax > 0 || isLegacyQuotation) ? items.reduce((sum: number, item: any) => {
    const rate = parseFloat(item.gstRate || "0") || 0;
    return sum + (parseFloat(item.amount || 0) * (rate / 100));
  }, 0) : 0;

  const rawTotal = taxableAmount + totalTax;
  // If no tax is saved (especially for estimates where GST was disabled), 
  // the total should be the rounded taxable amount to avoid legacy bugged totals
  const total = (activeInvoice.total && (savedTax > 0 || !isLegacyQuotation)) ? parseFloat(activeInvoice.total) : Math.round(rawTotal);
  const roundOff = total - rawTotal;

  const taxGroups = (savedTax > 0 || isLegacyQuotation) ? items.reduce((acc: any, item: any) => {
    const rate = parseFloat(item.gstRate || "0") || 0;
    if (rate > 0) {
      const amt = parseFloat(item.amount || 0);
      const tax = amt * (rate / 100);
      if (!acc[rate]) acc[rate] = { rate, tax: 0 };
      acc[rate].tax += tax;
    }
    return acc;
  }, {}) : {};

  const MAX_ITEMS_A4 = 16;
  const MAX_ITEMS_A5 = 8;
  const fitsOnOnePage = items.length <= (paperSize === "A5" ? MAX_ITEMS_A5 : MAX_ITEMS_A4);

  const upiUrl = activeQr?.isDynamic ? `upi://pay?pa=${activeQr.upiId}&pn=${encodeURIComponent(activeQr.payeeName)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Invoice ' + (activeInvoice.invoiceNo || activeInvoice.estimateNo || ''))}&tr=${activeInvoice.invoiceNo || activeInvoice.estimateNo || ''}` : null;

  const { data: dynamicQrData, isLoading: qrLoading, error: qrError } = useQuery({
    queryKey: ["dynamic_qr", upiUrl],
    queryFn: async () => {
      const res = await fetch(`/api/qr?data=${encodeURIComponent(upiUrl!)}`);
      if (!res.ok) throw new Error('Failed to fetch QR');
      return res.json();
    },
    enabled: !!upiUrl,
    staleTime: 3600000
  });

  const [qrBlobUrl, setQrBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (dynamicQrData?.qrDataUrl) {
      fetch(dynamicQrData.qrDataUrl)
        .then(res => res.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setQrBlobUrl(url);
        })
        .catch(err => { });
    }
    return () => {
      if (qrBlobUrl) URL.revokeObjectURL(qrBlobUrl);
    };
  }, [dynamicQrData?.qrDataUrl]);



  const handleDownload = async () => {
    const docNo = activeInvoice?.invoiceNo || activeInvoice?.quotationNo || activeInvoice?.estimateNo || 'Doc';
    const custName = (activeInvoice?.customerName || 'Customer').replace(/\s+/g, '_');

    setIsDownloading(true);

    try {
      const element = paperSize === "thermal"
        ? printRef.current?.querySelector('.thermal-format')
        : printRef.current?.querySelector('.invoice-page');

      if (!element) {
        toast({
          title: "Error",
          description: "Could not find the document to capture.",
          variant: "destructive"
        });
        return;
      }

      const clone = element.cloneNode(true) as HTMLElement;

      // Convert <img> src to data URLs for blob images
      const imgs = clone.querySelectorAll('img');
      for (const img of Array.from(imgs)) {
        const src = img.getAttribute('src');
        if (src && (src.startsWith('blob:') || src.startsWith('data:'))) {
          if (src.startsWith('blob:')) {
            try {
              const response = await fetch(src);
              const blob = await response.blob();
              const dataUrl = await new Promise<string>(resolve => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
              img.setAttribute('src', dataUrl);
            } catch {
              // Keep original src if fetch fails
            }
          }
        } else if (src && !src.startsWith('http') && !src.startsWith('data:')) {
          img.setAttribute('src', `${window.location.origin}${src}`);
        }
      }

      // Get all styles from the document
      const styleSheets = Array.from(document.styleSheets);
      let cssStyles = '';
      for (const sheet of styleSheets) {
        try {
          const rules = Array.from(sheet.cssRules);
          cssStyles += rules.map(rule => rule.cssText).join('\n');
        } catch (e) {
          // Skip cross-origin stylesheets that we can't access
        }
      }

      const htmlString = `
        <style>${cssStyles}</style>
        <style>${printStyles}</style>
        ${clone.outerHTML}
      `;

      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: htmlString,
          paperSize,
          docTitle: `${docNo}_${custName}`,
          thermalWidth: settingsData?.settings?.thermalWidth || settings.thermalWidth || "72.1"
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to generate PDF' }));
        throw new Error(errorData.error);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docNo}_${custName}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      console.error("Failed to generate PDF:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadJpg = async () => {
    const root = printRef.current;
    if (!root) return;

    // Target the specific document container to avoid extra whitespace
    const element = paperSize === "thermal"
      ? root.querySelector('.thermal-format') as HTMLElement
      : root.querySelector('.invoice-page') as HTMLElement;

    if (!element) {
      toast({
        title: "Error",
        description: "Could not find the document to capture.",
        variant: "destructive"
      });
      return;
    }

    setIsDownloading(true);

    // Temporarily remove constraints for clean capture
    const originalMinHeight = element.style.minHeight;
    const originalHeight = element.style.height;
    element.style.minHeight = 'auto';
    element.style.height = 'auto';

    try {
      const canvas = await html2canvas(element, {
        scale: 4, // Ultra-high quality
        useCORS: true,
        logging: false, // Internal logging disabled
        backgroundColor: "#ffffff",
        width: element.offsetWidth,
        height: element.scrollHeight,
        windowWidth: element.offsetWidth,
        windowHeight: element.scrollHeight
      });

      // Use Blob instead of dataURL for better reliability with large images
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error("Canvas to Blob conversion failed");
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const docNo = activeInvoice?.invoiceNo || activeInvoice?.quotationNo || activeInvoice?.estimateNo || 'Doc';
        const custName = (activeInvoice?.customerName || 'Customer').replace(/\s+/g, '_');

        link.download = `${docNo}_${custName}.jpg`;
        link.href = url;
        link.click();

        // Cleanup the object URL
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);

        toast({
          title: "Success",
          description: "Image downloaded successfully.",
        });
        setIsDownloading(false);
      }, "image/jpeg", 1.0);

    } catch (err) {
      console.error("Failed to generate image:", err);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      });
      setIsDownloading(false);
    } finally {
      element.style.minHeight = originalMinHeight;
      element.style.height = originalHeight;
    }
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
      if (activeInvoice.items.length <= MAX_ITEMS_A5) setPaperSize("A5");
      else setPaperSize("A4");
    }
  }, [activeInvoice?.id, docType]);

  useEffect(() => {
    // Only trigger download if QR is loaded (if dynamic)
    const qrLoaded = !upiUrl || !!qrBlobUrl;

    if (autoDownload && activeInvoice?.id && !invoiceLoading) {
      if (qrLoaded) {
        const timer = setTimeout(() => {
          if (isEstimate) {
            handleDownloadJpg().then(() => onClose());
          } else {
            handleDownload().then(() => onClose());
          }
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [autoDownload, activeInvoice?.id, qrBlobUrl, upiUrl, isEstimate, docType, invoiceLoading]);

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
  const a4Height = '270mm';
  const a5Width = '210mm';
  const a5Height = '130mm';

  const printStyles = `
    .print-container {
      width: 100%;
      display: flex;
      justify-content: center;
      background: white;
      padding: 0;
    }

    .invoice-page *, .invoice-page,
    .thermal-format *, .thermal-format {
      font-family: Arial !important;
    }

     .invoice-page {
     background: white;
     box-shadow: none;
     width: ${paperSize === "A4" ? a4Width : paperSize === "A5" ? a5Width : "100%"} !important;
     height: ${fitsOnOnePage ? (paperSize === "A4" ? a4Height : paperSize === "A5" ? a5Height : "auto") : "auto"} !important;
     margin: 0 auto;
     padding: ${paperSize === "A5" ? "10px 24px 20px 24px" : "0 38px 20px 38px"} !important;
     box-sizing: border-box;
     display: ${fitsOnOnePage ? 'flex' : 'block'} !important;
     flex-direction: column !important;
     flex-grow: 1 !important;
     position: relative;
     color: black;
     font-family: Arial, sans-serif;
     page-break-after: always;
     overflow: visible;
     }
     
    .thermal-format {
      width: ${settingsData?.settings?.thermalWidth || settings.thermalWidth || "72.1"}mm !important;
      padding: ${isEstimate ? '0' : '2mm'} 3mm 2mm 0 !important;
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
      margin: 2mm 0 1mm 0 !important;
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
      padding: 14px 2px !important;
      line-height: 1.2 !important;
      vertical-align: middle !important;
      box-sizing: border-box !important;
    }
    .invoice-items-table thead tr {
      border-top: 2px solid black !important;
      border-bottom: 2px solid black !important;
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
      margin: ${paperSize === "thermal" ? "0" : "2mm 4mm 4mm 4mm"};
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
      padding: ${paperSize === "A5" ? "2mm" : "3mm"} !important;
      border: none !important;
    }

    /* Table header repeats on each page with top padding on continuation pages */
    .invoice-items-table thead {
      display: table-header-group !important;
    }
    .invoice-items-table thead th {
      vertical-align: middle !important;
      padding: 14px 2px !important;
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
      padding: 1mm 3mm 1mm 0 !important;
      box-shadow: none !important;
    }
  }
`;



  const docTitle = docType === "estimates" ? "Estimate" : docType === "quotations" ? "Quotation" : "Tax Invoice";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className={cn(
        paperSize === "thermal" ? "h-auto max-h-[95vh]" : "h-[95vh] max-h-[95vh]",
        "flex flex-col bg-[#f5f5f5] p-0 gap-0 transition-all duration-300 border-none overflow-hidden",
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
          .a5-format .text-\\[0\\.7rem\\] { font-size: 0.57rem !important; }
          .a5-format .text-\\[0\\.6rem\\] { font-size: 0.57rem !important; }
          .a5-format .text-\\[0\\.62rem\\] { font-size: 0.52rem !important; }
          .a5-format .text-\\[0\\.65rem\\] { font-size: 0.62rem !important; }
          .a5-format .text-\\[0\\.68rem\\] { font-size: 0.64rem !important; }
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
          .a5-format .pt-6 { padding-top: 0.8rem !important; }
          .a5-format .mt-auto { margin-top: auto !important; }
          .a5-format { padding-top: 0 !important; }
          .a5-format .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.2rem !important; }
          .a5-format .pt-4 { padding-top: 0.1rem !important; }
          .a5-format .grid { gap: 0.1rem !important; }
          
          /* Shrink Header for A5 */
          .a5-format .header-brand-name { font-size: 1rem !important; }
          .a5-format .w-16.h-16 { width: 3rem !important; height: 3rem !important; }
          
          /* Shrink Table for A5 */
          .a5-format .invoice-items-table thead th { height: auto !important; line-height: 1.2 !important; padding: 10px 2px !important; font-size: 8.8px !important; vertical-align: middle !important; }

          /* Header Text Scaling for A5 */
          .a5-format .header-brand-name { font-size: 1.2rem !important; }
          .a5-format .header-slogan { font-size: 0.48rem !important; }
          .a5-format .header-sub-brand { font-size: 0.54rem !important; }
          .a5-format .header-contact-text { font-size: 0.675rem !important; }

          /* Prevent A5 Row Breaks */
          .a5-format .invoice-items-table tbody tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: table-row !important;
          }
        `}</style>


        <div className="h-11 px-4 border-b flex items-center justify-between no-print sticky top-0 bg-white z-10 shadow-sm flex-none">
          <span className="font-bold text-sm" title={(activeInvoice.customerName || invoice.customerName || "Customer").replace(/\s+/g, '_')}>
            {(activeInvoice.invoiceNo || activeInvoice.quotationNo || invoice.invoiceNo || invoice.quotationNo || "Draft")}_{(activeInvoice.customerName || invoice.customerName || "Customer").replace(/\s+/g, '_').length > 15 ? (activeInvoice.customerName || invoice.customerName || "Customer").replace(/\s+/g, '_').substring(0, 15) + "..." : (activeInvoice.customerName || invoice.customerName || "Customer").replace(/\s+/g, '_')}
          </span>
          <div className="flex gap-2 items-center">
            {/* Paper Size selection (only for A4/A5 documents) */}
            {!isEstimate && (
              <div className="flex gap-1 mr-2">
                <Button variant={paperSize === "A4" ? "default" : "outline"} size="sm" onClick={() => setPaperSize("A4")} className="h-7 px-2 text-[10px]">A4</Button>
                <Button variant={paperSize === "A5" ? "default" : "outline"} size="sm" onClick={() => setPaperSize("A5")} className="h-7 px-2 text-[10px]">A5</Button>
              </div>
            )}

            <Button
              variant="outline"
              onClick={handleDownloadJpg}
              disabled={isDownloading}
              className="gap-1.5 border-blue-600 text-blue-600 hover:bg-blue-50 h-8 text-[11px] px-3"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {isDownloading ? "Generating..." : "Download JPG"}
            </Button>

            {docType === 'estimates' && (
              <Button onClick={handlePrint} className="gap-1.5 bg-green-600 hover:bg-green-700 h-8 text-[11px] px-3">
                <Printer className="h-3.5 w-3.5" /> Print Document
              </Button>
            )}

            <Button variant="outline" onClick={handleDownload} className="gap-1.5 border-green-600 text-green-600 hover:bg-green-50 h-8 text-[11px] px-3">
              <Download className="h-3.5 w-3.5" /> Download PDF
            </Button>
          </div>
        </div>

        <div
          ref={printRef}
          className={`print-container flex-1 overflow-auto py-6 ${paperSize === "thermal" ? "bg-white" : "bg-[#f5f5f5]"}`}
          style={{ transform: 'none', transformOrigin: 'top left' }}
        >
          {paperSize === "A4" || paperSize === "A5" ? (
            <div className={`invoice-page ${paperSize === "A5" ? "a5-format" : ""}`} style={{ fontSize: `${(settingsData?.settings?.a4FontSize || settings.a4FontSize) * 0.9}px`, fontFamily: "Arial" }}>

              <div className={cn("space-y-2", paperSize === "A5" && "space-y-1")}>
                {/* Header Layout */}
                <div className={cn("flex justify-between items-start w-full border-b-2 border-black/20 pb-2", paperSize === "A5" && "pb-1")}>
                  <div className="flex items-center">
                    {profile.logoUrl ? (
                      <img src={profile.logoUrl} className="w-16 h-16 object-contain mr-3 shrink-0" alt="Logo" />
                    ) : (
                      <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center text-white font-bold text-2xl mr-3 shrink-0">PW</div>
                    )}
                    <div>
                      <h1 className="text-xl font-black tracking-tighter uppercase leading-none whitespace-nowrap header-brand-name">{profile.name || "PRINT WORKSHOP"}</h1>
                      <p className="text-[0.6rem] font-medium text-black uppercase mt-0.5 header-slogan">{profile.slogan}</p>
                      <p className="text-[0.6rem] font-medium text-black uppercase header-sub-brand">DIGITAL PRINTING</p>
                    </div>
                  </div>

                  <div className={cn("pt-1", paperSize === "A5" && "pt-1")}>
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
                <div className={cn("grid grid-cols-12 gap-4 text-[0.7rem]", paperSize === "A5" && "gap-1 text-[0.65rem]")}>
                  <div className="col-span-7 space-y-0.5">
                    <p className={cn("font-bold text-gray-500 uppercase tracking-widest text-[0.6rem]", paperSize === "A5" && "text-base mt-0 leading-tight")}>TO :</p>
                    <p className={cn("text-base font-black uppercase", paperSize === "A5" && "text-xl mt-0 leading-tight")}>{activeInvoice.customerName || invoice.customerName || ""}</p>
                    <p className={cn("text-gray-600 font-bold", paperSize === "A5" && "mt-0 leading-tight")}>COIMBATORE</p>
                    <p className={cn("mt-2 font-bold uppercase", paperSize === "A5" && "mt-1 leading-tight")}>GSTIN : {activeInvoice.customerGst || "N/A"}</p>
                    <p className={cn("font-bold uppercase", paperSize === "A5" && "mt-0 leading-tight")}>State & Code:</p>
                  </div>
                  <div className="col-span-5">
                    <table className="text-[0.7rem] font-bold" style={{ marginLeft: 'auto', tableLayout: 'auto', borderCollapse: 'collapse', fontFamily: 'Arial' }}>
                      <tbody>
                        <tr>
                          <td className="pr-0 text-right" style={{ whiteSpace: 'nowrap' }}>{docType === "quotations" ? "Quotation No" : docType === "estimates" ? "Estimate No" : "Invoice No"}</td>
                          <td className="pl-0 font-black text-left" style={{ whiteSpace: 'nowrap' }}>: {activeInvoice.invoiceNo || activeInvoice.quotationNo || activeInvoice.estimateNo || invoice.invoiceNo || invoice.quotationNo || invoice.estimateNo || "DRAFT"}</td>
                        </tr>
                        <tr>
                          <td className="pr-0 text-right" style={{ whiteSpace: 'nowrap' }}>{docType === "quotations" ? "Quotation Date" : docType === "estimates" ? "Estimate Date" : "Invoice Date"}</td>
                          <td className="pl-0 font-black text-left" style={{ whiteSpace: 'nowrap' }}>: {formatDate(activeInvoice.date || invoice.date)}</td>
                        </tr>
                        <tr>
                          <td className="pr-0 text-right" style={{ whiteSpace: 'nowrap' }}>PO No</td>
                          <td className="pl-0 font-black text-left" style={{ whiteSpace: 'nowrap' }}>: -</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <table className="w-full border-collapse text-[0.6rem] invoice-items-table">
                  <thead className="bg-white font-bold uppercase">
                    <tr className="text-[10px] align-middle">
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
                  <tbody className={cn("font-medium text-[0.65rem]", paperSize === "A5" && "text-[0.6rem]")}>
                    {items.map((item: any, i: number) => {
                      const itemRate = parseFloat(item.gstRate || 0);
                      const itemAmount = parseFloat(item.amount || 0);
                      const itemTax = itemAmount * (itemRate / 100);
                      return (
                        <tr key={i} className="">
                          <td className={cn("px-0.5 py-2 text-center", paperSize === "A5" && "py-1")}>{i + 1}</td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {paperSize === "A4" ? (
                                <span className="font-black uppercase text-[0.7rem]">{item.category || item.name}</span>
                              ) : (
                                <span className="font-black uppercase text-[0.7rem]">{item.category || item.name}</span>
                              )}
                            </div>
                          </td>
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
                          <td className={cn("px-2 py-2 text-right font-black", paperSize === "A5" && "py-1")}>{itemAmount.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    {/* Fill empty rows only when items fit on a single page */}
                    {fitsOnOnePage && Array.from({ length: Math.max(0, (paperSize === "A5" ? MAX_ITEMS_A5 : MAX_ITEMS_A4) - items.length) }).map((_, i) => (
                      <tr key={`empty-${i}`} className={paperSize === "A4" ? "h-4" : "h-4"}>
                        <td colSpan={isIgst ? 8 : (isEstimate ? 6 : 10)}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>

              {/* Footer Layout - on page 1: pushed to bottom; on multi-page: immediately after items */}
              {paperSize === "A5" ? (
                <div className="invoice-footer-section" style={{ pageBreakInside: 'avoid', breakInside: 'avoid', width: '100%', marginTop: fitsOnOnePage ? 'auto' : '10px', borderTop: '1px solid #eee' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontFamily: "Arial" }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '35%', verticalAlign: 'top' }}>
                          <p className="font-black mb-1 uppercase text-[9px]">Bank Details</p>
                          <div className="text-[10px] space-y-0.5">
                            <div className="flex"><span style={{ width: '80px' }} className="text-gray-500 font-bold uppercase text-[8px]">Account Name</span><span className="font-black">: {profile.accountName || profile.name}</span></div>
                            <div className="flex"><span style={{ width: '80px' }} className="text-gray-500 font-bold uppercase text-[8px]">Bank</span><span className="font-black">: {profile.bankName || "ICICI Bank"}</span></div>
                            <div className="flex"><span style={{ width: '80px' }} className="text-gray-500 font-bold uppercase text-[8px]">Branch</span><span className="font-black">: {profile.bankBranch || "Gandhipuram"}</span></div>
                            <div className="flex"><span style={{ width: '80px' }} className="text-gray-500 font-bold uppercase text-[8px]">A/C No</span><span className="font-black">: {profile.accountNumber || "730705000264"}</span></div>
                            <div className="flex"><span style={{ width: '80px' }} className="text-gray-500 font-bold uppercase text-[8px]">IFSC Code</span><span className="font-black">: {profile.ifscCode || "ICIC0007307"}</span></div>
                          </div>
                          <div className="mt-4">
                            <p className="text-[0.6rem] font-bold text-black uppercase tracking-tight text-left">THANK YOU FOR YOUR BUSINESS</p>
                          </div>
                        </td>
                        <td style={{ width: '30%', verticalAlign: 'top', textAlign: 'center' }}>
                          {activeQr && total > 0 && (
                            <div style={{ display: 'inline-block' }}>
                              {activeQr.isDynamic ? (
                                qrBlobUrl ? (
                                <img src={qrBlobUrl} style={{ height: '80px', width: '80px', objectFit: 'contain' }} className="p-1 mx-auto" alt="Dynamic UPI QR" />
                              ) : (
                                <div style={{ height: '80px', width: '80px' }} className="flex items-center justify-center mx-auto"><Loader2 className="h-6 w-6 animate-spin text-primary/30" /></div>
                              )
                            ) : (
                              <img src={activeQr.imageUrl} style={{ height: '80px', width: '80px', objectFit: 'contain' }} className="p-1 mx-auto" alt="Payment QR" />
                            )}
                              <p className="text-[9px] font-black uppercase text-gray-700 mt-1">SCAN and PAY</p>
                            </div>
                          )}
                        </td>
                        <td style={{ width: '35%', verticalAlign: 'top' }}>
                          <table className="w-full text-[9px] border-collapse border border-gray-300" style={{ fontFamily: "Arial", tableLayout: 'fixed' }}>
                            <tbody>
                              <tr>
                                <td className="px-2 py-0.5 text-gray-600 font-bold" style={{ width: '65%' }}>Sub Total</td>
                                <td className="px-2 py-0.5 text-right font-black" style={{ width: '35%' }}>{taxableAmount.toFixed(2)}</td>
                              </tr>
                              {Object.values(taxGroups).map((group: any) => (
                                isIgst ? (
                                  <tr key={`igst-${group.rate}`}>
                                    <td className="px-2 py-0.5 text-gray-600 font-bold uppercase text-[9px]">IGST {group.rate}%</td>
                                    <td className="px-2 py-0.5 text-right font-black">{group.tax.toFixed(2)}</td>
                                  </tr>
                                ) : (
                                  <Fragment key={`gst-${group.rate}`}>
                                    <tr>
                                      <td className="px-2 py-0.5 text-gray-600 font-bold uppercase text-[9px]">CGST {group.rate / 2}%</td>
                                      <td className="px-2 py-0.5 text-right font-black">{(group.tax / 2).toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                      <td className="px-2 py-0.5 text-gray-600 font-bold uppercase text-[9px]">SGST {group.rate / 2}%</td>
                                      <td className="px-2 py-0.5 text-right font-black">{(group.tax / 2).toFixed(2)}</td>
                                    </tr>
                                  </Fragment>
                                )
                              ))}
                              <tr>
                                <td className="px-2 py-0.5 text-gray-600 font-bold uppercase">Round Off</td>
                                <td className="px-2 py-0.5 text-right font-black">{roundOff.toFixed(2)}</td>
                              </tr>
                              <tr className="bg-gray-100 border-t border-gray-300 shadow-sm">
                                <td className="px-2 py-0.5 text-black text-[12px] font-black uppercase">Grand Total</td>
                                <td className="px-2 py-0.5 text-right text-black text-[12px] font-black">{total.toFixed(2)}</td>
                              </tr>
                            </tbody>
                          </table>
                          <div className="mt-2 w-full text-right">
                            <p className="text-[9px] text-gray-500 font-medium leading-tight">This is computer generated {docType === "quotations" ? "quotation" : docType === "estimates" ? "estimate" : "invoice"} signature not required</p>
                            {activeInvoice.fileName && <p className="text-[10px] font-bold uppercase text-primary mt-1">File: {activeInvoice.fileName}</p>}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="invoice-footer-section" style={{ pageBreakInside: 'avoid', breakInside: 'avoid', width: '100%', marginTop: fitsOnOnePage ? 'auto' : '10px', borderTop: '1px solid #eee' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontFamily: "Arial" }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '35%', verticalAlign: 'top' }}>
                          <p className="font-black mb-1 uppercase text-[11.5px]">Bank Details</p>
                          <div className="text-[11.5px] space-y-0.5">
                            <div className="flex"><span style={{ width: '90px' }} className="text-gray-500 font-bold uppercase text-[10px]">Account Name</span><span className="font-black">: {profile.accountName || profile.name}</span></div>
                            <div className="flex"><span style={{ width: '90px' }} className="text-gray-500 font-bold uppercase text-[10px]">Bank</span><span className="font-black">: {profile.bankName || "ICICI Bank"}</span></div>
                            <div className="flex"><span style={{ width: '90px' }} className="text-gray-500 font-bold uppercase text-[10px]">Branch</span><span className="font-black">: {profile.bankBranch || "Gandhipuram"}</span></div>
                            <div className="flex"><span style={{ width: '90px' }} className="text-gray-500 font-bold uppercase text-[10px]">A/C No</span><span className="font-black">: {profile.accountNumber || "730705000264"}</span></div>
                            <div className="flex"><span style={{ width: '90px' }} className="text-gray-500 font-bold uppercase text-[10px]">IFSC Code</span><span className="font-black">: {profile.ifscCode || "ICIC0007307"}</span></div>
                          </div>
                          <div className="mt-4">
                            <p className="text-[0.6rem] font-bold text-black uppercase tracking-tight text-left">THANK YOU FOR YOUR BUSINESS</p>
                          </div>
                        </td>
                        <td style={{ width: '30%', verticalAlign: 'top', textAlign: 'center' }}>
                          {activeQr && total > 0 && (
                            <div style={{ display: 'inline-block' }}>
                              {activeQr.isDynamic ? (
                                qrBlobUrl ? (
                                  <img src={qrBlobUrl} style={{ height: '135px', width: '135px', objectFit: 'contain' }} className="p-1 mx-auto" alt="Dynamic UPI QR" />
                                ) : (
                                  <div style={{ height: '135px', width: '135px' }} className="flex items-center justify-center mx-auto"><Loader2 className="h-6 w-6 animate-spin text-primary/30" /></div>
                                )
                              ) : (
                                <img src={activeQr.imageUrl} style={{ height: '135px', width: '135px', objectFit: 'contain' }} className="p-1 mx-auto" alt="Payment QR" />
                              )}
                              <p className="text-[10px] font-black uppercase text-gray-700 mt-1">SCAN and PAY</p>
                            </div>
                          )}
                        </td>
                        <td style={{ width: '35%', verticalAlign: 'top' }}>
                          <table className="w-full text-[11.5px] border-collapse border border-gray-300" style={{ fontFamily: "Arial", tableLayout: 'fixed' }}>
                            <tbody>
                              <tr>
                                <td className="px-2 py-1 text-gray-600 font-bold" style={{ width: '65%' }}>Sub Total</td>
                                <td className="px-2 py-1 text-right font-black" style={{ width: '35%' }}>{taxableAmount.toFixed(2)}</td>
                              </tr>
                              {Object.values(taxGroups).map((group: any) => (
                                isIgst ? (
                                  <tr key={`igst-${group.rate}`}>
                                    <td className="px-2 py-1 text-gray-600 font-bold uppercase text-[10px]">IGST {group.rate}%</td>
                                    <td className="px-2 py-1 text-right font-black">{group.tax.toFixed(2)}</td>
                                  </tr>
                                ) : (
                                  <Fragment key={`gst-${group.rate}`}>
                                    <tr>
                                      <td className="px-2 py-1 text-gray-600 font-bold uppercase text-[10px]">CGST {group.rate / 2}%</td>
                                      <td className="px-2 py-1 text-right font-black">{(group.tax / 2).toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                      <td className="px-2 py-1 text-gray-600 font-bold uppercase text-[10px]">SGST {group.rate / 2}%</td>
                                      <td className="px-2 py-1 text-right font-black">{(group.tax / 2).toFixed(2)}</td>
                                    </tr>
                                  </Fragment>
                                )
                              ))}
                              <tr>
                                <td className="px-2 py-1 text-gray-600 font-bold uppercase">Round Off</td>
                                <td className="px-2 py-1 text-right font-black">{roundOff.toFixed(2)}</td>
                              </tr>
                              <tr className="bg-gray-100 border-t border-gray-300 shadow-sm">
                                <td className="px-2 py-1 text-black text-[13.5px] font-black uppercase">Grand Total</td>
                                <td className="px-2 py-1 text-right text-black text-[13.5px] font-black">{total.toFixed(2)}</td>
                              </tr>
                            </tbody>
                          </table>
                          <div className="mt-2 w-full text-right">
                            <p className="text-[9px] text-gray-500 font-medium leading-tight">This is computer generated {docType === "quotations" ? "quotation" : docType === "estimates" ? "estimate" : "invoice"} signature not required</p>
                            {activeInvoice.fileName && <p className="text-[10px] font-bold uppercase text-primary mt-1">File: {activeInvoice.fileName}</p>}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center tracking-tight leading-tight thermal-format" style={{ fontFamily: "Arial", height: 'auto', minHeight: 'auto', lineHeight: '1.1' }}>
              {/* Thermal Format Header */}
              <div>
                {profile.logoUrl && !isEstimate && <img src={profile.logoUrl} className="h-12 mx-auto mb-2 object-contain" alt="Logo" />}
                <h1 style={{ fontSize: '29px', fontWeight: 800, lineHeight: '1.1', marginBottom: '6px' }}>{profile.name || "Print Workshop"}</h1>
                <p style={{ fontSize: '14px', marginTop: '1px' }}>( {profile.slogan || "Innovation in Impression"} )</p>
                <p style={{ fontSize: '14px', marginTop: '1px' }}>{profile.address || "No.4 Dhanlakshminagar, Sidhapudur, CBE-44"}</p>
                <p style={{ fontSize: '14px' }}>Call @ {profile.phone || "0422 2244066 | 84352 66666"}</p>
                {profile.email && <p style={{ fontSize: '14px', fontWeight: 'bold' }}>Mail : {profile.email}</p>}
                {profile.gst && !isEstimate && <p style={{ fontSize: '14px', fontWeight: 700 }}>GSTIN : {profile.gst}</p>}

                <h2 style={{ fontSize: '19px', fontWeight: 800, marginTop: '4px' }}>{docTitle}</h2>
                <div style={{ height: '8px' }}></div>
                <div style={{ borderTop: '0.5px dashed #999', margin: '0 0 4px 0', width: '100%' }}></div>
              </div>

              <div style={{ fontSize: '14.5px', fontStyle: 'normal' }}>
                <div className="flex justify-between">
                  <span>No.<span>{activeInvoice.invoiceNo || activeInvoice.quotationNo || activeInvoice.estimateNo || invoice.invoiceNo || invoice.quotationNo || invoice.estimateNo || "DRAFT"}</span></span>
                  <span>Date: {formatDate(activeInvoice.date || invoice.date)}</span>
                </div>
                <div className="text-left mt-1" style={{ fontSize: '14.5px' }}>
                  C.ID : {activeInvoice.customerName || invoice.customerName || ""}
                </div>
                {activeInvoice.customerGst && !isEstimate && (
                  <div className="text-left mt-0.5" style={{ fontSize: '14.5px' }}>
                    GSTIN : {activeInvoice.customerGst}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '0.5px dashed #999', margin: '12px 0', width: '100%' }}></div>

              <div className="mt-1">
                <table className="w-full" style={{ fontSize: '14px' }}>
                  <thead>
                    <tr style={{ fontWeight: 800 }}>
                      <th className="py-1 text-left px-0.5" style={{ width: '45%' }}>Product Name</th>
                      <th className="text-right py-1 px-0.5" style={{ width: '10%' }}>Qty</th>
                      <th className="text-right py-1 px-0.5" style={{ width: '20%' }}>Rate</th>
                      <th className="text-right py-1 px-0.5" style={{ width: '25%' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items && items.length > 0 ? items.map((item: any, i: number) => (
                      <tr key={i} className="align-top">
                        <td className="text-left py-1 px-0.5 uppercase leading-tight" style={{ fontSize: '13.5px', fontWeight: 400 }}>
                          {item.category || item.name}
                        </td>
                        <td className="text-right py-1 px-0.5" style={{ fontSize: '14px' }}>{item.qty}</td>
                        <td className="text-right py-1 px-0.5" style={{ fontSize: '14px' }}>{parseFloat(item.rate || 0).toFixed(0)}</td>
                        <td className="text-right py-1 px-0.5" style={{ fontSize: '14px' }}>{parseFloat(item.amount || 0).toFixed(2)}</td>
                      </tr>
                    )) : (
                      <tr className="h-10"><td colSpan={4} className="text-center italic opacity-50">No items listed</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ borderTop: '0.5px dashed #999', margin: '12px 0', width: '100%' }}></div>

              <div className="text-left py-1">
                <div className="flex items-center" style={{ fontSize: '14.5px' }}>
                  <div className="space-y-1.5 font-bold">
                    <p>Total Items : {items?.length || 0}</p>
                    <p>Total Qty : {items?.reduce((a: any, b: any) => a + parseInt(b.qty || 0), 0) || 0}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <span style={{ fontSize: '15.5px', fontWeight: 800 }}>
                      {totalTax > 0 ? 'Sub Total: ' : 'Grand Total: '}
                      {totalTax > 0 ? taxableAmount.toFixed(2) : total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {totalTax > 0 && (
                  <div className="mt-1 space-y-0.5" style={{ fontSize: '14px', textAlign: 'right' }}>
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
                    {roundOff !== 0 && <p>Round Off: {roundOff.toFixed(2)}</p>}
                    <p style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px' }}>Grand Total: {total.toFixed(2)}</p>
                  </div>
                )}
                {totalTax === 0 && roundOff !== 0 && (
                  <div className="text-right" style={{ fontSize: '14px' }}>
                    <p>Round Off: {roundOff.toFixed(2)}</p>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '0.5px dashed #999', margin: '12px 0', width: '100%' }}></div>

              <div className="pt-1 space-y-1">
                <div className="text-left space-y-1" style={{ fontSize: '15px', fontWeight: 'bold' }}>
                  <p>File : {activeInvoice.fileName || "-"}</p>
                  <p>User :{profile.name?.split(' ')[0] || "Admin"} | Time : {new Date().toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '.')}</p>
                </div>
                <div className="mt-1 space-y-0.5">
                  <p style={{ fontSize: '15px', fontWeight: 700 }}>{profile.website || 'www.printworkshop.in'}</p>
                  <p style={{ fontSize: '15px', fontWeight: 700 }}>Thank For Your Business</p>
                </div>
              </div>
              {activeQr && total > 0 && (
                <div className="flex flex-col items-center mt-2">
                  {activeQr.isDynamic ? (
                    qrBlobUrl ? (
                      <img
                        src={qrBlobUrl}
                        style={{ height: '150px', width: '150px', objectFit: 'contain' }}
                        className="p-1 mb-1 mx-auto"
                        alt="Dynamic UPI QR"
                      />
                    ) : (
                      <div style={{ height: '150px', width: '150px' }} className="flex items-center justify-center mx-auto">
                        <Loader2 className="h-5 w-5 animate-spin text-primary/30" />
                      </div>
                    )
                  ) : (
                    <img src={activeQr.imageUrl} className="h-24 w-24" alt="QA" />
                  )}
                  <p style={{ fontSize: '14px', fontWeight: 800, marginTop: '2px', letterSpacing: '-0.025em' }}>Scan and Pay</p>
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

  const [items, setItems] = useState<any[]>([]);
  const [pendingItem, setPendingItem] = useState({
    name: "", qty: 1, rate: 0, amount: 0, hsnCode: "", gstRate: "0",
    category: "", subCategory: "", sku: ""
  });
  const [focusNextItemTrigger, setFocusNextItemTrigger] = useState(0);
  const [productTrigger, setProductTrigger] = useState(0);
  const [subCategoryTrigger, setSubCategoryTrigger] = useState(0);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [fileName, setFileName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [gstEnabled, setGstEnabled] = useState(type !== 'estimates');
  const [isIgst, setIsIgst] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Navigation Refs
  const customerRef = useRef<HTMLButtonElement>(null);
  const pendingCategoryRef = useRef<HTMLButtonElement>(null);
  const pendingProductRef = useRef<HTMLButtonElement>(null);
  const pendingSubCategoryRef = useRef<HTMLButtonElement>(null);
  const pendingQtyRef = useRef<HTMLInputElement>(null);
  const pendingRateRef = useRef<HTMLInputElement>(null);
  const pendingAddBtnRef = useRef<HTMLButtonElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);


  const handleEnter = (e: React.KeyboardEvent, nextRef: React.RefObject<any> | any, prevRef?: React.RefObject<any> | any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setTimeout(() => {
        if (nextRef && 'current' in nextRef) {
          nextRef.current?.focus();
        } else if (nextRef) {
          nextRef?.focus();
        }
      }, 50);
    } else if (e.shiftKey && (e.key === "Tab" || e.key === "Enter")) {
      if (prevRef) {
        e.preventDefault();
        setTimeout(() => {
          if ('current' in prevRef) {
            prevRef.current?.focus();
          } else {
            prevRef?.focus();
          }
        }, 50);
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
      setFocusNextItemTrigger(0);
      setProductTrigger(0);
      setSubCategoryTrigger(0);
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
        setGstEnabled(source.tax ? parseFloat(source.tax) > 0 : type !== 'estimates');
        setIsIgst(source.isIgst === true);
        formInitialized.current = true;
      } else {
        // Create new mode
        setItems([]);
        setCustomerId("");
        setCustomerName("");
        setFileName("");
        setDate(new Date().toISOString().split('T')[0]);
        setGstEnabled(type !== 'estimates');
        setIsIgst(false);
        formInitialized.current = true;
      }
    }
  }, [open, type, initialData, fullDetails, products]);

  // Focus appropriate field on open
  useEffect(() => {
    if (open && !initialFocusDone.current) {
      // If editing, wait for full details to load to ensure UI is ready
      if (initialData && !fullDetails) return;

      const timer = setTimeout(() => {
        if (initialData) {
          // Edit mode: focus category
          pendingCategoryRef.current?.focus();
        } else {
          // Create mode: focus customer
          customerRef.current?.focus();
        }
        initialFocusDone.current = true;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open, initialData, fullDetails]);

  const addPendingItem = () => {
    if (!pendingItem.category) {
      toast({ variant: "destructive", title: "Error", description: "Please select a category first" });
      return;
    }
    if (!pendingItem.name) {
      toast({ variant: "destructive", title: "Error", description: "Please select a product first" });
      return;
    }
    if (!pendingItem.subCategory) {
      toast({ variant: "destructive", title: "Error", description: "Please select a sub-category first" });
      return;
    }
    if (pendingItem.qty <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Quantity cannot be zero" });
      return;
    }
    if (pendingItem.rate <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Rate cannot be zero" });
      return;
    }
    const itemToAdd = {
      ...pendingItem,
      amount: pendingItem.qty * pendingItem.rate
    };
    setItems([...items, itemToAdd]);
    setPendingItem({
      name: "", qty: 1, rate: 0, amount: 0, hsnCode: "", gstRate: "0",
      category: "", subCategory: "", sku: ""
    });
    setFocusNextItemTrigger(prev => prev + 1);
  };

  // Focus category after item is added and handle auto-scroll
  useEffect(() => {
    if (focusNextItemTrigger > 0 && open) {
      const timer = setTimeout(() => {
        pendingCategoryRef.current?.focus();

        // Handle scroll
        if (scrollViewportRef.current) {
          scrollViewportRef.current.scrollTo({
            top: scrollViewportRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [focusNextItemTrigger, open]);




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

  const updatePendingItem = (fieldOrUpdates: string | Record<string, any>, value?: any) => {
    setPendingItem(prev => {
      let updated: any;
      if (typeof fieldOrUpdates === 'string') {
        updated = { ...prev, [fieldOrUpdates]: value };
      } else {
        updated = { ...prev, ...fieldOrUpdates };
      }

      if (updated.qty !== undefined || updated.rate !== undefined) {
        updated.amount = (Number(updated.qty || 0)) * (Number(updated.rate || 0));
      }
      return updated;
    });
  };

  const validItems = items.filter(i => i.name && i.name.trim() !== "");
  const subtotal = validItems.reduce((sum, item) => sum + item.amount, 0);
  const potentialTax = validItems.reduce((sum, item) => sum + (item.amount * (parseFloat(item.gstRate || "18") / 100)), 0);

  // UI Display logic - Always show potential tax values by default
  const displayTotalTax = potentialTax;
  const displayRawTotal = subtotal + displayTotalTax;
  const displayGrandTotal = Math.round(displayRawTotal);
  const displayRoundOff = displayGrandTotal - displayRawTotal;

  // Persistence logic - Use gstEnabled flag for saving
  const totalTax = gstEnabled ? potentialTax : 0;
  const rawGrandTotal = subtotal + totalTax;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = grandTotal - rawGrandTotal;

  const resetForm = () => {
    setItems([{
      name: "", qty: 1, rate: 0, amount: 0, hsnCode: "", gstRate: "0",
      category: "", subCategory: "", sku: ""
    }]);
    setCustomerId("");
    setCustomerName("");
    setFileName("");
    setGstEnabled(type !== 'estimates');
    setIsIgst(false);
  };

  const handleSave = async (stayOpen: boolean = false) => {
    if (type !== 'estimates' && !customerId && !customerName) {
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
          [type === 'quotations' ? 'quotationNo' : 'invoiceNo']: initialData ? (initialData.invoiceNo || initialData.quotationNo) : generateNextNo(queryClient.getQueryData([type === 'quotations' ? 'quotations' : 'invoices']) || [], type === 'estimates' ? 'estimates' : type === 'quotations' ? 'quotations' : 'invoices'),
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
      <DialogContent className="max-w-[88.3rem] w-[98vw] h-[58rem] max-h-[92vh] p-0 flex flex-col overflow-hidden transition-all duration-300">
        <div className="flex flex-col h-full bg-white relative">
          <DialogHeader className="p-2.5 px-4 border-b flex flex-row items-center justify-between space-y-0 pr-12 shrink-0">
            <DialogTitle>{title}</DialogTitle>
            {items.length > 5 && (
              <div className="flex items-center gap-6 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="text-right">
                  <p className="text-[0.5625rem] font-black text-muted-foreground uppercase opacity-70 leading-none">Subtotal</p>
                  <p className="text-xs font-bold tabular-nums">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                {isIgst ? (
                  <div className="text-right">
                    <p className="text-[0.5625rem] font-black text-muted-foreground uppercase opacity-70 leading-none">IGST</p>
                    <p className="text-xs font-bold tabular-nums">₹{potentialTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                ) : (
                  <>
                    <div className="text-right">
                      <p className="text-[0.5625rem] font-black text-muted-foreground uppercase opacity-70 leading-none">CGST</p>
                      <p className="text-xs font-bold tabular-nums">₹{(potentialTax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[0.5625rem] font-black text-muted-foreground uppercase opacity-70 leading-none">SGST</p>
                      <p className="text-xs font-bold tabular-nums">₹{(potentialTax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </>
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
                  <Label className="text-[0.6875rem] font-bold text-muted-foreground">Select Customer {type === 'estimates' && "(Optional)"}</Label>
                  <FormCombobox
                    triggerRef={customerRef}
                    onKeyDown={(e) => handleEnter(e, pendingCategoryRef.current, null)}
                    openOnFocus
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

              {/* Quick Add Section */}
              <div className="bg-muted/30 p-2.5 rounded-lg border border-primary/10 space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label className="text-[0.6875rem] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Plus className="h-3 w-3" /> Quick Add Item
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="use-igst"
                        checked={isIgst}
                        onCheckedChange={(checked) => setIsIgst(checked as boolean)}
                        className="h-3.5 w-3.5"
                      />
                      <label htmlFor="use-igst" className="text-[0.625rem] font-bold uppercase cursor-pointer text-muted-foreground">IGST</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enable-gst"
                        checked={gstEnabled}
                        onCheckedChange={(checked) => setGstEnabled(checked as boolean)}
                        className="h-3.5 w-3.5"
                      />
                      <label htmlFor="enable-gst" className="text-[0.625rem] font-bold uppercase cursor-pointer text-muted-foreground">GST</label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3 space-y-0.5">
                    <Label className="text-[0.5625rem] uppercase font-black text-muted-foreground ml-1">Category</Label>
                    <FormCombobox
                      triggerRef={pendingCategoryRef}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !pendingItem.category && items.length > 0) {
                          saveBtnRef.current?.focus();
                        } else {
                          handleEnter(e, pendingProductRef.current, customerRef.current);
                        }
                      }}
                      openOnFocus
                      autoOpenTrigger={focusNextItemTrigger}
                      label="Category"
                      value={pendingItem.category}
                      options={Array.from(new Set(products.map((p: any) => p.category))).filter(Boolean) as string[]}
                      onSelect={(v) => {
                        updatePendingItem({ category: v, name: "", subCategory: "" });
                        if (v) {
                          setProductTrigger(prev => prev + 1);
                          setTimeout(() => pendingProductRef.current?.focus(), 250);
                        }
                      }}
                    />
                  </div>
                  <div className="col-span-3 space-y-0.5">
                    <Label className="text-[0.5625rem] uppercase font-black text-muted-foreground ml-1">Product</Label>
                    <FormCombobox
                      triggerRef={pendingProductRef}
                      onKeyDown={(e) => handleEnter(e, pendingSubCategoryRef.current, pendingCategoryRef.current)}
                      openOnFocus
                      label="Product"
                      value={pendingItem.name}
                      autoOpenTrigger={productTrigger}
                      options={Array.from(new Set(products.filter((p: any) => !pendingItem.category || p.category === pendingItem.category).map((p: any) => p.name))).filter(Boolean) as string[]}
                      onSelect={(v) => {
                        updatePendingItem({ name: v, subCategory: "" });
                        setSubCategoryTrigger(prev => prev + 1);
                        setTimeout(() => pendingSubCategoryRef.current?.focus(), 250);
                      }}
                    />
                  </div>
                  <div className="col-span-2 space-y-0.5">
                    <Label className="text-[0.5625rem] uppercase font-black text-muted-foreground ml-1">Sub Category</Label>
                    <FormCombobox
                      triggerRef={pendingSubCategoryRef}
                      onKeyDown={(e) => handleEnter(e, pendingQtyRef.current, pendingProductRef.current)}
                      openOnFocus
                      label="Sub Category"
                      value={pendingItem.subCategory}
                      autoOpenTrigger={subCategoryTrigger}
                      options={Array.from(new Set(products.filter((p: any) =>
                        (!pendingItem.category || p.category === pendingItem.category) &&
                        (!pendingItem.name || p.name === pendingItem.name)
                      ).map((p: any) => p.subCategory))).filter(Boolean) as string[]}
                      onSelect={(v) => {
                        const exactProd = products.find((p: any) =>
                          p.name === pendingItem.name && p.subCategory === v &&
                          (!pendingItem.category || p.category === pendingItem.category)
                        );
                        if (exactProd) {
                          updatePendingItem({
                            subCategory: v,
                            sku: exactProd.sku || "",
                            rate: parseFloat(exactProd.sellPrice || 0),
                            hsnCode: exactProd.hsnCode || "",
                            gstRate: exactProd.gstRate || "0",
                            category: exactProd.category || pendingItem.category
                          });
                        } else {
                          updatePendingItem("subCategory", v);
                        }
                        setTimeout(() => pendingQtyRef.current?.focus(), 250);
                      }}
                    />
                  </div>
                  <div className="col-span-1 space-y-0.5">
                    <Label className="text-[0.5625rem] uppercase font-black text-muted-foreground text-center block">Qty</Label>
                    <Input
                      ref={pendingQtyRef}
                      type="number"
                      min="0"
                      value={pendingItem.qty}
                      className="h-8 font-bold text-center text-xs"
                      onKeyDown={(e) => handleEnter(e, pendingRateRef.current, pendingSubCategoryRef.current)}
                      onChange={e => updatePendingItem("qty", Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                  <div className="col-span-1 space-y-0.5">
                    <Label className="text-[0.5625rem] uppercase font-black text-muted-foreground ml-1">Rate</Label>
                    <Input
                      ref={pendingRateRef}
                      type="number"
                      min="0"
                      value={pendingItem.rate}
                      className="h-8 font-bold text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          addPendingItem();
                        } else {
                          handleEnter(e, null, pendingQtyRef.current);
                        }
                      }}
                      onChange={e => updatePendingItem("rate", Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Button onClick={addPendingItem} size="sm" className="h-8 w-full gap-1.5 shadow-sm">
                      <Plus className="h-3 w-3" /> Add Item
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Items Table Section */}
            <div ref={scrollViewportRef} className="flex-1 overflow-auto border-t bg-muted/5">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="sticky top-0 bg-white border-b z-10 shadow-sm">
                  <tr>
                    <th className="p-1.5 pl-4 text-[0.625rem] font-black uppercase text-muted-foreground tracking-widest w-[18%]">Category</th>
                    <th className="p-1.5 text-[0.625rem] font-black uppercase text-muted-foreground tracking-widest w-[22%]">Product</th>
                    <th className="p-1.5 text-[0.625rem] font-black uppercase text-muted-foreground tracking-widest w-[18%]">Sub Category</th>
                    <th className="p-1.5 text-[0.625rem] font-black uppercase text-muted-foreground tracking-widest text-center w-20">Qty</th>
                    <th className="p-1.5 text-[0.625rem] font-black uppercase text-muted-foreground tracking-widest w-28">Rate</th>
                    <th className="p-1.5 text-[0.625rem] font-black uppercase text-muted-foreground tracking-widest text-center w-20">GST</th>
                    <th className="p-1.5 pr-4 text-[0.625rem] font-black uppercase text-muted-foreground tracking-widest text-right w-32">Total</th>
                    <th className="p-1.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-muted/20 transition-colors group">
                      <td className="p-1.5 pl-4 py-1.5">
                        <span className="text-[0.6875rem] font-black text-muted-foreground/70 uppercase tracking-tight leading-tight block truncate" title={item.category}>
                          {item.category || "-"}
                        </span>
                      </td>
                      <td className="p-1.5 py-1.5">
                        <span className="text-xs font-black text-primary uppercase leading-tight block truncate" title={item.name}>
                          {item.name}
                        </span>
                      </td>
                      <td className="p-1.5 py-1.5">
                        <span className="text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-tight leading-tight block truncate" title={item.subCategory}>
                          {item.subCategory || "-"}
                        </span>
                      </td>
                      <td className="p-1.5 py-1.5">
                        <Input
                          type="number"
                          min="0"
                          value={item.qty}
                          className="h-8 font-bold text-center text-xs bg-transparent border-transparent focus:border-primary/20 hover:bg-muted/30 focus:bg-white transition-all"
                          onChange={e => updateItem(index, "qty", Math.max(0, parseFloat(e.target.value) || 0))}
                          title={item.qty.toString()}
                        />
                      </td>
                      <td className="p-2 py-3">
                        <div className="relative group/rate">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[0.625rem] font-bold text-muted-foreground opacity-0 group-focus-within/rate:opacity-100 transition-opacity">₹</span>
                          <Input
                            type="number"
                            min="0"
                            value={item.rate}
                            className="h-8 font-bold text-xs pl-4 bg-transparent border-transparent focus:border-primary/20 hover:bg-muted/30 focus:bg-white transition-all"
                            onChange={e => updateItem(index, "rate", Math.max(0, parseFloat(e.target.value) || 0))}
                            title={item.rate.toString()}
                          />
                        </div>
                      </td>
                      <td className="p-2 py-3">
                        <div className="text-[0.6875rem] font-black text-orange-600 text-center bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100" title={`${item.gstRate}% GST`}>
                          {item.gstRate}%
                        </div>
                      </td>
                      <td className="p-1.5 pr-4 py-1.5 text-right">
                        <span className="text-xs font-black text-primary tabular-nums" title={`₹${item.amount.toFixed(2)}`}>
                          ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-1.5 py-1.5 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  {isIgst ? (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium uppercase tracking-tighter">IGST Amount</span>
                      <span className="font-bold tabular-nums">₹{potentialTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-medium uppercase tracking-tighter">CGST Amount</span>
                        <span className="font-bold tabular-nums">₹{(potentialTax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-medium uppercase tracking-tighter">SGST Amount</span>
                        <span className="font-bold tabular-nums">₹{(potentialTax / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium uppercase tracking-tighter">Round Off</span>
                    <span className="font-bold tabular-nums">₹{displayRoundOff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <Separator className="bg-muted-foreground/20" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-black text-[0.625rem] uppercase tracking-widest text-muted-foreground">Grand Total</span>
                    <span className="font-black text-lg text-green-600 tabular-nums">₹{displayGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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

function TxTable({ data, cols, isLoading, onPrint, onConvert, onToggleStatus, loadingId, onWhatsApp, onEdit, onDelete, onDownload }: {
  data: any[];
  cols: any[];
  isLoading?: boolean,
  onPrint?: (r: any) => void,
  onConvert?: (r: any) => void,
  onToggleStatus?: (r: any) => void,
  loadingId?: number | null,
  onWhatsApp?: (r: any) => void,
  onEdit?: (r: any) => void,
  onDelete?: (r: any) => void,
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
                    {(onPrint || onConvert || onEdit || onDelete) && <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">Action</th>}
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
                            {onDelete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" title="Delete">
                                    <Trash2 className="h-3.5 w-3.5" />Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the 
                                      {row.quotationNo || row.invoiceNo} and all its associated items.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(row)} className="bg-red-600 hover:bg-red-700">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
  const { user, role } = useAuth();
  const isSuperAdmin = !role || role.name === 'Super Admin' || user?.email === 'admin@example.com'; // Adding fallback checks
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
      const isTargetInvoice = targetType === 'invoices' || targetType === 'quotations';
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

      const isTargetInvoicesTable = targetType === 'invoices' || targetType === 'estimates';
      const newBody: any = {
        customerId: detail.customerId,
        customerName: detail.customerName,
        fileName: detail.fileName,
        [isTargetInvoicesTable ? 'invoiceNo' : 'quotationNo']: `${prefix}-${sourceNo.split('-').pop()}`,
        date: new Date().toISOString().split('T')[0],
        amount: subtotal.toFixed(2),
        status: targetType === 'estimates' ? "Draft" : (targetType === 'invoices' ? "Paid" : "Pending"),
        items: convertedItems
      };

      if (targetType !== 'estimates' || isTargetInvoicesTable) {
        newBody.tax = calculatedTax.toFixed(2);
        newBody.total = Math.round(subtotal + calculatedTax).toFixed(2);
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

  const handleDelete = async (record: any, type: string) => {
    try {
      const res = await fetch(`/api/sales?resource=${type === 'quotations' ? 'quotations' : 'invoices'}&id=${record.id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete record");
      toast({ title: "Success", description: "Record deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
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
            onDelete={isSuperAdmin ? (r) => handleDelete(r, "invoices") : undefined}
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
            onDelete={isSuperAdmin ? (r) => handleDelete(r, "quotations") : undefined}
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
            onDelete={isSuperAdmin ? (r) => handleDelete(r, "invoices") : undefined}
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
