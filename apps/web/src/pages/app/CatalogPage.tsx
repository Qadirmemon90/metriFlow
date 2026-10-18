import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatPaisa, rupeesToPaisa, paisaToRupees } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Package,
  Plus,
  Upload,
  Search,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Archive,
  Edit2,
} from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    barcode: '',
    uom: 'PCS',
    costRupees: '',
    wholesalePriceRupees: '',
    minWholesaleQty: 1,
    category: 'General',
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/master-data/products', { search });
      setProducts(Array.isArray(res) ? res : res.items || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/master-data/products', {
        sku: formData.sku.toUpperCase(),
        name: formData.name,
        barcode: formData.barcode || undefined,
        uom: formData.uom,
        unitCostPaisa: rupeesToPaisa(formData.costRupees),
        priceTiers: [
          {
            tierName: 'WHOLESALE',
            minQuantity: Number(formData.minWholesaleQty) || 1,
            unitPricePaisa: rupeesToPaisa(formData.wholesalePriceRupees),
          },
        ],
        category: formData.category,
      });

      setIsAddModalOpen(false);
      setFormData({
        sku: '',
        name: '',
        barcode: '',
        uom: 'PCS',
        costRupees: '',
        wholesalePriceRupees: '',
        minWholesaleQty: 1,
        category: 'General',
      });
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to create product');
    }
  };

  const handleArchiveProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to archive this product? Historical orders and movements will be preserved.')) return;
    try {
      await api.delete(`/master-data/products/${id}`);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to archive product');
    }
  };

  // CSV Import Parsing & Preview
  const handleParseCsv = () => {
    setImportError('');
    setImportSuccess('');
    if (!importCsvText.trim()) {
      setImportError('Please paste CSV data');
      return;
    }

    const lines = importCsvText.trim().split('\n');
    if (lines.length < 2) {
      setImportError('CSV must contain a header line and at least one data row');
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const parsedRows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length < 3) continue;

      const row: any = {
        rowNumber: i + 1,
        sku: parts[0]?.toUpperCase(),
        name: parts[1],
        uom: parts[2] || 'PCS',
        costRupees: parts[3] || '0',
        wholesalePriceRupees: parts[4] || '0',
        errors: [] as string[],
      };

      if (!row.sku) row.errors.push('Missing SKU');
      if (!row.name) row.errors.push('Missing Name');
      if (isNaN(parseFloat(row.wholesalePriceRupees)) || parseFloat(row.wholesalePriceRupees) <= 0) {
        row.errors.push('Invalid Wholesale Price');
      }

      parsedRows.push(row);
    }

    setImportPreview(parsedRows);
  };

  const handleCommitImport = async () => {
    if (!importPreview || importPreview.length === 0) return;
    const validRows = importPreview.filter((r) => r.errors.length === 0);
    if (validRows.length === 0) {
      setImportError('No valid rows to commit');
      return;
    }

    setImportLoading(true);
    setImportError('');
    try {
      const payload = validRows.map((r) => ({
        sku: r.sku,
        name: r.name,
        uom: r.uom,
        unitCostPaisa: rupeesToPaisa(r.costRupees),
        priceTiers: [
          {
            tierName: 'WHOLESALE',
            minQuantity: 1,
            unitPricePaisa: rupeesToPaisa(r.wholesalePriceRupees),
          },
        ],
      }));

      await api.post('/master-data/import/products', { products: payload });
      setImportSuccess(`Successfully imported ${validRows.length} wholesale products!`);
      setImportPreview(null);
      setImportCsvText('');
      fetchProducts();
    } catch (err: any) {
      setImportError(err.message || 'Batch import failed');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Wholesale Product Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage SKUs, units of measure, wholesale price tiers, and inventory valuations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Upload className="w-4 h-4 text-emerald-600" />}
            onClick={() => setIsImportModalOpen(true)}
          >
            Import CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, item name, or barcode..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">UOM</th>
                <th className="py-3 px-4 text-right">Standard Cost</th>
                <th className="py-3 px-4 text-right">Wholesale Rate</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">Loading catalog...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No products found. Add an item or import a CSV catalog.
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const wholesaleTier = prod.priceTiers?.find((t: any) => t.tierName === 'WHOLESALE') || prod.priceTiers?.[0];
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{prod.sku}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{prod.name}</td>
                      <td className="py-3 px-4 text-slate-500">{prod.category || 'General'}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{prod.uom}</td>
                      <td className="py-3 px-4 text-right text-slate-600 font-mono">
                        {formatPaisa(prod.unitCostPaisa)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-800 font-mono">
                        {wholesaleTier ? formatPaisa(wholesaleTier.unitPricePaisa) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={prod.isActive ? 'success' : 'neutral'} size="sm">
                          {prod.isActive ? 'Active' : 'Archived'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleArchiveProduct(prod.id)}
                          title="Archive Product"
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Wholesale Product"
        description="Create a new SKU with base cost and tiered wholesale pricing."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="SKU / Item Code"
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="e.g. SKU-BOLT-10MM"
            />
            <Input
              label="Barcode / EAN (Optional)"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="e.g. 8961234567890"
            />
          </div>

          <Input
            label="Product Name / Description"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Hex Bolt Steel 10mm x 50mm"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Unit of Measure (UOM)"
              required
              value={formData.uom}
              onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
              options={[
                { value: 'PCS', label: 'Pieces (PCS)' },
                { value: 'BOX', label: 'Box / Carton' },
                { value: 'KG', label: 'Kilogram (KG)' },
                { value: 'METER', label: 'Meter' },
                { value: 'PACK', label: 'Pack' },
                { value: 'DOZEN', label: 'Dozen (12)' },
              ]}
            />
            <Input
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g. Fasteners"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimated Cost (PKR)"
              type="number"
              step="0.01"
              required
              value={formData.costRupees}
              onChange={(e) => setFormData({ ...formData, costRupees: e.target.value })}
              placeholder="100.00"
              prefixText="PKR"
            />
            <Input
              label="Wholesale Selling Rate (PKR)"
              type="number"
              step="0.01"
              required
              value={formData.wholesalePriceRupees}
              onChange={(e) => setFormData({ ...formData, wholesalePriceRupees: e.target.value })}
              placeholder="150.00"
              prefixText="PKR"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportPreview(null);
          setImportError('');
          setImportSuccess('');
        }}
        title="Import Wholesale Catalog via CSV"
        description="Paste comma-separated rows. Formats: SKU,Name,UOM,CostPKR,WholesalePricePKR"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {importError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{importSuccess}</span>
            </div>
          )}

          {!importPreview ? (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg text-[11px] font-mono text-slate-600">
                <strong>Example Format:</strong><br />
                SKU,Name,UOM,Cost,WholesalePrice<br />
                SKU-BOLT-10,Hex Bolt 10mm,PCS,50,75<br />
                SKU-NUT-10,Hex Nut 10mm,PCS,25,40<br />
                SKU-CABLE-1M,Copper Wire 1M,METER,120,180
              </div>

              <textarea
                rows={6}
                value={importCsvText}
                onChange={(e) => setImportCsvText(e.target.value)}
                placeholder="Paste CSV rows here..."
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

              <Button variant="secondary" size="sm" onClick={handleParseCsv} className="w-full">
                Preview & Validate Rows
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Preview: {importPreview.length} rows ({importPreview.filter((r) => r.errors.length === 0).length} valid)
                </span>
                <Button variant="ghost" size="sm" onClick={() => setImportPreview(null)}>
                  Edit CSV
                </Button>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Row</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">UOM</th>
                      <th className="py-2 px-3 text-right">Cost</th>
                      <th className="py-2 px-3 text-right">Price</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {importPreview.map((r, idx) => (
                      <tr key={idx} className={r.errors.length > 0 ? 'bg-red-50/50' : 'hover:bg-slate-50'}>
                        <td className="py-1.5 px-3">{r.rowNumber}</td>
                        <td className="py-1.5 px-3 font-bold">{r.sku}</td>
                        <td className="py-1.5 px-3">{r.name}</td>
                        <td className="py-1.5 px-3">{r.uom}</td>
                        <td className="py-1.5 px-3 text-right">PKR {r.costRupees}</td>
                        <td className="py-1.5 px-3 text-right">PKR {r.wholesalePriceRupees}</td>
                        <td className="py-1.5 px-3">
                          {r.errors.length === 0 ? (
                            <span className="text-emerald-700 font-sans font-semibold">Valid</span>
                          ) : (
                            <span className="text-red-600 font-sans">{r.errors.join(', ')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => setImportPreview(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={importLoading}
                  onClick={handleCommitImport}
                  icon={<FileSpreadsheet className="w-4 h-4" />}
                >
                  Commit Batch Import
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
