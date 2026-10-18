import React from 'react';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { Button } from './Button';

interface PrintableDocumentProps {
  title: string;
  documentNumber: string;
  type: 'INVOICE' | 'CHALLAN';
  organization: {
    name: string;
    address?: string;
    phone?: string;
    ntn?: string;
    strn?: string;
  };
  recipient: {
    name: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
    city?: string;
    ntn?: string;
  };
  metadata: {
    date: string;
    dueDate?: string;
    referenceOrder?: string;
    vehicleNumber?: string;
    driverName?: string;
    driverPhone?: string;
  };
  children: React.ReactNode;
  onBack?: () => void;
  footerNotes?: string;
}

export const PrintableDocument: React.FC<PrintableDocumentProps> = ({
  title,
  documentNumber,
  type,
  organization,
  recipient,
  metadata,
  children,
  onBack,
  footerNotes,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      {/* Top action bar - hidden during print */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between no-print">
        {onBack ? (
          <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={onBack}>
            Back
          </Button>
        ) : <div />}
        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            Print {type === 'INVOICE' ? 'Sales Invoice' : 'Delivery Challan'}
          </Button>
        </div>
      </div>

      {/* A4 Document Paper Container */}
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl border border-slate-200 p-8 sm:p-12 print:shadow-none print:border-none print:p-0 print:m-0">
        {/* Header */}
        <div className="border-b-2 border-slate-800 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-black text-[#102A43] tracking-tight">{organization.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
                  Wholesale
                </span>
              </div>
              {organization.address && <p className="text-xs text-slate-600 max-w-sm">{organization.address}</p>}
              {organization.phone && <p className="text-xs text-slate-600 mt-0.5">Phone: {organization.phone}</p>}
              {(organization.ntn || organization.strn) && (
                <p className="text-xs text-slate-600 mt-0.5 font-mono">
                  {organization.ntn && `NTN: ${organization.ntn}`}
                  {organization.ntn && organization.strn && ' | '}
                  {organization.strn && `STRN: ${organization.strn}`}
                </p>
              )}
            </div>

            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded text-xs font-black tracking-wider uppercase mb-2 ${
                type === 'INVOICE' ? 'bg-[#102A43] text-white' : 'bg-emerald-700 text-white'
              }`}>
                {title}
              </span>
              <p className="text-base font-bold font-mono text-slate-900">{documentNumber}</p>
              <p className="text-xs text-slate-500 mt-1">Date: {metadata.date}</p>
              {metadata.dueDate && <p className="text-xs text-slate-500">Due: {metadata.dueDate}</p>}
              {metadata.referenceOrder && (
                <p className="text-xs text-slate-500">Order Ref: {metadata.referenceOrder}</p>
              )}
            </div>
          </div>
        </div>

        {/* Bill/Ship To & Logistics */}
        <div className="grid grid-cols-2 gap-8 mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {type === 'INVOICE' ? 'Billed To (Customer):' : 'Consignee / Delivery Address:'}
            </span>
            <p className="font-bold text-sm text-slate-900">{recipient.name}</p>
            {recipient.contactPerson && <p className="text-slate-600">Attn: {recipient.contactPerson}</p>}
            {recipient.address && <p className="text-slate-600">{recipient.address}</p>}
            {recipient.city && <p className="text-slate-600">{recipient.city}</p>}
            {recipient.phone && <p className="text-slate-600 mt-1">Phone: {recipient.phone}</p>}
            {recipient.ntn && <p className="text-slate-600 font-mono">NTN: {recipient.ntn}</p>}
          </div>

          <div className="border-l border-slate-200 pl-6">
            <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Logistics & Dispatch Details:
            </span>
            {metadata.vehicleNumber ? (
              <p className="text-slate-700"><span className="font-semibold">Vehicle / Bilty:</span> {metadata.vehicleNumber}</p>
            ) : null}
            {metadata.driverName ? (
              <p className="text-slate-700 mt-0.5"><span className="font-semibold">Driver / Staff:</span> {metadata.driverName}</p>
            ) : null}
            {metadata.driverPhone ? (
              <p className="text-slate-700 mt-0.5"><span className="font-semibold">Driver Contact:</span> {metadata.driverPhone}</p>
            ) : null}
            <p className="text-slate-500 mt-2 text-[11px] italic">
              Commercial document issued under MetriFlow wholesale management system.
            </p>
          </div>
        </div>

        {/* Dynamic Line Items Content */}
        <div className="mb-8">{children}</div>

        {/* Signatures & Declarations */}
        <div className="mt-12 pt-6 border-t border-slate-200">
          <div className="grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
            <div>
              <div className="h-16 border-b border-dashed border-slate-300" />
              <p className="mt-2 font-medium">Prepared By</p>
            </div>
            <div>
              <div className="h-16 border-b border-dashed border-slate-300" />
              <p className="mt-2 font-medium">Delivered / Handed Over By</p>
            </div>
            <div>
              <div className="h-16 border-b border-dashed border-slate-300" />
              <p className="mt-2 font-medium">Received In Good Condition (Stamp & Sign)</p>
            </div>
          </div>

          {footerNotes && (
            <p className="mt-6 text-[11px] text-slate-400 text-center italic">{footerNotes}</p>
          )}
        </div>
      </div>
    </div>
  );
};
